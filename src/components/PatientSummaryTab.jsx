import { useMemo } from 'react';
import {
  Activity, FileText, Calculator, Calendar, FileSignature, ImageIcon,
  ArrowRight, Wallet, ClipboardList, Stethoscope,
} from 'lucide-react';
import { TEETH_UPPER, TEETH_LOWER } from '../constants';

// ============================================================================
// RESUMEN DEL PACIENTE
// ----------------------------------------------------------------------------
// Esta pantalla no existía. Al abrir un paciente caías en Datos Personales, que
// es justamente lo que menos se mira durante una atención: nombre y teléfono ya
// los sabes, estás con el paciente sentado al frente.
//
// El Resumen responde en un vistazo lo que un dentista necesita al sentarse:
// qué le hicimos la última vez, qué quedó pendiente, qué piezas están marcadas,
// cuánto debe y cuándo vuelve. Todo lo demás está a un clic.
//
// Nada aquí guarda datos. Es solo lectura y navegación, para que sea imposible
// modificar algo sin querer mientras se revisa.
// ============================================================================

function Tarjeta({ titulo, icono: Icono, accion, onAccion, children, tono = 'neutro' }) {
  const fondo = {
    neutro: 'bg-surface border-line',
    accent: 'bg-accent-soft border-accent/20',
    warn:   'bg-warn-soft border-warn/25',
  }[tono];

  return (
    <section className={`rounded-card border ${fondo} p-4`}>
      <header className="mb-3 flex items-center gap-2">
        <Icono size={14} className="shrink-0 text-muted" />
        <h3 className="text-2xs font-extrabold uppercase tracking-wider text-muted">{titulo}</h3>
        {accion && (
          <button
            onClick={onAccion}
            className="ml-auto flex items-center gap-1 text-2xs font-bold text-accent hover:underline"
          >
            {accion} <ArrowRight size={10} />
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

const fechaCorta = (d) => {
  if (!d) return null;
  const f = new Date(d);
  return Number.isNaN(f.getTime()) ? String(d) : f.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const pesos = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

export default function PatientSummaryTab({ p, irA, citas = [], onNuevaEvolucion, onAgendar }) {
  const evoluciones = useMemo(() => {
    const lista = p?.clinical?.evolutions || p?.evolutions || [];
    return [...lista].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 3);
  }, [p]);

  const piezasMarcadas = useMemo(() => {
    const dientes = p?.clinical?.teeth || {};
    return Object.entries(dientes)
      .filter(([, v]) => {
        const st = Array.isArray(v?.status) ? v.status : (v?.status ? [v.status] : []);
        return st.length && !st.includes('healthy');
      })
      .map(([n, v]) => ({ n: Number(n), status: Array.isArray(v.status) ? v.status : [v.status] }))
      .sort((a, b) => a.n - b.n);
  }, [p]);

  const presupuestos = useMemo(
    () => (p?.clinical?.quotes || []).filter(q => q.status === 'en_proceso' || q.status === 'active'),
    [p],
  );

  const saldo = useMemo(
    () => presupuestos.reduce((s, q) => s + Math.max(0, Number(q.total || 0) - Number(q.paid || 0)), 0),
    [presupuestos],
  );

  const proxima = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return [...citas]
      .filter(c => String(c.date || '') >= hoy)
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))[0] || null;
  }, [citas]);

  const perio = p?.clinical?.perioHistory?.[p.clinical.perioHistory.length - 1]?.stats;
  const consentimientos = p?.consents || [];
  const imagenes = Object.values(p?.images || {}).flat?.() || [];

  const esSuperior = (n) => TEETH_UPPER.includes(n) || (n >= 51 && n <= 65);
  const esInferior = (n) => TEETH_LOWER.includes(n) || (n >= 71 && n <= 85);

  return (
    <div className="space-y-4">
      {/* --- Fila superior: próxima cita, saldo, riesgo --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta titulo="Próxima cita" icono={Calendar} accion="Agendar" onAccion={onAgendar}>
          {proxima ? (
            <>
              <p className="text-lg font-extrabold leading-tight text-ink">{fechaCorta(proxima.date)}</p>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {proxima.time || ''} {proxima.reason ? `· ${proxima.reason}` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-muted">Sin citas futuras</p>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Saldo pendiente"
          icono={Wallet}
          accion="Presupuestos"
          onAccion={() => irA('quotes')}
          tono={saldo > 0 ? 'warn' : 'neutro'}
        >
          <p className="tabular text-lg font-extrabold leading-tight text-ink">{pesos(saldo)}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {presupuestos.length
              ? `${presupuestos.length} presupuesto${presupuestos.length > 1 ? 's' : ''} en curso`
              : 'Sin presupuestos activos'}
          </p>
        </Tarjeta>

        <Tarjeta titulo="Último control periodontal" icono={Stethoscope} accion="Ver" onAccion={() => irA('perio')}>
          {perio ? (
            <div className="flex gap-5">
              {[['BOP', perio.bop != null ? `${perio.bop}%` : '—'],
                ['Placa', perio.plaque != null ? `${perio.plaque}%` : '—'],
                ['NIC', perio.nic != null ? `${perio.nic} mm` : '—']].map(([et, v]) => (
                <div key={et}>
                  <p className="text-2xs font-bold uppercase tracking-wide text-muted">{et}</p>
                  <p className="tabular text-base font-extrabold text-ink">{v}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted">Sin registros</p>
          )}
        </Tarjeta>
      </div>

      {/* --- Evoluciones recientes --- */}
      <Tarjeta titulo="Últimas atenciones" icono={FileText} accion="Ver todas" onAccion={() => irA('evolution')}>
        {evoluciones.length ? (
          <ol className="space-y-2.5">
            {evoluciones.map((e, i) => (
              <li key={e.id || i} className="border-l-2 border-accent/30 pl-3">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted">
                  {fechaCorta(e.date)}
                  {e.author || e.created_by ? ` · ${e.author || e.created_by}` : ''}
                </p>
                <p className="mt-0.5 line-clamp-3 text-sm leading-relaxed text-ink">{e.text || e.content}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm font-semibold text-muted">Todavía no hay evoluciones registradas.</p>
        )}
        <button
          onClick={onNuevaEvolucion}
          className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-2xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-accent-hover"
        >
          Registrar atención de hoy
        </button>
      </Tarjeta>

      {/* --- Piezas con hallazgo --- */}
      <Tarjeta
        titulo={`Piezas con hallazgo (${piezasMarcadas.length})`}
        icono={Activity}
        accion="Odontograma"
        onAccion={() => irA('clinical')}
      >
        {piezasMarcadas.length ? (
          <div className="space-y-2">
            {[['Superior', esSuperior], ['Inferior', esInferior]].map(([nombre, filtro]) => {
              const piezas = piezasMarcadas.filter(x => filtro(x.n));
              if (!piezas.length) return null;
              return (
                <div key={nombre} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-2xs font-bold uppercase tracking-wide text-muted">{nombre}</span>
                  <div className="flex flex-wrap gap-1">
                    {piezas.map(x => (
                      <button
                        key={x.n}
                        onClick={() => irA('clinical')}
                        title={x.status.join(', ')}
                        className="tabular rounded-md border border-line-strong bg-raised px-1.5 py-0.5 text-2xs font-extrabold text-ink transition-colors hover:border-accent hover:bg-accent-soft"
                      >
                        {x.n}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-semibold text-muted">Ninguna pieza marcada todavía.</p>
        )}
      </Tarjeta>

      {/* --- Documentos --- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Consentimientos" icono={FileSignature} accion="Ver" onAccion={() => irA('consent')}>
          <p className="text-lg font-extrabold text-ink">{consentimientos.length}</p>
          <p className="text-xs font-semibold text-muted">
            {consentimientos.filter(c => c.signed_at).length} firmados
          </p>
        </Tarjeta>
        <Tarjeta titulo="Imágenes" icono={ImageIcon} accion="Galería" onAccion={() => irA('images')}>
          <p className="text-lg font-extrabold text-ink">{imagenes.length}</p>
          <p className="text-xs font-semibold text-muted">archivos en la ficha</p>
        </Tarjeta>
        <Tarjeta titulo="Plan de tratamiento" icono={ClipboardList} accion="Planificar" onAccion={() => irA('quotes')}>
          <p className="text-lg font-extrabold text-ink">{presupuestos.length}</p>
          <p className="text-xs font-semibold text-muted">en curso</p>
        </Tarjeta>
      </div>
    </div>
  );
}

export { Calculator };
