import React, { useState } from 'react';
import {
    ArrowLeft, AlertTriangle, User, FileQuestion, Activity,
    FileBarChart, FileText, FileSignature, ImageIcon,
    Mic, MicOff, Sparkles, Calculator, Heart, Stethoscope, ChevronDown
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
        { id: 'data',      label: 'Datos',      icon: User,          tabs: ['personal', 'anamnesis'] },
        { id: 'clinical',  label: 'Clínico',    icon: Stethoscope,   tabs: ['clinical', 'perio', 'evolution'] },
        { id: 'risk',      label: 'Riesgo',     icon: AlertTriangle, tabs: ['pra', 'cariogram'] },
        { id: 'documents', label: 'Documentos', icon: FileText,      tabs: ['quotes', 'consent', 'images'] },
    ];

    // Configuración de botones de pestañas (Incluimos 'Presupuestos')
    const tabButtons = [
        {id:'personal', label:'Datos', icon: User},
        {id:'anamnesis', label:'Fichas / Anam.', icon: FileQuestion, restricted: true},
        {id:'clinical', label:'Odontograma', icon: Activity},
        {id:'perio', label:'Periodontograma', icon: FileBarChart, restricted: true},
        {id:'quotes', label:'Presupuestos', icon: Calculator, badge: activeQuotesCount},
        {id:'evolution', label:'Evolución', icon: FileText, restricted: true},
        {id:'pra',       label:'Riesgo Perio',  icon: Heart,       restricted: true},
        {id:'cariogram', label:'Riesgo Caries', icon: Calculator,  restricted: true},
        {id:'consent', label:'Consentimientos', icon: FileSignature, badge: consentsCount},
        {id:'images', label:'Galería', icon: ImageIcon}
    ];

    const getGroupForTab = (tabId) =>
        TAB_GROUPS.find(g => g.tabs.includes(tabId))?.id || 'data';

    const [activeGroup, setActiveGroup] = useState(() => getGroupForTab(patientTab));
    const [lastTabInGroup, setLastTabInGroup] = useState(() => ({
        data: 'personal', clinical: 'clinical', risk: 'pra', documents: 'quotes',
        [getGroupForTab(patientTab)]: patientTab,
    }));

    const isTabVisible = (tabId) => {
        const t = tabButtons.find(b => b.id === tabId);
        return t && !(userRole === 'assistant' && t.restricted);
    };

    const switchGroup = (groupId) => {
        setActiveGroup(groupId);
        const group = TAB_GROUPS.find(g => g.id === groupId);
        const saved = lastTabInGroup[groupId];
        const target = isTabVisible(saved)
            ? saved
            : group.tabs.find(isTabVisible);
        if (target) setPatientTab(target);
    };

    const switchTab = (tabId) => {
        setPatientTab(tabId);
        setLastTabInGroup(prev => ({ ...prev, [activeGroup]: tabId }));
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right pb-10">
            
            {/* --- ENCABEZADO DEL DOSSIER --- */}
            <div className="flex flex-col gap-3 border-b border-[#DFD2C4]/50 pb-5">
                <button 
                    onClick={() => setSelectedPatientId(null)} 
                    className="flex items-center gap-2 text-[11px] font-bold text-[#9A8F84] hover:text-[#5B6651] transition-colors w-fit tracking-widest uppercase"
                >
                    <ArrowLeft size={14}/> VOLVER AL BUSCADOR
                </button>
                
                <div className="flex justify-between items-start">
                    <h2 className="text-4xl font-black text-[#312923] tracking-tight capitalize">
                        {p.personal?.legalName || 'Paciente'}
                    </h2>
                </div>
            </div>

            {/* --- BANNER DE ALERTA MÉDICA GLOBAL --- */}
            {(() => {
                const criticalConditions = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Coagulopatía', 'Epilepsia'];
                const activeAlerts = Object.entries(p.anamnesis?.conditions || {}).filter(([k, v]) => v && criticalConditions.includes(k)).map(([k]) => k);
                
                if (activeAlerts.length > 0 || (p.anamnesis?.remote && p.anamnesis.remote.toLowerCase().includes('alergia'))) {
                    return (
                        <div className="w-full bg-[#CBAAA2]/10 border-l-[4px] border-[#CBAAA2] p-4 rounded-r-2xl flex items-center gap-4 animate-pulse shadow-sm">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <AlertTriangle className="text-[#CBAAA2] shrink-0" size={24}/>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-[#CBAAA2] uppercase tracking-widest leading-none">Atención Clínica</p>
                                <p className="text-sm font-bold text-[#312923] mt-1">{activeAlerts.join(' • ')} {(p.anamnesis?.remote && p.anamnesis.remote.toLowerCase().includes('alergia')) ? '• Revisar Alergias en Anamnesis' : ''}</p>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* --- NAVEGACIÓN DE PESTAÑAS AGRUPADAS --- */}

            {/* Desktop (md+): grupos + sub-tabs */}
            <div className="hidden md:block">
                {/* Fila de grupos */}
                <div className="flex gap-1">
                    {TAB_GROUPS.map(group => {
                        const visibleTabs = group.tabs.filter(isTabVisible);
                        if (visibleTabs.length === 0) return null;
                        const groupBadge = visibleTabs.reduce((sum, id) => sum + (tabButtons.find(b => b.id === id)?.badge || 0), 0);
                        const isActive = activeGroup === group.id;
                        return (
                            <button
                                key={group.id}
                                onClick={() => switchGroup(group.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap rounded-t-2xl transition-all ${
                                    isActive
                                    ? 'bg-[#312923] text-white'
                                    : 'bg-[#FDFBF7] text-[#9A8F84] hover:text-[#312923]'
                                }`}
                            >
                                <group.icon size={13} />
                                {group.label}
                                {groupBadge > 0 && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none ${
                                        isActive ? 'bg-white/25 text-white' : 'bg-[#5B6651]/20 text-[#5B6651]'
                                    }`}>
                                        {groupBadge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Fila de sub-tabs */}
                <div key={activeGroup} className="flex gap-1.5 bg-[#FDFBF7] px-4 py-2.5 border border-[#DFD2C4]/50 border-b-0 rounded-tr-2xl animate-in fade-in duration-200">
                    {TAB_GROUPS.find(g => g.id === activeGroup)?.tabs.map(tabId => {
                        if (!isTabVisible(tabId)) return null;
                        const t = tabButtons.find(b => b.id === tabId);
                        const isActive = patientTab === tabId;
                        return (
                            <button
                                key={tabId}
                                onClick={() => switchTab(tabId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition-all ${
                                    isActive
                                    ? 'bg-[#5B6651]/10 text-[#5B6651] font-bold'
                                    : 'text-[#9A8F84] hover:text-[#312923] font-medium'
                                }`}
                            >
                                <t.icon size={12} className={isActive ? 'text-[#5B6651]' : 'text-[#DFD2C4]'} />
                                {t.label}
                                {t.badge > 0 && (
                                    <span className="px-1.5 py-0.5 bg-[#5B6651]/20 text-[#5B6651] text-[10px] font-bold rounded-full leading-none">
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile (< md): selector de grupo + selector de tab */}
            <div className="flex md:hidden gap-2 pb-2 border-b border-[#DFD2C4]/30">
                <div className="relative flex-1">
                    <select
                        value={activeGroup}
                        onChange={e => switchGroup(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#DFD2C4] rounded-xl px-3 py-2.5 text-sm font-bold text-[#312923] pr-8 focus:outline-none focus:border-[#5B6651] cursor-pointer"
                    >
                        {TAB_GROUPS.map(group => {
                            if (group.tabs.filter(isTabVisible).length === 0) return null;
                            return <option key={group.id} value={group.id}>{group.label}</option>;
                        })}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8F84] pointer-events-none" />
                </div>
                <div className="relative flex-1">
                    <select
                        value={patientTab}
                        onChange={e => switchTab(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#5B6651]/40 rounded-xl px-3 py-2.5 text-sm font-bold text-[#5B6651] pr-8 focus:outline-none focus:border-[#5B6651] cursor-pointer"
                    >
                        {TAB_GROUPS.find(g => g.id === activeGroup)?.tabs.map(tabId => {
                            if (!isTabVisible(tabId)) return null;
                            const t = tabButtons.find(b => b.id === tabId);
                            return (
                                <option key={tabId} value={tabId}>
                                    {t.label}{t.badge > 0 ? ` (${t.badge})` : ''}
                                </option>
                            );
                        })}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8F84] pointer-events-none" />
                </div>
            </div>

            {/* --- ÁREA DE RENDERIZADO DE PESTAÑAS --- */}
            <div className="bg-white rounded-b-[2rem] rounded-tr-[2rem] p-6 sm:p-8 border border-[#DFD2C4]/40 shadow-sm" style={{ boxShadow: '0 10px 25px -5px rgba(91, 102, 81, 0.05)', marginTop: '-1px' }}>
                
                {/* Asistente de Voz Global (Solo en Odontograma y Perio) */}
                {(patientTab === 'clinical' || patientTab === 'perio') && (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-[#FDFBF7] to-white border border-[#DFD2C4]/60 p-4 rounded-3xl shadow-sm gap-4 mb-8 animate-in fade-in">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-[#5B6651]/10 text-[#5B6651]'}`}>
                                <Sparkles size={24} className={isListening ? 'animate-spin-slow' : ''} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#312923] uppercase tracking-widest flex items-center gap-2">
                                    Asistente Clínico Inteligente
                                    <span className="bg-[#CBAAA2]/20 text-[#CBAAA2] px-2 py-0.5 rounded-full text-[9px]">BETA</span>
                                </h3>
                                <p className="text-[11px] font-bold text-[#9A8F84] mt-1">
                                    {isListening 
                                        ? "IA Activa. Di 'Diente uno cuatro...' y luego 'Avanza'." 
                                        : "Haz clic en el micrófono para dictar a manos libres."}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                            {voiceStatus && <span className="text-[11px] font-bold text-[#5B6651] animate-pulse whitespace-nowrap hidden sm:block">{voiceStatus}</span>}
                            <button
                                onClick={toggleVoice}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shrink-0 ${
                                    isListening ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30 animate-pulse' : 'bg-[#312923] text-white hover:bg-[#1a1512] hover:-translate-y-0.5 shadow-[#312923]/20'
                                }`}
                            >
                                {isListening ? <MicOff size={16}/> : <Mic size={16}/>}
                                {isListening ? 'Detener' : 'Activar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Renderizado de Componentes */}
                {patientTab === 'personal' && <PatientPersonalTab themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} sendWhatsApp={sendWhatsApp} config={config} />}
                
                {patientTab === 'anamnesis' && <PatientAnamnesisTab themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} session={session} notify={notify} activeFormType={activeFormType} setActiveFormType={setActiveFormType} viewingForm={viewingForm} setViewingForm={setViewingForm} />}
                
                {patientTab === 'clinical' && <OdontogramTab themeMode={themeMode} odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode} odontogramType={odontogramType} setOdontogramType={setOdontogramType} getPatient={getPatient} selectedPatientId={selectedPatientId} setToothModalData={setToothModalData} setModal={setModal} userRole={userRole} catalog={catalog} setQuoteItems={setQuoteItems} notify={notify} setActiveTab={setActiveTab} sessionData={sessionData} setSessionData={setSessionData} savePatientData={savePatientData} />}
                
                {patientTab === 'perio' && <PerioTab themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} savePerioSnapshot={savePerioSnapshot} getPerioStats={getPerioStats} setToothModalData={setToothModalData} setPerioData={setPerioData} setModal={setModal} restoreSnapshot={restoreSnapshot} />}              
                
                {/* --- NUEVO: PESTAÑA DE PRESUPUESTOS EN PROCESO --- */}
                {patientTab === 'quotes' && <ActiveQuotesTab getPatient={getPatient} selectedPatientId={selectedPatientId} />} 
                
                {patientTab === 'pra'       && <PRATab       patient={p} savePatientData={(id, data, opts) => savePatientData(selectedPatientId, data, opts)} notify={notify} />}
                {patientTab === 'cariogram' && <CariogramTab patient={p} savePatientData={(id, data, opts) => savePatientData(selectedPatientId, data, opts)} notify={notify} />}

                {patientTab === 'evolution' && <PatientEvolutionTab themeMode={themeMode} newEvolution={newEvolution} setNewEvolution={setNewEvolution} isListening={isListening} toggleVoice={toggleVoice} voiceStatus={voiceStatus} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} session={session} logAction={logAction} />}
                
                {patientTab === 'consent' && <PatientConsentTab themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} modal={modal} setModal={setModal} consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate} consentText={consentText} setConsentText={setConsentText} generatePDF={handleGeneratePDF} session={session} notify={notify} />}
                
                {patientTab === 'images' && <PatientImagesTab themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} activeFolder={activeFolder} setActiveFolder={setActiveFolder} handleImageUpload={handleImageUpload} uploading={uploading} setSelectedImg={setSelectedImg} notify={notify} />}
            </div>
        </div>
    );
}