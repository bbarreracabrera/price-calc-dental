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
        })}</div>{patientTab === 'personal' && <Card theme={themeMode} className="space-y-4"><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Completo" value={getPatient(selectedPatientId).personal.legalName} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, legalName: e.target.value}})} /><InputField theme={themeMode} label="RUT / DNI" value={getPatient(selectedPatientId).personal?.rut || ''} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, rut: formatRUT(e.target.value)}})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Email" icon={Mail} value={getPatient(selectedPatientId).personal.email} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, email: e.target.value}})} /><div className="flex items-end gap-2"><InputField theme={themeMode} label="Teléfono" icon={Phone} value={getPatient(selectedPatientId).personal.phone} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, phone: e.target.value}})} />{getPatient(selectedPatientId).personal.phone && <button onClick={()=>sendWhatsApp(getPatient(selectedPatientId).personal.phone, "Hola, me comunico de ShiningCloud Dental.")} className="p-3 bg-emerald-500 rounded-xl text-white mb-[2px]"><MessageCircle size={18}/></button>}</div></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Fecha Nacimiento" type="date" value={getPatient(selectedPatientId).personal.birthDate} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, birthDate: e.target.value}})} /><InputField theme={themeMode} label="Ocupación" value={getPatient(selectedPatientId).personal.occupation} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, occupation: e.target.value}})} /></div><InputField theme={themeMode} label="Dirección" icon={MapPin} value={getPatient(selectedPatientId).personal.address} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, address: e.target.value}})} /><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Ciudad" value={getPatient(selectedPatientId).personal.city} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, city: e.target.value}})} /><InputField theme={themeMode} label="Comuna" value={getPatient(selectedPatientId).personal.commune} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, commune: e.target.value}})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Previsión" value={getPatient(selectedPatientId).personal.convention} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, convention: e.target.value}})} /><InputField theme={themeMode} label="Apoderado (Si aplica)" value={getPatient(selectedPatientId).personal.guardian} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, guardian: e.target.value}})} /></div></Card>}
                {patientTab === 'anamnesis' && (() => {
                    const p = getPatient(selectedPatientId);
                    
                    // Inicializadores seguros de borradores
                    const drafts = p.anamnesis?.drafts || { general: {}, cirugia: {}, endodoncia: {} };
                    const history = p.anamnesis?.history || [];
                    
                    const setDraft = (type, field, value) => {
                        savePatientData(selectedPatientId, { ...p, anamnesis: { ...p.anamnesis, drafts: { ...drafts, [type]: { ...drafts[type], [field]: value } } } });
                    };

                    const saveFinalForm = (type) => {
                        if (!window.confirm(`¿Guardar esta Ficha de ${type} como definitiva? No se podrá editar después.`)) return;
                        
                        const newForm = {
                            id: Date.now().toString(),
                            type: type,
                            date: new Date().toLocaleString(),
                            author: session?.user?.email,
                            data: { ...drafts[type] }
                        };
                        
                        // Guardamos en el historial y limpiamos el borrador
                        savePatientData(selectedPatientId, { 
                            ...p, 
                            anamnesis: { 
                                ...p.anamnesis, 
                                history: [newForm, ...history],
                                drafts: { ...drafts, [type]: {} } // Limpia el formulario
                            } 
                        });
                        notify(`Ficha de ${type} guardada en el historial`);
                        setViewingForm(newForm); // Lo abrimos en modo lectura
                    };

                    // Datos activos según si estamos viendo el historial o escribiendo un borrador
                    const activeData = viewingForm ? viewingForm.data : drafts[activeFormType];
                    const isReadOnly = viewingForm !== null;

                    return (
                        <div className="space-y-4 animate-in fade-in h-full flex flex-col">
                            
                            {/* CABECERA Y NAVEGACIÓN */}
                            <div className="flex justify-between items-center mb-2">
                                {isReadOnly ? (
                                    <div className="flex items-center gap-3">
                                        <button onClick={()=>setViewingForm(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"><ArrowLeft size={14} className="inline mr-1"/> Volver a Edición</button>
                                        <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">Ficha Histórica: {viewingForm.type}</span>
                                        <span className="text-[10px] opacity-50 bg-black/20 px-2 py-1 rounded border border-white/5">{viewingForm.date} • {viewingForm.author}</span>
                                    </div>
                                ) : (
                                    <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar w-full">
                                        <button onClick={()=>setActiveFormType('general')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='general'?t.accentBg:'opacity-50'}`}> Ficha General</button>
                                        <button onClick={()=>setActiveFormType('cirugia')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='cirugia'?'bg-red-500 text-white':'opacity-50'}`}> Cirugía</button>
                                        <button onClick={()=>setActiveFormType('endodoncia')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='endodoncia'?'bg-purple-500 text-white':'opacity-50'}`}> Endodoncia</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6">
                                {/* --- 1. FICHA GENERAL EXTENDIDA --- */}
                        {(isReadOnly ? viewingForm.type === 'general' : activeFormType === 'general') && (
                            <Card theme={themeMode} className="space-y-6 border-t-2 border-t-amber-500 animate-in slide-in-from-left">
                                <h3 className="font-black text-amber-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Anamnesis y Examen General</h3>
                                
                                {/* ALARMAS GLOBALES (Siempre editables, actualizan el Banner Rojo al instante) */}
                                {!isReadOnly && (
                                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl mb-4">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Alertas Médicas Globales</p>
                                        <div className="flex flex-wrap gap-2">
                                            {ANAMNESIS_TAGS.map(tag => {
                                                const isActive = getPatient(selectedPatientId).anamnesis?.conditions?.[tag];
                                                return (
                                                    <button key={tag} onClick={() => { 
                                                        const pat = getPatient(selectedPatientId); 
                                                        const newCond = { ...pat.anamnesis.conditions, [tag]: !isActive }; 
                                                        savePatientData(selectedPatientId, { ...pat, anamnesis: { ...pat.anamnesis, conditions: newCond } }); 
                                                    }} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${isActive ? 'bg-red-500 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-stone-400 hover:border-white/30'}`}>{tag}</button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">1. Motivo de Consulta</h4>
                                    <InputField theme={themeMode} textarea label="Motivo de Consulta (En palabras del paciente)" disabled={isReadOnly} value={activeData.motivo || ''} onChange={e=>setDraft('general', 'motivo', e.target.value)} />
                                    <InputField theme={themeMode} textarea label="Historia de la Enfermedad Actual" disabled={isReadOnly} value={activeData.enfermedadActual || ''} onChange={e=>setDraft('general', 'enfermedadActual', e.target.value)} />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">2. Antecedentes Remotos</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Antecedentes Médicos y Quirúrgicos" disabled={isReadOnly} value={activeData.medicos || ''} onChange={e=>setDraft('general', 'medicos', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Fármacos en Uso y Alergias Detalladas" disabled={isReadOnly} value={activeData.farmacosAlergias || ''} onChange={e=>setDraft('general', 'farmacosAlergias', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Hábitos (Tabaco, Alcohol, Bruxismo, etc.)" disabled={isReadOnly} value={activeData.habitos || ''} onChange={e=>setDraft('general', 'habitos', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Antecedentes Odontológicos (Traumas, Ortodoncia previa)" disabled={isReadOnly} value={activeData.odontologicos || ''} onChange={e=>setDraft('general', 'odontologicos', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">3. Examen Físico</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Examen Extraoral (ATM, Asimetrías, Ganglios)" disabled={isReadOnly} value={activeData.extraoral || ''} onChange={e=>setDraft('general', 'extraoral', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Examen Intraoral (Mucosas, Lengua, Piso de boca)" disabled={isReadOnly} value={activeData.intraoral || ''} onChange={e=>setDraft('general', 'intraoral', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Examen de Oclusión (Clase Angle, Overjet, Guías)" disabled={isReadOnly} value={activeData.oclusion || ''} onChange={e=>setDraft('general', 'oclusion', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Examen Periodontal Inicial (Biotipo, Higiene, Sangrado)" disabled={isReadOnly} value={activeData.periodonto || ''} onChange={e=>setDraft('general', 'periodonto', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-amber-500/20 pb-1">4. Conclusión</h4>
                                    <InputField theme={themeMode} textarea label="Diagnóstico Clínico Integral" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('general', 'diagnostico', e.target.value)} />
                                    <InputField theme={themeMode} textarea label="Plan de Tratamiento (Fases)" disabled={isReadOnly} value={activeData.plan || ''} onChange={e=>setDraft('general', 'plan', e.target.value)} />
                                </div>
                            </Card>
                        )}

                                {/* --- 2. FICHA PRE-QUIRÚRGICA --- */}
                                {(isReadOnly ? viewingForm.type === 'cirugia' : activeFormType === 'cirugia') && (
                                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-red-500">
                                        <h3 className="font-black text-red-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Protocolo Pre-Quirúrgico</h3>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">ASA</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.asa || ''} onChange={e=>setDraft('cirugia', 'asa', e.target.value)}>
                                                    <option value="">Seleccione...</option><option value="I">ASA I</option><option value="II">ASA II</option><option value="III">ASA III</option>
                                                </select>
                                            </div>
                                            <InputField theme={themeMode} label="Presión Art." placeholder="120/80" disabled={isReadOnly} value={activeData.pa || ''} onChange={e=>setDraft('cirugia', 'pa', e.target.value)} />
                                            <InputField theme={themeMode} label="Frec. Card." placeholder="Lpm" disabled={isReadOnly} value={activeData.fc || ''} onChange={e=>setDraft('cirugia', 'fc', e.target.value)} />
                                            <InputField theme={themeMode} label="HGT (Glicemia)" placeholder="mg/dl" disabled={isReadOnly} value={activeData.hgt || ''} onChange={e=>setDraft('cirugia', 'hgt', e.target.value)} />
                                        </div>

                                        <InputField theme={themeMode} textarea label="Sistemática Radiográfica" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('cirugia', 'rx', e.target.value)} />
                                        
                                        <div className="space-y-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                                            <InputField theme={themeMode} textarea label="Diagnóstico Quirúrgico" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('cirugia', 'diagnostico', e.target.value)} />
                                            <InputField theme={themeMode} textarea label="Paso a paso Quirúrgico (Técnica)" disabled={isReadOnly} value={activeData.tecnica || ''} onChange={e=>setDraft('cirugia', 'tecnica', e.target.value)} />
                                        </div>
                                    </Card>
                                )}

                                {/* --- 3. FICHA ENDODONCIA --- */}
                                {(isReadOnly ? viewingForm.type === 'endodoncia' : activeFormType === 'endodoncia') && (
                                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-purple-500">
                                        <h3 className="font-black text-purple-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Evaluación Endodóntica</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputField theme={themeMode} label="Diente a Tratar" type="number" placeholder="Ej: 36" disabled={isReadOnly} value={activeData.diente || ''} onChange={e=>setDraft('endodoncia', 'diente', e.target.value)} />
                                            <div className="md:col-span-2">
                                                <InputField theme={themeMode} label="Semiología del Dolor" placeholder="Localización, cronología, alivio..." disabled={isReadOnly} value={activeData.dolor || ''} onChange={e=>setDraft('endodoncia', 'dolor', e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Pruebas Sensibilidad (Frío)</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.frio || ''} onChange={e=>setDraft('endodoncia', 'frio', e.target.value)}>
                                                    <option value="">Seleccione...</option><option value="Normal">Normal</option><option value="Aumentada (+)">Aumentada (+)</option><option value="Disminuida (-)">Disminuida (-)</option><option value="Sin Respuesta">Sin Respuesta</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Percusión / Palpación</label>
                                                <input className={`w-full p-3 rounded-xl border text-sm font-bold outline-none ${t.inputBg} ${t.text} ${t.border}`} placeholder="Vertical (+), Horizontal (-)..." disabled={isReadOnly} value={activeData.percusion || ''} onChange={e=>setDraft('endodoncia', 'percusion', e.target.value)} />
                                            </div>
                                        </div>

                                        <InputField theme={themeMode} textarea label="Examen Radiográfico (Raíces, conductos, zona apical)" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('endodoncia', 'rx', e.target.value)} />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Diagnóstico Pulpar</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.dxPulpar || ''} onChange={e=>setDraft('endodoncia', 'dxPulpar', e.target.value)}>
                                                    <option value="">Seleccione...</option>
                                                    <option value="Pulpa Normal">Pulpa Normal</option>
                                                    <option value="Pulpitis Reversible">Pulpitis Reversible</option>
                                                    <option value="Pulpitis Irreversible Sintomática">Pulpitis Irreversible Sintomática</option>
                                                    <option value="Pulpitis Irreversible Asintomática">Pulpitis Irreversible Asintomática</option>
                                                    <option value="Necrosis Pulpar">Necrosis Pulpar</option>
                                                    <option value="Diente Previamente Tratado">Diente Previamente Tratado</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Diagnóstico Periapical</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.dxPeriapical || ''} onChange={e=>setDraft('endodoncia', 'dxPeriapical', e.target.value)}>
                                                    <option value="">Seleccione...</option>
                                                    <option value="Tejido Apical Normal">Tejido Apical Normal</option>
                                                    <option value="Periodontitis Apical Sintomática">Periodontitis Apical Sintomática</option>
                                                    <option value="Periodontitis Apical Asintomática">Periodontitis Apical Asintomática</option>
                                                    <option value="Absceso Apical Agudo">Absceso Apical Agudo</option>
                                                    <option value="Absceso Apical Crónico">Absceso Apical Crónico</option>
                                                </select>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* BOTÓN DE GUARDADO (SOLO EN MODO BORRADOR) */}
                                {!isReadOnly && (
                                    <button onClick={() => saveFinalForm(activeFormType)} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30">
                                        💾 GUARDAR FICHA DEFINITIVA
                                    </button>
                                )}

                                {/* LISTA DE FICHAS HISTÓRICAS DE ESTE PACIENTE */}
                                {!isReadOnly && (
                                    <div className="pt-6 border-t border-white/10 mt-6">
                                        <h4 className="font-bold text-sm mb-3">Historial de Fichas Guardadas</h4>
                                        {history.length === 0 ? (
                                            <p className="text-xs opacity-50 text-center py-4 border border-dashed border-white/10 rounded-xl">No hay fichas históricas guardadas.</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {history.map(form => (
                                                    <div key={form.id} onClick={() => setViewingForm(form)} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${form.type==='general'?'bg-amber-500/20 text-amber-500':form.type==='cirugia'?'bg-red-500/20 text-red-500':'bg-purple-500/20 text-purple-500'}`}>
                                                                <FileText size={16}/>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm capitalize">Ficha {form.type}</p>
                                                                <p className="text-[10px] opacity-50">{form.date}</p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"/>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}        
                      
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
                {/* V76: EVOLUTION TAB - SECURE (READ ONLY HISTORY) */}
                {patientTab === 'evolution' && <div className="space-y-2">
                    <div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>
                        <textarea rows="3" placeholder="Escribir nueva evolución (No editable después de guardar)..." className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`} value={newEvolution} onChange={e=>setNewEvolution(e.target.value)} />
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={toggleVoice} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'text-stone-400 hover:text-cyan-400'}`}>
                                {isListening ? <MicOff size={18}/> : <Mic size={18}/>}
                            </button>
                        </div>
                    </div>
                    {voiceStatus && <p className="text-[10px] text-right opacity-60 animate-pulse font-bold">{voiceStatus}</p>}
                    <Button theme={themeMode} className="w-full" onClick={()=>{ 
                        if (!newEvolution.trim()) return;
                        const p=getPatient(selectedPatientId); 
                        // V76: Integridad - Nueva evolución se añade al principio, nunca se reemplaza el array
                        const n={id:Date.now(), text:newEvolution, date:new Date().toLocaleString(), author: session.user.email}; 
                        savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, evolution: [n, ...(p.clinical.evolution||[])]}}); 
                        setNewEvolution(''); 
                        logAction('ADD_EVOLUTION', { text_preview: newEvolution.substring(0,20) }, selectedPatientId);
                    }}>GUARDAR Y BLOQUEAR</Button>
                    
                    <div className="space-y-2 mt-4">
                        {getPatient(selectedPatientId).clinical.evolution?.map(ev=>(
                            <div key={ev.id} className={`p-4 rounded-xl border border-white/5 relative ${t.card}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileLock size={14} className="text-emerald-500"/>
                                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{ev.date}</span>
                                    </div>
                                    <span className="text-[9px] opacity-30">{ev.author}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{ev.text}</p>
                            </div>
                        ))}
                    </div>
                </div>}

                {patientTab === 'consent' && <div className="space-y-4">{modal === 'sign' ? (<Card theme={themeMode} className="space-y-4"><h3 className="font-bold">{CONSENT_TEMPLATES[consentTemplate].title}</h3><textarea className="w-full h-48 bg-black/20 p-4 rounded-xl text-sm leading-relaxed outline-none border border-white/10 focus:border-emerald-500 transition-colors resize-none text-white" value={consentText} onChange={(e)=>setConsentText(e.target.value)} /><SignaturePad theme={themeMode} onSave={(sig)=>{ const p=getPatient(selectedPatientId); savePatientData(selectedPatientId, {...p, consents:[{id:Date.now(), type:CONSENT_TEMPLATES[consentTemplate].title, text:consentText, signature:sig}, ...(p.consents||[])]}); setModal(null); }} onCancel={()=>setModal(null)}/></Card>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Object.entries(CONSENT_TEMPLATES).map(([key, tpl]) => (<Card key={key} onClick={()=>{setConsentTemplate(key); setConsentText(tpl.text); setModal('sign');}} theme={themeMode} className="cursor-pointer hover:border-emerald-500 hover:scale-[1.02] transition-transform"><FileSignature className="text-emerald-500 mb-2"/><span className="font-bold text-sm block">{tpl.title}</span></Card>))}</div>)}<h3 className="font-bold pt-4 border-t border-white/10 mt-4">Historial</h3><div className="space-y-2">{(getPatient(selectedPatientId).consents || []).map(c => (<Card key={c.id} theme={themeMode} className="flex justify-between items-center py-3"><div><p className="font-bold text-sm">{c.type}</p><p className="text-[10px] opacity-50">{c.date}</p></div><div className="flex items-center gap-3"><div className="bg-white p-1 rounded"><img src={c.signature} className="h-8 object-contain" alt="Firma"/></div><button onClick={()=>generatePDF('consent', c)} className={`p-2 rounded-xl ${t.inputBg} hover:opacity-80`}><Printer size={16}/></button></div></Card>))}</div></div>}
                {patientTab === 'images' && (
          <div className="space-y-6 animate-in fade-in h-full flex flex-col">
              
              {/* --- 1. LAS PESTAÑAS DE LAS CARPETAS --- */}
              <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                  {['Radiografías', 'Fotos Clínicas', 'Documentos', 'Otros'].map(folder => (
                      <button 
                          key={folder}
                          onClick={() => setActiveFolder(folder)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${t.border} ${activeFolder === folder ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' : 'opacity-50 hover:opacity-100'}`}
                      >
                          {folder === 'Radiografías' ? '🦴 ' : folder === 'Fotos Clínicas' ? '📸 ' : folder === 'Documentos' ? '📄 ' : '📁 '}
                          {folder}
                      </button>
                  ))}
              </div>

              {/* --- 2. ZONA DE SUBIDA (Te avisa a qué carpeta va) --- */}
              <div className={`flex items-center justify-center border-2 border-dashed ${t.border} rounded-3xl p-8 relative group hover:opacity-70 transition-colors cursor-pointer ${t.cardBg}`}>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*,application/pdf" onChange={handleImageUpload} disabled={uploading}/>
                  {uploading ? (
                      <Loader className="animate-spin text-cyan-400" size={30}/> 
                  ) : (
                      <div className="text-center">
                          <Upload className="mx-auto mb-2 opacity-30"/>
                          <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                              Subir archivo a <span className="text-cyan-500">{activeFolder}</span>
                          </span>
                      </div>
                  )}
              </div>

              {/* --- 3. LA CUADRÍCULA DE FOTOS (Filtrada por la carpeta activa) --- */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getPatient(selectedPatientId).images?.filter(img => (img.folder || 'Otros') === activeFolder).length === 0 ? (
                          <div className="col-span-full py-10 text-center opacity-30 text-sm font-bold">
                              No hay archivos en la carpeta {activeFolder}
                          </div>
                      ) : (
                          getPatient(selectedPatientId).images?.filter(img => (img.folder || 'Otros') === activeFolder).map(img => (
                              <div key={img.id} className={`relative group rounded-2xl overflow-hidden aspect-square border ${t.border} bg-black/5 dark:bg-white/5`}>
                                  
                                  {/* AQUI LLAMAMOS A NUESTRO COMPONENTE DE SEGURIDAD */}
                                  <PrivateImage img={img} onClick={setSelectedImg} />
                                  
                                  <button onClick={async()=>{ 
                                      if(window.confirm("¿Seguro que deseas eliminar este archivo?")) {
                                          const p = getPatient(selectedPatientId); 
                                          const f = p.images.filter(i => i.id !== img.id); 
                                          await savePatientData(selectedPatientId, {...p, images:f}); 
                                          
                                          // Limpiamos el archivo real de Supabase para no ocupar espacio "basura"
                                          const filePath = img.path || img.url;
                                          if (filePath && !filePath.startsWith('http')) {
                                              await supabase.storage.from('patient-images').remove([filePath]);
                                          }
                                          
                                          notify("Eliminado"); 
                                      }
                                  }} className="absolute top-2 right-2 p-2 bg-red-500 shadow-lg rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                      <Trash2 size={14}/>
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
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
{/* --- MODAL DIENTE LATERAL (CORREGIDO, UNIFICADO Y CON PERIO) --- */}
{modal === 'tooth' && (
    <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Fondo sutil */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setModal(null)} />

        <Card theme={themeMode} className="w-full max-w-sm h-full relative z-10 shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 rounded-none">
            
            {/* ENCABEZADO CON NAVEGACIÓN RÁPIDA (NUEVO) */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => goToAdjacentTooth(-1)} className="p-1.5 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-lg transition-all"><ChevronLeft size={20} /></button>
                    <h3 className="text-2xl font-black italic tracking-tighter w-20 text-center text-cyan-500">{toothModalData.id}</h3>
                    <button onClick={() => goToAdjacentTooth(1)} className="p-1.5 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-lg transition-all"><ChevronRight size={20} /></button>
                </div>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* --- SECCIÓN: PERIODONTOGRAMA TIPO DENTALINK (SOLO EN MODO PERIO) --- */}
                {activeTab === 'perio' && (
                    <div className="p-4 border border-white/10 rounded-3xl bg-black/5 dark:bg-white/5 shadow-inner animate-in fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                            <h3 className="text-sm font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                                📏 Periodontograma
                            </h3>
                        </div>

                        {/* TABLAS VESTIBULAR Y LINGUAL/PALATINO */}
                        {['v', 'l'].map(face => (
                            <div key={face} className="mb-5 bg-white/5 p-3 rounded-2xl border border-white/5 relative mt-4">
                                <h4 className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-2 text-center absolute -top-3 left-1/2 -translate-x-1/2 bg-[#121212] px-3 py-0.5 rounded-full border border-white/10">
                                    {face === 'v' ? 'Vestibular' : (parseInt(toothModalData.id) > 30 ? 'Lingual' : 'Palatino')}
                                </h4>
                                
                                <div className="grid grid-cols-4 gap-1 mb-1 mt-2">
                                    <div></div>
                                    <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Dist</span>
                                    <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Cent</span>
                                    <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Mesi</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-4 gap-1 items-center">
                                        <span className="text-[9px] font-bold text-right pr-1 opacity-70">Prof.</span>
                                        {[0, 1, 2].map(idx => (
                                            <input key={`pd-${face}-${idx}`} type="text" value={toothModalData.perio?.[`pd_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'pd', idx, e.target.value)} className={`w-full h-8 text-center text-xs font-bold rounded-lg bg-black/20 border outline-none ${toothModalData.perio?.[`pd_${face}`]?.[idx] >= 4 ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-white/10 focus:border-cyan-500'}`} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 items-center">
                                        <span className="text-[9px] font-bold text-right pr-1 opacity-70">Margen</span>
                                        {[0, 1, 2].map(idx => (
                                            <input key={`mg-${face}-${idx}`} type="text" value={toothModalData.perio?.[`mg_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'mg', idx, e.target.value)} className="w-full h-8 text-center text-xs font-bold rounded-lg bg-black/20 border border-white/10 focus:border-blue-400 outline-none text-blue-400" />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 items-center mt-2 pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-black text-right pr-1 text-cyan-600">NIC</span>
                                        {[0, 1, 2].map(idx => {
                                            const nic = calcNIC(toothModalData.perio?.[`pd_${face}`]?.[idx], toothModalData.perio?.[`mg_${face}`]?.[idx]);
                                            return (
                                                <div key={`nic-${face}-${idx}`} className={`w-full h-7 flex items-center justify-center text-xs font-black rounded-lg bg-black/10 ${nic >= 4 || nic === '-' ? 'text-orange-500' : 'text-emerald-500'}`}>{nic}</div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* ALERTAS PERIO */}
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            <button onClick={() => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, bop: !prev.perio?.bop } }))} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${toothModalData.perio?.bop ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-transparent border-white/10 opacity-50'}`}>🩸 BOP</button>
                            <button onClick={() => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, pus: !prev.perio?.pus } }))} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${toothModalData.perio?.pus ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-transparent border-white/10 opacity-50'}`}>🟡 PUS</button>
                            <select className="p-2 rounded-xl bg-transparent border border-white/10 text-[10px] font-black outline-none text-center appearance-none" value={toothModalData.perio?.mobility || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, mobility: parseInt(e.target.value) } }))}><option value={0} className="bg-[#121212]">Mov 0</option><option value={1} className="bg-[#121212]">Mov I</option><option value={2} className="bg-[#121212]">Mov II</option><option value={3} className="bg-[#121212]">Mov III</option></select>
                            <select className="p-2 rounded-xl bg-transparent border border-white/10 text-[10px] font-black outline-none text-center appearance-none" value={toothModalData.perio?.furcation || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, furcation: parseInt(e.target.value) } }))}><option value={0} className="bg-[#121212]">Furca 0</option><option value={1} className="bg-[#121212]">Furca I</option><option value={2} className="bg-[#121212]">Furca II</option><option value={3} className="bg-[#121212]">Furca III</option></select>
                        </div>
                    </div>
                )}

                {/* Selector de Modo (Hallazgos vs Tratamientos) */}
                <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                    <button onClick={() => setToothModalData({...toothModalData, mode: 'hallazgos'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${toothModalData.mode === 'hallazgos' ? 'bg-white dark:bg-white/10 shadow-sm text-cyan-500' : 'opacity-50'}`}>Hallazgos</button>
                    <button onClick={() => setToothModalData({...toothModalData, mode: 'tratamientos'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${toothModalData.mode === 'tratamientos' ? 'bg-white dark:bg-white/10 shadow-sm text-cyan-500' : 'opacity-50'}`}>Tratamientos</button>
                </div>

                {toothModalData.mode === 'hallazgos' ? (
                    /* --- MODO HALLAZGOS --- */
                    <div className="space-y-6 animate-in fade-in">
                        <div className={`flex flex-col items-center p-6 rounded-3xl border transition-colors ${t.border} bg-black/5 dark:bg-white/5 shadow-inner`}>
                            <ToothSVG number={toothModalData.id} faces={toothModalData.faces} status={toothModalData.status} size={100} interactive={true} activeFace={toothModalData.activeFace || 'o'} onFaceClick={(face) => setToothModalData({...toothModalData, activeFace: face})} />
                            <p className="text-[10px] font-black opacity-50 mt-4 uppercase tracking-[0.2em]">
                                Cara: <span className="text-cyan-500">{toothModalData.activeFace === 'v' ? 'Vestibular' : toothModalData.activeFace === 'l' ? 'Lingual/Palatino' : toothModalData.activeFace === 'm' ? 'Mesial' : toothModalData.activeFace === 'd' ? 'Distal' : 'Oclusal'}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">En Cara</span>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'caries'}, status: null})} className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-2xl text-[11px] font-black transition-all">🔴 CARIES</button>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'filled'}, status: null})} className="w-full p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-2xl text-[11px] font-black transition-all">🔵 RESINA</button>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: null}})} className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black transition-all opacity-70 hover:opacity-100">⚪ LIMPIAR CARA</button>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">En Pieza</span>
                                <button onClick={() => setToothModalData({...toothModalData, status: 'crown'})} className="w-full p-3 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-black border border-yellow-500/20 rounded-2xl text-[11px] font-black transition-all">🟡 CORONA</button>
                                <button onClick={() => setToothModalData({...toothModalData, status: 'missing'})} className="w-full p-3 bg-stone-500/10 text-stone-500 hover:bg-stone-500 hover:text-white border border-stone-500/20 rounded-2xl text-[11px] font-black transition-all">❌ AUSENTE</button>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {v:null,l:null,m:null,d:null,o:null}, status:null})} className="w-full p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-2xl text-[11px] font-black transition-all">✅ DIENTE SANO</button>
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40">Evolución Clínica</label>
                            <div className="relative group">
                                <textarea rows="4" placeholder="Dicta hallazgos..." className={`w-full p-5 rounded-3xl border ${t.border} ${t.inputBg} outline-none focus:border-cyan-500 font-bold text-sm resize-none transition-all shadow-inner`} value={toothModalData.notes || ''} onChange={e => setToothModalData({...toothModalData, notes: e.target.value})} />
                                <button onClick={() => toggleVoice()} className={`absolute bottom-4 right-4 p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse text-white scale-110' : 'bg-cyan-500 text-white shadow-cyan-500/20'}`}>
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- MODO TRATAMIENTOS --- */
                    <div className="space-y-6 animate-in fade-in">
                        <div className="w-full">
                            <label className="text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 text-stone-400">Tratamiento Planificado</label>
                            <input list="catalog-tooth-options" className={`w-full outline-none font-bold text-sm p-4 rounded-2xl border ${t.border} ${t.inputBg} focus:border-cyan-400 transition-all shadow-inner`} placeholder="Busca en tu arancel..." value={toothModalData.treatment?.name || ''} onChange={e => setToothModalData({...toothModalData, treatment: {...(toothModalData.treatment || {}), name: e.target.value, status: toothModalData.treatment?.status || 'planned'}})} />
                            <datalist id="catalog-tooth-options">{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'planned'}})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${toothModalData.treatment?.status === 'planned' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'border-white/10 opacity-50'}`}>Por Hacer</button>
                            <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'completed'}})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${toothModalData.treatment?.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-white/10 opacity-50'}`}>Realizado</button>
                        </div>
                        <button onClick={() => setToothModalData({...toothModalData, treatment: null})} className="w-full p-2 text-[10px] font-bold text-red-400 opacity-50 hover:opacity-100 uppercase tracking-widest transition-opacity">Eliminar Tratamiento</button>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-white/5 bg-black/5">
                <button 
                    onClick={() => {
                        const p = getPatient(selectedPatientId); 
                        const ut = {...p.clinical.teeth, [toothModalData.id]: {
                            status: toothModalData.status, 
                            faces: toothModalData.faces, 
                            notes: toothModalData.notes, 
                            treatment: toothModalData.treatment,
                            perio: toothModalData.perio // <-- ¡ESTO FALTABA PARA GUARDAR EL SONDAJE!
                        }}; 
                        savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, teeth: ut}}); 
                        setModal(null); 
                        notify("Diente Guardado con éxito");
                    }}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 transition-all shadow-xl active:scale-95"
                >
                    GUARDAR DATOS
                </button>
            </div>
        </Card>
    </div>
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

      {/* MODAL DE ABONOS */}
      {modal === 'abono' && selectedFinancialRecord && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
              <Card  className="w-full max-w-md space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <div><h3 className="text-xl font-bold">{selectedFinancialRecord.patientName}</h3><p className="text-xs opacity-50">{selectedFinancialRecord.date}</p></div>
                      <button onClick={()=>setModal(null)}><X/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 bg-white/5 rounded-xl"><p className="text-[10px] uppercase opacity-50">Total</p><p className="font-bold">${(selectedFinancialRecord.total||0).toLocaleString()}</p></div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl"><p className="text-[10px] uppercase text-emerald-500">Pagado</p><p className="font-bold text-emerald-400">${((selectedFinancialRecord.payments||[]).reduce((s,p)=>s+p.amount,0) + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0)).toLocaleString()}</p></div>
                      <div className="p-3 bg-red-500/10 rounded-xl"><p className="text-[10px] uppercase text-red-500">Deuda</p><p className="font-bold text-red-400">${((selectedFinancialRecord.total||0) - ((selectedFinancialRecord.payments||[]).reduce((s,p)=>s+p.amount,0) + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0))).toLocaleString()}</p></div>
                  </div>
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl">
                      <h4 className="font-bold text-sm">Registrar Nuevo Abono</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <InputField  type="number" placeholder="$ Monto" value={paymentInput.amount} onChange={e=>setPaymentInput({...paymentInput, amount:e.target.value})} />
                          <select className="bg-[#121212] border border-white/10 rounded-xl px-2 p-3 text-xs font-bold outline-none text-white" value={paymentInput.method} onChange={e=>setPaymentInput({...paymentInput, method:e.target.value})}>
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Tarjeta">Tarjeta</option>
                          </select>
                          <InputField  placeholder="N° Boleta (Opc.)" value={paymentInput.receiptNumber} onChange={e=>setPaymentInput({...paymentInput, receiptNumber:e.target.value})} />
                      </div>
                      <Button  className="w-full" onClick={async ()=>{
                          if(!paymentInput.amount) return;
                          const newPayment = { amount: Number(paymentInput.amount), method: paymentInput.method, date: new Date().toLocaleDateString(), receiptNumber: paymentInput.receiptNumber };
                          const currentPayments = selectedFinancialRecord.payments || [];
                          if (!selectedFinancialRecord.payments && selectedFinancialRecord.paid > 0) {
                              currentPayments.push({ amount: selectedFinancialRecord.paid, method: 'Histórico', date: selectedFinancialRecord.date });
                          }
                          const updatedPayments = [...currentPayments, newPayment];
                          const newTotalPaid = updatedPayments.reduce((s,p)=>s+p.amount, 0);
                          const nr = {...selectedFinancialRecord, paid: newTotalPaid, payments: updatedPayments}; 
                          setFinancialRecords(prev => prev.map(h => h.id === nr.id ? nr : h));
                          await saveToSupabase('financials', nr.id, nr); 
                          setModal(null); setPaymentInput({amount:'', method:'Efectivo', date: getLocalDate(), receiptNumber: ''}); notify("Abono Registrado");
                      }}>CONFIRMAR PAGO</Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                      <p className="text-[10px] font-bold opacity-50 uppercase">Historial de Pagos</p>
                      {(selectedFinancialRecord.payments || []).length > 0 ? (selectedFinancialRecord.payments.map((p, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                              <div className="flex gap-2 items-center">
                                  <span className="opacity-50">{p.date}</span> 
                                  <span className="font-bold">{p.method}</span>
                                  {p.receiptNumber && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-stone-300 font-mono tracking-wider border border-white/10">Bol: {p.receiptNumber}</span>}
                              </div>
                              <span className="font-bold text-emerald-400">+${p.amount.toLocaleString()}</span>
                          </div>
                      ))) : <p className="text-xs opacity-30 text-center">Sin abonos registrados.</p>}
                  </div>
              </Card>
          </div>
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
      {/* --- MODAL AGENDAR CITA ACTUALIZADO --- */}
{modal === 'appt' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
    <Card  className="w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl">{newAppt.id ? 'Editar Cita' : 'Agendar Cita'}</h3>
            <button onClick={()=>setModal(null)} className="opacity-50 hover:opacity-100"><X size={20}/></button>
        </div>
       {!newAppt.id && <PatientSelect patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
            if (p.id === 'new') {
                const newId = "pac_" + Date.now().toString();
                const nombreReal = p.name;
                const newPatient = getPatient(newId);
                newPatient.id = newId;
                newPatient.name = nombreReal;
                if (!newPatient.personal) newPatient.personal = {};
                newPatient.personal.legalName = nombreReal;
                
                savePatientData(newId, newPatient);
                setNewAppt({...newAppt, name: nombreReal});
                notify("Paciente Creado Exitosamente");
            } else {
                // 👇 MAGIA INYECTADA AQUÍ 👇
                setPatientRecords(prev => ({...prev, [p.id]: p}));
                
                setNewAppt({...newAppt, name: p.personal?.legalName || p.name});
            }
        }} />}
        
        {newAppt.id && <p className="font-bold text-lg text-cyan-400">{newAppt.name}</p>}
        
        <InputField  label="Tratamiento" value={newAppt.treatment} onChange={e=>setNewAppt({...newAppt, treatment:e.target.value})}/>
        
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Fecha y Hora</label>
                <input type="date" className="w-full bg-white/5 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/>
                <input type="time" className="w-full bg-white/5 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Detalles</label>
                <select className="w-full bg-[#121212] border border-white/10 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.duration} onChange={e=>setNewAppt({...newAppt, duration: Number(e.target.value)})}>
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 Hora</option>
                    <option value={90}>1.5 Horas</option>
                    <option value={120}>2 Horas</option>
                </select>
                <select className={`w-full border border-white/10 p-3 rounded-xl text-white outline-none text-xs font-bold bg-[#121212] ${newAppt.status==='agendado'?'text-stone-400':newAppt.status==='confirmado'?'text-emerald-400':newAppt.status==='espera'?'text-yellow-400':newAppt.status==='atendiendo'?'text-blue-400':'text-red-400'}`} value={newAppt.status} onChange={e=>setNewAppt({...newAppt, status:e.target.value})}>
                    <option value="agendado">⚪ Por Confirmar</option>
                    <option value="confirmado">🟢 Confirmado</option>
                    <option value="espera">🟡 En Sala Espera</option>
                    <option value="atendiendo">🔵 En Box (Atendiendo)</option>
                    <option value="no_asistio">🔴 No Asistió</option>
                </select>
            </div>
        </div>

        <div className="flex gap-2 pt-2">
            {newAppt.id && (
                <button onClick={async (e) => {
    e.stopPropagation(); 
    try {
        const { error } = await supabase.from('appointments').delete().eq('id', newAppt.id);
        if (error) throw error;
        setAppointments(appointments.filter(a => a.id !== newAppt.id)); 
        setModal(null); 
        notify("Cita Eliminada");
    } catch (err) {
        alert("Error al eliminar la cita. Revisa tu conexión.");
    }
}} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl">
    <Trash2 size={20}/>
</button>
            )}
            <Button  className="flex-1" onClick={async ()=>{ 
                if(newAppt.name){ 
                    const id = newAppt.id || Date.now().toString(); 
                    const nd = {...newAppt, id}; 
                    if (newAppt.id) {
                        setAppointments(appointments.map(a => a.id === id ? nd : a));
                    } else {
                        setAppointments([...appointments, nd]); 
                    }
                    await saveToSupabase('appointments', id, nd); 
                    setModal(null); 
                    notify(newAppt.id ? "Cita Actualizada" : "Cita Agendada"); 
                }
            }}>{newAppt.id ? 'ACTUALIZAR' : 'AGENDAR'}</Button>
        </div>
        
        {/* Atajo de WhatsApp para confirmar rápido */}
        {newAppt.id && (
            <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(newAppt.name), `Hola ${newAppt.name}, le escribimos de ShiningCloud Dental para confirmar su cita para el ${newAppt.date.split('-').reverse().join('/')} a las ${newAppt.time}. ¿Nos confirma su asistencia?`); }} className="w-full flex items-center justify-center gap-2 text-[10px] bg-white/5 py-2 rounded-xl hover:bg-white/10 text-stone-400 transition-colors uppercase font-bold tracking-widest mt-2">
                <MessageCircle size={14} className="text-emerald-400"/> Enviar WhatsApp de Confirmación
            </button>
        )}
    </Card>
</div>}
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