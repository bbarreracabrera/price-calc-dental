import React from 'react';
import { 
    ArrowLeft, AlertTriangle, User, FileQuestion, Activity, 
    FileBarChart, FileText, FileSignature, ImageIcon 
} from 'lucide-react';
import { THEMES } from '../constants';

// --- IMPORTACIÓN DE PESTAÑAS (Movidas desde App.jsx) ---
import PatientPersonalTab from './PatientPersonalTab';
import PatientAnamnesisTab from './PatientAnamnesisTab';
import OdontogramTab from './OdontogramTab';
import PerioTab from './PerioTab';
import PatientEvolutionTab from './PatientEvolutionTab';
import PatientConsentTab from './PatientConsentTab';
import PatientImagesTab from './PatientImagesTab';

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
    
    // Puentes (Wrappers)
    handleGeneratePDF, handleImageUpload, notify, sendWhatsApp, setSelectedImg
}) {
    const t = THEMES[themeMode] || THEMES.dark;
    const p = getPatient(selectedPatientId);

    // Configuración de botones de pestañas
    const tabButtons = [
        {id:'personal', label:'Datos', icon: User}, 
        {id:'anamnesis', label:'Fichas / Anam.', icon: FileQuestion, restricted: true}, 
        {id:'clinical', label:'Odontograma', icon: Activity}, 
        {id:'perio', label:'Periodontograma', icon: FileBarChart, restricted: true}, 
        {id:'evolution', label:'Evolución', icon: FileText, restricted: true}, 
        {id:'consent', label:'Consentimientos', icon: FileSignature}, 
        {id:'images', label:'Galería', icon: ImageIcon}
    ];

    return (
        <div className="space-y-4 animate-in slide-in-from-right">
            {/* Botón Volver */}
            <button onClick={() => setSelectedPatientId(null)} className="flex items-center gap-2 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity">
                <ArrowLeft size={14}/> VOLVER AL BUSCADOR
            </button>
            
            {/* Nombre Paciente */}
            <div className="flex justify-between items-start">
                <h2 className="text-3xl font-black capitalize">{p.personal?.legalName || 'Paciente'}</h2>
            </div>

            {/* --- BANNER DE ALERTA MÉDICA GLOBAL --- */}
            {(() => {
                const criticalConditions = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Coagulopatía', 'Epilepsia'];
                const activeAlerts = Object.entries(p.anamnesis?.conditions || {}).filter(([k, v]) => v && criticalConditions.includes(k)).map(([k]) => k);
                
                if (activeAlerts.length > 0 || (p.anamnesis?.remote && p.anamnesis.remote.toLowerCase().includes('alergia'))) {
                    return (
                        <div className="w-full bg-red-500/20 border-2 border-red-500/50 p-3 rounded-xl flex items-center gap-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <AlertTriangle className="text-red-500 shrink-0" size={24}/>
                            <div>
                                <p className="text-xs font-black text-red-500 uppercase tracking-widest leading-none">Alerta Médica Activa</p>
                                <p className="text-sm font-bold text-red-400 mt-0.5">{activeAlerts.join(' • ')} {(p.anamnesis?.remote && p.anamnesis.remote.toLowerCase().includes('alergia')) ? '• Revisar Alergias en Anamnesis' : ''}</p>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Botones de Navegación de Pestañas */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {tabButtons.map(b => {
                    if (userRole === 'assistant' && b.restricted) return null; // Role Protection
                    return (
                        <button key={b.id} onClick={() => setPatientTab(b.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap transition-colors flex items-center gap-2 ${patientTab === b.id ? t.accentBg : 'bg-white/5 hover:bg-white/10'}`}>
                            <b.icon size={12}/> {b.label}
                        </button>
                    )
                })}
            </div>

            {/* --- RENDERIZADO DE PESTAÑAS INDIVIDUALES --- */}
            
            {patientTab === 'personal' && (
                <PatientPersonalTab themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} sendWhatsApp={sendWhatsApp} />
            )}

            {patientTab === 'anamnesis' && (
                <PatientAnamnesisTab themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} session={session} notify={notify} activeFormType={activeFormType} setActiveFormType={setActiveFormType} viewingForm={viewingForm} setViewingForm={setViewingForm} />
            )}
                                  
            {patientTab === 'clinical' && (
                <OdontogramTab themeMode={themeMode} t={t} odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode} odontogramType={odontogramType} setOdontogramType={setOdontogramType} getPatient={getPatient} selectedPatientId={selectedPatientId} setToothModalData={setToothModalData} setModal={setModal} userRole={userRole} catalog={catalog} setQuoteItems={setQuoteItems} notify={notify} setActiveTab={setActiveTab} sessionData={sessionData} setSessionData={setSessionData} />
            )}

            {patientTab === 'perio' && (
                <PerioTab themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} savePerioSnapshot={savePerioSnapshot} getPerioStats={getPerioStats} setToothModalData={setToothModalData} setPerioData={setPerioData} setModal={setModal} restoreSnapshot={restoreSnapshot} />
            )}               
                            
            {patientTab === 'evolution' && (
                <PatientEvolutionTab themeMode={themeMode} t={t} newEvolution={newEvolution} setNewEvolution={setNewEvolution} isListening={isListening} toggleVoice={toggleVoice} voiceStatus={voiceStatus} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} session={session} logAction={logAction} />
            )}

            {patientTab === 'consent' && (
                <PatientConsentTab themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} modal={modal} setModal={setModal} consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate} consentText={consentText} setConsentText={setConsentText} generatePDF={handleGeneratePDF} />
            )}

            {patientTab === 'images' && (
                <PatientImagesTab themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} activeFolder={activeFolder} setActiveFolder={setActiveFolder} handleImageUpload={handleImageUpload} uploading={uploading} setSelectedImg={setSelectedImg} notify={notify} />
            )}
        </div>
    );
}