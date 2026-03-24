import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './supabase';
import { getLocalDate, formatRUT, THEMES, TEETH_UPPER, TEETH_LOWER, ANAMNESIS_TAGS } from './constants';

// --- ICONS ---
import { 
  Calculator, User, Users, Settings, Library, History, Moon, Sun, TrendingUp, Cloud, 
  Stethoscope, CalendarClock, Menu, ArrowLeft, Mail, Upload, Image as ImageIcon, 
  Wallet, Activity, FileQuestion, FileSignature, Printer, LogOut, ArrowRight, Droplets, 
  FileBarChart, MapPin, Phone, AlertTriangle, Shield, MessageCircle, FlaskConical, Box, X, Trash2
} from 'lucide-react';

// --- COMPONENTS & VIEWS ---
import { Card, Button, InputField } from './components/UIComponents';
import { PatientSelect, AuthScreen, TermsScreen } from './components/SystemModals';
import LandingPage from "./components/LandingPage";
import DashboardView from './components/DashboardView';
import FinanceCenter from './components/FinanceCenter';
import CatalogView from './components/CatalogView';
import InventoryView from './components/InventoryView';
import LabView from './components/LabView';
import SettingsView from './components/SettingsView';
import QuoteView from './components/QuoteView';
import AgendaView from './components/AgendaView';
import PrescriptionView from './components/PrescriptionView';
import CRMView from './components/CRMView';
import Sidebar from './components/Sidebar';
import PatientWorkspace from './components/PatientWorkspace';

// --- MODALS ---
import ToothModal from './components/ToothModal';
import ApptModal from './components/ApptModal';
import AbonoModal from './components/AbonoModal';
import CatalogModal from './components/CatalogModal';
import LabWorkModal from './components/LabWorkModal';
import AddItemModal from './components/AddItemModal';
import LoadPackModal from './components/LoadPackModal';
import RecoveryModal from './components/RecoveryModal';

// --- UTILS & HOOKS ---
import { generatePDF } from './utils/pdfGenerator';
import { uploadLogo, uploadPatientImage } from './utils/uploadHandlers';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useClinicData } from './hooks/useClinicData';

export default function App() {
  // ==========================================
  // 1. ESTADOS GLOBALES (STATE)
  // ==========================================
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('sc_theme_mode') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  
  // Data
  const [config, setConfigLocal] = useState({ logo: null, hourlyRate: 25000, profitMargin: 30, name: "Dr. Benjamín" });
  const [patientRecords, setPatientRecords] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]); 
  const [protocols, setProtocols] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [catalog, setCatalog] = useState([]);
  const [labWorks, setLabWorks] = useState([]);
  const [team, setTeam] = useState([]); 
  const [userRole, setUserRole] = useState('admin');
  const [clinicOwner, setClinicOwner] = useState('');

  // Formularios y Vistas
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal');
  const [activeFormType, setActiveFormType] = useState('general');
  const [viewingForm, setViewingForm] = useState(null);
  const [sessionData, setSessionData] = useState({ patientName: '', clinicalTime: 60, baseCost: 0, patientId: null });
  const [quoteMode, setQuoteMode] = useState('calc');
  const [quoteItems, setQuoteItems] = useState([]);
  const [newQuoteItem, setNewQuoteItem] = useState({ name: '', price: '', tooth: '' });
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', price: '', id: null });
  const [prescription, setPrescription] = useState([]);
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '', duration: 60, status: 'agendado', id: null }); 
  const [odontogramMode, setOdontogramMode] = useState('hallazgos');
  const [odontogramType, setOdontogramType] = useState('adulto');
  const [toothModalData, setToothModalData] = useState({ id: null, status: null, faces: { v: null, l: null, m: null, d: null, o: null }, notes: '', treatment: {name: '', status: 'planned'}, mode: 'hallazgos' });
  const [perioData, setPerioData] = useState({});
  const [consentTemplate, setConsentTemplate] = useState('general');
  const [consentText, setConsentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('Radiografías');
  const [selectedImg, setSelectedImg] = useState(null);
  const [rxPatient, setRxPatient] = useState(null);
  const [newEvolution, setNewEvolution] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', stock: 0, min: 5, unit: 'u', id: null });
  const [paymentInput, setPaymentInput] = useState({ amount: '', method: 'Efectivo', date: getLocalDate(), receiptNumber: '' });
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'dentist' });
  const [financeTab, setFinanceTab] = useState('resumen');
  const [newLabWork, setNewLabWork] = useState({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const logoInputRef = useRef(null);

  // ==========================================
  // 2. INICIALIZACIÓN Y HOOKS
  // ==========================================
  const notify = (m) => toast.success(m, { 
    style: { borderRadius: '12px', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '12px' },
    iconTheme: { primary: '#06b6d4', secondary: '#fff' }
  });

  const goToAdjacentTooth = (direction, explicitData = null) => {
      if (!toothModalData || !toothModalData.id) return;
      const dataToSave = explicitData || perioData;
      const p = getPatient(selectedPatientId);
      const updatedPerio = { ...p.clinical.perio, [toothModalData.id]: dataToSave };
      savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: updatedPerio } });

      const PERIO_TOOTH_ORDER = [ '18','17','16','15','14','13','12','11', '21','22','23','24','25','26','27','28', '38','37','36','35','34','33','32','31', '41','42','43','44','45','46','47','48' ];
      const currentIndex = PERIO_TOOTH_ORDER.indexOf(toothModalData.id.toString());
      let nextIndex = currentIndex + direction;

      if (nextIndex >= 0 && nextIndex < PERIO_TOOTH_ORDER.length) {
          const nextId = PERIO_TOOTH_ORDER[nextIndex];
          const nextData = p.clinical.perio?.[nextId] || {}; 
          setToothModalData({ id: nextId, mode: toothModalData.mode, ...p.clinical.teeth[nextId], faces: p.clinical.teeth[nextId]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: p.clinical.teeth[nextId]?.treatment || {name:'', status:'planned'} });
          setPerioData({ pd: nextData.pd || {}, mg: nextData.mg || {}, bop: nextData.bop || {}, pus: nextData.pus || false, mobility: nextData.mobility || 0, furcation: nextData.furcation || 0 });
          notify(`Avanzando a pieza ${nextId}`);
      }
  };

  const { isListening, voiceStatus, isPerioVoiceActive, voiceFeedback, toggleVoice, startPerioDictation } = useVoiceAssistant({ notify, setToothModalData, setPerioData, goToAdjacentTooth });

  useEffect(() => { document.title = "ShiningCloud | Dental"; }, []);
  
  useEffect(() => {
      if (window.location.hash.includes('type=recovery')) setModal('recovery');
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') setModal('recovery');
          setSession(session);
      });
      return () => subscription.unsubscribe();
  }, []);
  
 useClinicData({
      session, setTeam, setUserRole, setClinicOwner, setConfigLocal,
      setPatientRecords, setAppointments, setFinancialRecords,
      setProtocols, setInventory, setCatalog, setLabWorks
  });

  // ==========================================
  // 3. FUNCIONES DE DATOS Y LÓGICA
  // ==========================================
  const logAction = async (action, details, patientId = null) => {
      try {
          await supabase.from('audit_logs').insert({
              user_email: session.user.email, action: action, patient_id: patientId, details: details,
              timestamp: new Date().toISOString(), admin_email: clinicOwner || session.user.email
          });
      } catch (error) { console.error("Error logging action", error); }
  };

  const toggleTheme = () => { const modes = ['dark', 'light', 'blue']; const next = modes[(modes.indexOf(themeMode) + 1) % modes.length]; setThemeMode(next); localStorage.setItem('sc_theme_mode', next); };
  
  const saveToSupabase = async (t, id, d) => { 
      await supabase.from(t).upsert({ id: id.toString(), data: d, admin_email: clinicOwner || session.user.email }); 
  };
  
  const getPatient = (id) => {
      const base = { id, personal: { legalName: id }, anamnesis: { recent: '', remote: '', conditions: {} }, clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, consents: [], images: [] };
      const existing = patientRecords[id];
      if (!existing) return base;
      return { ...base, ...existing, anamnesis: { ...base.anamnesis, ...(existing.anamnesis || {}) }, clinical: existing.clinical || base.clinical, personal: existing.personal || base.personal };
  };

  const savePatientData = async (id, d) => { 
      setPatientRecords(prev => ({...prev, [id]: d})); 
      await saveToSupabase('patients', id, d);
      logAction('UPDATE_PATIENT', { patientName: d.personal.legalName }, id);
  };

  const handlePerioChange = (face, field, index, value) => {
      let val = value;
      if (value !== '' && value !== '-') { val = parseInt(value, 10); if(isNaN(val)) return; }
      setToothModalData(prev => {
          const currentPerio = prev.perio || {};
          const key = `${field}_${face}`; 
          const newArray = [...(currentPerio[key] || ['','',''])];
          newArray[index] = val;
          return { ...prev, perio: { ...currentPerio, [key]: newArray } };
      });
  };

  const calcNIC = (pd, mg) => {
      if (pd === '' || mg === '' || pd === undefined || mg === undefined || pd === '-' || mg === '-') return '-';
      return parseInt(pd) + parseInt(mg);
  };

  const savePerioSnapshot = () => {
      const p = getPatient(selectedPatientId);
      const dateStr = new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
      const newSnapshot = { id: Date.now().toString(), date: dateStr, perio: JSON.parse(JSON.stringify(p.clinical.perio || {})), hygiene: JSON.parse(JSON.stringify(p.clinical.hygiene || {})), stats: getPerioStats() };
      savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perioHistory: [...(p.clinical.perioHistory || []), newSnapshot] }});
      notify(`Evolución Periodontal guardada con éxito (${dateStr})`);
  };

  const restoreSnapshot = (snap) => {
      if(window.confirm(`¿Estás seguro de cargar en pantalla la evolución del ${snap.date}?`)) {
          const p = getPatient(selectedPatientId);
          savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: JSON.parse(JSON.stringify(snap.perio || {})), hygiene: JSON.parse(JSON.stringify(snap.hygiene || {})) }});
          notify(`Cargando evolución del ${snap.date}`);
      }
  };

  const getPerioStats = () => {
    if (!selectedPatientId) return { bop: 0, plaque: 0 };
    const p = getPatient(selectedPatientId);
    let sites=0, bop=0, faces=0, plaque=0;
    [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => {
        if (p.clinical.teeth[t]?.status !== 'missing') {
            sites+=6; faces+=4;
            const perio = p.clinical.perio?.[t] || {}; const hygiene = p.clinical.hygiene?.[t] || {};
            if(perio.bop) Object.values(perio.bop).forEach(v=> {if(v) bop++});
            Object.values(hygiene).forEach(v=> {if(v) plaque++});
        }
    });
    return { bop: sites>0?Math.round((bop/sites)*100):0, plaque: faces>0?Math.round((plaque/faces)*100):0 };
  };

  const sendWhatsApp = (phone, text) => {
      if (!phone) return alert("El paciente no tiene teléfono registrado.");
      let cleanPhone = phone.replace(/\D/g, ''); 
      if (cleanPhone.length === 8 || cleanPhone.length === 9) cleanPhone = `56${cleanPhone}`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPatientPhone = (name) => {
      if (!name) return '';
      const foundEntry = Object.values(patientRecords).find(p => p.personal?.legalName === name);
      return foundEntry?.personal?.phone || '';
  };

  // --- PUENTES HACIA ARCHIVOS UTILS ---
  const handleLogoUploadWrapper = (e) => uploadLogo(e, { setUploading, notify, clinicOwner, session, config, setConfigLocal, saveToSupabase });
  const handleImageUploadWrapper = (e) => uploadPatientImage({ file: e.target.files[0], selectedPatientId, setUploading, getPatient, activeFolder, savePatientData, notify, logAction });
  const handleGeneratePDF = (type, data = null) => generatePDF(type, data, { themeMode, config, selectedPatientId, getPatient, sessionData, patientRecords, prescription, notify, logAction });
  const saveToSupabaseWrapper = (t, id, d) => saveToSupabase(t, id, d);

  // ==========================================
  // 4. DATOS DERIVADOS (UseMemo)
  // ==========================================
  const incomeRecords = financialRecords.filter(f => !f.type || f.type === 'income');
  const expenseRecords = financialRecords.filter(f => f.type === 'expense');
  const totalCollected = incomeRecords.reduce((acc, rec) => { const paymentsSum = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0); return acc + (paymentsSum > 0 ? paymentsSum : (Number(rec.paid) || 0)); }, 0);
  const totalExpenses = expenseRecords.reduce((a, b) => a + (Number(b.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;
  const totalDebt = incomeRecords.reduce((acc, rec) => {
      const paid = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0) + (rec.paid && !rec.payments ? rec.paid : 0);
      const pending = (rec.total || 0) - paid;
      return acc + (pending > 0 ? pending : 0);
  }, 0);
  
  const todaysAppointments = appointments.filter(a => a.date === getLocalDate()).sort((a,b) => a.time.localeCompare(b.time));
  const filteredInventory = useMemo(() => { if(!inventorySearch) return inventory; return inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase())); }, [inventory, inventorySearch]);
  
  const getChartData = () => {
      if (incomeRecords.length === 0) return [{label: 'Ayer', value: 0}, {label: 'Hoy', value: 0}];
      const recentIncomes = [...incomeRecords].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6).reverse();
      return recentIncomes.map(rec => {
          const paid = (rec.payments || []).reduce((s,p)=>s+p.amount,0) + (rec.paid && !rec.payments ? rec.paid : 0);
          return { label: rec.patientName.split(' ')[0] || 'Pac', value: paid > 0 ? paid : 1000 };
      });
  };

  const getRecalls = useMemo(() => {
      const now = new Date(); const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(now.getMonth() - 6);
      const futureAppts = appointments.filter(a => new Date(a.date) >= now);
      const futurePatientNames = new Set(futureAppts.map(a => a.name));
      const pastAppts = appointments.filter(a => new Date(a.date) <= sixMonthsAgo);
      const latestAppts = {};
      pastAppts.forEach(a => { if (!latestAppts[a.name] || new Date(a.date) > new Date(latestAppts[a.name].date)) latestAppts[a.name] = a; });
      return Object.values(latestAppts).filter(a => !futurePatientNames.has(a.name));
  }, [appointments]);

  // ==========================================
  // 5. RENDERIZADO VISUAL
  // ==========================================
  if (!session) {
      if (!showLogin) return <LandingPage onLoginClick={() => setShowLogin(true)} />;
      return (
          <div className="relative min-h-screen">
              <button onClick={() => setShowLogin(false)} className="absolute top-6 left-6 z-50 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                  ← Volver al inicio
              </button>
              <AuthScreen />
          </div>
      );
  }
  const t = THEMES[themeMode] || THEMES.dark;

  return (
    <div className={`min-h-screen flex ${t.bg} ${t.text} transition-all duration-500 font-sans`}>
      <Toaster position="bottom-center" reverseOrder={false} />
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={()=>setMobileMenuOpen(false)}></div>}
      
    {/* --- SIDEBAR NAVEGACIÓN --- */}
    <Sidebar 
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} 
     config={config} session={session} userRole={userRole} 
     activeTab={activeTab} setActiveTab={setActiveTab} 
     setSelectedPatientId={setSelectedPatientId} themeMode={themeMode} 
     toggleTheme={toggleTheme} supabase={supabase}
    />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between mb-6"><button onClick={()=>setMobileMenuOpen(true)} className={`p-2 rounded-xl ${t.inputBg}`}><Menu/></button><span className="font-black text-lg">ShiningCloud | Dental</span><div className="w-8"></div></div>
        
        {/* --- VISTAS PRINCIPALES --- */}
        {activeTab === 'dashboard' && <DashboardView config={config} userRole={userRole} themeMode={themeMode} t={t} totalCollected={totalCollected} totalExpenses={totalExpenses} netProfit={netProfit} chartData={getChartData()} todaysAppointments={todaysAppointments} setActiveTab={setActiveTab} setFinanceTab={setFinanceTab} setModal={setModal} setSelectedPatientId={setSelectedPatientId} setQuoteMode={setQuoteMode} />}
        {activeTab === 'terms' && <TermsScreen theme={t} />}
        {activeTab === 'history' && (userRole === 'admin' || userRole === 'assistant') && <FinanceCenter themeMode={themeMode} t={t} financeTab={financeTab} setFinanceTab={setFinanceTab} financialRecords={financialRecords} setFinancialRecords={setFinancialRecords} incomeRecords={incomeRecords} expenseRecords={expenseRecords} totalCollected={totalCollected} totalExpenses={totalExpenses} totalDebt={totalDebt} netProfit={netProfit} patientRecords={patientRecords} saveToSupabase={saveToSupabase} notify={notify} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} onOpenAbonoModal={(record, pending) => { setSelectedFinancialRecord(record); setPaymentInput({amount: pending > 0 ? pending : '', method:'Efectivo', date: getLocalDate(), receiptNumber: ''}); setModal('abono'); }} />}
        {activeTab === 'catalog' && (userRole === 'admin' || userRole === 'dentist') && <CatalogView themeMode={themeMode} t={t} catalog={catalog} setCatalog={setCatalog} clinicOwner={clinicOwner} session={session} setNewCatalogItem={setNewCatalogItem} setModal={setModal} saveToSupabase={saveToSupabase} notify={notify} />}
        {activeTab === 'inventory' && userRole === 'admin' && <InventoryView themeMode={themeMode} t={t} inventory={inventory} setInventory={setInventory} filteredInventory={filteredInventory} inventorySearch={inventorySearch} setInventorySearch={setInventorySearch} setNewItem={setNewItem} setModal={setModal} saveToSupabase={saveToSupabase} />}
        {activeTab === 'lab' && <LabView themeMode={themeMode} t={t} labWorks={labWorks} setLabWorks={setLabWorks} setNewLabWork={setNewLabWork} setModal={setModal} notify={notify} />}
        {activeTab === 'settings' && <SettingsView themeMode={themeMode} t={t} config={config} setConfigLocal={setConfigLocal} logoInputRef={logoInputRef} handleLogoUpload={handleLogoUploadWrapper} userRole={userRole} saveToSupabase={saveToSupabase} notify={notify} team={team} setTeam={setTeam} newMember={newMember} setNewMember={setNewMember} />}
        {activeTab === 'quote' && (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') && <QuoteView themeMode={themeMode} t={t} quoteItems={quoteItems} setQuoteItems={setQuoteItems} newQuoteItem={newQuoteItem} setNewQuoteItem={setNewQuoteItem} catalog={catalog} patientRecords={patientRecords} sessionData={sessionData} setSessionData={setSessionData} getPatient={getPatient} savePatientData={savePatientData} saveToSupabase={saveToSupabase} notify={notify} generatePDF={handleGeneratePDF} setActiveTab={setActiveTab} />}
        {activeTab === 'agenda' && <AgendaView themeMode={themeMode} t={t} appointments={appointments} onOpenModal={(apptData) => { setNewAppt(apptData); setModal('appt'); }} />}
        {activeTab === 'clinical' && (userRole === 'admin' || userRole === 'dentist') && <PrescriptionView themeMode={themeMode} t={t} patientRecords={patientRecords} getPatient={getPatient} savePatientData={savePatientData} setPatientRecords={setPatientRecords} rxPatient={rxPatient} setRxPatient={setRxPatient} medInput={medInput} setMedInput={setMedInput} prescription={prescription} setPrescription={setPrescription} notify={notify} generatePDF={handleGeneratePDF} />}
        {activeTab === 'recalls' && (userRole === 'admin' || userRole === 'assistant') && <CRMView themeMode={themeMode} t={t} getRecalls={getRecalls} patientRecords={patientRecords} setActiveTab={setActiveTab} setSelectedPatientId={setSelectedPatientId} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} />}

        {/* --- FICHA DEL PACIENTE (Buscador) --- */}
        {activeTab === 'ficha' && !selectedPatientId && (
            <div className="space-y-4 animate-in slide-in-from-bottom">
                <div className="flex gap-2">
                    <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
                        if (p.id === 'new') {
                            let nombreReal = p.name;
                            if (!nombreReal || nombreReal.trim() === "") { nombreReal = window.prompt("Confirma el nombre del nuevo paciente:"); if (!nombreReal) return; }
                            const newId = "pac_" + Date.now().toString();
                            const newPatient = getPatient(newId);
                            newPatient.id = newId; newPatient.name = nombreReal;
                            if (!newPatient.personal) newPatient.personal = {};
                            newPatient.personal.legalName = nombreReal;
                            savePatientData(newId, newPatient);
                            setSelectedPatientId(newId);
                            notify("Paciente Creado Exitosamente");
                        } else {
                            setPatientRecords(prev => ({...prev, [p.id]: p}));
                            setSelectedPatientId(p.id);
                        }
                    }} />
                </div>
                <div className="grid gap-2">
                    {Object.keys(patientRecords).map(k => (
                        <Card key={k} theme={themeMode} onClick={() => setSelectedPatientId(k)} className="cursor-pointer py-4 flex justify-between items-center">
                            <span className="font-bold capitalize">{patientRecords[k]?.personal?.legalName || 'Paciente sin nombre'}</span>
                            <ArrowRight size={14}/>
                        </Card>
                    ))}
                </div>
            </div>
        )}
        
        {/* --- FICHA DEL PACIENTE (Espacio de Trabajo Orquestado) --- */}
        {activeTab === 'ficha' && selectedPatientId && (
            <PatientWorkspace 
                selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
                patientTab={patientTab} setPatientTab={setPatientTab}
                userRole={userRole} themeMode={themeMode} session={session} clinicOwner={clinicOwner}
                patientRecords={patientRecords}setActiveTab={setActiveTab} activeFormType={activeFormType} 
                setActiveFormType={setActiveFormType} viewingForm={viewingForm} setViewingForm={setViewingForm}
                odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode}
                odontogramType={odontogramType} setOdontogramType={setOdontogramType}
                toothModalData={toothModalData} setToothModalData={setToothModalData}
                catalog={catalog} sessionData={sessionData} setSessionData={setSessionData}
                isListening={isListening} voiceStatus={voiceStatus} toggleVoice={toggleVoice}
                newEvolution={newEvolution} setNewEvolution={setNewEvolution}
                activeFolder={activeFolder} setActiveFolder={setActiveFolder}
                uploading={uploading} consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate}
                consentText={consentText} setConsentText={setConsentText} modal={modal}
                getPatient={getPatient} savePatientData={savePatientData}
                setPatientRecords={setPatientRecords} setModal={setModal}
                setQuoteItems={setQuoteItems} setPerioData={setPerioData}
                restoreSnapshot={restoreSnapshot} savePerioSnapshot={savePerioSnapshot}
                getPerioStats={getPerioStats} logAction={logAction}
                handleGeneratePDF={handleGeneratePDF} handleImageUpload={handleImageUploadWrapper}
                notify={notify} sendWhatsApp={sendWhatsApp} setSelectedImg={setSelectedImg}
            />
        )}
      </main>

      {/* ========================================== */}
      {/* 6. MODALES GLOBALES                        */}
      {/* ========================================== */}
      
      {modal === 'tooth' && <ToothModal themeMode={themeMode} t={t} toothModalData={toothModalData} setToothModalData={setToothModalData} setModal={setModal} activeTab={activeTab} perioData={perioData} setPerioData={setPerioData} handlePerioChange={handlePerioChange} calcNIC={calcNIC} isPerioVoiceActive={isPerioVoiceActive} startPerioDictation={startPerioDictation} voiceFeedback={voiceFeedback} isListening={isListening} toggleVoice={toggleVoice} catalog={catalog} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} goToAdjacentTooth={goToAdjacentTooth} />}
      {modal === 'appt' && <ApptModal themeMode={themeMode} newAppt={newAppt} setNewAppt={setNewAppt} setModal={setModal} patientRecords={patientRecords} setPatientRecords={setPatientRecords} getPatient={getPatient} savePatientData={savePatientData} notify={notify} appointments={appointments} setAppointments={setAppointments} saveToSupabase={saveToSupabase} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} />}
      {modal === 'abono' && selectedFinancialRecord && <AbonoModal themeMode={themeMode} selectedFinancialRecord={selectedFinancialRecord} setModal={setModal} paymentInput={paymentInput} setPaymentInput={setPaymentInput} financialRecords={financialRecords} setFinancialRecords={setFinancialRecords} saveToSupabase={saveToSupabase} notify={notify} />}
      {modal === 'catalogItem' && <CatalogModal themeMode={themeMode} newCatalogItem={newCatalogItem} setNewCatalogItem={setNewCatalogItem} catalog={catalog} setCatalog={setCatalog} setModal={setModal} clinicOwner={clinicOwner} notify={notify} saveToSupabase={saveToSupabase} />}
      {modal === 'labWork' && <LabWorkModal themeMode={themeMode} newLabWork={newLabWork} setNewLabWork={setNewLabWork} patientRecords={patientRecords} setModal={setModal} clinicOwner={clinicOwner} labWorks={labWorks} setLabWorks={setLabWorks} supabase={supabase} notify={notify} />}
      {modal === 'addItem' && <AddItemModal themeMode={themeMode} newItem={newItem} setNewItem={setNewItem} setModal={setModal} inventory={inventory} setInventory={setInventory} saveToSupabase={saveToSupabaseWrapper} supabase={supabase} notify={notify} />}
      {modal === 'loadPack' && <LoadPackModal themeMode={themeMode} setModal={setModal} protocols={protocols} setProtocols={setProtocols} sessionData={sessionData} setSessionData={setSessionData} supabase={supabase} notify={notify} />}
      {modal === 'recovery' && <RecoveryModal newPasswordInput={newPasswordInput} setNewPasswordInput={setNewPasswordInput} supabase={supabase} notify={notify} setModal={setModal} />}
      
      {selectedImg && <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4" onClick={()=>setSelectedImg(null)}><img src={selectedImg} className="max-w-full max-h-[85%] rounded-xl shadow-2xl animate-in zoom-in"/><span className="mt-4 text-white font-bold opacity-50">CLICK PARA CERRAR</span></div>}
    </div>
  );
}