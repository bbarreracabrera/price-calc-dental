import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import MasterPanel from './components/MasterPanel';
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
import PublicBooking from './components/PublicBooking'; 
import SterilizationView from './components/SterilizationView'; 
import NetworkMonitor from './components/NetworkMonitor';
import LabDashboard from './components/LabDashboard'; 

// --- MODALS ---
import ToothModal from './components/ToothModal';
import ApptModal from './components/ApptModal';
import AbonoModal from './components/AbonoModal';
import CatalogModal from './components/CatalogModal';
import LabWorkModal from './components/LabWorkModal';
import AddItemModal from './components/AddItemModal';
import LoadPackModal from './components/LoadPackModal';
import RecoveryModal from './components/RecoveryModal';
import OnboardingModal from './components/OnboardingModal';
import { useDialog } from './components/DialogProvider';
import MPOAuthCallback from './components/MPOAuthCallback';

// --- UTILS & HOOKS ---
import { generatePDF } from './utils/pdfGenerator';
import { uploadLogo, uploadPatientImage } from './utils/uploadHandlers';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useClinicData } from './hooks/useClinicData';

export default function App() {
  const { confirm, prompt } = useDialog();

  // ==========================================
  // 1. ESTADOS GLOBALES (STATE)
  // ==========================================
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('sc_theme_mode') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [publicClinicId, setPublicClinicId] = useState(null); 
  
  // Data
  const [config, setConfigLocal] = useState({ logo: null, hourlyRate: 25000, profitMargin: 30, name: "Profesional" });
  const [patientRecords, setPatientRecords] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]); 
  const [protocols, setProtocols] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [sterilizationItems, setSterilizationItems] = useState([]); 
  const [catalog, setCatalog] = useState([]);
  const [labWorks, setLabWorks] = useState([]);
  const [team, setTeam] = useState([]); 
  const [userRole, setUserRole] = useState('admin');
  const [clinicOwner, setClinicOwner] = useState('');

  // === LA LLAVE MAESTRA ===
  const MASTER_EMAIL = 'b.barreracabrera.dent@gmail.com'; 
  const IS_MASTER_ADMIN = session?.user?.email === MASTER_EMAIL;

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
  // 2. INICIALIZACIÓN Y HOOKS GLOBALES
  // ==========================================
  const notify = (m) => toast.success(m, { 
      style: { borderRadius: '12px', background: '#374151', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '13px' },
      iconTheme: { primary: '#9CA3AF', secondary: '#fff' }
  });

  useEffect(() => { document.title = "ShiningCloud | Dental"; }, []);
  
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reserva')) {
          setPublicClinicId(params.get('reserva'));
          return; 
      }

      if (window.location.hash.includes('type=recovery')) setModal('recovery');

      supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') setModal('recovery');
          setSession(session);
          
          if (!session) {
              setClinicOwner('');
              setUserRole('admin');
              setTeam([]);
          }
      });

      return () => subscription.unsubscribe();
  }, []);
  
  useClinicData({
      session, setTeam, setUserRole, setClinicOwner, setConfigLocal,
      setPatientRecords, setAppointments, setFinancialRecords,
      setProtocols, setInventory, setCatalog, setLabWorks
  });

  // --- CERRADURA DE SEGURIDAD PARA ROLES (Evita la Fuga de Rol) ---
  useEffect(() => {
      const verifyRole = async () => {
          if (session?.user?.email) {
              // Verificamos forzosamente si este correo es de un laboratorio en la base de datos
              const { data } = await supabase
                  .from('team')
                  .select('data')
                  .eq('data->>email', session.user.email)
                  .single();
              
              if (data && data.data && data.data.role === 'lab') {
                  setUserRole('lab');
              }
          }
      };
      verifyRole();
  }, [session]);
  // ----------------------------------------------------------------

  useEffect(() => {
      if (session && clinicOwner) {
          const fetchSterilization = async () => {
              const { data, error } = await supabase.from('sterilization').select('id, data').eq('admin_email', clinicOwner);
              if (data && !error) {
                  setSterilizationItems(data.map(d => d.data));
              }
          };
          fetchSterilization();
      }
  }, [session, clinicOwner]);

  // ==========================================
  // 3. FUNCIONES DE BASE DE DATOS Y LÓGICA CORE
  // ==========================================
    const logAction = useCallback(async (action, details, patientId = null) => {
      try {
          if (!session?.user?.email) return;
          await supabase.from('audit_logs').insert({
              user_email: session.user.email, 
              action: action, 
              details: { ...details, id_paciente_ref: patientId },
              timestamp: new Date().toISOString(), 
              admin_email: clinicOwner || session.user.email
          });
      } catch (error) { 
          console.warn("Aviso de historial:", error); 
      }
  }, [session, clinicOwner]);

  const toggleTheme = () => { const modes = ['dark', 'light', 'blue']; const next = modes[(modes.indexOf(themeMode) + 1) % modes.length]; setThemeMode(next); localStorage.setItem('sc_theme_mode', next); };
  
const saveToSupabase = async (tableName, id, dataObj) => {
    if (navigator.onLine) {
        try {
            let payload = { id: id };
            if (['clinic_config', 'clinical_evolutions'].includes(tableName)) {
                payload = { id: id, ...dataObj };
            } else {
                payload.data = dataObj;
                payload.admin_email = clinicOwner || session?.user?.email;
            }

            const { error } = await supabase.from(tableName).upsert([payload]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error(`Error guardando en ${tableName}:`, err);
            saveToOfflineVault(tableName, id, dataObj);
            return false;
        }
    } 
    else {
        saveToOfflineVault(tableName, id, dataObj);
        return false; 
    }
};

const saveToOfflineVault = (table, id, data) => {
    console.warn(`Modo Offline: Guardando en bóveda local [Tabla: ${table}]`);
    const queue = JSON.parse(localStorage.getItem('shining_offline_queue') || '[]');
    queue.push({ table, id, data, timestamp: new Date().toISOString() });
    localStorage.setItem('shining_offline_queue', JSON.stringify(queue));
};
  
  const getPatient = useCallback((id) => {
      const base = { id, personal: { legalName: id }, anamnesis: { recent: '', remote: '', conditions: {} }, clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, consents: [], images: [] };
      const existing = patientRecords[id];
      if (!existing) return base;
      return { ...base, ...existing, anamnesis: { ...base.anamnesis, ...(existing.anamnesis || {}) }, clinical: existing.clinical || base.clinical, personal: existing.personal || base.personal };
  }, [patientRecords]);

  const savePatientData = useCallback(async (id, d) => { 
      setPatientRecords(prev => ({...prev, [id]: d})); 
      await saveToSupabase('patients', id, d);
      logAction('UPDATE_PATIENT', { patientName: d.personal.legalName }, id);
  }, [logAction, clinicOwner, session]);

  // ==========================================
  // 4. HANDLERS CLÍNICOS Y CEREBRO DE VOZ
  // ==========================================
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

  const getPerioStats = () => {
    if (!selectedPatientId) return { bop: 0, plaque: 0 };
    const p = getPatient(selectedPatientId);
    let sites=0, bop=0, faces=0, plaque=0;
    [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => {
        const st = p.clinical.teeth[t]?.status;
        const isMissing = Array.isArray(st) ? st.includes('missing') : st === 'missing';
        if (!isMissing) {
            sites+=6; faces+=4;
            const perio = p.clinical.perio?.[t] || {}; const hygiene = p.clinical.hygiene?.[t] || {};
            if(perio.bop) Object.values(perio.bop).forEach(v=> {if(v) bop++});
            Object.values(hygiene).forEach(v=> {if(v) plaque++});
        }
    });
    return { bop: sites>0?Math.round((bop/sites)*100):0, plaque: faces>0?Math.round((plaque/faces)*100):0 };
  };

  const savePerioSnapshot = () => {
      const p = getPatient(selectedPatientId);
      const dateStr = new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
      const newSnapshot = { id: Date.now().toString(), date: dateStr, perio: JSON.parse(JSON.stringify(p.clinical.perio || {})), hygiene: JSON.parse(JSON.stringify(p.clinical.hygiene || {})), stats: getPerioStats() };
      savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perioHistory: [...(p.clinical.perioHistory || []), newSnapshot] }});
      notify(`Evolución Periodontal guardada con éxito (${dateStr})`);
  };

  const restoreSnapshot = async (snap) => {
      if(await confirm(`¿Estás seguro de cargar en pantalla la evolución del ${snap.date}?`)) {
          const p = getPatient(selectedPatientId);
          savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: JSON.parse(JSON.stringify(snap.perio || {})), hygiene: JSON.parse(JSON.stringify(snap.hygiene || {})) }});
          notify(`Cargando evolución del ${snap.date}`);
      }
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

    const setSelectedToothId = (id) => {
      if (id) {
          const p = getPatient(selectedPatientId);
          const tData = p.clinical?.teeth?.[id] || {};
          const pData = p.clinical?.perio?.[id] || {}; 

          setToothModalData({
              id: id,
              mode: patientTab === 'perio' ? 'perio' : odontogramMode,
              ...tData,
              faces: tData.faces || {v:null, l:null, m:null, d:null, o:null},
              treatment: tData.treatment || {name: '', status: 'planned'},
              perio: pData 
          });
          setModal('tooth');
      } else {
          setModal(null); 
      }
  };
  
  const { isListening, voiceStatus, isPerioVoiceActive, voiceFeedback, toggleVoice, startPerioDictation } = useVoiceAssistant({ notify, setToothModalData, setPerioData, goToAdjacentTooth, setSelectedToothId, odontogramType, getPatient, selectedPatientId, savePatientData, patientTab, toothModalData });

  const handleLogoUploadWrapper = useCallback((e) => uploadLogo(e, { setUploading, notify, clinicOwner, session, config, setConfigLocal, saveToSupabase }), [clinicOwner, session, config]);
  const handleImageUploadWrapper = useCallback((file) => {
      uploadPatientImage(file, { selectedPatientId, setUploading, getPatient, activeFolder, savePatientData, notify, logAction });
  }, [selectedPatientId, getPatient, activeFolder, savePatientData, logAction]);
  const handleGeneratePDF = useCallback((type, data = null) => generatePDF(type, data, { themeMode, config, selectedPatientId, getPatient, sessionData, patientRecords, prescription, notify, logAction }), [themeMode, config, selectedPatientId, getPatient, sessionData, patientRecords, prescription, logAction]);
  const saveToSupabaseWrapper = useCallback((t, id, d) => saveToSupabase(t, id, d), [clinicOwner, session]);

  const handleOnboardingSave = async (form) => {
      const newConfig = { ...config, name: form.name, specialty: form.specialty, rut: form.rut, phone: form.phone || config.phone, address: form.address || config.address };
      setConfigLocal(newConfig);
      await saveToSupabase('settings', 'general', newConfig);
      notify(`¡Bienvenido/a, ${form.name.split(' ').slice(-1)[0]}!`);
  };

  // ==========================================
  // 5. DATOS DERIVADOS (UseMemo)
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
  
  const chartData = useMemo(() => {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const today = new Date();
      const last6Months = [];

      for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          last6Months.push({
              name: monthNames[d.getMonth()], 
              year: d.getFullYear(),
              month: d.getMonth(),
              ingresos: 0 
          });
      }

      incomeRecords.forEach(rec => {
          if (!rec.date) return;
          const recDate = new Date(rec.date);
          const paid = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0) + (rec.paid && !rec.payments ? Number(rec.paid) : 0);
          const targetMonth = last6Months.find(m => m.month === recDate.getMonth() && m.year === recDate.getFullYear());
          if (targetMonth) targetMonth.ingresos += paid; 
      });

      return last6Months.map(item => ({ name: item.name, ingresos: item.ingresos }));
  }, [incomeRecords]);

  const getRecalls = useMemo(() => {
      const now = new Date(); const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(now.getMonth() - 6);
      const futureAppts = appointments.filter(a => new Date(a.date) >= now);
      const futurePatientNames = new Set(futureAppts.map(a => a.name));
      const pastAppts = appointments.filter(a => new Date(a.date) <= sixMonthsAgo);
      const latestAppts = {};
      pastAppts.forEach(a => { if (!latestAppts[a.name] || new Date(a.date) > new Date(latestAppts[a.name].date)) latestAppts[a.name] = a; });
      return Object.values(latestAppts).filter(a => !futurePatientNames.has(a.name));
  }, [appointments]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => {
        if (!item || !item.name || item.name.trim() === '') return false;
        const stockActual = Number(item.stock) || 0;
        const stockMinimo = Number(item.min) || 0;
        return stockActual <= stockMinimo;
    });
  }, [inventory]);

  const expirationAlerts = useMemo(() => {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);

      const alerts = { expired: [], near: [] };

      inventory.forEach(item => {
          item.batches?.forEach(batch => {
              if (batch.expiry) {
                  const expiryDate = new Date(batch.expiry);
                  if (expiryDate <= today) {
                      alerts.expired.push({ ...item, batch });
                  } else if (expiryDate <= nextMonth) {
                      alerts.near.push({ ...item, batch });
                  }
              }
          });
      });
      return alerts;
  }, [inventory]);

  const pendingLabWorks = useMemo(() => {
    return labWorks
        .filter(work => work.status !== 'Entregado' && work.status !== 'Finalizado')
        .sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate))
        .slice(0, 5);
  }, [labWorks]);

  // ==========================================
  // 6. RENDERIZADO VISUAL
  // ==========================================
  
  if (publicClinicId) {
      return (
          <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white flex flex-col">
              <Toaster position="bottom-center" />
              <PublicBooking clinicId={publicClinicId} supabase={supabase} notify={notify} />
          </div>
      );
  }

  if (!session) {
      if (!showLogin) return <LandingPage onLoginClick={() => setShowLogin(true)} />;
      return (
          <div className="min-h-screen flex bg-[#FDFBF7] text-[#2A2421] transition-all duration-500 font-sans">
              <button onClick={() => setShowLogin(false)} className="absolute top-6 left-6 z-50 text-[#5C544D] hover:text-[#2A2421] flex items-center gap-2 font-bold text-sm transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-200">
                  <ArrowLeft size={16}/> Volver al inicio
              </button>
              <AuthScreen />
          </div>
      );
  }

  // --- MAGIA: INTERCEPTAMOS AL LABORATORIO ---
  if (userRole === 'lab') {
      return (
          <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans">
              <Toaster position="bottom-center" />
              <main className="p-6 md:p-10 h-screen overflow-y-auto">
                  <LabDashboard
                      config={config}
                      supabase={supabase}
                      notify={notify}
                      session={session}
                  />
              </main>
          </div>
      );
  }
  // ------------------------------------------
  
  const t = THEMES[themeMode] || THEMES.dark;
  const isWorkspaceActive = (activeTab === 'ficha' && selectedPatientId !== null) || activeTab === 'agenda';

  if (window.location.pathname === '/mp-oauth-callback') {
    return <MPOAuthCallback />;
  }

  return (
    <div className={`min-h-screen flex bg-[#FDFBF7] text-[#2A2421] transition-all duration-500 font-sans`}>
      <Toaster position="bottom-center" reverseOrder={false} />
      
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-[#2A2421]/30 backdrop-blur-sm md:hidden" onClick={()=>setMobileMenuOpen(false)}></div>}
      
      <Sidebar 
          mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} 
          config={config} session={session} userRole={userRole} 
          activeTab={activeTab} setActiveTab={setActiveTab} 
          setSelectedPatientId={setSelectedPatientId} themeMode={themeMode} 
          toggleTheme={toggleTheme} supabase={supabase}
          isWorkspaceActive={isWorkspaceActive} 
      />

      <main className={`flex-1 p-6 md:p-10 h-screen overflow-y-auto transition-all duration-300 ${isWorkspaceActive ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
            <button onClick={()=>setMobileMenuOpen(true)} className={`p-2 rounded-xl bg-[#FDFBF7] text-[#5C544D]`}><Menu/></button>
            <span className="font-black text-lg tracking-tight">ShiningCloud <span className="text-[#A3968B]">Dental</span></span>
            <div className="w-8"></div>
        </div>
        
        {activeTab === 'master_panel' && IS_MASTER_ADMIN && <MasterPanel supabase={supabase} notify={notify} />}
        {activeTab === 'dashboard' && <DashboardView config={config} userRole={userRole} themeMode={themeMode} t={t} totalCollected={totalCollected} totalExpenses={totalExpenses} netProfit={netProfit} chartData={chartData} todaysAppointments={todaysAppointments} setActiveTab={setActiveTab} setFinanceTab={setFinanceTab} setModal={setModal} setSelectedPatientId={setSelectedPatientId} setQuoteMode={setQuoteMode} lowStockItems={lowStockItems} pendingLabWorks={pendingLabWorks} expirationAlerts={expirationAlerts} />}
        {activeTab === 'terms' && <TermsScreen theme={t} />}
        {activeTab === 'history' && (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') && <FinanceCenter themeMode={themeMode} t={t} financeTab={financeTab} setFinanceTab={setFinanceTab} financialRecords={financialRecords} setFinancialRecords={setFinancialRecords} incomeRecords={incomeRecords} expenseRecords={expenseRecords} totalCollected={totalCollected} totalExpenses={totalExpenses} totalDebt={totalDebt} netProfit={netProfit} patientRecords={patientRecords} saveToSupabase={saveToSupabase} notify={notify} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} onOpenAbonoModal={(record, pending) => { setSelectedFinancialRecord(record); setPaymentInput({amount: pending > 0 ? pending : '', method:'Efectivo', date: getLocalDate(), receiptNumber: ''}); setModal('abono'); }} session={session} team={team} userRole={userRole} />}
        {activeTab === 'catalog' && (userRole === 'admin' || userRole === 'dentist') && <CatalogView themeMode={themeMode} t={t} catalog={catalog} setCatalog={setCatalog} clinicOwner={clinicOwner} session={session} setNewCatalogItem={setNewCatalogItem} setModal={setModal} saveToSupabase={saveToSupabase} notify={notify} />}
        {activeTab === 'inventory' && (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') && <InventoryView themeMode={themeMode} t={t} inventory={inventory} setInventory={setInventory} filteredInventory={filteredInventory} inventorySearch={inventorySearch} setInventorySearch={setInventorySearch} setNewItem={setNewItem} setModal={setModal} saveToSupabase={saveToSupabase} session={session} team={team} notify={notify} />}
        {activeTab === 'lab' && <LabView themeMode={themeMode} t={t} labWorks={labWorks} setLabWorks={setLabWorks} setNewLabWork={setNewLabWork} setModal={setModal} notify={notify} team={team} sendWhatsApp={sendWhatsApp} config={config} />}        
        {activeTab === 'settings' && <SettingsView themeMode={themeMode} t={t} config={config} setConfigLocal={setConfigLocal} logoInputRef={logoInputRef} handleLogoUpload={handleLogoUploadWrapper} userRole={userRole} saveToSupabase={saveToSupabase} notify={notify} team={team} setTeam={setTeam} newMember={newMember} setNewMember={setNewMember} session={session} />}
        {activeTab === 'quote' && (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') && <QuoteView themeMode={themeMode} t={t} quoteItems={quoteItems} setQuoteItems={setQuoteItems} newQuoteItem={newQuoteItem} setNewQuoteItem={setNewQuoteItem} catalog={catalog} patientRecords={patientRecords} sessionData={sessionData} setSessionData={setSessionData} getPatient={getPatient} savePatientData={savePatientData} saveToSupabase={saveToSupabase} notify={notify} generatePDF={handleGeneratePDF} setActiveTab={setActiveTab} />}
        {activeTab === 'agenda' && <AgendaView themeMode={themeMode} t={t} appointments={appointments} team={team} onOpenModal={(apptData) => { setNewAppt(apptData); setModal('appt'); }} />}
        {activeTab === 'clinical' && (userRole === 'admin' || userRole === 'dentist') && <PrescriptionView themeMode={themeMode} t={t} patientRecords={patientRecords} getPatient={getPatient} savePatientData={savePatientData} setPatientRecords={setPatientRecords} rxPatient={rxPatient} setRxPatient={setRxPatient} medInput={medInput} setMedInput={setMedInput} prescription={prescription} setPrescription={setPrescription} notify={notify} generatePDF={handleGeneratePDF} />}
        {activeTab === 'recalls' && (userRole === 'admin' || userRole === 'assistant') && <CRMView themeMode={themeMode} t={t} getRecalls={getRecalls} patientRecords={patientRecords} setActiveTab={setActiveTab} setSelectedPatientId={setSelectedPatientId} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} />}
        
        {activeTab === 'sterilization' && (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') && (
            <SterilizationView 
                themeMode={themeMode} 
                t={t} 
                sterilizationItems={sterilizationItems} 
                setSterilizationItems={setSterilizationItems} 
                saveToSupabase={saveToSupabaseWrapper}
                supabase={supabase}
                notify={notify}
                session={session}
                config={config} 
            />
        )}

        {activeTab === 'ficha' && !selectedPatientId && (
            <div className="space-y-4 animate-in slide-in-from-bottom">
                <div className="flex gap-2">
                    <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={async (p) => {
                        if (p.id === 'new') {
                            let nombreReal = p.name;
                            if (!nombreReal || nombreReal.trim() === "") { nombreReal = await prompt("Confirma el nombre del nuevo paciente:"); if (!nombreReal) return; }
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
                <div className="grid gap-3">
                    {Object.keys(patientRecords).map(k => (
                        <Card key={k} onClick={() => setSelectedPatientId(k)} className="cursor-pointer py-5 px-6 flex justify-between items-center group hover:bg-white hover:border-[#A3968B] transition-all">
                            <span className="font-bold capitalize text-[#2A2421] group-hover:text-[#A3968B]">{patientRecords[k]?.personal?.legalName || 'Paciente sin nombre'}</span>
                            <div className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center text-[#5C544D] group-hover:bg-[#E5E7EB] transition-colors">
                                <ArrowRight size={16}/>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )}
        
        {activeTab === 'ficha' && selectedPatientId && (
            <PatientWorkspace 
                selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
                patientTab={patientTab} setPatientTab={setPatientTab}
                userRole={userRole} themeMode={themeMode} session={session} clinicOwner={clinicOwner}
                patientRecords={patientRecords} setActiveTab={setActiveTab} activeFormType={activeFormType} 
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
                config={config} 
            />
        )}
      </main>

      {/* --- RENDERIZADO DEL RADAR OFFLINE --- */}
      <NetworkMonitor />

      {/* --- MODALES --- */}
      {modal === 'tooth' && <ToothModal themeMode={themeMode} t={t} toothModalData={toothModalData} setToothModalData={setToothModalData} setModal={setModal} activeTab={activeTab} perioData={perioData} setPerioData={setPerioData} handlePerioChange={handlePerioChange} calcNIC={calcNIC} isPerioVoiceActive={isPerioVoiceActive} startPerioDictation={startPerioDictation} voiceFeedback={voiceFeedback} isListening={isListening} toggleVoice={toggleVoice}  catalog={catalog} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} goToAdjacentTooth={goToAdjacentTooth} setActiveTab={() => {setActiveTab('ficha'); setPatientTab('images');}}/>}   
      {modal === 'appt' && <ApptModal themeMode={themeMode} newAppt={newAppt} setNewAppt={setNewAppt} setModal={setModal} patientRecords={patientRecords} setPatientRecords={setPatientRecords} getPatient={getPatient} savePatientData={savePatientData} notify={notify} appointments={appointments} setAppointments={setAppointments} saveToSupabase={saveToSupabase} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} team={team} session={session} />}
      {modal === 'abono' && selectedFinancialRecord && <AbonoModal themeMode={themeMode} selectedFinancialRecord={selectedFinancialRecord} setModal={setModal} paymentInput={paymentInput} setPaymentInput={setPaymentInput} financialRecords={financialRecords} setFinancialRecords={setFinancialRecords} saveToSupabase={saveToSupabase} notify={notify} session={session} team={team} />}      
      {modal === 'catalogItem' && <CatalogModal themeMode={themeMode} newCatalogItem={newCatalogItem} setNewCatalogItem={setNewCatalogItem} catalog={catalog} setCatalog={setCatalog} setModal={setModal} clinicOwner={clinicOwner} notify={notify} saveToSupabase={saveToSupabase} />}
      {modal === 'labWork' && (<LabWorkModal themeMode={themeMode} newLabWork={newLabWork} setNewLabWork={setNewLabWork} patientRecords={patientRecords} setModal={setModal} clinicOwner={clinicOwner} labWorks={labWorks} setLabWorks={setLabWorks} supabase={supabase} notify={notify} catalog={catalog} financialRecords={financialRecords} setFinancialRecords={setFinancialRecords} session={session} laboratories={config.laboratories || []} />)}
      {modal === 'addItem' && <AddItemModal themeMode={themeMode} newItem={newItem} setNewItem={setNewItem} setModal={setModal} inventory={inventory} setInventory={setInventory} saveToSupabase={saveToSupabaseWrapper} supabase={supabase} notify={notify} session={session} />}       
      {modal === 'loadPack' && <LoadPackModal themeMode={themeMode} setModal={setModal} protocols={protocols} setProtocols={setProtocols} sessionData={sessionData} setSessionData={setSessionData} supabase={supabase} notify={notify} />}
      {modal === 'recovery' && <RecoveryModal newPasswordInput={newPasswordInput} setNewPasswordInput={setNewPasswordInput} supabase={supabase} notify={notify} setModal={setModal} />}
      
      {selectedImg && (
          <div className="fixed inset-0 z-[200] bg-[#2A2421]/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer" onClick={()=>setSelectedImg(null)}>
              <img src={selectedImg} className="max-w-full max-h-[85%] rounded-2xl shadow-2xl border border-white/20 animate-in zoom-in-95" alt="Radiografía" />
              <span className="mt-6 px-6 py-2 rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-md">CLICK PARA CERRAR</span>
          </div>
      )}

      {clinicOwner && config.name === 'Profesional' && (
          <OnboardingModal onSave={handleOnboardingSave} />
      )}
    </div>
  );
}