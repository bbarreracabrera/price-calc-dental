import { useEffect, useState } from 'react';
import {
    ArrowLeft, AlertTriangle, User, FileQuestion, Activity,
    FileBarChart, FileText, FileSignature, ImageIcon,
    Mic, Sparkles, Calculator, Heart, Stethoscope,
    FolderOpen, ChevronRight, Plus, MessageCircle, Calendar,
    Zap, ClipboardList, Phone, Menu, X, GitBranch, HardDrive, Microscope, FastForward
} from 'lucide-react';

// --- IMPORTACIÓN DE PESTAÑAS ---
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
import { PatientCardSkeleton, FormSkeleton } from './SkeletonLoaders';

// Nuevos componentes de seguimiento de especialidades
import OrthodonticsTrackingTab from './OrthodonticsTrackingTab';
import ImplantologyTrackingTab from './ImplantologyTrackingTab';
import EndodonticsTrackingTab from './EndodonticsTrackingTab';

export default function PatientWorkspace({
    selectedPatientId, setSelectedPatientId, patientTab, setPatientTab,
    userRole, themeMode, session, clinicOwner, patientRecords, setActiveTab,
    activeFormType, setActiveFormType, viewingForm, setViewingForm,
    odontogramMode, setOdontogramMode, odontogramType, setOdontogramType,
    toothModalData, setToothModalData, catalog, sessionData, setSessionData,
    isListening, voiceStatus, toggleVoice,
    newEvolution, setNewEvolution, activeFolder, setActiveFolder, uploading,
    consentTemplate, setConsentTemplate, consentText, setConsentText, modal,
    getPatient, savePatientData, setPatientRecords, setModal, setQuoteItems,
    setPerioData, restoreSnapshot, savePerioSnapshot, getPerioStats, logAction,
    handleGeneratePDF, handleImageUpload, notify, sendWhatsApp, setSelectedImg, config,
    isLoading = false
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);

    if (isLoading || (selectedPatientId && !getPatient(selectedPatientId))) {
        return (
            <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4 lg:gap-6 animate-in fade-in p-4 lg:p-0">
                <div className="w-full lg:w-56 shrink-0 space-y-4">
                    <div className="h-40 bg-[#DFD2C4]/20 animate-pulse rounded-2xl"></div>
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-10 bg-[#DFD2C4]/10 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-[2.5rem] border border-[#DFD2C4]/60 p-4 lg:p-8 shadow-sm overflow-hidden">
                    <PatientCardSkeleton />
                    <div className="mt-8">
                        <FormSkeleton />
                    </div>
                </div>
            </div>
        );
    }
    const p = getPatient(selectedPatientId);

    const activeQuotesCount = p.clinical?.quotes?.filter(q => q.status === 'en_proceso' || q.status === 'active')?.length || 0;
    const consentsCount = p.consents?.length || 0;

    // --- ACCIONES RÁPIDAS ---
    const quickActions = [
        {
            id: 'fast_exam',
            label: 'Examen Rápido',
            icon: FastForward,
            color: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200',
            action: () => {
                setPatientTab('clinical');
                setOdontogramMode('hallazgos');
                notify('Modo Examen Rápido activado. Selecciona los hallazgos directamente en el odontograma.');
            }
        },
        {
            id: 'evolution',
            label: 'Nueva Evolución',
            icon: Plus,
            color: 'bg-[#5B6651] text-white hover:bg-[#4a5442]',
            action: () => {
                setPatientTab('evolution');
                setTimeout(() => {
                    const el = document.getElementById('new-evolution-input');
                    if (el) el.focus();
                }, 200);
            }
        },
        {
            id: 'quote',
            label: 'Cotización Rápida',
            icon: Calculator,
            color: 'bg-[#CBAAA2]/20 text-[#8B5E57] hover:bg-[#CBAAA2]/40 border border-[#CBAAA2]/30',
            action: () => {
                if (setSessionData) {
                    setSessionData(prev => ({
                        ...prev,
                        patientId: selectedPatientId,
                        patientName: p.personal?.legalName || 'Paciente'
                    }));
                }
                setActiveTab('quote');
            }
        },
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
            action: () => {
                const phone = p.personal?.phone?.replace(/\D/g, '');
                if (!phone) { notify('El paciente no tiene teléfono registrado.'); return; }
                const name = p.personal?.legalName || 'paciente';
                window.open(`https://wa.me/56${phone.replace(/^0/, '')}?text=Hola%20${encodeURIComponent(name)}%2C%20le%20contactamos%20desde%20la%20cl%C3%ADnica.`, '_blank');
            }
        },
        {
            id: 'agenda',
            label: 'Agendar Cita',
            icon: Calendar,
            color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
            action: () => setModal('appointment')
        },
        {
            id: 'call',
            label: 'Llamar',
            icon: Phone,
            color: 'bg-[#FDFBF7] text-[#6B615A] hover:bg-[#DFD2C4]/40 border border-[#DFD2C4]',
            action: () => {
                const phone = p.personal?.phone?.replace(/\D/g, '');
                if (!phone) { notify('El paciente no tiene teléfono registrado.'); return; }
                window.location.href = `tel:+56${phone.replace(/^0/, '')}`;
            }
        }
    ];

    // --- GRUPOS Y BOTONES DE NAVEGACIÓN ---
    function ShieldIcon(props) { return <Heart {...props} />; }

    const TAB_GROUPS = [
        { id: 'data',      label: 'Ficha & Datos', icon: User,        tabs: ['personal', 'anamnesis'] },
        { id: 'clinical',  label: 'Clínica Pro',   icon: Stethoscope, tabs: ['clinical', 'perio', 'evolution', 'orthodontics', 'implantology', 'endodontics'] },
        { id: 'risk',      label: 'Prevención',    icon: ShieldIcon,  tabs: ['pra', 'cariogram'] },
        { id: 'documents', label: 'Gestión',       icon: FolderOpen,  tabs: ['quotes', 'consent', 'images'] },
    ];

    const tabButtons = [
        { id: 'personal',  label: 'Datos Personales',    icon: User,          group: 'data' },
        { id: 'anamnesis', label: 'Anamnesis / Ficha',   icon: FileQuestion,  group: 'data',      restricted: true },
        { id: 'clinical',  label: 'Odontograma',         icon: Activity,      group: 'clinical' },
        { id: 'perio',     label: 'Periodontograma',     icon: FileBarChart,  group: 'clinical',  restricted: true },
        { id: 'evolution', label: 'Evolución Clínica',   icon: FileText,      group: 'clinical',  restricted: true },
        { id: 'orthodontics', label: 'Ortodoncia',       icon: GitBranch,     group: 'clinical',  restricted: true },
        { id: 'implantology', label: 'Implantología',   icon: HardDrive,     group: 'clinical',  restricted: true },
        { id: 'endodontics', label: 'Endodoncia',       icon: Microscope,    group: 'clinical',  restricted: true },
        { id: 'pra',       label: 'Riesgo Periodontal',  icon: Heart,         group: 'risk',      restricted: true },
        { id: 'cariogram', label: 'Riesgo Caries',       icon: Calculator,    group: 'risk',      restricted: true },
        { id: 'quotes',    label: 'Presupuestos',        icon: Calculator,    group: 'documents', badge: activeQuotesCount },
        { id: 'consent',   label: 'Consentimientos',     icon: FileSignature, group: 'documents', badge: consentsCount },
        { id: 'images',    label: 'Galería Multimedia',  icon: ImageIcon,     group: 'documents' }
    ];

    const isTabVisible = (tabId) => {
        const t = tabButtons.find(b => b.id === tabId);
        return t && !(userRole === 'assistant' && t.restricted);
    };

    // Alertas médicas críticas
    const criticalConditions = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Coagulopatía', 'Epilepsia'];
    const activeAlerts = Object.entries(p.anamnesis?.conditions || {})
        .filter(([k, v]) => v && criticalConditions.includes(k))
        .map(([k]) => k);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right pb-10 lg:pb-0">

            {/* ===== ENCABEZADO DEL DOSSIER ===== */}
            <div className="flex flex-col gap-3 border-b border-[#DFD2C4]/50 pb-4 lg:pb-5 mb-4 lg:mb-5 px-4 lg:px-0">
                
                {/* Fila 1: Volver + Alertas + Menú Móvil */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={() => setSelectedPatientId(null)}
                        className="flex items-center gap-2 text-[10px] font-black text-[#9A8F84] hover:text-[#5B6651] transition-colors tracking-widest uppercase"
                    >
                        <ArrowLeft size={12} /> VOLVER
                    </button>
                    <div className="flex items-center gap-2">
                        {activeAlerts.length > 0 && (
                            <div className="bg-red-50 border border-red-200 px-2 lg:px-3 py-1 lg:py-1.5 rounded-xl flex items-center gap-2">
                                <AlertTriangle size={13} className="text-red-500 shrink-0" />
                                <span className="text-[9px] lg:text-[10px] font-black text-red-600 uppercase tracking-tight">
                                    {activeAlerts[0]}{activeAlerts.length > 1 ? ` +${activeAlerts.length - 1}` : ''}
                                </span>
                            </div>
                        )}
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-[#DFD2C4]/30 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Fila 2: Avatar + Nombre */}
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-2xl bg-[#5B6651]/10 flex items-center justify-center text-[#5B6651] font-black text-lg lg:text-xl shadow-inner border border-[#5B6651]/10 shrink-0">
                        {p.personal?.legalName?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl lg:text-2xl font-black text-[#312923] tracking-tight leading-none truncate">
                            {p.personal?.legalName || 'Paciente'}
                        </h2>
                        <p className="text-[9px] lg:text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-1 truncate">
                            RUT: {p.personal?.rut || '—'}
                        </p>
                    </div>
                </div>

                {/* Fila 3: BARRA DE ACCIONES RÁPIDAS (Scroll horizontal en móvil) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:pb-0 lg:flex-wrap">
                    <div className="flex items-center gap-1.5 mr-1 shrink-0">
                        <Zap size={11} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9A8F84] whitespace-nowrap">Acciones</span>
                    </div>
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={action.action}
                            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-[9px] lg:text-[10px] font-black transition-all hover:-translate-y-0.5 shadow-sm shrink-0 ${action.color}`}
                        >
                            <action.icon size={11} />
                            <span className="hidden sm:inline">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== CUERPO PRINCIPAL: MENÚ LATERAL + CONTENIDO ===== */}
            <div className="flex gap-4 lg:gap-5 flex-1 min-h-0 px-4 lg:px-0">

                {/* --- MENÚ LATERAL DE NAVEGACIÓN (Drawer en móvil) --- */}
                <div className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-[#DFD2C4]/50 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 pb-4 transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    {TAB_GROUPS.map(group => {
                        const visibleTabs = tabButtons.filter(t => t.group === group.id && isTabVisible(t.id));
                        if (visibleTabs.length === 0) return null;
                        return (
                            <div key={group.id} className="space-y-1 px-3">
                                <h3 className="text-[9px] font-black text-[#9A8F84] uppercase tracking-[0.2em] px-3 flex items-center gap-2 mb-2">
                                    <group.icon size={11} />
                                    {group.label}
                                </h3>
                                {visibleTabs.map(tab => {
                                    const isActive = patientTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setPatientTab(tab.id);
                                                setSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all group ${
                                                isActive
                                                    ? 'bg-[#312923] text-white shadow-md'
                                                    : 'bg-white hover:bg-[#FDFBF7] text-[#6B615A] border border-transparent hover:border-[#DFD2C4]/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <tab.icon size={14} className={isActive ? 'text-white shrink-0' : 'text-[#9A8F84] group-hover:text-[#5B6651] shrink-0'} />
                                                <span className={`text-[11px] font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-[#312923]'}`}>
                                                    {tab.label}
                                                </span>
                                            </div>
                                            {tab.badge > 0 && (
                                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-[#CBAAA2]/20 text-[#CBAAA2]'
                                                }`}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                            {isActive && <ChevronRight size={12} className="text-white/40 ml-auto shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Atajo de Voz - Destacado: siempre pegado al fondo */}
                    <div className={`mt-auto rounded-3xl border-2 transition-all overflow-hidden shrink-0 mx-3 ${
                        isListening
                            ? 'border-red-400 bg-red-50 shadow-lg shadow-red-100'
                            : 'border-[#5B6651]/30 bg-gradient-to-br from-[#5B6651]/5 to-[#5B6651]/10'
                    }`}>
                        <button
                            onClick={toggleVoice}
                            className={`w-full p-4 flex flex-col items-center gap-2 transition-all group ${
                                isListening ? 'cursor-pointer' : 'hover:bg-[#5B6651]/5'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                                isListening
                                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-300'
                                    : 'bg-[#5B6651] text-white group-hover:scale-110 shadow-md shadow-[#5B6651]/30'
                            }`}>
                                <Mic size={18} />
                            </div>
                            <div className="text-center">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${
                                    isListening ? 'text-red-600' : 'text-[#312923]'
                                }`}>
                                    {isListening ? '● Escuchando...' : 'Asistente de Voz'}
                                </p>
                                <p className="text-[9px] font-bold text-[#9A8F84] mt-0.5">
                                    {isListening ? 'Toca para detener' : 'Toca para activar'}
                                </p>
                            </div>
                        </button>
                        {voiceStatus && (
                            <div className="px-3 pb-3">
                                <p className="text-[9px] font-black text-[#5B6651] bg-white rounded-xl px-3 py-2 text-center border border-[#5B6651]/20 truncate">
                                    {voiceStatus}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay para cerrar sidebar en móvil */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
                <div className="flex-1 bg-white rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-7 border border-[#DFD2C4]/40 shadow-sm overflow-y-auto custom-scrollbar relative min-w-0">

                    {/* Indicador flotante de estado de voz */}
                    {voiceStatus && (
                        <div className="absolute top-4 right-4 lg:right-6 bg-[#312923] text-white px-3 lg:px-4 py-2 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-xl animate-bounce z-10 flex items-center gap-2">
                            <Sparkles size={11} className="text-amber-400 shrink-0" />
                            <span className="hidden sm:inline">{voiceStatus}</span>
                        </div>
                    )}

                    {/* RENDERIZADO DINÁMICO */}
                    <div className="animate-in fade-in duration-200">
                        {patientTab === 'personal'  && <PatientPersonalTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} />}
                        {patientTab === 'anamnesis' && (
                            <PatientAnamnesisTab
                                p={p}
                                getPatient={getPatient}
                                selectedPatientId={selectedPatientId}
                                savePatientData={savePatientData}
                                notify={notify}
                                session={session}
                                activeFormType={activeFormType}
                                setActiveFormType={setActiveFormType}
                                viewingForm={viewingForm}
                                setViewingForm={setViewingForm}
                            />
                        )}
                        {patientTab === 'clinical'  && (
                            <OdontogramTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode}
                                odontogramType={odontogramType} setOdontogramType={setOdontogramType}
                                setToothModalData={setToothModalData} setModal={setModal}
                            />
                        )}
                        {patientTab === 'perio' && (
                            <PerioTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                setPerioData={setPerioData} setModal={setModal} setToothModalData={setToothModalData}
                                restoreSnapshot={restoreSnapshot} savePerioSnapshot={savePerioSnapshot} getPerioStats={getPerioStats}
                            />
                        )}
                        {patientTab === 'evolution' && (
                            <PatientEvolutionTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                newEvolution={newEvolution} setNewEvolution={setNewEvolution} notify={notify} session={session}
                            />
                        )}
                        {patientTab === 'orthodontics' && (
                            <OrthodonticsTrackingTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                notify={notify} session={session}
                            />
                        )}
                        {patientTab === 'implantology' && (
                            <ImplantologyTrackingTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                notify={notify} session={session}
                            />
                        )}
                        {patientTab === 'endodontics' && (
                            <EndodonticsTrackingTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                notify={notify} session={session}
                            />
                        )}
                        {patientTab === 'pra' && (
                            <PRATab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                notify={notify}
                            />
                        )}
                        {patientTab === 'cariogram' && (
                            <CariogramTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                notify={notify}
                            />
                        )}
                        {patientTab === 'quotes' && (
                            <ActiveQuotesTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                notify={notify} setQuoteItems={setQuoteItems} setActiveTab={setActiveTab}
                            />
                        )}
                        {patientTab === 'consent' && (
                            <PatientConsentTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate}
                                consentText={consentText} setConsentText={setConsentText}
                                notify={notify} session={session}
                            />
                        )}
                        {patientTab === 'images' && (
                            <PatientImagesTab
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                activeFolder={activeFolder} setActiveFolder={setActiveFolder}
                                uploading={uploading} handleImageUpload={handleImageUpload}
                                setSelectedImg={setSelectedImg} notify={notify}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
