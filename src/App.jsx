import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx'; 
import { 
  Calculator, User, Share2, X, Settings, 
  Library, Plus, Trash2, Save, History, Search, 
  Moon, Sun, TrendingUp, Cloud, Diamond, FileSpreadsheet, 
  Stethoscope, FileText, CalendarClock, Menu, ArrowLeft,
  Mail, Upload, Image as ImageIcon, Wallet, 
  Activity, Check, FileQuestion, Camera, Lock, Printer, LogOut,
  ArrowRight, Star, Droplets, FileBarChart, MapPin, Phone, AlertCircle,
  ChevronLeft, ChevronRight, Users, Clock, DollarSign, PenTool, FileSignature, Edit3, Loader, TrendingDown, CreditCard, Banknote, Box, Minus, AlertTriangle, Shield, Mic, MicOff, MessageCircle,
  BarChart2, PieChart, EyeOff, FileLock , FlaskConical 
} from 'lucide-react';
import AgendaView from './components/AgendaView';
import { Card, Button, InputField, SignaturePad, SimpleLineChart } from './components/UIComponents';
import { ToothSVG, Tooth, HygieneCell } from './components/ToothSystem';
import { PrivateImage, TermsScreen, PatientSelect, AuthScreen } from './components/SystemModals';
import { supabase } from './supabase';
import LandingPage from './LandingPage';
import CatalogModal from './CatalogModal';
import { Toaster, toast } from 'react-hot-toast';
import { CONSENT_TEMPLATES, ANAMNESIS_TAGS, THEMES, TEETH_UPPER, TEETH_LOWER, DEFAULT_CATALOG, getLocalDate,formatRUT } from './constants';
import { TEETH_UPPER_PED, TEETH_LOWER_PED } from './constants';
import FinanceCenter from './components/FinanceCenter';
import DashboardView from './components/DashboardView';
import CRMView from './components/CRMView';
import CatalogView from './components/CatalogView';
import InventoryView from './components/InventoryView';
import LabView from './components/LabView';
import SettingsView from './components/SettingsView';
import QuoteView from './components/QuoteView';
import PrescriptionView from './components/PrescriptionView';
import OdontogramTab from './components/OdontogramTab';
import PerioTab from './components/PerioTab';
import PatientPersonalTab from './components/PatientPersonalTab';
import PatientEvolutionTab from './components/PatientEvolutionTab';
import PatientConsentTab from './components/PatientConsentTab';
import PatientImagesTab from './components/PatientImagesTab';
import PatientAnamnesisTab from './components/PatientAnamnesisTab';
import ToothModal from './components/ToothModal';
import ApptModal from './components/ApptModal';
import AbonoModal from './components/AbonoModal';

// --- APP ---
export default function App() {
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('sc_theme_mode') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [perioData, setPerioData] = useState({});
  // --- NUEVOS ESTADOS DEL COTIZADOR ---
  const [quoteItems, setQuoteItems] = useState([]);
  const [newQuoteItem, setNewQuoteItem] = useState({ name: '', price: '', tooth: '' });
  const [catalog, setCatalog] = useState([]);
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', price: '', id: null });

  // DATA
  const [config, setConfigLocal] = useState({ logo: null, hourlyRate: 25000, profitMargin: 30, name: "Dr. Benjamín" });
  const [patientRecords, setPatientRecords] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]); 
  const [protocols, setProtocols] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [team, setTeam] = useState([]); 
  const [userRole, setUserRole] = useState('admin');
  const [clinicOwner, setClinicOwner] = useState('');

  // UI STATES
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal');
  const [activeFormType, setActiveFormType] = useState('general');
  const [viewingForm, setViewingForm] = useState(null);
  const [sessionData, setSessionData] = useState({ patientName: '', clinicalTime: 60, baseCost: 0, patientId: null });
  const [prescription, setPrescription] = useState([]);
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
// --- ESTADO DE AGENDA ACTUALIZADO ---
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '', duration: 60, status: 'agendado', id: null });  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  const [modal, setModal] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // PERIO & CONSENT & IMAGES & ODONTOGRAMA PRO
  // --- NUEVO ESTADO PARA EL MODO ODONTOGRAMA ---
  const [odontogramMode, setOdontogramMode] = useState('hallazgos');
  const [odontogramType, setOdontogramType] = useState('adulto'); // 'adulto', 'pediatrico', o 'mixto'
  // Actualizamos toothModalData para incluir datos de tratamiento
  const [toothModalData, setToothModalData] = useState({ id: null, status: null, faces: { v: null, l: null, m: null, d: null, o: null }, notes: '', treatment: {name: '', status: 'planned'}, mode: 'hallazgos' });
  const [consentTemplate, setConsentTemplate] = useState('general');
  const [consentText, setConsentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('Radiografías');
  const [selectedImg, setSelectedImg] = useState(null);
  const [rxPatient, setRxPatient] = useState(null);
  const [newEvolution, setNewEvolution] = useState('');
  // --- LÓGICA DE PERIODONTOGRAMA AVANZADO ---
  const PERIO_TOOTH_ORDER = [
      '18','17','16','15','14','13','12','11', '21','22','23','24','25','26','27','28',
      '38','37','36','35','34','33','32','31', '41','42','43','44','45','46','47','48'
  ];

 const goToAdjacentTooth = (direction, explicitData = null) => {
      if (!toothModalData || !toothModalData.id) return;

      // 1. AUTO-GUARDADO: Guardamos lo que haya en pantalla en la base de datos
      const dataToSave = explicitData || perioData;
      const p = getPatient(selectedPatientId);
      const updatedPerio = { ...p.clinical.perio, [toothModalData.id]: dataToSave };
      savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: updatedPerio } });

      // 2. NAVEGACIÓN: Calculamos el diente vecino
      const currentIndex = PERIO_TOOTH_ORDER.indexOf(toothModalData.id.toString());
      let nextIndex = currentIndex + direction;

      if (nextIndex >= 0 && nextIndex < PERIO_TOOTH_ORDER.length) {
          const nextId = PERIO_TOOTH_ORDER[nextIndex];
          const nextData = p.clinical.perio?.[nextId] || {}; // Buscamos si el nuevo diente ya tenía datos

          // 3. ACTUALIZAR PANTALLA
          setToothModalData({ id: nextId });
          setPerioData({
              pd: nextData.pd || {}, mg: nextData.mg || {}, bop: nextData.bop || {},
              pus: nextData.pus || false, mobility: nextData.mobility || 0, furcation: nextData.furcation || 0
          });
          notify(`Avanzando a pieza ${nextId}`);
      }
  };

  const handlePerioChange = (face, field, index, value) => {
      // Permite escribir números y el signo menos "-" para el margen (recesión/hiperplasia)
      let val = value;
      if (value !== '' && value !== '-') {
          val = parseInt(value, 10);
          if(isNaN(val)) return; // Evita que se ingresen letras
      }

      setToothModalData(prev => {
          const currentPerio = prev.perio || {};
          const key = `${field}_${face}`; // Ejemplo: 'pd_v' o 'mg_l'
          const newArray = [...(currentPerio[key] || ['','',''])];
          newArray[index] = val;
          
          return { ...prev, perio: { ...currentPerio, [key]: newArray } };
      });
  };

  const calcNIC = (pd, mg) => {
      if (pd === '' || mg === '' || pd === undefined || mg === undefined || pd === '-' || mg === '-') return '-';
      return parseInt(pd) + parseInt(mg);
  };
  // --- GUARDAR SNAPSHOT PERIODONTAL (HISTORIAL) ---
  const savePerioSnapshot = () => {
      const p = getPatient(selectedPatientId);
      const dateStr = new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
      
      const newSnapshot = {
          id: Date.now().toString(),
          date: dateStr,
          perio: JSON.parse(JSON.stringify(p.clinical.perio || {})), // Copia profunda exacta
          hygiene: JSON.parse(JSON.stringify(p.clinical.hygiene || {})), // Copia profunda exacta
          stats: getPerioStats()
      };

      const history = p.clinical.perioHistory || [];
      savePatientData(selectedPatientId, {
          ...p,
          clinical: {
              ...p.clinical,
              perioHistory: [...history, newSnapshot]
          }
      });
      notify(`Evolución Periodontal guardada con éxito (${dateStr})`);
  };
  // --- CARGAR SNAPSHOT PERIODONTAL EN PANTALLA ---
  const restoreSnapshot = (snap) => {
      if(window.confirm(`¿Estás seguro de cargar en pantalla la evolución del ${snap.date}?\n\nNota: Asegúrate de haber guardado tu trabajo actual si estabas haciendo cambios.`)) {
          const p = getPatient(selectedPatientId);
          
          // Reemplazamos los datos actuales de la pantalla con los del snapshot
          savePatientData(selectedPatientId, {
              ...p,
              clinical: {
                  ...p.clinical,
                  perio: JSON.parse(JSON.stringify(snap.perio || {})),
                  hygiene: JSON.parse(JSON.stringify(snap.hygiene || {}))
              }
          });
          notify(`Cargando evolución del ${snap.date}`);
      }
  };
  // --- MOTOR DE DICTADO POR VOZ (PERIODONCIA) ---
  const [isPerioVoiceActive, setIsPerioVoiceActive] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const startPerioDictation = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
          notify("Tu navegador no soporta dictado por voz (Te recomiendo Chrome).");
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; // Configurado para español
      recognition.continuous = false; // Se detiene al terminar la frase
      recognition.interimResults = false;

      recognition.onstart = () => {
          setIsPerioVoiceActive(true);
          setVoiceFeedback('Escuchando (ej: "tres, dos, tres")...');
      };

      recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setVoiceFeedback(`Escuchaste: "${transcript}"`);
          
          // 1. Convertir palabras a números y soporte para signos negativos
          const cleanText = transcript
              .replace(/uno/g, '1').replace(/dos/g, '2').replace(/tres/g, '3')
              .replace(/cuatro/g, '4').replace(/cinco/g, '5').replace(/seis/g, '6')
              .replace(/siete/g, '7').replace(/ocho/g, '8').replace(/nueve/g, '9').replace(/cero/g, '0')
              .replace(/menos /g, '-');

          setPerioData(prev => {
              let newData = { ...prev, pd: { ...(prev.pd || {}) }, mg: { ...(prev.mg || {}) }, bop: { ...(prev.bop || {}) } };
              
              let pdNumbers = [];
              let mgNumbers = [];

              if (cleanText.includes('margen')) {
                  const parts = cleanText.split('margen');
                  pdNumbers = parts[0].match(/-?\d/g) || [];
                  mgNumbers = parts[1].match(/-?\d/g) || [];
              } else {
                  pdNumbers = cleanText.match(/-?\d/g) || [];
              }
              
              // --- NUEVA INTELIGENCIA DE CARAS ---
              const isPalatino = cleanText.includes('palatino') || cleanText.includes('lingual');

              // 2. Rellenar Profundidad (PD)
              if (pdNumbers.length >= 6) {
                  // Si dicta 6 números de corrido, llena toda la pieza
                  if (pdNumbers[0]) newData.pd.vd = pdNumbers[0];
                  if (pdNumbers[1]) newData.pd.v  = pdNumbers[1];
                  if (pdNumbers[2]) newData.pd.vm = pdNumbers[2];
                  if (pdNumbers[3]) newData.pd.ld = pdNumbers[3]; 
                  if (pdNumbers[4]) newData.pd.l  = pdNumbers[4];
                  if (pdNumbers[5]) newData.pd.lm = pdNumbers[5];
              } else if (pdNumbers.length > 0) {
                  // Si dicta 3 números o menos, revisa de qué cara está hablando
                  if (isPalatino) {
                      if (pdNumbers[0]) newData.pd.ld = pdNumbers[0];
                      if (pdNumbers[1]) newData.pd.l  = pdNumbers[1];
                      if (pdNumbers[2]) newData.pd.lm = pdNumbers[2];
                  } else { // Por defecto va a Vestibular
                      if (pdNumbers[0]) newData.pd.vd = pdNumbers[0];
                      if (pdNumbers[1]) newData.pd.v  = pdNumbers[1];
                      if (pdNumbers[2]) newData.pd.vm = pdNumbers[2];
                  }
              }

              // 3. Rellenar Margen (MG) con la misma inteligencia
              if (mgNumbers.length >= 6) {
                  if (mgNumbers[0]) newData.mg.vd = mgNumbers[0];
                  if (mgNumbers[1]) newData.mg.v  = mgNumbers[1];
                  if (mgNumbers[2]) newData.mg.vm = mgNumbers[2];
                  if (mgNumbers[3]) newData.mg.ld = mgNumbers[3]; 
                  if (mgNumbers[4]) newData.mg.l  = mgNumbers[4];
                  if (mgNumbers[5]) newData.mg.lm = mgNumbers[5];
              } else if (mgNumbers.length > 0) {
                  if (isPalatino) {
                      if (mgNumbers[0]) newData.mg.ld = mgNumbers[0];
                      if (mgNumbers[1]) newData.mg.l  = mgNumbers[1];
                      if (mgNumbers[2]) newData.mg.lm = mgNumbers[2];
                  } else {
                      if (mgNumbers[0]) newData.mg.vd = mgNumbers[0];
                      if (mgNumbers[1]) newData.mg.v  = mgNumbers[1];
                      if (mgNumbers[2]) newData.mg.vm = mgNumbers[2];
                  }
              }

              // 4. Detectar Sangrado y Pus direccionado
              if (cleanText.includes('sangra') || cleanText.includes('sangrado')) {
                  if (isPalatino) {
                      newData.bop.l = true; // Sangrado palatino
                  } else {
                      newData.bop.v = true; // Sangrado vestibular
                  }
              }
              if (cleanText.includes('pus') || cleanText.includes('supura')) {
                  newData.pus = true;
              }
              // Si la IA escucha "Siguiente", guarda lo que dictaste y salta al próximo diente
              if (cleanText.includes('siguiente') || cleanText.includes('próximo') || cleanText.includes('avanza')) {
                  setTimeout(() => goToAdjacentTooth(1, newData), 100);
              } 
              // Si la IA escucha "Anterior" o "Atrás", retrocede
              else if (cleanText.includes('anterior') || cleanText.includes('atrás') || cleanText.includes('vuelve')) {
                  setTimeout(() => goToAdjacentTooth(-1, newData), 100);
              }

              return newData;
          });
      };

      recognition.onerror = () => {
          setVoiceFeedback('No se escuchó bien. Intenta de nuevo.');
          setIsPerioVoiceActive(false);
      };

      recognition.onend = () => {
          setIsPerioVoiceActive(false);
          // Borrar el mensaje después de 3 segundos
          setTimeout(() => setVoiceFeedback(''), 3000); 
      };

      recognition.start();
  };
  // --- INVENTARIO & PAGOS ---
  const [inventorySearch, setInventorySearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', stock: 0, min: 5, unit: 'u', id: null });
  const [paymentInput, setPaymentInput] = useState({ amount: '', method: 'Efectivo', date: getLocalDate(), receiptNumber: '' });
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null);
 // --- NUEVOS ESTADOS CENTRO FINANCIERO ---
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'dentist' });
  const [financeTab, setFinanceTab] = useState('resumen');

  // --- ESTADOS DE LABORATORIO ---
  const [labWorks, setLabWorks] = useState([]);
  const [newLabWork, setNewLabWork] = useState({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
 
  // --- VOZ A TEXTO ---
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognitionRef = useRef(null);

  const logoInputRef = useRef(null);

  useEffect(() => { document.title = "ShiningCloud | Dental"; }, []);
  useEffect(() => {
      // 1. Truco infalible: Leemos la URL nativa por si Supabase se demora
      if (window.location.hash.includes('type=recovery')) {
          setModal('recovery');
      }

      // 2. Cargamos la sesión inicial
      supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
      });

      // 3. El vigía oficial de Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
              setModal('recovery');
          }
          setSession(session);
      });
      
      return () => subscription.unsubscribe();
  }, []);
  
useEffect(() => {
    if (!session) return;
    
    const load = async () => {
      // 1. PRIMERO: Averiguar quién soy y quién es el dueño de mi clínica
      const { data: t, error: tErr } = await supabase.from('team').select('*');
      let myClinicAdmin = session.user.email; 
      
      if (!tErr && t) {
          const allTeamData = t.map(r => ({...r.data, id: r.id}));
          const me = allTeamData.find(u => u.email === session.user.email);
          
          if (me) myClinicAdmin = me.admin_email; 
          
          const myTeam = allTeamData.filter(u => u.admin_email === myClinicAdmin);
          setTeam(myTeam);
          
          if (myTeam.length === 0 || !me) setUserRole('admin'); 
          else setUserRole(me.role);
      } else { 
          setUserRole('admin'); 
      }
      
      setClinicOwner(myClinicAdmin);

      // 2. SEGUNDO: Descargar SOLO los datos que le pertenecen a mi clínica
      const { data: s } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
      if (s) setConfigLocal(s.data);
      
      const { data: p } = await supabase.from('patients').select('*').eq('admin_email', myClinicAdmin).order('id', { ascending: false }).limit(50);
      if (p) { const m = {}; p.forEach(r => m[r.id] = r.data); setPatientRecords(m); }
      
      const { data: a } = await supabase.from('appointments').select('*').eq('admin_email', myClinicAdmin);
      if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));
      
      const { data: f } = await supabase.from('financials').select('*').eq('admin_email', myClinicAdmin);
      if (f) setFinancialRecords(f.map(r => ({ ...r.data, id: r.id })));
      
      const { data: pk } = await supabase.from('packs').select('*').eq('admin_email', myClinicAdmin);
      if (pk) setProtocols(pk.map(r => ({ ...r.data, id: r.id })));
      
      const { data: i, error: iErr } = await supabase.from('inventory').select('*').eq('admin_email', myClinicAdmin);
      if (!iErr && i) setInventory(i.map(r => ({ ...r.data, id: r.id })));

      const { data: catData } = await supabase.from('catalog').select('*').eq('admin_email', myClinicAdmin);
      if (catData) setCatalog(catData.map(r => ({ ...r.data, id: r.id })));

      const { data: labData } = await supabase.from('lab_works').select('*').eq('admin_email', myClinicAdmin);
      if (labData) setLabWorks(labData); 
    };
    
    load();
  }, [session]);

// --- V76/V78: SISTEMA DE AUDITORÍA CON ETIQUETA DE CLÍNICA ---
  const logAction = async (action, details, patientId = null) => {
      try {
          const currentOwner = clinicOwner || session.user.email;
          
          await supabase.from('audit_logs').insert({
              user_email: session.user.email,
              action: action,
              patient_id: patientId,
              details: details,
              timestamp: new Date().toISOString(),
              admin_email: currentOwner // <-- LA ETIQUETA MULTITENANT
          });
      } catch (error) {
          console.error("Error creating audit log", error);
      }
  };

  const notify = (m) => toast.success(m, { 
    style: { borderRadius: '12px', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '12px' },
    iconTheme: { primary: '#06b6d4', secondary: '#fff' }
});
  const toggleTheme = () => { const modes = ['dark', 'light', 'blue']; const next = modes[(modes.indexOf(themeMode) + 1) % modes.length]; setThemeMode(next); localStorage.setItem('sc_theme_mode', next); };
  // --- FUNCIÓN MAESTRA DE GUARDADO BLINDADA (V78) ---
  const saveToSupabase = async (t, id, d) => { 
      // Determinamos quién es el dueño de la clínica en este momento
      const currentOwner = clinicOwner || session.user.email;
      
      await supabase.from(t).upsert({ 
          id: id.toString(), 
          data: d,
          admin_email: currentOwner // <-- LA ETIQUETA MULTITENANT
      }); 
  };
  
  const getPatient = (id) => {
      const base = { id, personal: { legalName: id }, anamnesis: { recent: '', remote: '', conditions: {} }, clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, consents: [], images: [] };
      const existing = patientRecords[id];
      if (!existing) return base;
      return { 
          ...base, ...existing, 
          anamnesis: { ...base.anamnesis, ...(existing.anamnesis || {}) }, 
          clinical: existing.clinical || base.clinical, 
          personal: existing.personal || base.personal 
      };
  };

  const savePatientData = async (id, d) => { 
      setPatientRecords(prev => ({...prev, [id]: d})); 
      await saveToSupabase('patients', id, d);
      // V76: Log de auditoría
      logAction('UPDATE_PATIENT', { patientName: d.personal.legalName }, id);
  };

  // --- SUBIDA DE LOGO OPTIMIZADA (EN BUCKET PÚBLICO SEPARADO) ---
  const handleLogoUpload = async (e) => { 
      const file = e.target.files[0]; 
      if (!file) return; 
      
      setUploading(true);
      notify("Subiendo logo...");
      
      try {
            // Eliminamos la extensión dinámica para forzar la sobreescritura del archivo anterior
            const fileName = `logo_${clinicOwner || session.user.email}_file`;
          
          // Subimos al bucket dedicado de logos
          const { error: uploadError } = await supabase.storage.from('clinic-logos').upload(fileName, file, { upsert: true });
          if (uploadError) throw uploadError;
          
          // Obtenemos el link público
          const { data: { publicUrl } } = supabase.storage.from('clinic-logos').getPublicUrl(fileName);
          
          // Guardamos SOLO el link en la base de datos
          const newConfig = { ...config, logo: publicUrl }; 
          setConfigLocal(newConfig); 
          
          // Guardamos con la etiqueta de seguridad multitenant
          await saveToSupabase('settings', 'general', newConfig); 
          
          notify("Logo Actualizado con éxito"); 
      } catch (err) {
          console.error(err);
          alert("Error subiendo el logo");
      } finally {
          setUploading(false);
      }
  };

  const currentTotal = useMemo(() => { const time = parseFloat(sessionData.clinicalTime) || 0; const base = parseFloat(sessionData.baseCost) || 0; const hourly = parseFloat(config.hourlyRate) || 0; const margin = parseFloat(config.profitMargin) || 0; return Math.round(((hourly / 60) * time + base) / (1 - margin / 100)); }, [sessionData, config]);
  const incomeRecords = financialRecords.filter(f => !f.type || f.type === 'income');
  const expenseRecords = financialRecords.filter(f => f.type === 'expense');
  const totalCollected = incomeRecords.reduce((acc, rec) => { const paymentsSum = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0); return acc + (paymentsSum > 0 ? paymentsSum : (Number(rec.paid) || 0)); }, 0);
  const totalExpenses = expenseRecords.reduce((a, b) => a + (Number(b.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;
  // Calcular deuda en la calle (total de tratamientos - lo que han pagado)
  const totalDebt = incomeRecords.reduce((acc, rec) => {
      const paid = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0) + (rec.paid && !rec.payments ? rec.paid : 0);
      const pending = (rec.total || 0) - paid;
      return acc + (pending > 0 ? pending : 0);
  }, 0);
  const todaysAppointments = appointments.filter(a => a.date === getLocalDate()).sort((a,b) => a.time.localeCompare(b.time));
  const filteredInventory = useMemo(() => { if(!inventorySearch) return inventory; return inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase())); }, [inventory, inventorySearch]);

 // --- SUBIDA SEGURA DE IMÁGENES CLÍNICAS (BUCKET PRIVADO) ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0]; 
      if (!file || !selectedPatientId) return; 
      setUploading(true);
      try {
          const fileName = `${selectedPatientId}_${Date.now()}.${file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage.from('patient-images').upload(fileName, file);
          if (uploadError) throw uploadError;
          
          const p = getPatient(selectedPatientId);
          
          // LA MAGIA: Ya no pedimos la URL pública, guardamos el "path" (fileName) interno
          const updatedImages = [...(p.images || []), { 
              id: Date.now(), 
              path: fileName, // <-- Guardamos la ruta interna para generar el Signed URL después
              url: fileName,  // Guardamos lo mismo aquí por compatibilidad con tu código actual
              date: new Date().toLocaleDateString(),
              folder: activeFolder 
          }];
          
          await savePatientData(selectedPatientId, { ...p, images: updatedImages });
          notify(`Archivo encriptado en ${activeFolder}`);
          logAction('UPLOAD_IMAGE', { fileName, folder: activeFolder }, selectedPatientId); 
      } catch (err) { 
          alert(`Error: ${err.message}`); 
      } finally { 
          setUploading(false); 
      }
  };

  const generatePDF = (type, data = null) => {
    try {
        const doc = new jsPDF();
        // Colores según tu tema (mantenemos tu lógica de colores)
        const primaryColor = themeMode === 'light' ? [217, 119, 6] : (themeMode === 'blue' ? [6, 182, 212] : [212, 175, 55]);
        
        // --- 1. ENCABEZADO PROFESIONAL (Basado en normativa chilena) ---
        doc.setFillColor(...primaryColor); 
        doc.rect(0, 0, 210, 3, 'F'); 

        if (config.logo) {
            try { doc.addImage(config.logo, 'PNG', 15, 10, 20, 20); } 
            catch (e) { console.warn("Logo incompatible"); }
        }

        // Datos del Profesional (Extraídos de config/Ajustes)
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(config.name?.toUpperCase() || "DOCTOR", 200, 15, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`RUT: ${config.rut || '---'}`, 200, 20, { align: 'right'});
        doc.text(`Registro Super. de Salud: ${config.rnpi || '---'}`, 200, 24, { align: 'right' });
        doc.text(`${config.university || ''}`, 200, 28, { align: 'right' });
        doc.text(`${config.address || ''}`, 200, 32, { align: 'right' });

        // --- 2. DATOS DEL PACIENTE ---
        const pData = (type === 'consent') ? getPatient(selectedPatientId) : (data || (sessionData.patientId ? patientRecords[sessionData.patientId] : null));
        const pName = pData?.personal?.legalName || (sessionData.patientName || 'Paciente...');
        const pRut = pData?.personal?.documentId || '---';
        const pAge = pData?.personal?.age ? `${pData.personal.age} años` : '';

        doc.setDrawColor(200);
        doc.line(15, 38, 195, 38); 

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("PACIENTE:", 15, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`${pName.toUpperCase()}`, 40, 45);
        doc.text(`RUT: ${pRut}`, 140, 45);
        doc.text(`EDAD: ${pAge}`, 15, 50);
        doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 140, 50);

        // --- 3. LÓGICA SEGÚN TIPO DE DOCUMENTO ---

        // CASO A: RECETA MÉDICA (RX)
        if (type === 'rx') {
            if (prescription.length === 0) { notify("Receta vacía"); return; }
            
            doc.setFontSize(16);
            doc.setFont("times", "italic", "bold");
            doc.text("RP:", 15, 65);

            autoTable(doc, {
                startY: 70,
                head: [['FÁRMACO (DCI / PRESENTACIÓN)', 'INDICACIONES (POSOLOGÍA)']],
                body: prescription.map(p => [p.name.toUpperCase(), p.dosage]),
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fontStyle: 'bold', textColor: primaryColor, borderBottom: { width: 0.5, color: primaryColor } },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
            });

            const finalY = doc.lastAutoTable.finalY + 30;
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.line(70, finalY + 20, 140, finalY + 20);
            doc.setFontSize(8);
            doc.text("FIRMA Y TIMBRE PROFESIONAL", 105, finalY + 25, { align: 'center' });
        } 

        // CASO B: PRESUPUESTO (QUOTE) - Restaurado y Mejorado
        else if (type === 'quote') {
            const qItems = data || []; 
            const totalQ = qItems.reduce((sum, item) => sum + Number(item.price), 0);
            
            doc.setFontSize(18);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("PRESUPUESTO DENTAL", 15, 65); 

            autoTable(doc, { 
                startY: 70, 
                head: [['TRATAMIENTO', 'DIENTE', 'VALOR']], 
                body: qItems.map(it => [it.name, it.tooth || '-', `$${Number(it.price).toLocaleString('es-CL')}`]),
                foot: [['', 'TOTAL A PAGAR:', `$${totalQ.toLocaleString('es-CL')}`]],
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold' },
                footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 252, 252] }
            }); 

            const finalY = doc.lastAutoTable.finalY + 15;
            if (finalY < 230) {
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text("Términos y Condiciones:", 15, finalY);
                doc.text("1. Este presupuesto tiene una validez de 30 días.", 15, finalY + 6);
                doc.text("2. Los valores pueden variar según hallazgos clínicos durante el tratamiento.", 15, finalY + 11);

                doc.setDrawColor(150);
                doc.line(30, finalY + 40, 85, finalY + 40); 
                doc.line(125, finalY + 40, 180, finalY + 40); 
                doc.text("Firma Profesional", 45, finalY + 45);
                doc.text("Firma Paciente", 145, finalY + 45);
            }
        }

        // CASO C: CONSENTIMIENTO
        else if (type === 'consent' && data) { 
            doc.setFontSize(14); doc.text(data.type, 105, 70, { align: 'center' }); 
            doc.setFontSize(10); doc.text(doc.splitTextToSize(data.text || '', 170), 20, 90); 
            if(data.signature) { try { doc.addImage(data.signature, 'PNG', 80, 200, 50, 30); } catch(e) { console.warn("Firma error"); } } 
        }

        // Pie de página global
        doc.setFontSize(7);
        doc.setTextColor(180);
        doc.text(`Documento generado por ShiningCloud - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        doc.save(`${type}_${pName}.pdf`); 
        notify("PDF Generado con éxito"); 
        logAction('GENERATE_PDF', { type }, selectedPatientId);

    } catch (e) { 
        console.error(e); 
        alert("Error generando PDF."); 
    }
};

  const getPerioStats = () => {
    if (!selectedPatientId) return { bop: 0, plaque: 0 };
    const p = getPatient(selectedPatientId);
    let sites=0, bop=0, faces=0, plaque=0;
    [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => {
        if (p.clinical.teeth[t]?.status !== 'missing') {
            sites+=6; faces+=4;
            const perio = p.clinical.perio?.[t] || {};
            const hygiene = p.clinical.hygiene?.[t] || {};
            if(perio.bop) Object.values(perio.bop).forEach(v=> {if(v) bop++});
            Object.values(hygiene).forEach(v=> {if(v) plaque++});
        }
    });
    return { bop: sites>0?Math.round((bop/sites)*100):0, plaque: faces>0?Math.round((plaque/faces)*100):0 };
  };

// --- LOGICA DE VOZ (MULTIPLE HALLAZGOS) ---
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Navegador no compatible. Por favor, usa Google Chrome.");
        return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'es-CL';
      recognition.continuous = true; 
      recognition.interimResults = false;
      
      recognition.onstart = () => { setIsListening(true); };

      recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) { 
              if (event.results[i].isFinal) transcript += event.results[i][0].transcript; 
          }

          if (transcript) {
              const text = transcript.toLowerCase();
              
              // 1. Detectar Caras (Anatomía)
              const facesMap = { 'vestibular': 'v', 'lingual': 'l', 'palatina': 'l', 'mesial': 'm', 'distal': 'd', 'oclusal': 'o', 'incisal': 'o' };
              const foundFaceKey = Object.keys(facesMap).find(f => text.includes(f));
              const faceId = foundFaceKey ? facesMap[foundFaceKey] : null;

              // 2. Detectar Diagnósticos (Comandos de Acción)
              if (text.includes('caries') || text.includes('lesión')) {
                  if (faceId) setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: 'caries' }, activeFace: faceId, status: null }));
              } 
              else if (text.includes('resina') || text.includes('empaste') || text.includes('obturación')) {
                  if (faceId) setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: 'filled' }, activeFace: faceId, status: null }));
              } 
              else if (text.includes('corona')) {
                  setToothModalData(prev => ({ ...prev, status: 'crown' }));
              } 
              else if (text.includes('ausente') || text.includes('extraído') || text.includes('extracción')) {
                  setToothModalData(prev => ({ ...prev, status: 'missing' }));
              } 
              else if (text.includes('sano') || text.includes('limpiar')) {
                  if (faceId) {
                      setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: null }, activeFace: faceId }));
                  } else {
                      setToothModalData(prev => ({ ...prev, faces: {v:null,l:null,m:null,d:null,o:null}, status: null }));
                  }
              }

              // 3. Escribir en la Evolución
              setToothModalData(prev => ({
                  ...prev, 
                  notes: (prev.notes ? prev.notes.trim() + ' ' : '') + transcript.charAt(0).toUpperCase() + transcript.slice(1) 
              }));
          }
      };

      recognition.onerror = () => { setIsListening(false); };
      recognition.onend = () => { setIsListening(false); };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // --- WHATSAPP HELPER ---
  const sendWhatsApp = (phone, text) => {
      if (!phone) return alert("El paciente no tiene teléfono registrado.");
      let cleanPhone = phone.replace(/\D/g, ''); 
      // Solo forzamos el 56 si el número tiene exactamente 8 o 9 dígitos (formato local chileno). Si tiene más, asumimos que ya trae código de país.
      if (cleanPhone.length === 8 || cleanPhone.length === 9) {
          cleanPhone = `56${cleanPhone}`;
      }
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPatientPhone = (name) => {
      if (!name) return '';
      const foundEntry = Object.values(patientRecords).find(p => p.personal?.legalName === name);
      return foundEntry?.personal?.phone || '';
  };

// --- GRÁFICO DINÁMICO DE INGRESOS ---
  const getChartData = () => {
      if (incomeRecords.length === 0) return [{label: 'Ayer', value: 0}, {label: 'Hoy', value: 0}];
      
      // Tomamos los últimos 6 ingresos registrados para mostrar la tendencia reciente
      const recentIncomes = [...incomeRecords].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6).reverse();
      
      return recentIncomes.map(rec => {
          const paid = (rec.payments || []).reduce((s,p)=>s+p.amount,0) + (rec.paid && !rec.payments ? rec.paid : 0);
          return { 
              label: rec.patientName.split(' ')[0] || 'Pac', // Muestra el primer nombre
              value: paid > 0 ? paid : 1000 // Valor mínimo para que el gráfico no se rompa si es 0
          };
      });
  };

  // --- MENU LOGIC ---
  const getMenuItems = () => {
      const base = [
          { id: 'dashboard', label: 'Inicio', icon: TrendingUp },
          { id: 'agenda', label: 'Agenda', icon: CalendarClock },
          { id: 'ficha', label: 'Pacientes', icon: User },
          { id: 'recalls', label: 'Retención CRM', icon: Users }, // <-- NUEVO BOTÓN
      ];
      if (userRole === 'admin' || userRole === 'assistant') { base.push({ id: 'history', label: 'Caja & Gastos', icon: Wallet }); }
      if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'quote', label: 'Cotizador', icon: Calculator }); }
      if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'clinical', label: 'Recetas', icon: Stethoscope }); }
      if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'catalog', label: 'Arancel', icon: Library }); }
      if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'lab', label: 'Laboratorio', icon: FlaskConical }); }
      if (userRole === 'admin') { base.push({ id: 'inventory', label: 'Insumos', icon: Box }); base.push({ id: 'settings', label: 'Ajustes', icon: Settings }); }
      base.push({ id: 'terms', label: 'Legal', icon: Shield });
      return base;
  };
// --- LÓGICA DEL CRM DE RETENCIÓN (RECALLS) ---
  const getRecalls = useMemo(() => {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      // 1. Ver quiénes ya tienen citas en el futuro (para no molestarlos)
      const futureAppts = appointments.filter(a => new Date(a.date) >= now);
      const futurePatientNames = new Set(futureAppts.map(a => a.name));

      // 2. Buscar citas que fueron hace 6 meses o más
      const pastAppts = appointments.filter(a => new Date(a.date) <= sixMonthsAgo);
      
      // 3. Agrupar por paciente para ver su ÚLTIMA cita
      const latestAppts = {};
      pastAppts.forEach(a => {
          if (!latestAppts[a.name] || new Date(a.date) > new Date(latestAppts[a.name].date)) {
              latestAppts[a.name] = a;
          }
      });

      // 4. Filtrar: Mostrar solo a los que NO tienen citas futuras
      return Object.values(latestAppts).filter(a => !futurePatientNames.has(a.name));
  }, [appointments]);
  if (!session) {
      if (!showLogin) {
          return <LandingPage onLoginClick={() => setShowLogin(true)} />;
      }
      return (
          <div className="relative min-h-screen">
              {/* Botón flotante para volver a la Landing Page */}
              <button 
                  onClick={() => setShowLogin(false)}
                  className="absolute top-6 left-6 z-50 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors bg-black/50 p-2 rounded-lg backdrop-blur-sm"
              >
                  ← Volver al inicio
              </button>
              
              {/* Tu pantalla de Login original */}
              <AuthScreen />
          </div>
      );
  }
  const t = THEMES[themeMode] || THEMES.dark;

  return (
    <div className={`min-h-screen flex ${t.bg} ${t.text} transition-all duration-500 font-sans`}>
        <Toaster position="bottom-center" reverseOrder={false} />
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={()=>setMobileMenuOpen(false)}></div>}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out ${t.card} border-r flex flex-col`}>
        <div className="p-8 border-b border-white/5 flex flex-col items-center gap-4 relative">
            <button onClick={()=>setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 opacity-50"><X/></button>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${t.gradient}`}>
                {config.logo ? <img src={config.logo} className="w-full h-full object-contain rounded-2xl"/> : <Cloud className="text-white" size={32}/>}
            </div>
            <div className="text-center">
                <h1 className="text-xl font-black tracking-tight">ShiningCloud</h1>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${t.subText}`}>Dental OS</p>
            </div>
        </div>
        
        <div className="px-6 py-6">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${userRole==='admin'?'bg-emerald-500':userRole==='dentist'?'bg-blue-500':'bg-purple-500'}`}>
                    {session.user.email[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{session.user.email.split('@')[0]}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${userRole==='admin'?'text-emerald-400':userRole==='dentist'?'text-blue-400':'text-purple-400'}`}>{userRole === 'admin' ? 'Admin' : userRole === 'dentist' ? 'Dr.' : 'Asist.'}</p>
                </div>
            </div>
        </div>

        <nav className="px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {getMenuItems().map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatientId(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wide transition-all duration-300 group ${activeTab === item.id ? t.activeNav : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}>
                    <item.icon size={18} className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-current' : ''}`}/> {item.label}
                </button>
            ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-white/5">
            <button onClick={toggleTheme} className="w-full p-3 rounded-2xl bg-white/5 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:bg-white/10 hover:scale-[1.02]">
                {themeMode==='dark'?<Moon size={14}/>:themeMode==='light'?<Sun size={14}/>:<Droplets size={14}/>} TEMA
            </button>
            <button onClick={()=>supabase.auth.signOut()} className="w-full p-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-xs transition-all hover:bg-red-500/20 hover:scale-[1.02]">
                <LogOut size={14} className="inline mr-2"/> SALIR
            </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-12 h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between mb-6"><button onClick={()=>setMobileMenuOpen(true)} className={`p-2 rounded-xl ${t.inputBg}`}><Menu/></button><span className="font-black text-lg">ShiningCloud | Dental</span><div className="w-8"></div></div>
        

        {/* --- DASHBOARD --- */}
{activeTab === 'dashboard' && (
    <DashboardView 
        config={config} userRole={userRole} themeMode={themeMode} t={t}
        totalCollected={totalCollected} totalExpenses={totalExpenses} netProfit={netProfit} 
        chartData={getChartData()} todaysAppointments={todaysAppointments}
        setActiveTab={setActiveTab} setFinanceTab={setFinanceTab} setModal={setModal} 
        setSelectedPatientId={setSelectedPatientId} setQuoteMode={setQuoteMode}
    />
)}

    {activeTab === 'terms' && <TermsScreen theme={t} />}

 {/* --- CENTRO FINANCIERO (Refactorizado) --- */}
{activeTab === 'history' && (userRole === 'admin' || userRole === 'assistant') && (
    <FinanceCenter 
        themeMode={themeMode}
        t={t}
        financeTab={financeTab}      
        setFinanceTab={setFinanceTab}
        financialRecords={financialRecords}
        setFinancialRecords={setFinancialRecords}
        incomeRecords={incomeRecords}
        expenseRecords={expenseRecords}
        totalCollected={totalCollected}
        totalExpenses={totalExpenses}
        totalDebt={totalDebt}
        netProfit={netProfit}
        patientRecords={patientRecords}
        saveToSupabase={saveToSupabase}
        notify={notify}
        sendWhatsApp={sendWhatsApp}
        getPatientPhone={getPatientPhone}
        onOpenAbonoModal={(record, pending) => {
            setSelectedFinancialRecord(record); 
            setPaymentInput({amount: pending > 0 ? pending : '', method:'Efectivo', date: getLocalDate(), receiptNumber: ''}); 
            setModal('abono');
        }}
    />
)}  
{/* --- ARANCEL / CATÁLOGO --- */}
{activeTab === 'catalog' && (userRole === 'admin' || userRole === 'dentist') && (
    <CatalogView 
        themeMode={themeMode} t={t} catalog={catalog} setCatalog={setCatalog} 
        clinicOwner={clinicOwner} session={session} setNewCatalogItem={setNewCatalogItem} 
        setModal={setModal} saveToSupabase={saveToSupabase} notify={notify} 
    />
)}
        {/* --- INVENTARIO --- */}
{activeTab === 'inventory' && userRole === 'admin' && (
    <InventoryView 
        themeMode={themeMode} t={t} inventory={inventory} setInventory={setInventory} 
        filteredInventory={filteredInventory} inventorySearch={inventorySearch} 
        setInventorySearch={setInventorySearch} setNewItem={setNewItem} 
        setModal={setModal} saveToSupabase={saveToSupabase} 
    />
)}
       {/* --- MÓDULO DE LABORATORIO EXTERNO --- */}
{activeTab === 'lab' && (
    <LabView 
        themeMode={themeMode} t={t} labWorks={labWorks} setLabWorks={setLabWorks}
        setNewLabWork={setNewLabWork} setModal={setModal} notify={notify}
    />
)}
{/* --- SETTINGS / AJUSTES --- */}
{activeTab === 'settings' && (
    <SettingsView 
        themeMode={themeMode} t={t} config={config} setConfigLocal={setConfigLocal}
        logoInputRef={logoInputRef} handleLogoUpload={handleLogoUpload} userRole={userRole}
        saveToSupabase={saveToSupabase} notify={notify} team={team} setTeam={setTeam}
        newMember={newMember} setNewMember={setNewMember}
    />
)}
{/* --- COTIZADOR --- */}
{activeTab === 'quote' && (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') && (
    <QuoteView 
        themeMode={themeMode} t={t} quoteItems={quoteItems} setQuoteItems={setQuoteItems}
        newQuoteItem={newQuoteItem} setNewQuoteItem={setNewQuoteItem} catalog={catalog}
        patientRecords={patientRecords} sessionData={sessionData} setSessionData={setSessionData}
        getPatient={getPatient} savePatientData={savePatientData} saveToSupabase={saveToSupabase}
        notify={notify} generatePDF={generatePDF} setActiveTab={setActiveTab}
    />
)}
{/* --- AGENDA FLEXIBLE (Refactorizada) --- */}
{activeTab === 'agenda' && (
    <AgendaView 
        themeMode={themeMode} 
        t={t} 
        appointments={appointments} 
        onOpenModal={(apptData) => { 
            setNewAppt(apptData); 
            setModal('appt'); 
        }} 
    />
)}
        {activeTab === 'ficha' && !selectedPatientId && (
            <div className="space-y-4 animate-in slide-in-from-bottom">
                <div className="flex gap-2">
                    <PatientSelect 
                        theme={themeMode} 
                        patients={patientRecords} 
                        placeholder="Buscar o Crear Paciente..." 
                        onSelect={(p) => { 
                            if (p.id === 'new') { 
                                let nombreReal = p.name;
                                
                                // Red de seguridad por si el nombre llega vacío
                                if (!nombreReal || nombreReal.trim() === "") {
                                    nombreReal = window.prompt("Confirma el nombre del nuevo paciente:");
                                    if (!nombreReal) return; 
                                }

                                const newId = "pac_" + Date.now().toString(); 
                                
                                const newPatient = getPatient(newId);
                                newPatient.id = newId;
                                newPatient.name = nombreReal;
                                if (!newPatient.personal) newPatient.personal = {};
                                newPatient.personal.legalName = nombreReal;
                                
                                savePatientData(newId, newPatient); 
                                setSelectedPatientId(newId); 
                                notify("Paciente Creado Exitosamente");
                            } else { 
                                // 👇 LA MAGIA ESTÁ EXACTAMENTE AQUÍ 👇
                                // Inyectamos el paciente de la nube a la memoria local antes de abrirlo
                                setPatientRecords(prev => ({...prev, [p.id]: p}));
                                setSelectedPatientId(p.id); 
                            } 
                        }} 
                    />
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
        
        {activeTab === 'ficha' && selectedPatientId && <div className="space-y-4 animate-in slide-in-from-right">
            <button onClick={()=>setSelectedPatientId(null)} className="flex items-center gap-2 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"><ArrowLeft size={14}/> VOLVER AL BUSCADOR</button>
            
            <div className="flex justify-between items-start">
                <h2 className="text-3xl font-black capitalize">{getPatient(selectedPatientId).personal?.legalName || 'Paciente'}</h2>
            </div>

            {/* --- BANNER DE ALERTA MÉDICA GLOBAL --- */}
            {(() => {
                const p = getPatient(selectedPatientId);
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

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">{[{id:'personal', label:'Datos', icon: User}, {id:'anamnesis', label:'Fichas / Anam.', icon: FileQuestion, restricted: true}, {id:'clinical', label:'Odontograma', icon: Activity}, {id:'perio', label:'Periodontograma', icon: FileBarChart, restricted: true}, {id:'evolution', label:'Evolución', icon: FileText, restricted: true}, {id:'consent', label:'Consentimientos', icon: FileSignature}, {id:'images', label:'Galería', icon: ImageIcon}].map(b=>{
            if (userRole === 'assistant' && b.restricted) return null; // V76: Role Protection
            return (<button key={b.id} onClick={()=>setPatientTab(b.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap ${patientTab===b.id?t.accentBg:'bg-white/5'}`}>{b.label}</button>)
        })}</div>
        {/* --- DATOS PERSONALES --- */}
        {patientTab === 'personal' && (
            <PatientPersonalTab 
                themeMode={themeMode} getPatient={getPatient} selectedPatientId={selectedPatientId}
                savePatientData={savePatientData} sendWhatsApp={sendWhatsApp}
            />
        )}

{/* --- ANAMNESIS Y FICHAS --- */}
{patientTab === 'anamnesis' && (
    <PatientAnamnesisTab 
        themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId}
        savePatientData={savePatientData} session={session} notify={notify}
        activeFormType={activeFormType} setActiveFormType={setActiveFormType}
        viewingForm={viewingForm} setViewingForm={setViewingForm}
    />
)}
                      
{/* --- ODONTOGRAMA DUAL --- */}
{patientTab === 'clinical' && (
    <OdontogramTab 
        themeMode={themeMode} t={t} odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode}
        odontogramType={odontogramType} setOdontogramType={setOdontogramType} getPatient={getPatient}
        selectedPatientId={selectedPatientId} setToothModalData={setToothModalData} setModal={setModal}
        userRole={userRole} catalog={catalog} setQuoteItems={setQuoteItems} notify={notify}
        setActiveTab={setActiveTab} sessionData={sessionData} setSessionData={setSessionData}
    />
)}
{/* --- PERIODONTOGRAMA AVANZADO --- */}
{patientTab === 'perio' && (
    <PerioTab 
        themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId}
        savePatientData={savePatientData} savePerioSnapshot={savePerioSnapshot} getPerioStats={getPerioStats}
        setToothModalData={setToothModalData} setPerioData={setPerioData} setModal={setModal}
        restoreSnapshot={restoreSnapshot}
    />
)}               
                {/* --- EVOLUCIONES --- */}
{patientTab === 'evolution' && (
    <PatientEvolutionTab 
        themeMode={themeMode} t={t} newEvolution={newEvolution} setNewEvolution={setNewEvolution}
        isListening={isListening} toggleVoice={toggleVoice} voiceStatus={voiceStatus}
        getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData}
        session={session} logAction={logAction}
    />
)}

               {/* --- CONSENTIMIENTOS --- */}
{patientTab === 'consent' && (
    <PatientConsentTab 
        themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId}
        savePatientData={savePatientData} modal={modal} setModal={setModal}
        consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate}
        consentText={consentText} setConsentText={setConsentText} generatePDF={generatePDF}
    />
)}
{/* --- IMÁGENES / GALERÍA --- */}
{patientTab === 'images' && (
    <PatientImagesTab 
        themeMode={themeMode} t={t} getPatient={getPatient} selectedPatientId={selectedPatientId}
        savePatientData={savePatientData} activeFolder={activeFolder} setActiveFolder={setActiveFolder}
        handleImageUpload={handleImageUpload} uploading={uploading} setSelectedImg={setSelectedImg}
        notify={notify}
    />
)}
            </div>
        }

{/* --- RECETAS (CLINICAL) --- */}
{activeTab === 'clinical' && (userRole === 'admin' || userRole === 'dentist') && (
    <PrescriptionView 
        themeMode={themeMode} t={t} patientRecords={patientRecords} getPatient={getPatient}
        savePatientData={savePatientData} setPatientRecords={setPatientRecords}
        rxPatient={rxPatient} setRxPatient={setRxPatient} medInput={medInput}
        setMedInput={setMedInput} prescription={prescription} setPrescription={setPrescription}
        notify={notify} generatePDF={generatePDF}
    />
)}

       {/* --- CRM DE RETENCIÓN --- */}
{activeTab === 'recalls' && (userRole === 'admin' || userRole === 'assistant') && (
    <CRMView 
        themeMode={themeMode} t={t} getRecalls={getRecalls} patientRecords={patientRecords}
        setActiveTab={setActiveTab} setSelectedPatientId={setSelectedPatientId}
        sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone}
    />
)}
      </main>
{/* --- MODAL DIENTE LATERAL --- */}
{modal === 'tooth' && (
    <ToothModal 
        themeMode={themeMode} t={t} toothModalData={toothModalData} 
        setToothModalData={setToothModalData} setModal={setModal} activeTab={activeTab}
        perioData={perioData} setPerioData={setPerioData} handlePerioChange={handlePerioChange} 
        calcNIC={calcNIC} isPerioVoiceActive={isPerioVoiceActive} startPerioDictation={startPerioDictation} 
        voiceFeedback={voiceFeedback} isListening={isListening} toggleVoice={toggleVoice} 
        catalog={catalog} getPatient={getPatient} selectedPatientId={selectedPatientId} 
        savePatientData={savePatientData} notify={notify} goToAdjacentTooth={goToAdjacentTooth}
    />
)}

{/* --- MODAL NUEVO TRABAJO DE LABORATORIO --- */}
      {modal === 'labWork' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-md space-y-4 relative p-6 rounded-3xl border shadow-2xl ${themeMode === 'light' ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                  <button onClick={()=>setModal(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"><X size={20}/></button>
                  <h3 className="text-xl font-bold flex items-center gap-2"><FlaskConical size={24} className="text-cyan-500"/> Enviar a Laboratorio</h3>
                  
                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Paciente</label>
                      <select 
                          className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500 text-black' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`}
                          value={newLabWork.patientId}
                          onChange={(e) => {
                              const p = Object.values(patientRecords).find(pat => pat.id === e.target.value);
                              if (p) setNewLabWork({...newLabWork, patientId: p.id, patientName: p.personal?.legalName || p.name});
                          }}
                      >
                          <option value="" className={themeMode === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'}>Selecciona un paciente...</option>
                          {Object.values(patientRecords).map(p => (
                              <option key={p.id} value={p.id} className={themeMode === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'}>
                                  {p.personal?.legalName || p.name}
                              </option>
                          ))}
                      </select>
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tipo de Trabajo</label>
                      <input type="text" placeholder="Ej: Corona de Porcelana, Placa..." className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.workType} onChange={e=>setNewLabWork({...newLabWork, workType:e.target.value})}/>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Diente (Opcional)</label>
                          <input type="text" placeholder="N°" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.tooth} onChange={e=>setNewLabWork({...newLabWork, tooth:e.target.value})}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Laboratorio</label>
                          <input type="text" placeholder="Nombre Lab" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.labName} onChange={e=>setNewLabWork({...newLabWork, labName:e.target.value})}/>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Fecha de Envío</label>
                          <input type="date" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.sendDate} onChange={e=>setNewLabWork({...newLabWork, sendDate:e.target.value})}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Entrega Esperada</label>
                          <input type="date" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.expectedDate} onChange={e=>setNewLabWork({...newLabWork, expectedDate:e.target.value})}/>
                      </div>
                  </div>

                  <button className="w-full mt-4 p-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold tracking-widest uppercase transition-colors shadow-lg shadow-cyan-500/30" onClick={async ()=>{
                      if(newLabWork.patientId && newLabWork.workType && newLabWork.expectedDate){
                          const id = newLabWork.id || Date.now().toString();
                          
                          // --- PASO 3 APLICADO AQUÍ ---
                          const data = { ...newLabWork, id, admin_email: clinicOwner };
                          
                          // GUARDA EN SUPABASE PRIMERO
                          const { error } = await supabase.from('lab_works').insert([data]);
                          
                          if (error) {
                              console.error("Error guardando en Supabase:", error);
                              alert("Hubo un error al guardar en la nube.");
                          } else {
                              // SI FUE EXITOSO, ACTUALIZA LA PANTALLA
                              setLabWorks([...labWorks, data]);
                              setModal(null);
                              if(typeof notify === 'function') notify("✅ Trabajo enviado y guardado en la nube");
                          }
                      } else {
                          alert("Por favor selecciona un paciente, el tipo de trabajo y la fecha de entrega.");
                      }
                  }}>GUARDAR Y ENVIAR</button>
              </div>
          </div>
      )}
      
{/* --- MODAL DE ABONOS --- */}
{modal === 'abono' && selectedFinancialRecord && (
    <AbonoModal 
        themeMode={themeMode} selectedFinancialRecord={selectedFinancialRecord} setModal={setModal}
        paymentInput={paymentInput} setPaymentInput={setPaymentInput} financialRecords={financialRecords}
        setFinancialRecords={setFinancialRecords} saveToSupabase={saveToSupabase} notify={notify}
    />
)}

      {/* MODAL INVENTARIO */}
      {modal === 'addItem' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <Card theme={themeMode} className="w-full max-w-sm space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl">{newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                      <button onClick={()=>{setModal(null); if(newItem.id) setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); }} className="opacity-50 hover:opacity-100 transition-opacity"><X/></button>
                  </div>
                  <InputField theme={themeMode} placeholder="Nombre (ej: Anestesia)" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/>
                  <div className="flex gap-2">
                      <InputField theme={themeMode} label="Stock" type="number" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:Number(e.target.value)})}/>
                      <InputField theme={themeMode} label="Mínimo" type="number" value={newItem.min} onChange={e=>setNewItem({...newItem, min:Number(e.target.value)})}/>
                  </div>
                  <div className="flex gap-2">
                      <Button theme={themeMode} className="flex-1" onClick={async()=>{ 
                          if(newItem.name){ 
                              const id = newItem.id || Date.now().toString(); 
                              const itemData = { ...newItem, id }; 
                              let updatedInventory; 
                              if (newItem.id) { updatedInventory = inventory.map(i => i.id === id ? itemData : i); } 
                              else { updatedInventory = [...inventory, itemData]; } 
                              setInventory(updatedInventory); 
                              await saveToSupabase('inventory', id, itemData); 
                              setModal(null); 
                              setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); 
                              notify("Guardado"); 
                          }
                      }}>GUARDAR</Button>
                      
                      {newItem.id && (
                          <button onClick={async()=>{ 
                              const filtered = inventory.filter(i=>i.id!==newItem.id); 
                              setInventory(filtered); 
                              await supabase.from('inventory').delete().eq('id', newItem.id); 
                              setModal(null); 
                              notify("Eliminado"); 
                          }} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl"><Trash2 size={20}/></button>
                      )}
                  </div>
              </Card>
          </div>
      )}

    {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA (FORZADO) */}
      {modal === 'recovery' && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-red-500/30 p-8 rounded-3xl w-full max-w-md text-white shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                  <h2 className="text-2xl font-black mb-2 text-amber-400">Actualiza tu Contraseña</h2>
                  <p className="text-slate-400 text-sm mb-6">Por seguridad, debes establecer una nueva contraseña para tu cuenta ahora mismo antes de continuar.</p>
                  
                  <input 
                      type="password" 
                      placeholder="Nueva contraseña (mín. 6 caracteres)" 
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 outline-none mb-6 font-bold"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                  />
                  
                  <button 
                      onClick={async () => {
                          if (newPasswordInput.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
                          
                          // Enviamos la nueva contraseña a Supabase
                          const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
                          
                          if (error) {
                              notify("Error al actualizar: " + error.message);
                          } else {
                              notify("¡Contraseña actualizada con éxito! Ya puedes usar el sistema.");
                              setModal(null);
                              setNewPasswordInput('');
                              window.location.hash = ''; // Limpiamos la URL
                          }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl transition-all shadow-lg active:scale-95"
                  >
                      GUARDAR NUEVA CONTRASEÑA
                  </button>
              </div>
          </div>
      )}

     {/* MODAL ARANCEL EXTERNO */}
      {modal === 'catalogItem' && (
          <CatalogModal 
              themeMode={themeMode} newCatalogItem={newCatalogItem} setNewCatalogItem={setNewCatalogItem} 
              catalog={catalog} setCatalog={setCatalog} setModal={setModal} 
              clinicOwner={clinicOwner} notify={notify} saveToSupabase={saveToSupabase} 
          />
      )}

{/* --- MODAL PERIODONTAL AVANZADO (CON GRÁFICO VISUAL EN TIEMPO REAL) --- */}
{modal === 'perio' && (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <Card theme={themeMode} className="w-full max-w-sm space-y-3 relative overflow-hidden border-t-2 border-t-cyan-500 p-5">
            
            {/* ENCABEZADO COMPACTO CON MOTOR DE VOZ */}
            <div className="flex justify-between items-center pb-2 border-b border-white/10 relative">
                <button onClick={() => goToAdjacentTooth(-1)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg transition-all"><ChevronLeft size={18} className="text-cyan-500"/></button>
                
                <div className="text-center leading-tight flex flex-col items-center">
                    <h3 className="font-black text-xl tracking-tighter text-cyan-500">{toothModalData.id}</h3>
                    {/* El Botón del Micrófono */}
                    <button 
                        onClick={startPerioDictation}
                        className={`mt-1 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg ${isPerioVoiceActive ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/30'}`}
                    >
                        {isPerioVoiceActive ? <MicOff size={10} /> : <Mic size={10} />}
                        {isPerioVoiceActive ? 'Escuchando...' : 'Dictar'}
                    </button>
                </div>

                <button onClick={() => goToAdjacentTooth(1)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg transition-all"><ChevronRight size={18} className="text-cyan-500"/></button>
            </div>

            {/* FEEDBACK DE VOZ (Muestra lo que la IA entendió) */}
            {voiceFeedback && (
                <div className="text-center text-[10px] font-bold text-yellow-400 bg-black/40 p-1.5 rounded-lg border border-yellow-500/30 mt-1 animate-in slide-in-from-top-2">
                    {voiceFeedback}
                </div>
            )}
            
            {/* GRÁFICO VISUAL EN TIEMPO REAL (EL "KILLER FEATURE") */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                    { title: 'Vestibular', keys: ['vd', 'v', 'vm'] },
                    { title: toothModalData.id < 30 ? 'Palatino' : 'Lingual', keys: ['ld', 'l', 'lm'] }
                ].map((graph, idx) => {
                    // Función para calcular la coordenada Y en el SVG (0mm = Y:30)
                    const getY = (val) => 30 + ((parseInt(val) || 0) * 5); 
                    
                    const mg0 = getY(perioData.mg?.[graph.keys[0]]);
                    const mg1 = getY(perioData.mg?.[graph.keys[1]]);
                    const mg2 = getY(perioData.mg?.[graph.keys[2]]);
                    
                    const pd0 = getY((parseInt(perioData.mg?.[graph.keys[0]]) || 0) + (parseInt(perioData.pd?.[graph.keys[0]]) || 0));
                    const pd1 = getY((parseInt(perioData.mg?.[graph.keys[1]]) || 0) + (parseInt(perioData.pd?.[graph.keys[1]]) || 0));
                    const pd2 = getY((parseInt(perioData.mg?.[graph.keys[2]]) || 0) + (parseInt(perioData.pd?.[graph.keys[2]]) || 0));

                    return (
                        <div key={idx} className="bg-black/20 rounded-xl border border-white/5 p-2 flex flex-col items-center">
                            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1">{graph.title}</span>
                            <svg viewBox="0 0 100 80" className="w-full h-16 drop-shadow-md">
                                {/* Fondo: Silueta abstracta de la raíz */}
                                <path d="M 10,25 Q 50,-5 90,25 L 85,75 Q 50,90 15,75 Z" fill={themeMode === 'light' ? '#e5e7eb' : '#374151'} opacity="0.4" />
                                
                                {/* Línea Cemento Esmalte (LCE) = Y:30 */}
                                <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="1" strokeDasharray="2" opacity="0.3" />
                                
                                {/* Zona de Bolsa Periodontal (Roja) */}
                                <polygon points={`15,${mg0} 50,${mg1} 85,${mg2} 85,${pd2} 50,${pd1} 15,${pd0}`} fill="#ef4444" fillOpacity="0.3" />
                                
                                {/* Línea del Margen Gingival (Azul) */}
                                <polyline points={`15,${mg0} 50,${mg1} 85,${mg2}`} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                
                                {/* Línea Base de la Bolsa (Roja Oscura) */}
                                <polyline points={`15,${pd0} 50,${pd1} 85,${pd2}`} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )
                })}
            </div>

            {/* TABLAS COMPACTAS (PD, MG, NIC) */}
            <div className="space-y-3 mt-2">
                {[
                    { faceName: 'Vestibular', keys: ['vd', 'v', 'vm'] },
                    { faceName: toothModalData.id < 30 ? 'Palatino' : 'Lingual', keys: ['ld', 'l', 'lm'] }
                ].map((faceData, faceIdx) => (
                    <div key={faceIdx} className="bg-black/20 p-2.5 rounded-xl border border-white/5 relative">
                        <div className="grid grid-cols-4 gap-1.5 mb-1">
                            <div></div>
                            <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Dist</span>
                            <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Cent</span>
                            <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Mesi</span>
                        </div>

                        <div className="space-y-1.5">
                            {/* PD Y BOP (DISEÑO ARREGLADO) */}
                            <div className="grid grid-cols-4 gap-1.5 items-start">
                                <span className="text-[9px] font-bold text-right pr-1 opacity-70 mt-2">Prof.</span>
                                {faceData.keys.map(k => {
                                    const pdValue = perioData.pd?.[k] || '';
                                    const isDanger = parseInt(pdValue) >= 4;
                                    const isBOP = perioData.bop?.[k];
                                    return (
                                        <div key={`pd-${k}`} className="flex flex-col gap-1">
                                            {/* Input de Profundidad */}
                                            <input className={`w-full h-7 rounded text-center text-xs font-black p-0 outline-none border transition-all ${t.inputBg} ${t.text} ${isDanger ? 'border-red-500 text-red-500 bg-red-500/10' : t.border} focus:border-cyan-400`} value={pdValue} onChange={e=>setPerioData({...perioData, pd: {...(perioData.pd || {}), [k]: e.target.value}})} />
                                            {/* Botón Explícito de Sangrado (BOP) */}
                                            <button 
                                                onClick={()=>setPerioData({...perioData, bop: {...(perioData.bop || {}), [k]: !isBOP}})} 
                                                className={`w-full py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all border ${isBOP ? 'bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-black/20 text-white/30 border-white/10 hover:bg-white/10'}`} 
                                                title="Sangrado (Bleeding on Probing)"
                                            >
                                                BOP
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 items-center mt-1">
                                <span className="text-[9px] font-bold text-right pr-1 opacity-70">Margen</span>
                                {faceData.keys.map(k => (
                                    <input key={`mg-${k}`} className={`w-full h-6 rounded text-center text-xs font-bold p-0 outline-none border transition-all ${t.inputBg} ${t.text} ${t.border} focus:border-blue-400 text-blue-400`} value={perioData.mg?.[k] || ''} onChange={e=>setPerioData({...perioData, mg: {...(perioData.mg || {}), [k]: e.target.value}})} />
                                ))}
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 items-center mt-1 pt-1 border-t border-white/5">
                                <span className="text-[9px] font-black text-right pr-1 text-cyan-600">NIC</span>
                                {faceData.keys.map(k => {
                                    const nic = calcNIC(perioData.pd?.[k], perioData.mg?.[k]);
                                    const isDangerNIC = parseInt(nic) >= 4;
                                    return (
                                        <div key={`nic-${k}`} className={`w-full h-6 flex items-center justify-center rounded text-xs font-black bg-black/20 ${nic === '-' ? 'opacity-30' : (isDangerNIC ? 'text-orange-500' : 'text-emerald-500')}`}>{nic}</div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* MOVILIDAD, FURCA Y PUS (UNA SOLA LÍNEA COMPACTA) */}
            <div className="grid grid-cols-3 gap-2 mt-2">
                <select className={`w-full p-2 rounded-lg text-center text-[9px] font-bold outline-none border transition-all ${t.inputBg} ${t.text} ${t.border} appearance-none cursor-pointer`} value={perioData.mobility || 0} onChange={e=>setPerioData({...perioData, mobility: parseInt(e.target.value)})}>
                    <option value={0}>Mov 0</option><option value={1}>Mov I</option><option value={2}>Mov II</option><option value={3}>Mov III</option>
                </select>
                <select className={`w-full p-2 rounded-lg text-center text-[9px] font-bold outline-none border transition-all ${t.inputBg} ${t.text} ${t.border} appearance-none cursor-pointer`} value={perioData.furcation || 0} onChange={e=>setPerioData({...perioData, furcation: parseInt(e.target.value)})}>
                    <option value={0}>Furca 0</option><option value={1}>Furca I</option><option value={2}>Furca II</option><option value={3}>Furca III</option>
                </select>
                <div onClick={()=>setPerioData({...perioData, pus: !perioData.pus})} className={`w-full flex items-center justify-center rounded-lg border text-center font-black text-[9px] cursor-pointer transition-all ${perioData.pus ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : `bg-transparent border-white/10 opacity-50`}`}>
                    {perioData.pus ? '🟡 PUS' : '⚪ PUS'}
                </div>
            </div>
            
            {/* BOTONES DE ACCIÓN */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => setModal(null)} className="w-full py-2 rounded-lg border border-white/10 text-[10px] font-black uppercase opacity-50 hover:opacity-100 transition-all">Cancelar</button>
                <button onClick={()=>{ 
                    const p = getPatient(selectedPatientId); 
                    const newPerio = { ...p.clinical.perio, [toothModalData.id]: perioData }; 
                    savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: newPerio }}); 
                    setModal(null); 
                    notify("Registro Guardado"); 
                }} className="w-full py-2 bg-cyan-500 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                    Guardar
                </button>
            </div>
        </Card>
    </div>
)}
{/* --- MODAL AGENDAR CITA --- */}
{modal === 'appt' && (
    <ApptModal 
        themeMode={themeMode} newAppt={newAppt} setNewAppt={setNewAppt} setModal={setModal}
        patientRecords={patientRecords} setPatientRecords={setPatientRecords} getPatient={getPatient}
        savePatientData={savePatientData} notify={notify} appointments={appointments}
        setAppointments={setAppointments} saveToSupabase={saveToSupabase} sendWhatsApp={sendWhatsApp}
        getPatientPhone={getPatientPhone}
    />
)}
      {/* --- MODAL CARGAR / ELIMINAR PACKS --- */}
      {modal === 'loadPack' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <Card  className="w-full max-w-sm h-96 flex flex-col">
              <h3 className="font-bold mb-4">Protocolos Guardados</h3>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {protocols.length === 0 && <p className="text-xs opacity-50 text-center mt-10">No hay packs creados.</p>}
                  {protocols.map(pr=>(
                      <div key={pr.id} className="p-4 bg-white/5 rounded-xl border border-transparent hover:border-cyan-500/50 flex justify-between items-center group transition-all">
                          <div className="cursor-pointer flex-1" onClick={()=>{setSessionData({...sessionData, treatmentName:pr.name, baseCost:pr.totalCost}); setModal(null); notify("Pack Cargado");}}>
                              <p className="font-bold text-sm">{pr.name}</p>
                              <p className="text-cyan-400 text-xs font-black">${pr.totalCost.toLocaleString()}</p>
                          </div>
                          {/* Botón de Eliminar Pack */}
                          <button onClick={async (e)=>{
                              e.stopPropagation(); 
                              setProtocols(protocols.filter(p=>p.id !== pr.id)); 
                              await supabase.from('packs').delete().eq('id', pr.id); 
                              notify("Pack Eliminado");
                          }} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all">
                              <Trash2 size={16}/>
                          </button>
                      </div>
                  ))}
              </div>
              <button onClick={()=>setModal(null)} className="mt-4 text-xs font-bold bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">Cerrar</button>
          </Card>
      </div>}
      
      {selectedImg && <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4" onClick={()=>setSelectedImg(null)}><img src={selectedImg} className="max-w-full max-h-[85%] rounded-xl shadow-2xl animate-in zoom-in"/><span className="mt-4 text-white font-bold opacity-50">CLICK PARA CERRAR</span></div>}
    </div>
  );
}