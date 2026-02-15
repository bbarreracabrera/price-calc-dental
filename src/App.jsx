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
  ChevronLeft, ChevronRight, Users, Clock, DollarSign, PenTool, FileSignature, Edit3, Loader, TrendingDown, CreditCard, Banknote, Box, Minus, AlertTriangle, Shield, Mic, MicOff, MessageCircle
} from 'lucide-react';
import { supabase } from './supabase';

// --- CONFIGURACIÓN BASE ---
const CONSENT_TEMPLATES = {
  general: { title: "Consentimiento General", text: "Autorizo al Dr/a. a realizar los exámenes y tratamientos dentales necesarios. Entiendo que la odontología no es una ciencia exacta y que no se pueden garantizar resultados. Me comprometo a seguir las indicaciones y asistir a mis citas." },
  exodoncia: { title: "Consentimiento Exodoncia", text: "Doy mi consentimiento para la extracción del diente indicado. He sido informado de los riesgos (dolor, infección, inflamación, parestesia) y beneficios. Autorizo el uso de anestesia local y acepto las instrucciones post-operatorias." },
  endo: { title: "Consentimiento Endodoncia", text: "Entiendo que el tratamiento de conducto busca salvar el diente, pero puede fallar, requerir retratamiento o cirugía. Conozco los riesgos de fractura instrumental o perforación. Acepto el procedimiento." }
};

const THEMES = {
  dark: { bg: 'bg-[#050505]', text: 'text-white', card: 'bg-[#121212]/90 border border-white/10 shadow-2xl', accent: 'text-[#D4AF37]', accentBg: 'bg-[#D4AF37]', inputBg: 'bg-white/5 border-white/5 focus-within:border-[#D4AF37]', subText: 'text-stone-400', gradient: 'bg-gradient-to-br from-[#D4AF37] to-[#B69121]', buttonSecondary: 'bg-white/5 border-white/10 text-white' },
  light: { bg: 'bg-[#FAFAFA]', text: 'text-stone-800', card: 'bg-white border-stone-200 shadow-xl', accent: 'text-amber-600', accentBg: 'bg-amber-500', inputBg: 'bg-stone-100 focus-within:bg-white focus-within:border-amber-500', subText: 'text-stone-500', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', buttonSecondary: 'bg-stone-100 border-stone-200 text-stone-600' },
  blue: { bg: 'bg-[#0a192f]', text: 'text-white', card: 'bg-[#112240]/90 border-cyan-500/20 shadow-cyan-900/20 shadow-2xl', accent: 'text-cyan-400', accentBg: 'bg-cyan-500', inputBg: 'bg-[#1d2d50] border-transparent focus-within:border-cyan-400', subText: 'text-slate-400', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-600', buttonSecondary: 'bg-white/5 border-white/10 text-cyan-400' }
};

// --- COMPONENTES UI ---
const SignaturePad = ({ onSave, onCancel, theme }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  useEffect(() => { 
    const canvas = canvasRef.current; 
    if (canvas) { 
      canvas.width = canvas.offsetWidth; 
      canvas.height = canvas.offsetHeight; 
      const ctx = canvas.getContext('2d'); 
      ctx.strokeStyle = theme === 'dark' || theme === 'blue' ? '#fff' : '#000'; 
      ctx.lineWidth = 2; 
      ctx.lineCap = 'round'; 
    } 
  }, [theme]);

  const startDrawing = (e) => { 
    const ctx = canvasRef.current.getContext('2d'); 
    ctx.beginPath(); 
    const { x, y } = getCoords(e); 
    ctx.moveTo(x, y); 
    setIsDrawing(true); 
  };

  const draw = (e) => { 
    if (!isDrawing) return; 
    const ctx = canvasRef.current.getContext('2d'); 
    const { x, y } = getCoords(e); 
    ctx.lineTo(x, y); 
    ctx.stroke(); 
  };

  const getCoords = (e) => { 
    const rect = canvasRef.current.getBoundingClientRect(); 
    const clientX = e.touches ? e.touches[0].clientX : e.clientX; 
    const clientY = e.touches ? e.touches[0].clientY : e.clientY; 
    return { x: clientX - rect.left, y: clientY - rect.top }; 
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20 touch-none h-48 relative">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={()=>setIsDrawing(false)}/>
        <div className="absolute bottom-2 right-2 text-[10px] opacity-30 pointer-events-none text-white">Firme aquí</div>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>onSave(canvasRef.current.toDataURL())} className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-bold">Confirmar</button>
        <button onClick={onCancel} className="p-3 rounded-xl bg-white/10 text-xs">Cancelar</button>
      </div>
    </div>
  );
};

const ToothFacesControl = ({ faces, onChange, theme }) => {
    const cycleStatus = (current) => { 
      if (!current) return 'caries'; 
      if (current === 'caries') return 'filled'; 
      if (current === 'filled') return 'crown'; 
      return null; 
    };
    const getColor = (status) => { 
      if (status === 'caries') return 'bg-red-500 border-red-500'; 
      if (status === 'filled') return 'bg-blue-500 border-blue-500'; 
      if (status === 'crown') return 'bg-yellow-500 border-yellow-500'; 
      return 'bg-white/5 border-white/10 hover:bg-white/10'; 
    };
    return (
      <div className="flex flex-col items-center gap-1 my-4">
        <button onClick={() => onChange('v', cycleStatus(faces.v))} className={`w-12 h-8 rounded-t-xl border-2 transition-all ${getColor(faces.v)}`}></button>
        <div className="flex gap-1">
          <button onClick={() => onChange('m', cycleStatus(faces.m))} className={`w-8 h-12 rounded-l-xl border-2 transition-all ${getColor(faces.m)}`}></button>
          <button onClick={() => onChange('o', cycleStatus(faces.o))} className={`w-12 h-12 rounded-md border-2 transition-all ${getColor(faces.o)}`}></button>
          <button onClick={() => onChange('d', cycleStatus(faces.d))} className={`w-8 h-12 rounded-r-xl border-2 transition-all ${getColor(faces.d)}`}></button>
        </div>
        <button onClick={() => onChange('l', cycleStatus(faces.l))} className={`w-12 h-8 rounded-b-xl border-2 transition-all ${getColor(faces.l)}`}></button>
      </div>
    );
};

const Tooth = ({ number, status, onClick, theme, isPerioMode, perioData, data }) => {
  const hasBOP = perioData && Object.values(perioData.bop || {}).some(v => v === true);
  const hasPus = perioData?.pus;
  const hasAlert = (perioData?.mobility > 0) || (perioData?.furcation > 0);
  
  const getSimpleColor = () => { 
    const currentStatus = data?.status || status; 
    if (currentStatus === 'missing') return '#000000'; 
    const faces = data?.faces || {}; 
    if (Object.values(faces).some(s => s === 'caries')) return '#ef4444'; 
    if (Object.values(faces).some(s => s === 'filled')) return '#3b82f6'; 
    if (Object.values(faces).some(s => s === 'crown')) return '#eab308'; 
    if (currentStatus === 'caries') return '#ef4444'; 
    if (currentStatus === 'filled') return '#3b82f6'; 
    if (currentStatus === 'crown') return '#eab308'; 
    return theme === 'light' ? '#333' : '#fff'; 
  };

  if (isPerioMode && (status === 'missing' || data?.status === 'missing')) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-20 pointer-events-none grayscale">
        <svg width="35" height="45" viewBox="0 0 100 120">
          <path d="M20 30C20 15 35 5 50 5C65 5 80 15 80 30V50C80 70 75 80 70 95C68 105 60 115 50 115C40 115 32 105 30 95C25 80 20 70 20 50V30Z" fill="#000" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span className="text-[8px] font-bold">AUS</span>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative">
      <svg width="35" height="45" viewBox="0 0 100 120">
        <path d="M20 30C20 15 35 5 50 5C65 5 80 15 80 30V50C80 70 75 80 70 95C68 105 60 115 50 115C40 115 32 105 30 95C25 80 20 70 20 50V30Z" fill={getSimpleColor()} fillOpacity={status === 'missing' || data?.status === 'missing' || Object.values(data?.faces||{}).some(v=>v) ? 1 : 0.15} stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      </svg>
      {isPerioMode && (
        <div className="absolute -top-2 flex gap-1">
          {hasBOP && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>}
          {hasPus && <div className="w-2 h-2 rounded-full bg-yellow-400"/>}
          {hasAlert && <div className="w-2 h-2 rounded-full bg-purple-500"/>}
        </div>
      )}
      <span className="text-[9px] font-bold opacity-50">{number}</span>
    </div>
  );
};

const HygieneCell = ({ tooth, data, onChange, status }) => { 
  if (status === 'missing') return null; 
  return (
    <div className="flex flex-col items-center gap-1 bg-white/5 p-2 rounded-xl">
      <span className="text-[10px] font-bold opacity-70">{tooth}</span>
      <div className="grid grid-cols-2 gap-1 w-12 h-12">
        {['v', 'd', 'l', 'm'].map(f => (
          <div key={f} onClick={() => onChange(f)} className={`rounded-sm cursor-pointer border border-white/10 transition-colors ${data?.[f] ? 'bg-red-500 border-red-500' : 'hover:bg-white/10'}`} title={`Cara ${f.toUpperCase()}`}></div>
        ))}
      </div>
    </div>
  ); 
};

const Card = ({ children, className = "", theme, ...props }) => { 
  const t = THEMES[theme] || THEMES.dark; 
  return <div {...props} className={`p-6 rounded-3xl transition-all relative ${t.card} ${className}`}>{children}</div>; 
};

const Button = ({ onClick, children, variant = "primary", className = "", theme, disabled }) => { 
  const t = THEMES[theme] || THEMES.dark; 
  const styles = { primary: `${t.gradient} text-white shadow-lg`, secondary: t.buttonSecondary }; 
  return <button disabled={disabled} onClick={onClick} className={`p-3 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>; 
};

const InputField = ({ label, icon: Icon, theme, textarea, ...props }) => { 
  const t = THEMES[theme] || THEMES.dark; 
  return (
    <div className="w-full">
      {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 ${t.subText}`}>{label}</label>}
      <div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>
        {Icon && <Icon size={16} className={`mr-2 mt-0.5 ${t.subText}`}/>}
        {textarea ? <textarea {...props} rows="3" className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`}/> : <input {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${t.text}`}/>}
      </div>
    </div>
  ); 
};

const PatientSelect = ({ theme, patients, onSelect, placeholder = "Buscar Paciente..." }) => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const results = useMemo(() => { if (!query) return []; return Object.values(patients).filter(p => p.personal?.legalName?.toLowerCase().includes(query.toLowerCase())); }, [query, patients]);
    const t = THEMES[theme] || THEMES.dark;
    return (
        <div className="relative w-full z-20">
            <InputField theme={theme} icon={Search} placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
            {showResults && query && (
                <div className={`absolute left-0 right-0 top-full mt-2 rounded-xl border max-h-48 overflow-y-auto shadow-xl ${t.card}`}>
                    {results.length > 0 ? results.map(p => (
                        <div key={p.id} onClick={() => { onSelect(p); setQuery(p.personal.legalName); setShowResults(false); }} className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0">
                            <p className="font-bold text-sm">{p.personal.legalName}</p>
                        </div>
                    )) : (
                        <div className="p-3 text-xs opacity-50">
                            No encontrado. <span className="underline cursor-pointer font-bold ml-1" onClick={()=>{ onSelect({id:'new', name: query}); setShowResults(false); }}>Crear "{query}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AuthScreen = () => {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [isSignUp, setIsSignUp] = useState(false); const [msg, setMsg] = useState('');
  const handleAuth = async (e) => { e.preventDefault(); setLoading(true); setMsg(''); try { if (isSignUp) { const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error; setMsg('Cuenta creada.'); } else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; } } catch (error) { setMsg(error.message); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 z-[100]"><div className="w-full max-w-sm flex flex-col items-center"><Cloud size={60} className="text-cyan-400 mb-4" /><h1 className="text-3xl font-black text-white mb-8">ShiningCloud</h1><form onSubmit={handleAuth} className="w-full space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10"><input type="email" placeholder="Email" className="w-full p-4 bg-black/40 rounded-xl text-white outline-none border border-white/10" value={email} onChange={e=>setEmail(e.target.value)} required /><input type="password" placeholder="Clave" className="w-full p-4 bg-black/40 rounded-xl text-white outline-none border border-white/10" value={password} onChange={e=>setPassword(e.target.value)} required /><button className="w-full p-4 bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-widest">{loading ? '...' : (isSignUp ? 'Registrar' : 'Entrar')}</button></form><button onClick={()=>setIsSignUp(!isSignUp)} className="mt-4 text-xs text-white/40 uppercase">{isSignUp ? 'Login' : 'Crear Cuenta'}</button></div></div>);
};

const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

// --- APP ---
export default function App() {
  const [session, setSession] = useState(null);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('sc_theme_mode') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // DATA
  const [config, setConfigLocal] = useState({ logo: null, hourlyRate: 25000, profitMargin: 30, name: "Dr. Benjamín" });
  const [patientRecords, setPatientRecords] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]); 
  const [protocols, setProtocols] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [team, setTeam] = useState([]); 
  const [userRole, setUserRole] = useState('admin'); 

  // UI STATES
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal');
  const [sessionData, setSessionData] = useState({ patientName: '', clinicalTime: 60, baseCost: 0, patientId: null });
  const [prescription, setPrescription] = useState([]);
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '' });
  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [modal, setModal] = useState(null);
  const [notification, setNotification] = useState('');
  
  // PERIO & CONSENT & IMAGES & ODONTOGRAMA PRO
  const [toothModalData, setToothModalData] = useState({ id: null, status: null, faces: { v: null, l: null, m: null, d: null, o: null }, notes: '' });
  const [perioData, setPerioData] = useState({ pd: { vd:'', v:'', vm:'', ld:'', l:'', lm:'' }, bop: { vd:false, v:false, vm:false, ld:false, l:false, lm:false }, pus: false, mobility: 0, furcation: 0 }); 
  const [consentTemplate, setConsentTemplate] = useState('general');
  const [consentText, setConsentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [rxPatient, setRxPatient] = useState(null);
  const [newEvolution, setNewEvolution] = useState('');
  
  // --- INVENTARIO & PAGOS ---
  const [inventorySearch, setInventorySearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', stock: 0, min: 5, unit: 'u', id: null });
  const [paymentInput, setPaymentInput] = useState({ amount: '', method: 'Efectivo', date: new Date().toISOString().split('T')[0] });
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null);
  const [historyMode, setHistoryMode] = useState('income'); 
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'dentist' });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Insumos', date: new Date().toISOString().split('T')[0] });

  // --- VOZ A TEXTO ---
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognitionRef = useRef(null);

  const logoInputRef = useRef(null);

  useEffect(() => { document.title = "ShiningCloud | Dental"; }, []);
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setSession(session)); supabase.auth.onAuthStateChange((_e, s) => setSession(s)); }, []);
  
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const { data: s } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
      if (s) setConfigLocal(s.data);
      const { data: p } = await supabase.from('patients').select('*');
      if (p) { const m = {}; p.forEach(r => m[r.id] = r.data); setPatientRecords(m); }
      const { data: a } = await supabase.from('appointments').select('*');
      if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));
      const { data: f } = await supabase.from('financials').select('*');
      if (f) setFinancialRecords(f.map(r => ({ ...r.data, id: r.id })));
      const { data: pk } = await supabase.from('packs').select('*');
      if (pk) setProtocols(pk.map(r => ({ ...r.data, id: r.id })));
      const { data: i, error } = await supabase.from('inventory').select('*');
      if (!error && i) setInventory(i.map(r => ({ ...r.data, id: r.id })));
      
      const { data: t, error: tErr } = await supabase.from('team').select('*');
      if (!tErr && t) {
          const teamData = t.map(r => ({...r.data, id: r.id}));
          setTeam(teamData);
          const me = teamData.find(u => u.email === session.user.email);
          if (teamData.length === 0 || !me) setUserRole('admin'); 
          else setUserRole(me.role);
      } else { setUserRole('admin'); }
    };
    load();
  }, [session]);

  const notify = (m) => { setNotification(m); setTimeout(() => setNotification(''), 3000); };
  const toggleTheme = () => { const modes = ['dark', 'light', 'blue']; const next = modes[(modes.indexOf(themeMode) + 1) % modes.length]; setThemeMode(next); localStorage.setItem('sc_theme_mode', next); };
  const saveToSupabase = async (t, id, d) => { await supabase.from(t).upsert({ id: id.toString(), data: d }); };
  
  const getPatient = (id) => {
      const base = { id, personal: { legalName: id }, anamnesis: { recent: '', remote: '' }, clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, consents: [], images: [] };
      const existing = patientRecords[id];
      if (!existing) return base;
      return { ...base, ...existing, anamnesis: existing.anamnesis || base.anamnesis, clinical: existing.clinical || base.clinical, personal: existing.personal || base.personal };
  };

  const savePatientData = async (id, d) => { setPatientRecords(prev => ({...prev, [id]: d})); await saveToSupabase('patients', id, d); };
  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => { const newConfig = { ...config, logo: reader.result }; setConfigLocal(newConfig); saveToSupabase('settings', 'general', newConfig); notify("Logo Actualizado"); }; reader.readAsDataURL(file); };

  const currentTotal = useMemo(() => { const time = parseFloat(sessionData.clinicalTime) || 0; const base = parseFloat(sessionData.baseCost) || 0; const hourly = parseFloat(config.hourlyRate) || 0; const margin = parseFloat(config.profitMargin) || 0; return Math.round(((hourly / 60) * time + base) / (1 - margin / 100)); }, [sessionData, config]);
  const incomeRecords = financialRecords.filter(f => !f.type || f.type === 'income');
  const expenseRecords = financialRecords.filter(f => f.type === 'expense');
  const totalCollected = incomeRecords.reduce((acc, rec) => { const paymentsSum = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0); return acc + (paymentsSum > 0 ? paymentsSum : (Number(rec.paid) || 0)); }, 0);
  const totalExpenses = expenseRecords.reduce((a, b) => a + (Number(b.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;
  const todaysAppointments = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).sort((a,b) => a.time.localeCompare(b.time));
  const filteredInventory = useMemo(() => { if(!inventorySearch) return inventory; return inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase())); }, [inventory, inventorySearch]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file || !selectedPatientId) return; setUploading(true);
    try {
        const fileName = `${selectedPatientId}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('patient-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('patient-images').getPublicUrl(fileName);
        const p = getPatient(selectedPatientId);
        const updatedImages = [...(p.images || []), { id: Date.now(), url: publicUrl, date: new Date().toLocaleDateString() }];
        await savePatientData(selectedPatientId, { ...p, images: updatedImages });
        notify("Imagen Subida");
    } catch (err) { alert(`Error: ${err.message}`); } finally { setUploading(false); }
  };

  const generatePDF = (type, data = null) => {
    try {
      const doc = new jsPDF();
      const primaryColor = themeMode === 'light' ? [217, 119, 6] : (themeMode === 'blue' ? [6, 182, 212] : [212, 175, 55]);
      doc.setFillColor(...primaryColor); doc.rect(0, 0, 210, 5, 'F');
      if (config.logo) { try { doc.addImage(config.logo, 'PNG', 15, 15, 25, 25); } catch (e) { try { doc.addImage(config.logo, 'JPEG', 15, 15, 25, 25); } catch(err) { console.warn("Logo incompatible", err); } } }
      doc.setFontSize(18); doc.text(config.name?.toUpperCase() || "DOCTOR", 200, 25, { align: 'right' });
      const pData = (type === 'consent') ? getPatient(selectedPatientId) : (data || (sessionData.patientId ? patientRecords[sessionData.patientId] : null));
      const pName = pData?.personal?.legalName || (sessionData.patientName || 'Paciente...');
      doc.setFontSize(10); doc.text(`PACIENTE: ${pName}`, 20, 50);
      
      if (type === 'rx') { 
          if (prescription.length === 0) { notify("Receta vacía"); return; } 
          autoTable(doc, { startY: 60, head: [['MEDICAMENTO', 'DOSIS']], body: prescription.map(p => [p.name, p.dosage]) }); 
      } 
      else if (type === 'quote') { 
          autoTable(doc, { startY: 60, head: [['ITEM', 'VALOR']], body: [[sessionData.treatmentName || 'Tratamiento', `$${currentTotal.toLocaleString()}`]] }); 
          if (pData && pData.clinical && pData.clinical.teeth) {
              const startY = doc.lastAutoTable.finalY + 20;
              doc.setFontSize(12); doc.setTextColor(0,0,0);
              doc.text("MAPA CLÍNICO (ODONTOGRAMA)", 105, startY, { align: 'center' });
              
              const drawTeethRow = (teethIds, yPos) => {
                  let xPos = 20; const width = 10; const height = 10; const gap = 1;
                  teethIds.forEach(id => {
                      const tData = pData.clinical.teeth[id] || {};
                      let color = [255, 255, 255]; 
                      if (tData.status === 'missing') color = [50, 50, 50]; 
                      else if (Object.values(tData.faces || {}).some(s => s === 'caries') || tData.status === 'caries') color = [220, 38, 38]; 
                      else if (Object.values(tData.faces || {}).some(s => s === 'filled') || tData.status === 'filled') color = [37, 99, 235]; 
                      else if (Object.values(tData.faces || {}).some(s => s === 'crown') || tData.status === 'crown') color = [234, 179, 8]; 
                      doc.setFillColor(...color); doc.rect(xPos, yPos, width, height, 'F'); doc.setDrawColor(150); doc.rect(xPos, yPos, width, height, 'S'); 
                      doc.setFontSize(7); doc.setTextColor(100); doc.text(id.toString(), xPos + width/2, yPos - 2, {align:'center'});
                      xPos += width + gap;
                  });
              };
              drawTeethRow(TEETH_UPPER, startY + 10); drawTeethRow(TEETH_LOWER, startY + 30);
              const legY = startY + 50; doc.setFontSize(8); doc.setFillColor(220, 38, 38); doc.rect(20, legY, 3, 3, 'F'); doc.text("Caries/Tto", 25, legY+2); doc.setFillColor(37, 99, 235); doc.rect(50, legY, 3, 3, 'F'); doc.text("Restauración", 55, legY+2); doc.setFillColor(50, 50, 50); doc.rect(85, legY, 3, 3, 'F'); doc.text("Ausente", 90, legY+2);
          }
      }
      else if (type === 'consent' && data) { 
          doc.setFontSize(14); doc.text(data.type, 105, 70, { align: 'center' }); 
          doc.setFontSize(10); doc.text(doc.splitTextToSize(data.text || '', 170), 20, 90); 
          if(data.signature) { try { doc.addImage(data.signature, 'PNG', 80, 200, 50, 30); } catch(e) { console.warn("Firma error", e); } } 
      }
      doc.save(`${type}_${pName}.pdf`); notify("PDF Generado"); 
    } catch (e) { console.error(e); alert("Error generando PDF."); }
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

  // --- LOGICA DE VOZ ---
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Navegador no compatible. Por favor, usa Google Chrome.");
        return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus('');
    } else {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'es-CL';
      recognition.continuous = true; 
      recognition.interimResults = false;
      recognition.onstart = () => { setIsListening(true); setVoiceStatus('Escuchando... 🔴'); };
      recognition.onresult = (event) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) final += event.results[i][0].transcript; }
        if (final) { setNewEvolution(prev => (prev ? prev.trim() + '. ' : '') + final.charAt(0).toUpperCase() + final.slice(1)); }
      };
      recognition.onerror = (event) => { console.error("Error Voz:", event.error); setIsListening(false); if (event.error === 'not-allowed') { setVoiceStatus('❌ Permiso denegado.'); alert("Permiso denegado. Habilita el micrófono en la barra de dirección."); } else if (event.error === 'no-speech') { setVoiceStatus('❌ No se escuchó nada.'); } else { setVoiceStatus(`❌ Error: ${event.error}`); } };
      recognition.onend = () => { setIsListening(false); setVoiceStatus('⏹️ Detenido.'); };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // --- WHATSAPP HELPER ---
  const sendWhatsApp = (phone, text) => {
      if (!phone) return alert("El paciente no tiene teléfono registrado.");
      const cleanPhone = phone.replace(/\D/g, ''); 
      const finalPhone = cleanPhone.startsWith('56') ? cleanPhone : `56${cleanPhone}`; 
      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPatientPhone = (name) => {
      if (!name) return '';
      const foundEntry = Object.values(patientRecords).find(p => p.personal?.legalName === name);
      return foundEntry?.personal?.phone || '';
  };

  // --- MENU LOGIC ---
  const getMenuItems = () => {
      const base = [
          { id: 'dashboard', label: 'Inicio', icon: TrendingUp },
          { id: 'agenda', label: 'Agenda', icon: CalendarClock },
          { id: 'ficha', label: 'Pacientes', icon: User },
      ];
      if (userRole === 'admin' || userRole === 'assistant') { base.push({ id: 'history', label: 'Caja & Gastos', icon: Wallet }); }
      if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'quote', label: 'Cotizador', icon: Calculator }); }
      if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'clinical', label: 'Recetas', icon: Stethoscope }); }
      if (userRole === 'admin') { base.push({ id: 'inventory', label: 'Insumos', icon: Box }); base.push({ id: 'settings', label: 'Ajustes', icon: Settings }); }
      return base;
  };

  if (!session) return <AuthScreen />;
  const t = THEMES[themeMode] || THEMES.dark;

  return (
    <div className={`min-h-screen flex ${t.bg} ${t.text} transition-all font-sans`}>
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={()=>setMobileMenuOpen(false)}></div>}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform ${t.card} border-r flex flex-col`}>
        <div className="p-8 border-b border-white/5 flex items-center gap-2 relative"><button onClick={()=>setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 opacity-50"><X/></button>{config.logo ? <img src={config.logo} className="w-8 h-8 rounded bg-white/10 object-contain"/> : <Cloud className={t.accent} size={24}/>}<h1 className="text-xl font-black">ShiningCloud | Dental</h1></div>
        <div className="px-8 py-4"><span className={`text-[10px] font-bold uppercase py-1 px-2 rounded bg-white/10 ${userRole==='admin'?'text-emerald-400':userRole==='dentist'?'text-blue-400':'text-stone-400'}`}>{userRole === 'admin' ? 'Administrador' : userRole === 'dentist' ? 'Dentista' : 'Asistente'}</span></div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">{getMenuItems().map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatientId(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-xs uppercase ${activeTab === item.id ? `${t.accentBg} text-white` : 'opacity-50 hover:opacity-100'}`}><item.icon size={18}/> {item.label}</button>))}</nav>
        <div className="p-4 space-y-2 border-t border-white/5"><button onClick={toggleTheme} className="w-full p-3 rounded-xl bg-white/5 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:bg-white/10">{themeMode==='dark'?<Moon size={14}/>:themeMode==='light'?<Sun size={14}/>:<Droplets size={14}/>} TEMA</button><button onClick={()=>supabase.auth.signOut()} className="w-full p-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs transition-all hover:bg-red-500/20"><LogOut size={14} className="inline mr-2"/> SALIR</button></div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between mb-6"><button onClick={()=>setMobileMenuOpen(true)} className={`p-2 rounded-xl ${t.inputBg}`}><Menu/></button><span className="font-black text-lg">ShiningCloud | Dental</span><div className="w-8"></div></div>
        {notification && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-cyan-500 text-white px-6 py-2 rounded-full font-bold animate-bounce">{notification}</div>}

        {activeTab === 'dashboard' && <div className="space-y-8 animate-in fade-in">
            <h1 className="text-4xl font-black">Hola, {config.name.split(' ')[0]} 👋</h1>
            {userRole === 'admin' && (<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card theme={themeMode} className="bg-emerald-500/10 border-emerald-500/20"><div className="flex justify-between mb-4"><div className="p-3 bg-emerald-500 rounded-xl text-white"><DollarSign/></div><span className="text-xs font-bold uppercase text-emerald-500">Recaudado</span></div><h2 className="text-3xl font-black">${totalCollected.toLocaleString()}</h2></Card><Card theme={themeMode} className="bg-red-500/10 border-red-500/20"><div className="flex justify-between mb-4"><div className="p-3 bg-red-500 rounded-xl text-white"><TrendingDown/></div><span className="text-xs font-bold uppercase text-red-500">Gastos</span></div><h2 className="text-3xl font-black">${totalExpenses.toLocaleString()}</h2></Card><Card theme={themeMode} className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-600'} text-white col-span-2 relative overflow-hidden`}><div className="relative z-10"><span className="text-xs font-bold uppercase opacity-80">Utilidad Neta</span><h2 className="text-4xl font-black mt-2">${netProfit.toLocaleString()}</h2><p className="text-xs opacity-60 mt-1">Ganancia Real</p></div><div className="absolute -right-4 -bottom-4 opacity-20"><DollarSign size={100}/></div></Card></div>)}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4"><h3 className="font-bold text-lg flex items-center gap-2"><Clock className={t.accent} size={20}/> Agenda de Hoy</h3><div className="space-y-2">{todaysAppointments.length === 0 ? (<div className="p-10 border border-dashed border-white/10 rounded-3xl text-center opacity-50 flex flex-col items-center gap-4"><p>No tienes pacientes hoy.</p><Button theme={themeMode} onClick={()=>setModal('appt')}>Agendar Cita</Button></div>) : (todaysAppointments.map(a => (<div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 ${t.card} hover:scale-[1.01] transition-transform`}><div className={`p-4 rounded-xl font-black text-white ${t.accentBg}`}>{a.time}</div><div className="flex-1"><h4 className="font-bold text-lg">{a.name}</h4><p className="text-xs opacity-50">{a.treatment}</p></div><button className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><ArrowRight size={16}/></button></div>)))}</div></div>
                <div className="space-y-6"><h3 className="font-bold text-lg">Accesos Rápidos</h3><div className="grid grid-cols-2 gap-3"><button onClick={()=>setModal('appt')} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><CalendarClock size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Agendar</span></button><button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null); setSearchTerm('');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><User size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Paciente</span></button>{userRole !== 'dentist' && <button onClick={()=>{setActiveTab('quote'); setQuoteMode('calc');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><Calculator size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Cotizar</span></button>}{(userRole === 'admin' || userRole === 'assistant') && <button onClick={()=>{setActiveTab('history');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><Wallet size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Caja</span></button>}</div></div>
            </div>
        </div>}

        {activeTab === 'history' && (userRole === 'admin' || userRole === 'assistant') && <div className="space-y-6 animate-in slide-in-from-right">
           <div className="flex bg-white/5 p-1 rounded-xl mb-4"><button onClick={()=>setHistoryMode('income')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all ${historyMode==='income'?t.accentBg:'opacity-50'}`}>Ingresos</button><button onClick={()=>setHistoryMode('expense')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all ${historyMode==='expense'?t.accentBg:'opacity-50'}`}>Gastos</button></div>
           {historyMode === 'income' ? (<div className="space-y-4"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Ingresos</h2><Button theme={themeMode} variant="secondary" onClick={()=>{const ws=XLSX.utils.json_to_sheet(financialRecords); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Finanzas"); XLSX.writeFile(wb, "Reporte.xlsx");}}><FileSpreadsheet/> Excel</Button></div>{incomeRecords.map(h=>{ const totalPaidRec = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0); const pending = (h.total || 0) - totalPaidRec; return (<Card key={h.id} theme={themeMode} onClick={()=>{setSelectedFinancialRecord(h); setPaymentInput({amount: pending > 0 ? pending : '', method:'Efectivo', date: new Date().toISOString().split('T')[0]}); setModal('abono');}} className={`flex justify-between items-center cursor-pointer border-l-4 ${pending<=0?'border-emerald-500':'border-red-500'} hover:scale-[1.01] transition-transform`}>
               <div><p className="font-bold">{h.patientName}</p><p className="text-[10px] opacity-40">{h.date} • Total: ${h.total?.toLocaleString()}</p></div>
               <div className="flex flex-col items-end gap-1">
                   <p className={`font-black ${pending<=0?'text-emerald-500':'text-red-500'}`}>{pending <= 0 ? 'PAGADO' : `DEBE $${pending.toLocaleString()}`}</p>
                   {pending > 0 && <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(h.patientName), `Hola ${h.patientName}, le recordamos que tiene un saldo pendiente de $${pending.toLocaleString()} en ShiningCloud Dental.`); }} className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded hover:bg-green-500/40"><MessageCircle size={12}/> COBRAR</button>}
               </div>
           </Card>)})}</div>) : (<div className="space-y-4"><Card theme={themeMode} className="space-y-4 border-l-4 border-red-500 bg-red-500/5"><h3 className="font-bold text-red-500">Registrar Nuevo Gasto</h3><div className="grid grid-cols-2 gap-2"><InputField theme={themeMode} placeholder="Descripción (ej: Luz)" value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description:e.target.value})}/><select className={`bg-transparent border border-white/10 rounded-xl px-3 text-xs font-bold outline-none ${t.text}`} value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category:e.target.value})}><option className="bg-[#121212] text-white">Insumos</option><option className="bg-[#121212] text-white">Laboratorio</option><option className="bg-[#121212] text-white">Arriendo</option><option className="bg-[#121212] text-white">Marketing</option><option className="bg-[#121212] text-white">Otros</option></select><InputField theme={themeMode} type="number" placeholder="$ Monto" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount:e.target.value})}/> <Button theme={themeMode} onClick={async()=>{ if(newExpense.description && newExpense.amount){ const id = Date.now().toString(); const expenseData = { ...newExpense, id, type: 'expense' }; setFinancialRecords([expenseData, ...financialRecords]); await saveToSupabase('financials', id, expenseData); setNewExpense({description:'', amount:'', category:'Insumos', date: new Date().toISOString().split('T')[0]}); notify("Gasto Guardado"); } }}>Guardar Gasto</Button></div></Card><div className="space-y-2">{expenseRecords.map(ex => (<div key={ex.id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"><div className="flex items-center gap-3"><div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><TrendingDown size={16}/></div><div><p className="font-bold text-sm">{ex.description}</p><p className="text-[10px] opacity-50">{ex.date} • {ex.category}</p></div></div><div className="flex items-center gap-4"><span className="font-black text-red-400">-${Number(ex.amount).toLocaleString()}</span><button onClick={async()=>{ const filtered = financialRecords.filter(f=>f.id!==ex.id); setFinancialRecords(filtered); await supabase.from('financials').delete().eq('id', ex.id); }} className="text-xs opacity-30 hover:opacity-100 hover:text-red-500"><Trash2 size={14}/></button></div></div>))}</div></div>)}
        </div>}

        {activeTab === 'inventory' && userRole === 'admin' && <div className="space-y-6 animate-in fade-in"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Inventario</h2><Button theme={themeMode} onClick={()=>{setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); setModal('addItem');}}><Plus/> Nuevo Item</Button></div><div className="relative"><InputField theme={themeMode} icon={Search} placeholder="Buscar insumo..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} /></div><div className="space-y-2">{filteredInventory.map(item => { const isLow = (item.stock || 0) <= (item.min || 5); return (<div key={item.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isLow ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}><div className="flex items-center gap-4"><div className={`p-3 rounded-lg ${isLow ? 'bg-red-500 text-white' : 'bg-white/10'}`}>{isLow ? <AlertTriangle size={20}/> : <Box size={20}/>}</div><div><h4 className="font-bold">{item.name}</h4><p className="text-xs opacity-50">Mínimo: {item.min} {item.unit}</p></div></div><div className="flex items-center gap-4"><div className="flex items-center gap-2 bg-black/20 rounded-lg p-1"><button onClick={async()=>{ const n = Math.max(0, (item.stock||0)-1); const u = {...item, stock:n}; setInventory(inventory.map(i=>i.id===u.id?u:i)); await saveToSupabase('inventory', u.id, u); }} className="p-2 hover:bg-white/10 rounded"><Minus size={14}/></button><span className={`w-8 text-center font-bold ${isLow?'text-red-500':''}`}>{item.stock}</span><button onClick={async()=>{ const n = (item.stock||0)+1; const u = {...item, stock:n}; setInventory(inventory.map(i=>i.id===u.id?u:i)); await saveToSupabase('inventory', u.id, u); }} className="p-2 hover:bg-white/10 rounded"><Plus size={14}/></button></div><button onClick={()=>{setNewItem(item); setModal('addItem');}} className="p-2 text-white/50 hover:text-cyan-400"><Edit3 size={18}/></button></div></div>)})}</div></div>}

        {/* --- SETTINGS (V58 CON EQUIPO) --- */}
        {activeTab === 'settings' && <div className="space-y-6">
            <Card theme={themeMode} className="space-y-4">
                <div onClick={()=>logoInputRef.current.click()} className="p-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5"><input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>{config.logo ? <img src={config.logo} className="h-16 object-contain"/> : <><Camera className="mb-2 opacity-50"/><span className="text-xs font-bold opacity-50">SUBIR LOGO</span></>}</div>
                {userRole === 'admin' ? (
                    <>
                        <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Clínica/Dr" value={config.name} onChange={e=>setConfigLocal({...config, name:e.target.value})} /><InputField theme={themeMode} label="RUT Profesional" value={config.rut} onChange={e=>setConfigLocal({...config, rut:e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Especialidad" value={config.specialty} onChange={e=>setConfigLocal({...config, specialty:e.target.value})} /><InputField theme={themeMode} label="Teléfono" value={config.phone} onChange={e=>setConfigLocal({...config, phone:e.target.value})} /></div>
                        <h3 className="font-bold pt-4">Datos Financieros</h3>
                        <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Valor Hora" type="number" value={config.hourlyRate} onChange={e=>setConfigLocal({...config, hourlyRate:e.target.value})} /><InputField theme={themeMode} label="Margen %" type="number" value={config.profitMargin} onChange={e=>setConfigLocal({...config, profitMargin:e.target.value})} /></div>
                        <Button theme={themeMode} className="w-full" onClick={()=>{saveToSupabase('settings', 'general', config); notify("Ajustes Guardados");}}>GUARDAR DATOS</Button>
                    </>
                ) : <p className="text-center opacity-50 py-4">Contacta al administrador para editar datos.</p>}
            </Card>

            {/* GESTIÓN DE EQUIPO (SOLO ADMIN) */}
            {userRole === 'admin' && (
                <Card theme={themeMode} className="space-y-4 border-l-4 border-cyan-500">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Shield size={20}/> Gestión de Equipo</h3>
                    <div className="flex gap-2">
                        <InputField theme={themeMode} placeholder="Nombre" value={newMember.name} onChange={e=>setNewMember({...newMember, name:e.target.value})}/>
                        <InputField theme={themeMode} placeholder="Email" value={newMember.email} onChange={e=>setNewMember({...newMember, email:e.target.value})}/>
                        <select className={`bg-transparent border border-white/10 rounded-xl px-2 text-xs font-bold outline-none ${t.text}`} value={newMember.role} onChange={e=>setNewMember({...newMember, role:e.target.value})}><option className="bg-[#121212] text-white" value="admin">Admin</option><option className="bg-[#121212] text-white" value="dentist">Dentista</option><option className="bg-[#121212] text-white" value="assistant">Asistente</option></select>
                        <Button theme={themeMode} onClick={async()=>{ 
                            if(newMember.email && newMember.name){ 
                                const id=Date.now().toString(); 
                                const u={...newMember, id}; 
                                setTeam([...team, u]); 
                                await saveToSupabase('team', id, u); 
                                setNewMember({name:'', email:'', role:'dentist'}); 
                                notify("Usuario Agregado"); 
                            } 
                        }}><Plus/></Button>
                    </div>
                    <div className="space-y-2">
                        {team.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div><p className="font-bold">{member.name}</p><p className="text-[10px] opacity-50">{member.email}</p></div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/10 ${member.role==='admin'?'text-emerald-400':member.role==='dentist'?'text-blue-400':'text-stone-400'}`}>{member.role}</span>
                                    <button onClick={async()=>{ const f=team.filter(t=>t.id!==member.id); setTeam(f); await supabase.from('team').delete().eq('id', member.id); }} className="text-red-500 opacity-50 hover:opacity-100"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>}

        {/* --- TABS COMUNES (MANTENIDOS) --- */}
        {activeTab === 'quote' && (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') && <div className="space-y-4 animate-in slide-in-from-bottom"><div className="flex bg-white/5 p-1 rounded-xl mb-4"><button onClick={()=>setQuoteMode('calc')} className={`flex-1 p-2 rounded-lg text-xs font-bold ${quoteMode==='calc'?t.accentBg:'opacity-50'}`}>Calculadora</button><button onClick={()=>setQuoteMode('packs')} className={`flex-1 p-2 rounded-lg text-xs font-bold ${quoteMode==='packs'?t.accentBg:'opacity-50'}`}>Packs</button></div>{quoteMode === 'calc' ? (<Card theme={themeMode} className="space-y-4"><Button theme={themeMode} variant="secondary" onClick={()=>setModal('loadPack')}>CARGAR PACK</Button><PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => setSessionData({...sessionData, patientName: p.personal.legalName, patientId: p.id})} placeholder="Buscar Paciente..." /><div className="grid grid-cols-2 gap-2"><InputField theme={themeMode} label="Minutos" type="number" value={sessionData.clinicalTime} onChange={e=>setSessionData({...sessionData, clinicalTime:e.target.value})} /><InputField theme={themeMode} label="Costos" type="number" value={sessionData.baseCost} onChange={e=>setSessionData({...sessionData, baseCost:e.target.value})} /></div><div className="text-center py-6 border-y border-white/10 my-4"><p className="text-xs opacity-50 uppercase tracking-widest mb-2">Total Estimado</p><h3 className="text-6xl font-black text-cyan-400">${currentTotal.toLocaleString()}</h3></div><div className="grid grid-cols-2 gap-2"><Button theme={themeMode} onClick={()=>{ const id=Date.now().toString(); saveToSupabase('financials', id, {id, total:currentTotal, paid:0, payments: [], patientName:sessionData.patientName, date:new Date().toLocaleDateString(), type: 'income'}); notify("Guardado en Caja"); }}>GUARDAR EN CAJA</Button><Button theme={themeMode} variant="secondary" onClick={()=>generatePDF('quote')}><Printer/></Button></div></Card>) : (<Card theme={themeMode} className="space-y-4"><h3 className="font-bold">Crear Nuevo Pack</h3><InputField theme={themeMode} label="Nombre Pack" value={newPack.name} onChange={e=>setNewPack({...newPack, name:e.target.value})} /><div className="flex gap-2"><InputField theme={themeMode} placeholder="Item" value={newPackItem.name} onChange={e=>setNewPackItem({...newPackItem, name:e.target.value})}/><InputField theme={themeMode} placeholder="$" type="number" value={newPackItem.cost} onChange={e=>setNewPackItem({...newPackItem, cost:e.target.value})}/><Button theme={themeMode} onClick={()=>{if(newPackItem.name) setNewPack({...newPack, items:[...newPack.items, {name:newPackItem.name, cost:Number(newPackItem.cost)}]}); setNewPackItem({name:'', cost:''});}}><Plus/></Button></div><div className="bg-black/20 p-4 rounded-xl space-y-2">{newPack.items.map((it, i)=>(<div key={i} className="flex justify-between text-xs border-b border-white/5 pb-1"><span>{it.name}</span><span>${it.cost}</span></div>))}</div><Button theme={themeMode} className="w-full" onClick={()=>{ const id = Date.now().toString(); const packComplete = {...newPack, id, totalCost: newPack.items.reduce((a,b)=>a+b.cost,0)}; setProtocols([...protocols, packComplete]); saveToSupabase('packs', id, packComplete); setNewPack({name:'', items:[]}); notify("Pack Guardado"); }}>GUARDAR PACK</Button></Card>)}</div>}
        {activeTab === 'agenda' && <div className="space-y-4 h-full flex flex-col"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-4"><h2 className="text-2xl font-bold">Agenda Semanal</h2><div className="flex items-center gap-2 bg-white/5 rounded-xl p-1"><button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d)}} className="p-2 hover:bg-white/10 rounded"><ChevronLeft size={16}/></button><button onClick={()=>setCurrentDate(new Date())} className="text-xs font-bold px-2">HOY</button><button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d)}} className="p-2 hover:bg-white/10 rounded"><ChevronRight size={16}/></button></div></div><Button theme={themeMode} onClick={()=>setModal('appt')}><Plus/> Agendar</Button></div><div className="flex-1 overflow-auto bg-white/5 rounded-2xl border border-white/5"><div className="grid grid-cols-8 min-w-[800px]"><div className="p-4 border-b border-r border-white/5 text-xs font-bold text-center opacity-50">HORA</div>{Array.from({length:7}, (_,i)=>{const d=new Date(currentDate); d.setDate(d.getDate()-d.getDay()+1+i); return d;}).map(d => (<div key={d} className={`p-4 border-b border-white/5 text-center ${d.toDateString()===new Date().toDateString() ? t.accent : ''}`}><p className="text-xs font-bold opacity-70">{['LUN','MAR','MIE','JUE','VIE','SAB','DOM'][d.getDay()===0?6:d.getDay()-1]}</p><p className="text-xl font-black">{d.getDate()}</p></div>))}{Array.from({length:11}, (_,i)=>8+i).map(h => (<React.Fragment key={h}><div className="p-2 border-r border-b border-white/5 text-xs font-bold opacity-50 text-center h-24">{h}:00</div>{Array.from({length:7}, (_,i)=>{const d=new Date(currentDate); d.setDate(d.getDate()-d.getDay()+1+i); return d;}).map(d => { const dateStr = d.toISOString().split('T')[0]; const appt = appointments.find(a => a.date === dateStr && parseInt(a.time.split(':')[0]) === h); return (<div key={d+h} className={`border-b border-white/5 relative group h-24 transition-all hover:bg-white/5 ${appt ? 'p-1' : 'cursor-pointer'}`} onClick={()=>{if(!appt) { setNewAppt({...newAppt, date: dateStr, time: `${h}:00`}); setModal('appt'); }}}>{appt && (<div className={`w-full h-full rounded-xl ${t.accentBg} p-2 shadow-lg flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform`}>
            <div><p className="text-xs font-black text-white truncate">{appt.name}</p><p className="text-[10px] text-white/80 truncate">{appt.treatment}</p></div>
            <div className="flex gap-1 justify-end">
                <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(appt.name), `Hola ${appt.name}, confirmamos su cita en ShiningCloud Dental para mañana a las ${appt.time}.`); }} className="text-[10px] bg-white/20 px-2 rounded hover:bg-white/30 text-white flex items-center gap-1"><MessageCircle size={10}/> Confirmar</button>
                <button onClick={(e)=>{e.stopPropagation(); supabase.from('appointments').delete().eq('id', appt.id).then(()=>setAppointments(appointments.filter(a=>a.id!==appt.id)))}} className="text-[10px] bg-black/20 px-2 rounded hover:bg-red-500 text-white">X</button>
            </div>
        </div>)}{!appt && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus size={14} className="opacity-50"/></div>}</div>) })}</React.Fragment>))}</div></div></div>}
        {activeTab === 'ficha' && !selectedPatientId && <div className="space-y-4 animate-in slide-in-from-bottom"><div className="flex gap-2"><PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => { if(p.id==='new') { const newId = p.name.trim().toLowerCase(); savePatientData(newId, getPatient(newId)); setSelectedPatientId(newId); } else { setSelectedPatientId(p.id); } }} placeholder="Buscar o Crear Paciente..." /></div><div className="grid gap-2">{Object.keys(patientRecords).map(k=>(<Card key={k} theme={themeMode} onClick={()=>setSelectedPatientId(k)} className="cursor-pointer py-4 flex justify-between items-center"><span className="font-bold capitalize">{k}</span><ArrowRight size={14}/></Card>))}</div></div>}
        
        {activeTab === 'ficha' && selectedPatientId && <div className="space-y-4 animate-in slide-in-from-right"><button onClick={()=>setSelectedPatientId(null)} className="flex items-center gap-2 text-xs font-bold opacity-50"><ArrowLeft size={14}/> VOLVER</button><h2 className="text-3xl font-black capitalize">{selectedPatientId}</h2><div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{[{id:'personal', label:'Datos', icon: User}, {id:'anamnesis', label:'Anamnesis', icon: FileQuestion}, {id:'clinical', label:'Odontograma', icon: Activity}, {id:'perio', label:'Periodontograma', icon: FileBarChart}, {id:'evolution', label:'Evolución', icon: FileText}, {id:'consent', label:'Consentimientos', icon: FileSignature}, {id:'images', label:'Galería', icon: ImageIcon}].map(b=>(<button key={b.id} onClick={()=>setPatientTab(b.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap ${patientTab===b.id?t.accentBg:'bg-white/5'}`}>{b.label}</button>))}</div>{patientTab === 'personal' && <Card theme={themeMode} className="space-y-4"><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Completo" value={getPatient(selectedPatientId).personal.legalName} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, legalName: e.target.value}})} /><InputField theme={themeMode} label="RUT / DNI" value={getPatient(selectedPatientId).personal.rut} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, rut: e.target.value}})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Email" icon={Mail} value={getPatient(selectedPatientId).personal.email} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, email: e.target.value}})} /><div className="flex items-end gap-2"><InputField theme={themeMode} label="Teléfono" icon={Phone} value={getPatient(selectedPatientId).personal.phone} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, phone: e.target.value}})} />{getPatient(selectedPatientId).personal.phone && <button onClick={()=>sendWhatsApp(getPatient(selectedPatientId).personal.phone, "Hola, me comunico de ShiningCloud Dental.")} className="p-3 bg-emerald-500 rounded-xl text-white mb-[2px]"><MessageCircle size={18}/></button>}</div></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Fecha Nacimiento" type="date" value={getPatient(selectedPatientId).personal.birthDate} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, birthDate: e.target.value}})} /><InputField theme={themeMode} label="Ocupación" value={getPatient(selectedPatientId).personal.occupation} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, occupation: e.target.value}})} /></div><InputField theme={themeMode} label="Dirección" icon={MapPin} value={getPatient(selectedPatientId).personal.address} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, address: e.target.value}})} /><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Ciudad" value={getPatient(selectedPatientId).personal.city} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, city: e.target.value}})} /><InputField theme={themeMode} label="Comuna" value={getPatient(selectedPatientId).personal.commune} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, commune: e.target.value}})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Previsión" value={getPatient(selectedPatientId).personal.convention} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, convention: e.target.value}})} /><InputField theme={themeMode} label="Apoderado (Si aplica)" value={getPatient(selectedPatientId).personal.guardian} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, guardian: e.target.value}})} /></div></Card>}{patientTab === 'anamnesis' && <Card theme={themeMode} className="space-y-4"><InputField theme={themeMode} textarea label="Motivo Consulta" value={getPatient(selectedPatientId).anamnesis?.recent || ''} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), anamnesis: {...getPatient(selectedPatientId).anamnesis, recent: e.target.value}})} /><InputField theme={themeMode} textarea label="Antecedentes Médicos" value={getPatient(selectedPatientId).anamnesis?.remote || ''} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), anamnesis: {...getPatient(selectedPatientId).anamnesis, remote: e.target.value}})} /></Card>}{patientTab === 'clinical' && <Card theme={themeMode} className="flex flex-col items-center gap-8"><div className="flex gap-2 flex-wrap justify-center">{TEETH_UPPER.map(n=><Tooth key={n} number={n} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}}); setModal('tooth');}} theme={themeMode}/>)}</div><div className="flex gap-2 flex-wrap justify-center">{TEETH_LOWER.map(n=><Tooth key={n} number={n} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}}); setModal('tooth');}} theme={themeMode}/>)}</div></Card>}{patientTab === 'perio' && <div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Card theme={themeMode} className="bg-red-500/10 border-red-500/20 text-center"><p className="text-red-500 font-bold text-xs uppercase">Índice Sangrado (BOP)</p><h2 className="text-4xl font-black text-red-500">{getPerioStats().bop}%</h2><p className="text-[10px] opacity-50">Calculado sobre 6 puntos</p></Card><Card theme={themeMode} className="bg-yellow-500/10 border-yellow-500/20 text-center"><p className="text-yellow-500 font-bold text-xs uppercase">Índice de Higiene</p><h2 className="text-4xl font-black text-yellow-500">{getPerioStats().plaque}%</h2><p className="text-[10px] opacity-50">O'Leary (4 caras)</p></Card></div><Card theme={themeMode} className="flex flex-col items-center gap-8"><div className="flex gap-2 flex-wrap justify-center">{TEETH_UPPER.map(n=><Tooth key={n} number={n} isPerioMode={true} perioData={getPatient(selectedPatientId).clinical.perio?.[n]} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = getPatient(selectedPatientId).clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {vd:'', v:'', vm:'', ld:'', l:'', lm:''}, bop: existing.bop || {vd:false, v:false, vm:false, ld:false, l:false, lm:false}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>)}</div><div className="flex gap-2 flex-wrap justify-center">{TEETH_LOWER.map(n=><Tooth key={n} number={n} isPerioMode={true} perioData={getPatient(selectedPatientId).clinical.perio?.[n]} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = getPatient(selectedPatientId).clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {vd:'', v:'', vm:'', ld:'', l:'', lm:''}, bop: existing.bop || {vd:false, v:false, vm:false, ld:false, l:false, lm:false}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>)}</div></Card><Card theme={themeMode} className="space-y-4"><h3 className="font-bold border-b border-white/10 pb-2">Tabla de Higiene (O'Leary)</h3><div className="overflow-x-auto pb-4"><div className="flex gap-2 min-w-max">{[...TEETH_UPPER, ...TEETH_LOWER].map(t => { const p = getPatient(selectedPatientId); if(p.clinical.teeth[t]?.status === 'missing') return null; return ( <HygieneCell key={t} tooth={t} data={p.clinical.hygiene?.[t]} onChange={(face) => { const current = p.clinical.hygiene?.[t] || {}; const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); }} /> ); })}</div></div><div className="flex gap-4 text-xs opacity-50"><span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"/> Placa</span><span className="flex items-center gap-1"><div className="w-3 h-3 bg-white/10 border border-white/20 rounded-sm"/> Limpio</span></div></Card></div>}
                {patientTab === 'evolution' && <div className="space-y-2"><div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}><textarea rows="3" placeholder="Escribir evolución..." className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`} value={newEvolution} onChange={e=>setNewEvolution(e.target.value)} /><div className="flex flex-col items-center gap-1"><button onClick={toggleVoice} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'text-stone-400 hover:text-cyan-400'}`}>{isListening ? <MicOff size={18}/> : <Mic size={18}/>}</button></div></div>{voiceStatus && <p className="text-[10px] text-right opacity-60 animate-pulse font-bold">{voiceStatus}</p>}<Button theme={themeMode} className="w-full" onClick={()=>{ const p=getPatient(selectedPatientId); const n={id:Date.now(), text:newEvolution, date:new Date().toLocaleDateString()}; savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, evolution: [n, ...(p.clinical.evolution||[])]}}); setNewEvolution(''); }}>GUARDAR</Button>{getPatient(selectedPatientId).clinical.evolution?.map(ev=>(<Card key={ev.id} theme={themeMode} className="py-3 text-xs"><div className="flex justify-between font-bold text-cyan-500 mb-1"><span>{ev.date}</span></div><p>{ev.text}</p></Card>))}</div>}
                {patientTab === 'consent' && <div className="space-y-4">{modal === 'sign' ? (<Card theme={themeMode} className="space-y-4"><h3 className="font-bold">{CONSENT_TEMPLATES[consentTemplate].title}</h3><textarea className="w-full h-48 bg-black/20 p-4 rounded-xl text-sm leading-relaxed outline-none border border-white/10 focus:border-emerald-500 transition-colors resize-none text-white" value={consentText} onChange={(e)=>setConsentText(e.target.value)} /><SignaturePad theme={themeMode} onSave={(sig)=>{ const p=getPatient(selectedPatientId); savePatientData(selectedPatientId, {...p, consents:[{id:Date.now(), type:CONSENT_TEMPLATES[consentTemplate].title, text:consentText, signature:sig}, ...(p.consents||[])]}); setModal(null); }} onCancel={()=>setModal(null)}/></Card>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Object.entries(CONSENT_TEMPLATES).map(([key, tpl]) => (<Card key={key} onClick={()=>{setConsentTemplate(key); setConsentText(tpl.text); setModal('sign');}} theme={themeMode} className="cursor-pointer hover:border-emerald-500 hover:scale-[1.02] transition-transform"><FileSignature className="text-emerald-500 mb-2"/><span className="font-bold text-sm block">{tpl.title}</span></Card>))}</div>)}<h3 className="font-bold pt-4 border-t border-white/10 mt-4">Historial</h3><div className="space-y-2">{(getPatient(selectedPatientId).consents || []).map(c => (<Card key={c.id} theme={themeMode} className="flex justify-between items-center py-3"><div><p className="font-bold text-sm">{c.type}</p><p className="text-[10px] opacity-50">{c.date}</p></div><div className="flex items-center gap-3"><div className="bg-white p-1 rounded"><img src={c.signature} className="h-8 object-contain" alt="Firma"/></div><button onClick={()=>generatePDF('consent', c)} className={`p-2 rounded-xl ${t.inputBg} hover:opacity-80`}><Printer size={16}/></button></div></Card>))}</div></div>}
                {patientTab === 'images' && <div className="space-y-6"><div className="flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-10 relative group hover:bg-white/5 transition-colors cursor-pointer"><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading}/>{uploading ? <Loader className="animate-spin text-cyan-400" size={30}/> : <div className="text-center"><Upload className="mx-auto mb-2 opacity-30"/><span className="text-xs font-bold opacity-50 uppercase tracking-widest">Subir Imagen</span></div>}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{getPatient(selectedPatientId).images?.map(img => (<div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-square border border-white/5"><img src={img.url} className="w-full h-full object-cover cursor-pointer" onClick={()=>setSelectedImg(img.url)}/><button onClick={async()=>{ const p=getPatient(selectedPatientId); const f = p.images.filter(i=>i.id!==img.id); await savePatientData(selectedPatientId, {...p, images:f}); notify("Eliminado"); }} className="absolute top-2 right-2 p-2 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>))}</div></div>}
            </div>
        }

        {/* --- TABS COMUNES (MANTENIDOS) --- */}
        {activeTab === 'clinical' && (userRole === 'admin' || userRole === 'dentist') && <Card theme={themeMode} className="space-y-4"><PatientSelect theme={themeMode} patients={patientRecords} onSelect={setRxPatient} placeholder="Seleccionar Paciente para Receta..." />{rxPatient && (<div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in"><div className={`w-12 h-12 rounded-full ${t.accentBg} flex items-center justify-center font-bold text-white`}>{rxPatient.personal.legalName[0]}</div><div><p className="font-bold">{rxPatient.personal.legalName}</p><p className="text-xs opacity-60">RUT: {rxPatient.personal.rut}</p></div></div>)}<div className="flex gap-2"><InputField theme={themeMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/><InputField theme={themeMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/><Button theme={themeMode} onClick={()=>{setPrescription([...prescription, medInput]); setMedInput({name:'', dosage:''});}}><Plus/></Button></div>{prescription.map((p,i)=>(<div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between text-xs"><span>{p.name} - {p.dosage}</span><X size={14} onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}/></div>))}<Button theme={themeMode} className="w-full" onClick={()=>generatePDF('rx', rxPatient)}><Printer/> GENERAR PDF</Button></Card>}
      </main>

      {/* MODAL DIENTE ODONTOGRAMA (5 CARAS) */}
      {modal === 'tooth' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <Card theme="dark" className="w-full max-w-sm space-y-4">
              <h3 className="text-2xl font-black text-center">Diente {toothModalData.id}</h3>
              <ToothFacesControl theme="dark" faces={toothModalData.faces} onChange={(face, status) => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [face]: status}})} />
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={()=>setToothModalData({...toothModalData, status: 'missing'})} className={`p-2 rounded-xl border text-[10px] font-bold uppercase ${toothModalData.status==='missing'?'border-red-500 text-red-500':'border-white/10'}`}>Ausente</button>
                  <button onClick={()=>setToothModalData({...toothModalData, faces: {v:null,l:null,m:null,d:null,o:null}, status:null})} className="p-2 bg-white/5 rounded-xl text-[10px] uppercase">Sano</button>
              </div>
              <InputField theme="dark" textarea label="Observaciones" placeholder="Ej: Fractura, mancha..." value={toothModalData.notes || ''} onChange={e=>setToothModalData({...toothModalData, notes: e.target.value})}/>
              <Button theme="dark" className="w-full" onClick={()=>{ 
                  const p = getPatient(selectedPatientId); 
                  const ut = {...p.clinical.teeth, [toothModalData.id]: {status: toothModalData.status, faces: toothModalData.faces, notes: toothModalData.notes}}; 
                  savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, teeth: ut}}); 
                  setModal(null); notify("Diente Guardado"); 
              }}>GUARDAR DATOS</Button>
          </Card>
      </div>}

      {/* MODAL DE ABONOS */}
      {modal === 'abono' && selectedFinancialRecord && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
              <Card theme="dark" className="w-full max-w-md space-y-6">
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
                      <div className="flex gap-2">
                          <InputField theme="dark" type="number" placeholder="$ Monto" value={paymentInput.amount} onChange={e=>setPaymentInput({...paymentInput, amount:e.target.value})} />
                          <select className="bg-transparent border border-white/10 rounded-xl px-2 text-xs font-bold outline-none text-white w-32" value={paymentInput.method} onChange={e=>setPaymentInput({...paymentInput, method:e.target.value})}><option className="bg-[#121212]">Efectivo</option><option className="bg-[#121212]">Transferencia</option><option className="bg-[#121212]">Tarjeta</option></select>
                      </div>
                      <Button theme="dark" className="w-full" onClick={async ()=>{
                          if(!paymentInput.amount) return;
                          const newPayment = { amount: Number(paymentInput.amount), method: paymentInput.method, date: new Date().toLocaleDateString() };
                          const currentPayments = selectedFinancialRecord.payments || [];
                          if (!selectedFinancialRecord.payments && selectedFinancialRecord.paid > 0) {
                              currentPayments.push({ amount: selectedFinancialRecord.paid, method: 'Legacy', date: selectedFinancialRecord.date });
                          }
                          const updatedPayments = [...currentPayments, newPayment];
                          const newTotalPaid = updatedPayments.reduce((s,p)=>s+p.amount, 0);
                          const nr = {...selectedFinancialRecord, paid: newTotalPaid, payments: updatedPayments}; 
                          setFinancialRecords(prev => prev.map(h => h.id === nr.id ? nr : h));
                          await saveToSupabase('financials', nr.id, nr); 
                          setModal(null); setPaymentInput({amount:'', method:'Efectivo', date:''}); notify("Abono Registrado");
                      }}>CONFIRMAR PAGO</Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                      <p className="text-[10px] font-bold opacity-50 uppercase">Historial de Pagos</p>
                      {(selectedFinancialRecord.payments || []).length > 0 ? (selectedFinancialRecord.payments.map((p, i) => (<div key={i} className="flex justify-between items-center text-xs p-2 border-b border-white/5 last:border-0"><div className="flex gap-2 items-center"><span className="opacity-50">{p.date}</span> <span className="font-bold">{p.method}</span></div><span className="font-bold text-emerald-400">+${p.amount.toLocaleString()}</span></div>))) : <p className="text-xs opacity-30 text-center">Sin abonos registrados.</p>}
                  </div>
              </Card>
          </div>
      )}

      {/* MODAL INVENTARIO */}
      {modal === 'addItem' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-xl">{newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}</h3><button onClick={()=>{setModal(null); if(newItem.id) setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); }}><X/></button></div><InputField theme="dark" placeholder="Nombre (ej: Anestesia)" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/><div className="flex gap-2"><InputField theme="dark" label="Stock" type="number" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:Number(e.target.value)})}/><InputField theme="dark" label="Mínimo" type="number" value={newItem.min} onChange={e=>setNewItem({...newItem, min:Number(e.target.value)})}/></div><div className="flex gap-2"><Button theme="dark" className="flex-1" onClick={async()=>{ if(newItem.name){ const id = newItem.id || Date.now().toString(); const itemData = { ...newItem, id }; let updatedInventory; if (newItem.id) { updatedInventory = inventory.map(i => i.id === id ? itemData : i); } else { updatedInventory = [...inventory, itemData]; } setInventory(updatedInventory); await saveToSupabase('inventory', id, itemData); setModal(null); setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); notify("Guardado"); }}}>GUARDAR</Button>{newItem.id && <button onClick={async()=>{ const filtered = inventory.filter(i=>i.id!==newItem.id); setInventory(filtered); await supabase.from('inventory').delete().eq('id', newItem.id); setModal(null); notify("Eliminado"); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Trash2 size={20}/></button>}</div></Card></div>}
      
      {/* OTROS MODALES DE SIEMPRE */}
      {modal === 'perio' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-md space-y-4"><h3 className="font-bold text-xl">Diente {toothModalData.id} (Perio)</h3><div className="grid grid-cols-2 gap-4"><InputField theme="dark" label="Movilidad (0-3)" value={perioData.mobility} onChange={e=>setPerioData({...perioData, mobility: e.target.value})}/><InputField theme="dark" label="Furca (I-III)" value={perioData.furcation} onChange={e=>setPerioData({...perioData, furcation: e.target.value})}/></div><div className="space-y-2"><p className="text-[10px] font-bold uppercase opacity-50 text-center">Vestibular</p><div className="grid grid-cols-3 gap-2 text-center">{['D', 'C', 'M'].map((pos, i) => { const k = ['vd','v','vm'][i]; return (<div key={k} className="space-y-1"><input className="w-full bg-white/5 rounded text-center text-xs p-2" placeholder={pos} value={perioData.pd[k]||''} onChange={e=>setPerioData({...perioData, pd: {...perioData.pd, [k]: e.target.value}})} /><div onClick={()=>setPerioData({...perioData, bop: {...perioData.bop, [k]: !perioData.bop[k]}})} className={`h-4 rounded cursor-pointer ${perioData.bop[k]?'bg-red-500':'bg-white/10'}`} title="Sangrado"></div></div>)})}</div></div><div className="space-y-2"><p className="text-[10px] font-bold uppercase opacity-50 text-center">{toothModalData.id < 30 ? 'Palatino' : 'Lingual'}</p><div className="grid grid-cols-3 gap-2 text-center">{['D', 'C', 'M'].map((pos, i) => { const k = ['ld','l','lm'][i]; return (<div key={k} className="space-y-1"><input className="w-full bg-white/5 rounded text-center text-xs p-2" placeholder={pos} value={perioData.pd[k]||''} onChange={e=>setPerioData({...perioData, pd: {...perioData.pd, [k]: e.target.value}})} /><div onClick={()=>setPerioData({...perioData, bop: {...perioData.bop, [k]: !perioData.bop[k]}})} className={`h-4 rounded cursor-pointer ${perioData.bop[k]?'bg-red-500':'bg-white/10'}`} title="Sangrado"></div></div>)})}</div></div><div onClick={()=>setPerioData({...perioData, pus: !perioData.pus})} className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${perioData.pus ? 'bg-yellow-500 text-black border-yellow-500' : 'border-white/10'}`}>{perioData.pus ? 'SUPURACIÓN (PUS)' : 'SIN PUS'}</div><Button theme="dark" className="w-full" onClick={()=>{ const p = getPatient(selectedPatientId); const newPerio = { ...p.clinical.perio, [toothModalData.id]: perioData }; savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: newPerio }}); setModal(null); notify("Datos Perio Guardados"); }}>GUARDAR DATOS</Button></Card></div>}
      {modal === 'appt' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm space-y-4"><h3 className="font-bold">Nueva Cita</h3><PatientSelect theme="dark" patients={patientRecords} onSelect={(p)=>setNewAppt({...newAppt, name: p.personal.legalName})} placeholder="Buscar Paciente..." /><InputField theme="dark" label="Tratamiento" value={newAppt.treatment} onChange={e=>setNewAppt({...newAppt, treatment:e.target.value})}/><div className="flex gap-2"><input type="date" className="bg-white/5 p-3 rounded-xl text-white outline-none flex-1" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/><input type="time" className="bg-white/5 p-3 rounded-xl text-white outline-none w-24" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/></div><Button theme="dark" className="w-full" onClick={async ()=>{ if(newAppt.name){ const id=Date.now().toString(); const nd={...newAppt, id}; setAppointments([...appointments, nd]); await saveToSupabase('appointments', id, nd); setModal(null); setNewAppt({name:'', treatment:'', date:'', time:''}); notify("Cita Agendada"); }}}>AGENDAR</Button><button onClick={()=>setModal(null)} className="w-full text-center text-xs opacity-50">Cancelar</button></Card></div>}
      {modal === 'loadPack' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm h-96 flex flex-col"><h3 className="font-bold mb-4">Cargar Protocolo</h3><div className="flex-1 overflow-y-auto space-y-2">{protocols.map(pr=>(<div key={pr.id} onClick={()=>{setSessionData({...sessionData, treatmentName:pr.name, baseCost:pr.totalCost}); setModal(null); notify("Pack Cargado");}} className="p-4 bg-white/5 rounded-xl cursor-pointer hover:border-cyan-400 border border-transparent"><p className="font-bold">{pr.name}</p><p className="text-cyan-400">${pr.totalCost}</p></div>))}</div><button onClick={()=>setModal(null)} className="mt-4 text-xs opacity-50">Cerrar</button></Card></div>}
      
      {selectedImg && <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4" onClick={()=>setSelectedImg(null)}><img src={selectedImg} className="max-w-full max-h-[85%] rounded-xl shadow-2xl animate-in zoom-in"/><span className="mt-4 text-white font-bold opacity-50">CLICK PARA CERRAR</span></div>}
    </div>
  );
}