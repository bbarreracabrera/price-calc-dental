import { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle,
  Loader2, Download, ChevronRight, ChevronLeft, Undo2, Users,
} from 'lucide-react';

import { supabase } from '../supabase';
import {
  PERFILES, CAMPOS, COLUMNAS_PLANTILLA,
  detectarColumnas, construirFila, marcarDuplicados, aPaciente, resumen,
} from '../utils/importMapping';

// ============================================================================
// TRASPASO DE PACIENTES
// ----------------------------------------------------------------------------
// Antes era una sola pantalla: soltabas el Excel, adivinaba las columnas en
// silencio y decía "Migración exitosa". Prometía al pie que eliminaba
// duplicados automáticamente y no lo hacía — reimportar el mismo archivo creaba
// todos los pacientes de nuevo. Si no encontraba una columna, importaba vacío
// sin avisar. Y no había forma de deshacer.
//
// Ahora son cinco pasos, y cada uno existe porque el anterior fallaba:
//
//   1. Origen     de dónde viene, para elegir el perfil de mapeo correcto
//   2. Mapeo      qué columna es qué, visible y editable
//   3. Validación fila por fila, con semáforo
//   4. Conflictos qué hacer con cada RUT repetido
//   5. Resumen    con la posibilidad de revertir el lote completo
//
// Con cien pacientes por dentista este nivel de revisión es perfectamente
// manejable en pantalla, y es justamente cuando conviene hacerlo: los datos que
// entran torcidos el primer día quedan torcidos para siempre.
// ============================================================================

const PASOS = ['Origen', 'Mapeo', 'Validación', 'Conflictos', 'Listo'];

function BarraPasos({ paso }) {
  return (
    <ol className="mb-6 flex items-center gap-1.5">
      {PASOS.map((nombre, i) => {
        const estado = i < paso ? 'hecho' : i === paso ? 'actual' : 'futuro';
        return (
          <li key={nombre} className="flex flex-1 items-center gap-1.5">
            <div className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${
                estado === 'futuro' ? 'bg-line' : 'bg-accent'
              }`} />
              <span className={`mt-1.5 block text-2xs font-extrabold uppercase tracking-wide ${
                estado === 'actual' ? 'text-accent' : estado === 'hecho' ? 'text-muted' : 'text-line-strong'
              }`}>
                {nombre}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Boton({ children, variante = 'primario', ...props }) {
  const clases = {
    primario: 'bg-accent text-white hover:bg-accent-hover disabled:opacity-40',
    neutro: 'border border-line text-muted hover:bg-raised hover:text-ink',
    peligro: 'border border-danger/30 text-danger hover:bg-danger-soft',
  }[variante];
  return (
    <button
      {...props}
      className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-2xs font-extrabold uppercase tracking-wider transition-colors disabled:cursor-not-allowed ${clases} ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

export default function ImportPatientsModal({ isOpen, onClose, session, onSuccess, clinicOwner }) {
  const [paso, setPaso] = useState(0);
  const [perfilId, setPerfilId] = useState('generico');
  const [archivo, setArchivo] = useState(null);
  const [encabezados, setEncabezados] = useState([]);
  const [crudas, setCrudas] = useState([]);
  const [mapa, setMapa] = useState({});
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [revirtiendo, setRevirtiendo] = useState(false);

  const adminEmail = clinicOwner || session?.user?.email;

  const reiniciar = useCallback(() => {
    setPaso(0); setPerfilId('generico'); setArchivo(null); setEncabezados([]);
    setCrudas([]); setMapa({}); setFilas([]); setError(''); setResultado(null);
  }, []);

  const cerrar = useCallback(() => { reiniciar(); onClose?.(); }, [reiniciar, onClose]);

  // -----------------------------------------------------------------------
  // Plantilla para quien trae fichas en papel
  // -----------------------------------------------------------------------
  const descargarPlantilla = () => {
    const hoja = XLSX.utils.aoa_to_sheet([
      COLUMNAS_PLANTILLA,
      ['María Ignacia', 'Fernández Rojas', '12.345.678-5', '11/03/1984', 'Femenino',
       '+56 9 8765 4321', 'correo@ejemplo.cl', 'Av. Picarte 1420, Valdivia', 'Fonasa B', 'Profesora', 'Alergia a penicilina'],
    ]);
    hoja['!cols'] = COLUMNAS_PLANTILLA.map(c => ({ wch: Math.max(14, c.length + 4) }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Pacientes');
    XLSX.writeFile(libro, 'plantilla-pacientes-shiningcloud.xlsx');
  };

  // -----------------------------------------------------------------------
  // Lectura del archivo
  // -----------------------------------------------------------------------
  const leerArchivo = async (f) => {
    if (!f) return;
    const ext = f.name.toLowerCase().split('.').pop();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('El archivo debe ser .xlsx, .xls o .csv');
      return;
    }

    setError('');
    setArchivo(f);

    try {
      // readAsBinaryString está obsoleto; ArrayBuffer es el camino soportado.
      const buffer = await f.arrayBuffer();
      const libro = XLSX.read(buffer, { type: 'array', cellDates: true });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const matriz = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: true });

      const conDatos = matriz.filter(fila => fila.some(c => String(c ?? '').trim() !== ''));
      if (conDatos.length < 2) {
        setError('El archivo no tiene filas de datos bajo el encabezado.');
        return;
      }

      const enc = conDatos[0].map(h => String(h ?? '').trim());
      setEncabezados(enc);
      setCrudas(conDatos.slice(1));
      setMapa(detectarColumnas(enc, perfilId));
      setPaso(1);
    } catch (e) {
      setError(`No se pudo leer el archivo: ${e.message}`);
    }
  };

  // -----------------------------------------------------------------------
  // Validación y búsqueda de duplicados
  // -----------------------------------------------------------------------
  const validar = async () => {
    setTrabajando(true);
    setError('');
    try {
      const construidas = crudas.map((f, i) => construirFila(f, mapa, i)).filter(f => f.legalName || f.rutNorm);

      // Los RUT que ya existen en esta clínica. `rut_norm` es una columna
      // generada en Postgres con la misma normalización que usa la aplicación,
      // y sobre ella vive el índice único: lo que aquí se detecta es
      // exactamente lo que la base rechazaría.
      const rutsArchivo = construidas.map(f => f.rutNorm).filter(Boolean);
      const existentes = new Set();

      for (let i = 0; i < rutsArchivo.length; i += 200) {
        const lote = rutsArchivo.slice(i, i + 200);
        const { data, error: err } = await supabase
          .from('patients')
          .select('rut_norm')
          .eq('admin_email', adminEmail)
          .is('deleted_at', null)
          .in('rut_norm', lote);
        if (err) throw err;
        (data || []).forEach(r => r.rut_norm && existentes.add(r.rut_norm));
      }

      setFilas(marcarDuplicados(construidas, existentes));
      setPaso(2);
    } catch (e) {
      setError(`No se pudo comprobar los duplicados: ${e.message}`);
    } finally {
      setTrabajando(false);
    }
  };

  const cambiarDecision = (indice, decision) =>
    setFilas(prev => prev.map((f, i) => (i === indice ? { ...f, decision } : f)));

  // -----------------------------------------------------------------------
  // Importación
  // -----------------------------------------------------------------------
  const importar = async () => {
    setTrabajando(true);
    setError('');

    const loteId = `lote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const aCrear = filas.filter(f => !f.errores.length && f.decision === 'importar');
    const aFusionar = filas.filter(f => !f.errores.length && f.decision === 'fusionar' && f.rutNorm);

    let creados = 0, fusionados = 0, fallidos = 0;

    try {
      // --- Altas ---
      const registros = aCrear.map(f => aPaciente(f, { adminEmail, userId: session?.user?.id, loteId }));
      for (let i = 0; i < registros.length; i += 50) {
        const lote = registros.slice(i, i + 50);
        const { error: err } = await supabase.from('patients').insert(lote);
        if (err) { fallidos += lote.length; console.error('[traspaso] alta', err); }
        else creados += lote.length;
      }

      // --- Fusiones ---
      // Solo se rellenan los campos que en la ficha existente están vacíos. Un
      // teléfono antiguo que ya fue corregido aquí no se pisa con el del
      // sistema del que se está migrando.
      for (const f of aFusionar) {
        const { data, error: errBusca } = await supabase
          .from('patients')
          .select('id, data')
          .eq('admin_email', adminEmail)
          .eq('rut_norm', f.rutNorm)
          .is('deleted_at', null)
          .limit(1);
        if (errBusca || !data?.length) { fallidos += 1; continue; }

        const actual = data[0];
        const personal = { ...(actual.data?.personal || {}) };
        for (const campo of ['legalName', 'rut', 'birthDate', 'age', 'sex', 'phone', 'email', 'address', 'insurance', 'occupation']) {
          const nuevo = f[campo];
          if ((personal[campo] === undefined || personal[campo] === '' || personal[campo] === null) && nuevo) {
            personal[campo] = nuevo;
          }
        }

        const { error: errUpd } = await supabase
          .from('patients')
          .update({ data: { ...actual.data, personal, mergedFrom: loteId, mergedAt: new Date().toISOString() } })
          .eq('id', actual.id);

        if (errUpd) fallidos += 1; else fusionados += 1;
      }

      setResultado({ loteId, creados, fusionados, fallidos, omitidos: filas.length - aCrear.length - aFusionar.length });
      setPaso(4);
      onSuccess?.();
    } catch (e) {
      setError(`La importación se detuvo: ${e.message}`);
    } finally {
      setTrabajando(false);
    }
  };

  // -----------------------------------------------------------------------
  // Deshacer
  // -----------------------------------------------------------------------
  // Borrado suave, no eliminación: la Ley 20.584 y el Decreto 41 obligan a
  // conservar la ficha clínica, y aunque estos registros no alcanzaron a
  // recibir atención, el sistema entero está construido sobre soft-delete.
  const revertir = async () => {
    if (!resultado?.loteId) return;
    setRevirtiendo(true);
    try {
      const { error: err } = await supabase
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('import_batch_id', resultado.loteId)
        .is('deleted_at', null);
      if (err) throw err;
      setResultado(r => ({ ...r, revertido: true }));
      onSuccess?.();
    } catch (e) {
      setError(`No se pudo revertir: ${e.message}`);
    } finally {
      setRevirtiendo(false);
    }
  };

  // -----------------------------------------------------------------------
  const r = useMemo(() => resumen(filas), [filas]);
  const conflictos = useMemo(() => filas.map((f, i) => ({ ...f, i })).filter(f => f.duplicado), [filas]);
  const sinNombre = mapa.legalName == null && mapa.nombres == null && mapa.apellidos == null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm md:items-center md:p-4">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-panel bg-surface shadow-pop md:max-w-4xl md:rounded-panel">

        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-ink">Traer mis pacientes</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              Desde Dentalink, Reservo, AgendaPro, tu propio Excel o fichas en papel.
            </p>
          </div>
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <BarraPasos paso={paso} />

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-card border border-danger/25 bg-danger-soft p-3.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-xs font-bold leading-relaxed text-danger">{error}</p>
            </div>
          )}

          {/* ============ PASO 1: ORIGEN ============ */}
          {paso === 0 && (
            <div className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(PERFILES).map(([id, perfil]) => (
                  <button
                    key={id}
                    onClick={() => setPerfilId(id)}
                    className={`rounded-card border p-4 text-left transition-colors ${
                      perfilId === id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-raised'
                    }`}
                  >
                    <p className="text-sm font-extrabold text-ink">{perfil.label}</p>
                    <p className="mt-0.5 text-2xs font-semibold text-muted">{perfil.descripcion}</p>
                  </button>
                ))}
              </div>

              {perfilId === 'papel' && (
                <div className="flex items-center gap-3 rounded-card border border-sky/20 bg-sky-soft p-4">
                  <FileSpreadsheet size={20} className="shrink-0 text-sky" />
                  <p className="flex-1 text-xs font-semibold text-ink">
                    Descarga la plantilla, transcribe las fichas y súbela. Trae las columnas ya
                    con los nombres correctos, así que el mapeo sale solo.
                  </p>
                  <Boton variante="neutro" onClick={descargarPlantilla}>
                    <Download size={13} /> Plantilla
                  </Boton>
                </div>
              )}

              <label
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={(e) => { e.preventDefault(); setArrastrando(false); }}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); leerArchivo(e.dataTransfer.files?.[0]); }}
                className={`flex cursor-pointer flex-col items-center rounded-panel border-2 border-dashed p-10 text-center transition-colors ${
                  arrastrando ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-accent/50 hover:bg-canvas'
                }`}
              >
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-canvas">
                  <Upload size={24} className={arrastrando ? 'text-accent' : 'text-muted'} />
                </span>
                <span className="text-sm font-extrabold text-ink">
                  {arrastrando ? 'Suelta el archivo' : 'Arrastra tu archivo o haz clic para elegirlo'}
                </span>
                <span className="mt-1 text-2xs font-semibold text-muted">.xlsx · .xls · .csv</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => leerArchivo(e.target.files?.[0])}
                />
                {archivo && (
                  <span className="mt-4 flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-2xs font-extrabold text-accent">
                    <CheckCircle2 size={13} /> {archivo.name}
                  </span>
                )}
              </label>
            </div>
          )}

          {/* ============ PASO 2: MAPEO ============ */}
          {paso === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold leading-relaxed text-muted">
                Esto es lo que detectamos en <b className="text-ink">{archivo?.name}</b>, con {crudas.length} filas.
                Revisa cada línea: si una columna quedó mal asignada, cámbiala aquí. El importador
                anterior hacía esto en silencio, y cuando se equivocaba el dato entraba vacío.
              </p>

              {sinNombre && (
                <div className="flex items-start gap-3 rounded-card border border-warn/25 bg-warn-soft p-3.5">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0 text-warn" />
                  <p className="text-xs font-bold text-warn">
                    No hay ninguna columna asignada al nombre. Asigna «Nombre completo», o bien
                    «Nombres» y «Apellidos», para poder continuar.
                  </p>
                </div>
              )}

              <div className="overflow-hidden rounded-card border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-raised">
                    <tr>
                      <th className="px-3 py-2 text-2xs font-extrabold uppercase tracking-wide text-muted">Campo en la ficha</th>
                      <th className="px-3 py-2 text-2xs font-extrabold uppercase tracking-wide text-muted">Columna del archivo</th>
                      <th className="px-3 py-2 text-2xs font-extrabold uppercase tracking-wide text-muted">Ejemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAMPOS.map(campo => {
                      const idx = mapa[campo.id];
                      const ejemplo = idx == null ? '' : String(crudas[0]?.[idx] ?? '');
                      return (
                        <tr key={campo.id} className="border-t border-line">
                          <td className="px-3 py-2">
                            <span className="font-bold text-ink">{campo.label}</span>
                            {campo.requerido && <span className="ml-1 text-danger">*</span>}
                            {campo.ayuda && <span className="mt-0.5 block text-2xs font-semibold text-muted">{campo.ayuda}</span>}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={idx ?? ''}
                              onChange={(e) => setMapa(m => ({ ...m, [campo.id]: e.target.value === '' ? null : Number(e.target.value) }))}
                              className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-xs font-semibold text-ink"
                            >
                              <option value="">— sin asignar —</option>
                              {encabezados.map((h, i) => (
                                <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>
                              ))}
                            </select>
                          </td>
                          <td className="max-w-[10rem] truncate px-3 py-2 text-2xs font-semibold text-muted">{ejemplo}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ PASO 3: VALIDACIÓN ============ */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Listos', r.listos, 'bg-ok-soft text-ok'],
                  ['Con aviso', r.conAviso, 'bg-warn-soft text-warn'],
                  ['Con error', r.conError, 'bg-danger-soft text-danger'],
                  ['Duplicados', r.duplicados, 'bg-sky-soft text-sky'],
                ].map(([et, n, clase]) => (
                  <div key={et} className={`rounded-card px-3 py-2.5 ${clase}`}>
                    <p className="tabular text-xl font-extrabold leading-none">{n}</p>
                    <p className="mt-1 text-2xs font-extrabold uppercase tracking-wide">{et}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-muted">
                Las filas con error no se importan. Corrígelas en el archivo y vuelve a subirlo,
                o continúa y quedan fuera.
              </p>

              <div className="max-h-80 overflow-y-auto rounded-card border border-line custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-raised">
                    <tr>
                      {['Fila', 'Paciente', 'RUT', 'Nacimiento', 'Teléfono', 'Estado'].map(h => (
                        <th key={h} className="px-3 py-2 text-2xs font-extrabold uppercase tracking-wide text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={i} className={`border-t border-line ${f.errores.length ? 'bg-danger-soft/40' : ''}`}>
                        <td className="tabular px-3 py-2 font-semibold text-muted">{f.fila}</td>
                        <td className="max-w-[12rem] truncate px-3 py-2 font-bold text-ink">{f.legalName || '—'}</td>
                        <td className="tabular px-3 py-2 text-muted">{f.rut || '—'}</td>
                        <td className="tabular px-3 py-2 text-muted">{f.birthDate || '—'}</td>
                        <td className="tabular px-3 py-2 text-muted">{f.phone || '—'}</td>
                        <td className="px-3 py-2">
                          {f.errores.length ? (
                            <span className="font-extrabold text-danger">{f.errores.join(' · ')}</span>
                          ) : f.avisos.length ? (
                            <span className="font-bold text-warn">{f.avisos.join(' · ')}</span>
                          ) : (
                            <span className="font-bold text-ok">Correcto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ PASO 4: CONFLICTOS ============ */}
          {paso === 3 && (
            <div className="space-y-4">
              {conflictos.length === 0 ? (
                <div className="flex items-center gap-3 rounded-card border border-ok/25 bg-ok-soft p-5">
                  <CheckCircle2 size={22} className="shrink-0 text-ok" />
                  <p className="text-sm font-bold text-ink">
                    Ningún RUT se repite, ni contra tu clínica ni dentro del archivo.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold leading-relaxed text-muted">
                    Dos pacientes no pueden compartir RUT: la base de datos ahora lo impide con un
                    índice único, así que estos casos hay que resolverlos antes y no a mitad del
                    proceso. <b className="text-ink">Fusionar</b> completa los campos que estén vacíos
                    en la ficha que ya existe, sin pisar lo que ya tengas escrito.
                  </p>

                  <div className="space-y-2">
                    {conflictos.map(f => (
                      <div key={f.i} className="flex flex-wrap items-center gap-3 rounded-card border border-line p-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-ink">{f.legalName}</p>
                          <p className="tabular text-2xs font-semibold text-muted">
                            {f.rut} ·{' '}
                            {f.duplicado === 'clinica'
                              ? 'ya existe en tu clínica'
                              : `repetido en el archivo (fila ${filas[f.duplicadoDe]?.fila})`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[
                            ['fusionar', 'Fusionar', f.duplicado === 'clinica'],
                            ['omitir', 'Omitir', true],
                            ['importar', 'Crear igual', f.duplicado === 'archivo'],
                          ].filter(([, , visible]) => visible).map(([valor, etiqueta]) => (
                            <button
                              key={valor}
                              onClick={() => cambiarDecision(f.i, valor)}
                              className={`rounded-lg px-3 py-2 text-2xs font-extrabold transition-colors ${
                                f.decision === valor ? 'bg-accent text-white' : 'border border-line text-muted hover:bg-raised'
                              }`}
                            >
                              {etiqueta}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="rounded-card border border-line bg-canvas p-4">
                <p className="text-2xs font-extrabold uppercase tracking-wide text-muted">Resultado de la importación</p>
                <p className="mt-2 text-sm font-bold text-ink">
                  Se crearán <b className="text-accent">{r.listos}</b> pacientes nuevos
                  {r.fusionar > 0 && <> y se fusionarán <b className="text-accent">{r.fusionar}</b></>}.
                  {r.omitidos > 0 && <> Quedan fuera {r.omitidos} por decisión tuya.</>}
                  {r.conError > 0 && <> {r.conError} no se importan por errores de datos.</>}
                </p>
                <p className="mt-2 text-2xs font-semibold leading-relaxed text-muted">
                  Los pacientes importados entran con su consentimiento marcado como heredado del
                  prestador anterior. La ficha lo muestra hasta que se capture uno actualizado en la
                  primera cita: nada bloquea la atención, pero la deuda queda visible.
                </p>
              </div>
            </div>
          )}

          {/* ============ PASO 5: RESUMEN ============ */}
          {paso === 4 && resultado && (
            <div className="py-6 text-center">
              <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
                resultado.revertido ? 'bg-raised' : 'bg-ok-soft'
              }`}>
                {resultado.revertido
                  ? <Undo2 size={30} className="text-muted" />
                  : <Users size={30} className="text-ok" />}
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-ink">
                {resultado.revertido ? 'Importación revertida' : 'Pacientes traspasados'}
              </h3>

              {!resultado.revertido && (
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-muted">
                  Se crearon <b className="text-ink">{resultado.creados}</b> fichas
                  {resultado.fusionados > 0 && <> y se completaron <b className="text-ink">{resultado.fusionados}</b> existentes</>}.
                  {resultado.omitidos > 0 && <> {resultado.omitidos} quedaron fuera.</>}
                  {resultado.fallidos > 0 && (
                    <span className="mt-1 block text-danger">{resultado.fallidos} fallaron al guardarse.</span>
                  )}
                </p>
              )}

              <p className="tabular mt-3 text-2xs font-semibold text-muted">Lote {resultado.loteId}</p>

              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                {!resultado.revertido && resultado.creados > 0 && (
                  <Boton variante="peligro" onClick={revertir} disabled={revirtiendo}>
                    {revirtiendo
                      ? <><Loader2 size={14} className="animate-spin" /> Revirtiendo</>
                      : <><Undo2 size={14} /> Deshacer esta importación</>}
                  </Boton>
                )}
                <Boton onClick={cerrar}>Ir a mis pacientes</Boton>
              </div>

              {!resultado.revertido && (
                <p className="mx-auto mt-4 max-w-sm text-2xs font-semibold leading-relaxed text-muted">
                  Deshacer archiva las fichas de este lote sin eliminarlas, que es como el sistema
                  maneja todo borrado por obligación legal de conservación.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ============ PIE DE NAVEGACIÓN ============ */}
        {paso < 4 && (
          <footer className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-4">
            <Boton
              variante="neutro"
              onClick={() => (paso === 0 ? cerrar() : setPaso(paso - 1))}
              disabled={trabajando}
            >
              {paso === 0 ? 'Cancelar' : <><ChevronLeft size={14} /> Atrás</>}
            </Boton>

            {paso === 0 && (
              <Boton onClick={() => archivo && setPaso(1)} disabled={!archivo}>
                Continuar <ChevronRight size={14} />
              </Boton>
            )}
            {paso === 1 && (
              <Boton onClick={validar} disabled={sinNombre || trabajando}>
                {trabajando
                  ? <><Loader2 size={14} className="animate-spin" /> Revisando</>
                  : <>Revisar {crudas.length} filas <ChevronRight size={14} /></>}
              </Boton>
            )}
            {paso === 2 && (
              <Boton onClick={() => setPaso(3)} disabled={r.listos + r.fusionar === 0}>
                Continuar <ChevronRight size={14} />
              </Boton>
            )}
            {paso === 3 && (
              <Boton onClick={importar} disabled={trabajando || r.listos + r.fusionar === 0}>
                {trabajando
                  ? <><Loader2 size={14} className="animate-spin" /> Importando</>
                  : `Importar ${r.listos + r.fusionar} pacientes`}
              </Boton>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
