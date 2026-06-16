import React, { useState } from 'react';
import {
    ArrowLeft, AlertTriangle, User, FileQuestion, Activity,
    FileBarChart, FileText, FileSignature, ImageIcon,
    Mic, MicOff, Sparkles, Calculator, Heart, Stethoscope, ChevronDown,
    LayoutDashboard, ClipboardList, TrendingUp, FolderOpen, ChevronRight
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

export default function PatientWorkspace({
    // Datos y Estado
    selectedPatientId, setSelectedPatientId, patientTab, setPatientTab, 
    userRole, themeMode, session, clinicOwner, patientRecords, setActiveTab, 
    activeFormType, setActiveFormType, viewingForm, setViewingForm,
    
    // Config Odontograma/Perio
    odontogramMode, setOdontogramMode, odontogramType, setOdontogramType,
    toothModalData, setToothModalData, catalog, sessionData, setSessionData,
    
    // Voz
    isListening, voiceStatus, toggleVoice,
    
    // Evolución/Consentimiento/Imágenes
    newEvolution, setNewEvolution, activeFolder, setActiveFolder, uploading, 
    consentTemplate, setConsentTemplate, consentText, setConsentText, modal,
    
    // Funciones Maestras (Setters y Puentes)
    getPatient, savePatientData, setPatientRecords, setModal, setQuoteItems,
    setPerioData, restoreSnapshot, savePerioSnapshot, getPerioStats, logAction,
    
    // Puentes (Wrappers) y Configuración
    handleGeneratePDF, handleImageUpload, notify, sendWhatsApp, setSelectedImg, config
}) {
    const p = getPatient(selectedPatientId);

    const activeQuotesCount = p.clinical?.quotes?.filter(q => q.status === 'en_proceso' || q.status === 'active')?.length || 0;
    const consentsCount = p.consents?.length || 0;

    const TAB_GROUPS = [
        { id: 'data',      label: 'Ficha & Datos', icon: User,          tabs: ['personal', 'anamnesis'] },
        { id: 'clinical',  label: 'Clínica Pro',   icon: Stethoscope,   tabs: ['clinical', 'perio', 'evolution'] },
        { id: 'risk',      label: 'Prevención',    icon: ShieldCheckIcon, tabs: ['pra', 'cariogram'] },
        { id: 'documents', label: 'Gestión',       icon: FolderOpen,    tabs: ['quotes', 'consent', 'images'] },
    ];

    function ShieldCheckIcon(props) {
        return <Heart {...props} />;
    }

    const tabButtons = [
        {id:'personal', label:'Datos Personales', icon: User, group: 'data'},
        {id:'anamnesis', label:'Anamnesis / Ficha', icon: FileQuestion, group: 'data', restricted: true},
        {id:'clinical', label:'Odontograma', icon: Activity, group: 'clinical'},
        {id:'perio', label:'Periodontograma', icon: FileBarChart, group: 'clinical', restricted: true},
        {id:'evolution', label:'Evolución Clínica', icon: FileText, group: 'clinical', restricted: true},
        {id:'pra',       label:'Riesgo Periodontal',  icon: Heart, group: 'risk', restricted: true},
        {id:'cariogram', label:'Riesgo Caries', icon: Calculator, group: 'risk', restricted: true},
        {id:'quotes', label:'Presupuestos', icon: Calculator, group: 'documents', badge: activeQuotesCount},
        {id:'consent', label:'Consentimientos', icon: FileSignature, group: 'documents', badge: consentsCount},
        {id:'images', label:'Galería Multimedia', icon: ImageIcon, group: 'documents'}
    ];

    const isTabVisible = (tabId) => {
        const t = tabButtons.find(b => b.id === tabId);
        return t && !(userRole === 'assistant' && t.restricted);
    };

    const switchTab = (tabId) => {
        setPatientTab(tabId);
    };

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right pb-10">
            
            {/* --- ENCABEZADO DEL DOSSIER --- */}
            <div className="flex flex-col gap-2 border-b border-[#DFD2C4]/50 pb-4 mb-6">
                <button 
                    onClick={() => setSelectedPatientId(null)} 
                    className="flex items-center gap-2 text-[10px] font-black text-[#9A8F84] hover:text-[#5B6651] transition-colors w-fit tracking-widest uppercase"
                >
                    <ArrowLeft size={12}/> VOLVER AL BUSCADOR
                </button>
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#5B6651]/10 flex items-center justify-center text-[#5B6651] font-black text-xl shadow-inner border border-[#5B6651]/10">
                            {p.personal?.legalName?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#312923] tracking-tight capitalize leading-none">
                                {p.personal?.legalName || 'Paciente'}
                            </h2>
                            <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-1">
                                RUT: {p.personal?.rut || 'Sin RUT'} • {p.personal?.phone || 'Sin Teléfono'}
                            </p>
                        </div>
                    </div>

                    {/* Alertas Rápidas */}
                    <div className="flex gap-2">
                        {(() => {
                            const criticalConditions = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Coagulopatía', 'Epilepsia'];
                            const activeAlerts = Object.entries(p.anamnesis?.conditions || {}).filter(([k, v]) => v && criticalConditions.includes(k)).map(([k]) => k);
                            
                            if (activeAlerts.length > 0) {
                                return (
                                    <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-red-500" />
                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-tight">{activeAlerts[0]} {activeAlerts.length > 1 ? `+${activeAlerts.length-1}` : ''}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* --- MENÚ LATERAL DE NAVEGACIÓN (SELECTOR 360) --- */}
                <div className="w-64 shrink-0 flex flex-col gap-6">
                    {TAB_GROUPS.map(group => {
                        const visibleTabs = tabButtons.filter(t => t.group === group.id && isTabVisible(t.id));
                        if (visibleTabs.length === 0) return null;

                        return (
                            <div key={group.id} className="space-y-2">
                                <h3 className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em] px-3 flex items-center gap-2">
                                    <group.icon size={12} />
                                    {group.label}
                                </h3>
                                <div className="space-y-1">
                                    {visibleTabs.map(tab => {
                                        const isActive = patientTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => switchTab(tab.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all group ${
                                                    isActive 
                                                    ? 'bg-[#312923] text-white shadow-md' 
                                                    : 'bg-white hover:bg-[#FDFBF7] text-[#6B615A] border border-transparent hover:border-[#DFD2C4]/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <tab.icon size={16} className={isActive ? 'text-white' : 'text-[#9A8F84] group-hover:text-[#5B6651]'} />
                                                    <span className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-[#312923]'}`}>
                                                        {tab.label}
                                                    </span>
                                                </div>
                                                {tab.badge > 0 && (
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                                        isActive ? 'bg-white/20 text-white' : 'bg-[#CBAAA2]/20 text-[#CBAAA2]'
                                                    }`}>
                                                        {tab.badge}
                                                    </span>
                                                )}
                                                {isActive && <ChevronRight size={14} className="text-white/40" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Atajo de Voz Rápido */}
                    <div className={`mt-auto p-4 rounded-3xl border transition-all ${isListening ? 'bg-red-50 border-red-200' : 'bg-[#FDFBF7] border-[#DFD2C4]/50'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#5B6651]/10 text-[#5B6651]'}`}>
                                <Mic size={14} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#312923]">Asistente</span>
                        </div>
                        <p className="text-[9px] font-bold text-[#9A8F84] leading-relaxed mb-3">
                            {isListening ? "Escuchando comandos..." : "Usa tu voz para registrar datos."}
                        </p>
                        <button 
                            onClick={toggleVoice}
                            className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                isListening ? 'bg-red-500 text-white' : 'bg-white border border-[#DFD2C4] text-[#312923] hover:bg-[#5B6651] hover:text-white hover:border-[#5B6651]'
                            }`}
                        >
                            {isListening ? "DETENER" : "ACTIVAR VOZ"}
                        </button>
                    </div>
                </div>

                {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
                <div className="flex-1 bg-white rounded-[2.5rem] p-8 border border-[#DFD2C4]/40 shadow-sm overflow-y-auto custom-scrollbar relative">
                    
                    {/* Indicador de Estado de Voz Flotante */}
                    {voiceStatus && (
                        <div className="absolute top-4 right-8 bg-[#312923] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-bounce z-10 flex items-center gap-2">
                            <Sparkles size={12} className="text-amber-400" />
                            {voiceStatus}
                        </div>
                    )}

                    {/* RENDERIZADO DINÁMICO DE PESTAÑAS */}
                    <div className="animate-in fade-in duration-300">
                        {patientTab === 'personal' && <PatientPersonalTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} />}
                        {patientTab === 'anamnesis' && <PatientAnamnesisTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} />}
                        {patientTab === 'clinical' && (
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
                                newEvolution={newEvolution} setNewEvolution={setNewEvolution}
                                getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                session={session} logAction={logAction}
                            />
                        )}
                        {patientTab === 'quotes' && (
                            <ActiveQuotesTab 
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                setModal={setModal} setQuoteItems={setQuoteItems} handleGeneratePDF={handleGeneratePDF}
                                sendWhatsApp={sendWhatsApp} notify={notify}
                            />
                        )}
                        {patientTab === 'consent' && (
                            <PatientConsentTab 
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate}
                                consentText={consentText} setConsentText={setConsentText}
                                handleGeneratePDF={handleGeneratePDF} notify={notify}
                            />
                        )}
                        {patientTab === 'images' && (
                            <PatientImagesTab 
                                p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
                                activeFolder={activeFolder} setActiveFolder={setActiveFolder}
                                uploading={uploading} handleImageUpload={handleImageUpload}
                                setSelectedImg={setSelectedImg} setModal={setModal} notify={notify}
                            />
                        )}
                        {patientTab === 'pra' && <PRATab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} handleGeneratePDF={handleGeneratePDF} />}
                        {patientTab === 'cariogram' && <CariogramTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} handleGeneratePDF={handleGeneratePDF} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
