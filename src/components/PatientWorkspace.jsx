import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, User, FileQuestion, Activity, FileBarChart, FileText, FileSignature,
  ImageIcon, Mic, Calculator, Heart, Stethoscope, FolderOpen, Plus, MessageCircle,
  Calendar, Zap, Phone, Menu, X, GitBranch, HardDrive, Microscope, FastForward,
  Volume2, VolumeX, Palette, LayoutDashboard, Printer, ChevronRight,
} from 'lucide-react';

import { supabase as supabaseClient } from '../supabase';
import { formatRUT } from '../constants';

import PatientPersonalTab from './PatientPersonalTab';
import PatientAnamnesisTab from './PatientAnamnesisTab';
import OdontogramTab from './OdontogramTab';
import PerioTab from './PerioTab';
import PatientEvolutionTab from './PatientEvolutionTab';
import PatientConsentTab from './PatientConsentTab';
import PatientImagesTab from './PatientImagesTab';
import ActiveQuotesTab from './ActiveQuotesTab';
import PRATab from './PRATab';
import CariogramTab from './CariogramTab';
import OrthodonticsTrackingTab from './OrthodonticsTrackingTab';
import ImplantologyTrackingTab from './ImplantologyTrackingTab';
import EndodonticsTrackingTab from './EndodonticsTrackingTab';
import DSDTab from './DSDTab';
import PatientSummaryTab from './PatientSummaryTab';
import AlertasMedicas from './AlertasMedicas';
import { PatientCardSkeleton, FormSkeleton } from './SkeletonLoaders';

// ============================================================================
// FICHA DEL PACIENTE
// ----------------------------------------------------------------------------
// Antes: catorce pestañas repartidas en cuatro grupos, todas al mismo nivel
// dentro de cada grupo. "Clínica Pro" tenía seis, y Ortodoncia, Implantología y
// Endodoncia pesaban igual que Odontograma, Periodontograma y Evolución, que se
// usan en toda atención. Además aparecían siempre, aunque el paciente viniera
// solo a una limpieza.
//
// Ahora: cinco secciones con sub-pestañas dentro. Las de especialidad aparecen
// únicamente si el paciente tiene registros en esa especialidad, o si el
// profesional las activa a propósito desde el botón de la sección Clínica.
//
// Tres cambios más que apuntan a lo mismo, menos clics:
//
//   · Resumen es la pantalla de entrada. Antes caías en Datos Personales, que
//     es justo lo que menos se mira con el paciente sentado al frente.
//   · Las alertas médicas viven fuera del área de contenido, así que se ven
//     desde cualquier sección y no solo desde la cabecera.
//   · La evolución se escribe en un panel lateral que se abre encima de lo que
//     estés mirando. Ya no hay que salir del odontograma para registrar.
//
// Y un error que tenía un botón muerto: esta vista pasaba la función de PDF
// como `handleGeneratePDF`, pero PatientConsentTab la recibe como `generatePDF`.
// El botón "Descargar PDF" de un consentimiento firmado llamaba a undefined.
// ============================================================================

const SECCIONES = [
  { id: 'resumen',    label: 'Resumen',    icono: LayoutDashboard, tabs: ['resumen'] },
  { id: 'paciente',   label: 'Paciente',   icono: User,            tabs: ['personal', 'anamnesis'] },
  { id: 'clinica',    label: 'Clínica',    icono: Stethoscope,     tabs: ['clinical', 'perio', 'evolution', 'orthodontics', 'implantology', 'endodontics'] },
  { id: 'riesgo',     label: 'Riesgo',     icono: Heart,           tabs: ['pra', 'cariogram'] },
  { id: 'documentos', label: 'Documentos', icono: FolderOpen,      tabs: ['quotes', 'consent', 'images', 'dsd'] },
];

const PESTANAS = [
  { id: 'resumen',      label: 'Resumen',            icono: LayoutDashboard, seccion: 'resumen' },
  { id: 'personal',     label: 'Datos personales',   icono: User,            seccion: 'paciente' },
  { id: 'anamnesis',    label: 'Anamnesis',          icono: FileQuestion,    seccion: 'paciente',   restringida: true },
  { id: 'clinical',     label: 'Odontograma',        icono: Activity,        seccion: 'clinica' },
  { id: 'perio',        label: 'Periodontograma',    icono: FileBarChart,    seccion: 'clinica',    restringida: true },
  { id: 'evolution',    label: 'Evolución clínica',  icono: FileText,        seccion: 'clinica',    restringida: true },
  { id: 'orthodontics', label: 'Ortodoncia',         icono: GitBranch,       seccion: 'clinica',    restringida: true, especialidad: 'ortodoncia' },
  { id: 'implantology', label: 'Implantología',      icono: HardDrive,       seccion: 'clinica',    restringida: true, especialidad: 'implantologia' },
  { id: 'endodontics',  label: 'Endodoncia',         icono: Microscope,      seccion: 'clinica',    restringida: true, especialidad: 'endodoncia' },
  { id: 'pra',          label: 'Riesgo periodontal', icono: Heart,           seccion: 'riesgo',     restringida: true },
  { id: 'cariogram',    label: 'Riesgo de caries',   icono: Calculator,      seccion: 'riesgo',     restringida: true },
  { id: 'quotes',       label: 'Presupuestos',       icono: Calculator,      seccion: 'documentos' },
  { id: 'consent',      label: 'Consentimientos',    icono: FileSignature,   seccion: 'documentos' },
  { id: 'images',       label: 'Imágenes',           icono: ImageIcon,       seccion: 'documentos' },
  { id: 'dsd',          label: 'Diseño de sonrisa',  icono: Palette,         seccion: 'documentos' },
];

const ESPECIALIDADES = [
  { clave: 'ortodoncia',    tabla: 'orthodontics_records', tab: 'orthodontics', label: 'Ortodoncia' },
  { clave: 'implantologia', tabla: 'implantology_records', tab: 'implantology', label: 'Implantología' },
  { clave: 'endodoncia',    tabla: 'endodontics_records',  tab: 'endodontics',  label: 'Endodoncia' },
];

export default function PatientWorkspace({
  selectedPatientId, setSelectedPatientId, patientTab, setPatientTab,
  userRole, session, setActiveTab,
  activeFormType, setActiveFormType, viewingForm, setViewingForm,
  odontogramMode, setOdontogramMode, odontogramType, setOdontogramType,
  setToothModalData, catalog, sessionData, setSessionData,
  isListening, voiceStatus, toggleVoice, voiceConfirmationEnabled, toggleVoiceConfirmation,
  newEvolution, setNewEvolution, activeFolder, setActiveFolder, uploading,
  consentTemplate, setConsentTemplate, consentText, setConsentText, modal,
  getPatient, savePatientData, setModal, setQuoteItems,
  setPerioData, restoreSnapshot, savePerioSnapshot, getPerioStats, logAction,
  handleGeneratePDF, handleImageUpload, notify, sendWhatsApp, setSelectedImg, config,
  supabase, appointments = [], isLoading = false,
}) {
  const db = supabase || supabaseClient;

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [panelEvolucion, setPanelEvolucion] = useState(false);
  const [especialidadesActivas, setEspecialidadesActivas] = useState([]);
  const [especialidadesManuales, setEspecialidadesManuales] = useState([]);
  const [menuEspecialidad, setMenuEspecialidad] = useState(false);
  const contenidoRef = useRef(null);

  // ---------------------------------------------------------------------
  // Qué especialidades tiene realmente este paciente
  // ---------------------------------------------------------------------
  // Los registros de especialidad viven en tablas propias, no dentro del JSON
  // del paciente, así que hay que preguntarlo. Son tres conteos sin traer
  // filas; se resuelven en una sola ida y vuelta.
  useEffect(() => {
    let vigente = true;
    if (!selectedPatientId || !db) return undefined;

    (async () => {
      try {
        const resultados = await Promise.all(
          ESPECIALIDADES.map(e =>
            db.from(e.tabla).select('id', { count: 'exact', head: true }).eq('patient_id', selectedPatientId),
          ),
        );
        if (!vigente) return;
        setEspecialidadesActivas(
          ESPECIALIDADES.filter((e, i) => (resultados[i]?.count || 0) > 0).map(e => e.clave),
        );
      } catch {
        // Si la consulta falla, se muestran las tres: es preferible una pestaña
        // de más que esconderle al profesional un tratamiento en curso.
        if (vigente) setEspecialidadesActivas(ESPECIALIDADES.map(e => e.clave));
      }
    })();

    return () => { vigente = false; };
  }, [selectedPatientId, db]);

  useEffect(() => { setEspecialidadesManuales([]); }, [selectedPatientId]);

  const especialidadesVisibles = useMemo(
    () => [...new Set([...especialidadesActivas, ...especialidadesManuales])],
    [especialidadesActivas, especialidadesManuales],
  );

  const pestanaVisible = useCallback((id) => {
    const t = PESTANAS.find(x => x.id === id);
    if (!t) return false;
    if (userRole === 'assistant' && t.restringida) return false;
    if (t.especialidad && !especialidadesVisibles.includes(t.especialidad)) return false;
    return true;
  }, [userRole, especialidadesVisibles]);

  const p = getPatient?.(selectedPatientId);

  const seccionActual = useMemo(
    () => SECCIONES.find(s => s.tabs.includes(patientTab))?.id || 'resumen',
    [patientTab],
  );

  const irA = useCallback((tab) => {
    setPatientTab(tab);
    setMenuAbierto(false);
    contenidoRef.current?.scrollTo?.({ top: 0 });
  }, [setPatientTab]);

  const abrirSeccion = useCallback((seccionId) => {
    const seccion = SECCIONES.find(s => s.id === seccionId);
    const primera = seccion?.tabs.find(pestanaVisible);
    if (primera) irA(primera);
  }, [irA, pestanaVisible]);

  const abrirEvolucion = useCallback(() => {
    setPanelEvolucion(true);
    setTimeout(() => document.getElementById('new-evolution-input')?.focus(), 180);
  }, []);

  // ---------------------------------------------------------------------
  // Atajos de teclado
  // ---------------------------------------------------------------------
  // Para las cuatro acciones que se repiten en cada atención. No se disparan
  // mientras se escribe en un campo ni con modificadores, para no pelear con
  // copiar y pegar.
  useEffect(() => {
    const manejar = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;

      const k = e.key.toLowerCase();
      if (k === 'r') { e.preventDefault(); irA('resumen'); }
      else if (k === 'o') { e.preventDefault(); irA('clinical'); }
      else if (k === 'e') { e.preventDefault(); abrirEvolucion(); }
      else if (k === 'p') { e.preventDefault(); irA('quotes'); }
      else if (k === 'escape' && panelEvolucion) setPanelEvolucion(false);
    };
    window.addEventListener('keydown', manejar);
    return () => window.removeEventListener('keydown', manejar);
  }, [irA, abrirEvolucion, panelEvolucion]);

  // ---------------------------------------------------------------------
  if (isLoading || (selectedPatientId && !p)) {
    return (
      <div className="flex h-[calc(100vh-100px)] animate-in flex-col gap-4 fade-in lg:flex-row lg:gap-6">
        <div className="w-full shrink-0 space-y-3 lg:w-52">
          <div className="h-32 animate-pulse rounded-panel bg-raised" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-xl bg-raised/60" />
          ))}
        </div>
        <div className="flex-1 overflow-hidden rounded-panel border border-line bg-surface p-4 shadow-card lg:p-8">
          <PatientCardSkeleton />
          <div className="mt-8"><FormSkeleton /></div>
        </div>
      </div>
    );
  }
  if (!p) return null;

  const nombre = p.personal?.legalName || p.personal?.name || 'Paciente';
  const citasPaciente = appointments.filter(
    c => c.patientId === selectedPatientId || c.patient_id === selectedPatientId,
  );

  const presupuestosActivos =
    p.clinical?.quotes?.filter(q => q.status === 'en_proceso' || q.status === 'active')?.length || 0;
  const contadores = { quotes: presupuestosActivos, consent: p.consents?.length || 0 };

  const accionesRapidas = [
    {
      id: 'evolution', label: 'Evolución', icono: Plus, atajo: 'E',
      clase: 'bg-accent text-white hover:bg-accent-hover',
      accion: abrirEvolucion,
    },
    {
      id: 'fast_exam', label: 'Examen rápido', icono: FastForward, atajo: 'O',
      clase: 'bg-warn-soft text-warn border border-warn/25',
      accion: () => {
        irA('clinical');
        setOdontogramMode?.('hallazgos');
        notify?.('Examen rápido activado. Marca los hallazgos en el odontograma.');
      },
    },
    {
      id: 'quote', label: 'Presupuesto', icono: Calculator, atajo: 'P',
      clase: 'bg-rose-soft text-rose border border-rose/25',
      accion: () => {
        setSessionData?.(prev => ({ ...prev, patientId: selectedPatientId, patientName: nombre }));
        setActiveTab?.('quote');
      },
    },
    {
      id: 'ficha', label: 'Imprimir ficha', icono: Printer,
      clase: 'bg-raised text-ink border border-line',
      accion: () => handleGeneratePDF?.('ficha', p),
    },
    {
      id: 'agenda', label: 'Agendar', icono: Calendar,
      clase: 'bg-sky-soft text-sky border border-sky/25',
      accion: () => setModal?.('appt'),
    },
    {
      id: 'whatsapp', label: 'WhatsApp', icono: MessageCircle,
      clase: 'bg-ok-soft text-ok border border-ok/25',
      accion: () => {
        const tel = p.personal?.phone?.replace(/\D/g, '');
        if (!tel) return notify?.('El paciente no tiene teléfono registrado.');
        return window.open(`https://wa.me/56${tel.replace(/^0/, '')}?text=Hola%20${encodeURIComponent(nombre)}`, '_blank');
      },
    },
    {
      id: 'call', label: 'Llamar', icono: Phone,
      clase: 'bg-raised text-muted border border-line',
      accion: () => {
        const tel = p.personal?.phone?.replace(/\D/g, '');
        if (!tel) return notify?.('El paciente no tiene teléfono registrado.');
        window.location.href = `tel:+56${tel.replace(/^0/, '')}`;
        return undefined;
      },
    },
  ];

  const propsBase = { p, getPatient, selectedPatientId, savePatientData, notify, session };

  const contenido = {
    resumen: (
      <PatientSummaryTab
        p={p}
        irA={irA}
        citas={citasPaciente}
        onNuevaEvolucion={abrirEvolucion}
        onAgendar={() => setModal?.('appt')}
      />
    ),
    personal: <PatientPersonalTab {...propsBase} sendWhatsApp={sendWhatsApp} config={config} />,
    anamnesis: (
      <PatientAnamnesisTab
        {...propsBase}
        activeFormType={activeFormType} setActiveFormType={setActiveFormType}
        viewingForm={viewingForm} setViewingForm={setViewingForm}
      />
    ),
    clinical: (
      <OdontogramTab
        {...propsBase}
        odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode}
        odontogramType={odontogramType} setOdontogramType={setOdontogramType}
        setToothModalData={setToothModalData} setModal={setModal}
        userRole={userRole} catalog={catalog} setQuoteItems={setQuoteItems}
        setActiveTab={setActiveTab} sessionData={sessionData} setSessionData={setSessionData}
      />
    ),
    perio: (
      <PerioTab
        {...propsBase}
        setPerioData={setPerioData} setModal={setModal} setToothModalData={setToothModalData}
        restoreSnapshot={restoreSnapshot} savePerioSnapshot={savePerioSnapshot}
        getPerioStats={getPerioStats}
        config={config} logAction={logAction}
      />
    ),
    evolution: <PatientEvolutionTab {...propsBase} newEvolution={newEvolution} setNewEvolution={setNewEvolution} />,
    orthodontics: <OrthodonticsTrackingTab {...propsBase} />,
    implantology: <ImplantologyTrackingTab {...propsBase} />,
    endodontics: <EndodonticsTrackingTab {...propsBase} />,
    pra: <PRATab {...propsBase} />,
    cariogram: <CariogramTab {...propsBase} />,
    quotes: <ActiveQuotesTab {...propsBase} setQuoteItems={setQuoteItems} setActiveTab={setActiveTab} />,
    consent: (
      <PatientConsentTab
        {...propsBase}
        consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate}
        consentText={consentText} setConsentText={setConsentText}
        modal={modal} setModal={setModal}
        // El nombre de esta propiedad es lo que estaba roto: el componente la
        // recibe como `generatePDF`, no como `handleGeneratePDF`.
        generatePDF={handleGeneratePDF}
      />
    ),
    images: (
      <PatientImagesTab
        {...propsBase}
        activeFolder={activeFolder} setActiveFolder={setActiveFolder}
        uploading={uploading} handleImageUpload={handleImageUpload}
        setSelectedImg={setSelectedImg} config={config} saveToSupabase={savePatientData}
      />
    ),
    dsd: (
      <DSDTab
        {...propsBase}
        supabase={db} config={config} handleImageUpload={handleImageUpload}
        activeFolder={activeFolder} setActiveFolder={setActiveFolder}
      />
    ),
  };

  const subPestanas = SECCIONES.find(s => s.id === seccionActual)?.tabs.filter(pestanaVisible) || [];
  const especialidadesDisponibles = ESPECIALIDADES.filter(e => !especialidadesVisibles.includes(e.clave));

  return (
    <div className="flex h-full animate-in flex-col slide-in-from-right pb-20 lg:pb-0">

      {/* ===== CABECERA ===== */}
      <header className="mb-4 flex flex-col gap-3 border-b border-line px-4 pb-4 lg:px-0">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSelectedPatientId(null)}
            className="flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={13} /> Volver
          </button>
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Abrir navegación de la ficha"
            className="rounded-lg p-2 transition-colors hover:bg-raised lg:hidden"
          >
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent-soft text-lg font-extrabold text-accent">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold leading-tight tracking-tight text-ink lg:text-2xl">
              {nombre}
            </h2>
            <p className="tabular mt-0.5 truncate text-2xs font-bold uppercase tracking-wider text-muted">
              RUT {p.personal?.rut ? formatRUT(p.personal.rut) : 'no registrado'}
              {p.personal?.age ? ` · ${p.personal.age} años` : ''}
            </p>
          </div>
        </div>

        {/* Las alertas viven aquí arriba, fuera del área de contenido: se ven
            desde las cinco secciones y no solo desde una. */}
        <AlertasMedicas p={p} onEditar={() => irA('anamnesis')} />

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0">
          <span className="flex shrink-0 items-center gap-1 pr-1 text-2xs font-extrabold uppercase tracking-wider text-muted">
            <Zap size={11} className="text-warn" /> Acciones
          </span>
          {accionesRapidas.map(a => (
            <button
              key={a.id}
              onClick={a.accion}
              title={a.atajo ? `${a.label} — tecla ${a.atajo}` : a.label}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-2xs font-extrabold transition-all hover:-translate-y-0.5 ${a.clase}`}
            >
              <a.icono size={12} />
              <span className="hidden sm:inline">{a.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ===== CUERPO ===== */}
      <div className="flex min-h-0 flex-1 gap-4 px-4 lg:px-0">

        <nav
          aria-label="Secciones de la ficha"
          className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-surface p-3 transition-transform duration-200 custom-scrollbar
            lg:static lg:w-52 lg:translate-x-0 lg:border-0 lg:bg-transparent lg:p-0
            ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {SECCIONES.map(s => {
            const visibles = s.tabs.filter(pestanaVisible);
            if (!visibles.length) return null;
            const activa = seccionActual === s.id;
            const pendientes = visibles.reduce((n, t) => n + (contadores[t] || 0), 0);

            return (
              <div key={s.id}>
                <button
                  onClick={() => abrirSeccion(s.id)}
                  aria-current={activa ? 'page' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors
                    ${activa ? 'bg-ink text-white' : 'text-ink hover:bg-raised'}`}
                >
                  <s.icono size={15} className={activa ? 'text-white' : 'text-muted'} />
                  <span className="text-xs font-extrabold tracking-tight">{s.label}</span>
                  {pendientes > 0 && (
                    <span className={`ml-auto rounded-md px-1.5 py-0.5 text-2xs font-extrabold ${activa ? 'bg-white/20' : 'bg-accent-soft text-accent'}`}>
                      {pendientes}
                    </span>
                  )}
                </button>

                {/* Las sub-pestañas solo se despliegan dentro de la sección
                    abierta: esa jerarquía es lo que se había perdido. */}
                {activa && visibles.length > 1 && (
                  <div className="mb-1 ml-3 mt-1 space-y-0.5 border-l border-line pl-2">
                    {visibles.map(id => {
                      const t = PESTANAS.find(x => x.id === id);
                      const sel = patientTab === id;
                      return (
                        <button
                          key={id}
                          onClick={() => irA(id)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors
                            ${sel ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-raised hover:text-ink'}`}
                        >
                          <t.icono size={12} className="shrink-0" />
                          <span className="truncate text-2xs font-bold">{t.label}</span>
                          {contadores[id] > 0 && (
                            <span className="ml-auto text-2xs font-extrabold">{contadores[id]}</span>
                          )}
                        </button>
                      );
                    })}

                    {s.id === 'clinica' && userRole !== 'assistant' && especialidadesDisponibles.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuEspecialidad(!menuEspecialidad)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-muted transition-colors hover:bg-raised hover:text-accent"
                        >
                          <Plus size={12} className="shrink-0" />
                          <span className="text-2xs font-bold">Agregar seguimiento</span>
                        </button>
                        {menuEspecialidad && (
                          <div className="mt-0.5 space-y-0.5 rounded-lg border border-line bg-surface p-1 shadow-card">
                            {especialidadesDisponibles.map(e => (
                              <button
                                key={e.clave}
                                onClick={() => {
                                  setEspecialidadesManuales(prev => [...prev, e.clave]);
                                  setMenuEspecialidad(false);
                                  irA(e.tab);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-2xs font-bold text-ink hover:bg-accent-soft"
                              >
                                <ChevronRight size={10} /> {e.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className={`mt-auto rounded-panel border transition-colors ${
            isListening ? 'border-danger/40 bg-danger-soft' : 'border-accent/20 bg-accent-soft/50'
          }`}>
            <button onClick={toggleVoice} className="flex w-full flex-col items-center gap-2 p-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                isListening ? 'animate-pulse bg-danger text-white' : 'bg-accent text-white'
              }`}>
                <Mic size={16} />
              </span>
              <span className="text-center">
                <span className={`block text-2xs font-extrabold uppercase tracking-wider ${isListening ? 'text-danger' : 'text-ink'}`}>
                  {isListening ? 'Escuchando' : 'Dictado por voz'}
                </span>
                <span className="mt-0.5 block text-2xs font-semibold text-muted">
                  {isListening ? 'Toca para detener' : 'Toca para activar'}
                </span>
              </span>
            </button>
            <div className="px-2 pb-2">
              <button
                onClick={toggleVoiceConfirmation}
                title="Lee en voz alta lo que se guardó en cada dictado"
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-2xs font-bold transition-colors ${
                  voiceConfirmationEnabled ? 'border-accent/30 bg-accent-soft text-accent' : 'border-line bg-surface text-muted'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {voiceConfirmationEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />} Confirmar en voz
                </span>
                <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${voiceConfirmationEnabled ? 'bg-accent' : 'bg-line-strong'}`}>
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${voiceConfirmationEnabled ? 'left-[14px]' : 'left-0.5'}`} />
                </span>
              </button>
            </div>
            {voiceStatus && (
              <p className="truncate px-2 pb-2 text-center text-2xs font-extrabold text-accent">{voiceStatus}</p>
            )}
          </div>
        </nav>

        {menuAbierto && (
          <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setMenuAbierto(false)} />
        )}

        <main
          ref={contenidoRef}
          className="min-w-0 flex-1 overflow-y-auto rounded-panel border border-line bg-surface p-4 shadow-card custom-scrollbar lg:p-6"
        >
          {subPestanas.length > 1 && (
            <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 pb-2 lg:hidden">
              {subPestanas.map(id => {
                const t = PESTANAS.find(x => x.id === id);
                const sel = patientTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => irA(id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-2xs font-extrabold transition-colors ${
                      sel ? 'bg-accent-soft text-accent' : 'text-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          <div key={patientTab} className="animate-in fade-in duration-150">
            {contenido[patientTab] || contenido.resumen}
          </div>
        </main>
      </div>

      {/* ===== PANEL LATERAL DE EVOLUCIÓN ===== */}
      {/* Se abre encima de cualquier sección. Registrar la atención ya no obliga
          a salir del odontograma y perder lo que estabas mirando. */}
      {panelEvolucion && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/40" onClick={() => setPanelEvolucion(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl animate-in flex-col border-l border-line bg-surface shadow-pop slide-in-from-right duration-200">
            <header className="flex items-center gap-3 border-b border-line px-5 py-4">
              <FileText size={16} className="text-accent" />
              <h3 className="text-sm font-extrabold text-ink">Evolución clínica</h3>
              <span className="truncate text-2xs font-bold text-muted">{nombre}</span>
              <button
                onClick={() => setPanelEvolucion(false)}
                aria-label="Cerrar panel de evolución"
                className="ml-auto rounded-lg p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
              >
                <X size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <PatientEvolutionTab {...propsBase} newEvolution={newEvolution} setNewEvolution={setNewEvolution} />
            </div>
          </aside>
        </>
      )}

      {/* ===== BARRA INFERIOR EN MÓVIL ===== */}
      {/* En pantallas táctiles un cajón lateral cuesta dos gestos por cambio de
          sección. Una barra fija cuesta uno. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        {SECCIONES.filter(s => s.tabs.some(pestanaVisible)).map(s => {
          const activa = seccionActual === s.id;
          return (
            <button
              key={s.id}
              onClick={() => abrirSeccion(s.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${activa ? 'text-accent' : 'text-muted'}`}
            >
              <s.icono size={17} />
              <span className="text-2xs font-bold">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
