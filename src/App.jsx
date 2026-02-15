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
  ChevronLeft, ChevronRight, Users, Clock, DollarSign
} from 'lucide-react';
import { supabase } from './supabase';

// --- TEMAS ---
const THEMES = {
  dark: {
    bg: 'bg-[#050505]', text: 'text-white', card: 'bg-[#121212]/90 border border-white/10 shadow-2xl',
    accent: 'text-[#D4AF37]', accentBg: 'bg-[#D4AF37]', inputBg: 'bg-white/5 border-white/5 focus-within:border-[#D4AF37]',
    subText: 'text-stone-400', gradient: 'bg-gradient-to-br from-[#D4AF37] to-[#B69121]', buttonSecondary: 'bg-white/5 border-white/10 text-white'
  },
  light: {
    bg: 'bg-[#FAFAFA]', text: 'text-stone-800', card: 'bg-white border-stone-200 shadow-xl',
    accent: 'text-amber-600', accentBg: 'bg-amber-500', inputBg: 'bg-stone-100 focus-within:bg-white focus-within:border-amber-500',
    subText: 'text-stone-500', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', buttonSecondary: 'bg-stone-100 border-stone-200 text-stone-600'
  },
  blue: {
    bg: 'bg-[#0a192f]', text: 'text-white', card: 'bg-[#112240]/90 border-cyan-500/20 shadow-cyan-900/20 shadow-2xl',
    accent: 'text-cyan-400', accentBg: 'bg-cyan-500', inputBg: 'bg-[#1d2d50] border-transparent focus-within:border-cyan-400',
    subText: 'text-slate-400', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-600', buttonSecondary: 'bg-white/5 border-white/10 text-cyan-400'
  }
};

// --- COMPONENTES UI ---
const Tooth = ({ number, status, onClick, theme, isPerioMode, perioData }) => {
  const currentTheme = THEMES[theme] ? theme : 'dark';
  const isMissing = status === 'missing';
  if (isPerioMode && isMissing) return <div className="flex flex-col items-center gap-1 opacity-20 pointer-events-none grayscale"><svg width="35" height="45" viewBox="0 0 100 120"><path d="M20 30C20 15 35 5 50 5C65 5 80 15 80 30V50C80 70 75 80 70 95C68 105 60 115 50 115C40 115 32 105 30 95C25 80 20 70 20 50V30Z" fill="#000" stroke="currentColor" strokeWidth="2"/></svg><span className="text-[9px] font-bold">AUS</span></div>;
  const getColor = () => { if (status === 'caries') return '#ef4444'; if (status === 'filled') return '#3b82f6'; if (status === 'missing') return '#000000'; if (status === 'crown') return '#eab308'; return currentTheme === 'light' ? '#333' : '#fff'; };
  const hasBOP = perioData && Object.values(perioData.bop || {}).some(v => v === true);
  const hasPus = perioData?.pus;
  const hasAlert = (perioData?.mobility > 1) || (perioData?.furcation > 1);
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative">
      <svg width="35" height="45" viewBox="0 0 100 120"><path d="M20 30C20 15 35 5 50 5C65 5 80 15 80 30V50C80 70 75 80 70 95C68 105 60 115 50 115C40 115 32 105 30 95C25 80 20 70 20 50V30Z" fill={getColor()} fillOpacity={status ? 1 : 0.15} stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/></svg>
      {isPerioMode && (<div className="absolute -top-2 flex gap-1">{hasBOP && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>}{hasPus && <div className="w-2 h-2 rounded-full bg-yellow-400"/>}{hasAlert && <div className="w-2 h-2 rounded-full bg-purple-500"/>}</div>)}
      <span className="text-[9px] font-bold opacity-50">{number}</span>
    </div>
  );
};

const HygieneCell = ({ tooth, data, onChange, status }) => {
    if (status === 'missing') return null;
    return (<div className="flex flex-col items-center gap-1 bg-white/5 p-2 rounded-xl"><span className="text-[10px] font-bold opacity-70">{tooth}</span><div className="grid grid-cols-2 gap-1 w-12 h-12">{['v', 'd', 'l', 'm'].map(f => (<div key={f} onClick={() => onChange(f)} className={`rounded-sm cursor-pointer border border-white/10 transition-colors ${data?.[f] ? 'bg-red-500 border-red-500' : 'hover:bg-white/10'}`}></div>))}</div></div>);
};

const Card = ({ children, className = "", theme, ...props }) => {
  const t = THEMES[theme] || THEMES.dark;
  return <div {...props} className={`p-6 rounded-3xl transition-all relative ${t.card} ${className}`}>{children}</div>;
};

const Button = ({ onClick, children, variant = "primary", className = "", theme }) => {
  const t = THEMES[theme] || THEMES.dark;
  const styles = { primary: `${t.gradient} text-white shadow-lg`, secondary: t.buttonSecondary };
  return <button onClick={onClick} className={`p-3 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 text-sm ${styles[variant]} ${className}`}>{children}</button>;
};

const InputField = ({ label, icon: Icon, theme, textarea, ...props }) => {
  const t = THEMES[theme] || THEMES.dark;
  return (<div className="w-full">{label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 ${t.subText}`}>{label}</label>}<div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>{Icon && <Icon size={16} className={`mr-2 mt-0.5 ${t.subText}`}/>}{textarea ? <textarea {...props} rows="3" className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`}/> : <input {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${t.text}`}/>}</div></div>);
};

const PatientSelect = ({ theme, patients, onSelect, placeholder = "Buscar Paciente..." }) => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const results = useMemo(() => { if (!query) return []; return Object.values(patients).filter(p => p.personal?.legalName?.toLowerCase().includes(query.toLowerCase()) || p.personal?.rut?.includes(query)); }, [query, patients]);
    const t = THEMES[theme] || THEMES.dark;
    return (
        <div className="relative w-full z-20">
            <InputField theme={theme} icon={Search} placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
            {showResults && query && (<div className={`absolute left-0 right-0 top-full mt-2 rounded-xl border max-h-48 overflow-y-auto shadow-xl ${t.card}`}>{results.length > 0 ? results.map(p => (<div key={p.id} onClick={() => { onSelect(p); setQuery(p.personal.legalName); setShowResults(false); }} className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"><p className="font-bold text-sm">{p.personal.legalName}</p><p className="text-[10px] opacity-50 font-mono">{p.personal.rut}</p></div>)) : (<div className="p-3 text-xs opacity-50">No encontrado. <span className="underline cursor-pointer font-bold" onClick={()=>{const newP = {id:'new', personal:{legalName:query}}; onSelect(newP); setShowResults(false);}}>Crear nuevo "{query}"</span></div>)}</div>)}
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

export default function App() {
  const [session, setSession] = useState(null);
  const [themeMode, setThemeMode] = useState(() => THEMES[localStorage.getItem('sc_theme_mode')] ? localStorage.getItem('sc_theme_mode') : 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // DATA
  const [config, setConfigLocal] = useState({ logo: null, hourlyRate: 25000, profitMargin: 30, bankName: "", rut: "", name: "Dr. Benjamín", phone: "", email: "", address: "", specialty: "" });
  const [protocols, setProtocols] = useState([]);
  const [history, setHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientRecords, setPatientRecords] = useState({});

  // UI
  const [sessionData, setSessionData] = useState({ patientName: '', treatmentName: '', clinicalTime: 60, baseCost: 0, patientId: null });
  const [prescription, setPrescription] = useState([]);
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '' });
  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // MODAL STATES
  const [toothModalData, setToothModalData] = useState({ id: null, status: null, history: [], notes: '' });
  const [perioData, setPerioData] = useState({ pd: { vd:'', v:'', vm:'', ld:'', l:'', lm:'' }, bop: { vd:false, v:false, vm:false, ld:false, l:false, lm:false }, pus: false, mobility: 0, furcation: 0 }); 
  const [rxPatient, setRxPatient] = useState(null);
  const [newEvolution, setNewEvolution] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [notification, setNotification] = useState('');
  const logoInputRef = useRef(null);

  // EFFECT
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setSession(session)); supabase.auth.onAuthStateChange((_e, s) => setSession(s)); }, []);
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const { data: s } = await supabase.from('settings').select('*').eq('id', 'general').single(); if (s) setConfigLocal(s.data);
      const { data: p } = await supabase.from('patients').select('*'); if (p) { const m = {}; p.forEach(r => m[r.id] = r.data); setPatientRecords(m); }
      const { data: a } = await supabase.from('appointments').select('*'); if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));
      const { data: f } = await supabase.from('financials').select('*'); if (f) setHistory(f.map(r => ({ ...r.data, id: r.id })));
      const { data: pk } = await supabase.from('packs').select('*'); if (pk) setProtocols(pk.map(r => ({ ...r.data, id: r.id })));
    };
    load();
  }, [session]);

  const notify = (m) => { setNotification(m); setTimeout(() => setNotification(''), 3000); };
  const toggleTheme = () => { const n = themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'blue' : 'dark'; setThemeMode(n); localStorage.setItem('sc_theme_mode', n); };
  const saveToSupabase = async (t, id, d) => { await supabase.from(t).upsert({ id: id.toString(), data: d }); };
  const getPatient = (id) => patientRecords[id] || { id, personal: { legalName: id }, anamnesis: {}, clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, images: [] };
  const savePatientData = async (id, d) => { setPatientRecords(prev => ({...prev, [id]: d})); await saveToSupabase('patients', id, d); };
  const getAge = (dateString) => { if(!dateString) return 'S/I'; const today = new Date(); const birthDate = new Date(dateString); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--; return age; };
  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => { const newConfig = { ...config, logo: reader.result }; setConfigLocal(newConfig); saveToSupabase('settings', 'general', newConfig); notify("Logo Actualizado"); }; reader.readAsDataURL(file); };
  const currentTotal = useMemo(() => { const time = parseFloat(sessionData.clinicalTime) || 0; const base = parseFloat(sessionData.baseCost) || 0; const hourly = parseFloat(config.hourlyRate) || 0; const margin = parseFloat(config.profitMargin) || 0; const cost = (hourly / 60) * time + base; return Math.round(cost / (1 - margin / 100)); }, [sessionData, config]);
  const totalInvoiced = history.reduce((a, b) => a + (Number(b.total) || 0), 0);
  const totalCollected = history.reduce((a, b) => a + (Number(b.paid) || 0), 0);
  const getPerioStats = () => { if (!selectedPatientId) return { bop: 0, plaque: 0, totalTeeth: 0 }; const p = getPatient(selectedPatientId); let totalSites = 0; let bopSites = 0; let totalHygieneFaces = 0; let plaqueFaces = 0; [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => { if (p.clinical.teeth[t]?.status !== 'missing') { totalSites += 6; const toothPerio = p.clinical.perio?.[t] || {}; if (toothPerio.bop) Object.values(toothPerio.bop).forEach(v => { if(v) bopSites++; }); totalHygieneFaces += 4; const toothHygiene = p.clinical.hygiene?.[t] || {}; Object.values(toothHygiene).forEach(v => { if(v) plaqueFaces++; }); } }); return { bop: totalSites > 0 ? Math.round((bopSites / totalSites) * 100) : 0, plaque: totalHygieneFaces > 0 ? Math.round((plaqueFaces / totalHygieneFaces) * 100) : 0, totalTeeth: totalSites / 6 }; };
  const generatePDF = (type, patientOverride = null) => { const doc = new jsPDF(); const primaryColor = themeMode === 'blue' ? [6, 182, 212] : [212, 175, 55]; doc.setFillColor(...primaryColor); doc.rect(0, 0, 210, 5, 'F'); if (config.logo) doc.addImage(config.logo, 'PNG', 15, 15, 25, 25); doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text(config.name?.toUpperCase() || "DOCTOR", 200, 25, { align: 'right' }); doc.setFontSize(10); doc.setFont("helvetica", "normal"); const info = [`RUT: ${config.rut || ''}`, config.specialty || '', config.email || '', config.phone || '', config.address || ''].filter(Boolean); let y = 32; info.forEach(l => { doc.text(l, 200, y, { align: 'right' }); y += 5; }); doc.setDrawColor(...primaryColor); doc.line(15, 55, 195, 55); doc.setFontSize(16); doc.setTextColor(...primaryColor); doc.setFont("helvetica", "bold"); doc.text(type === 'rx' ? 'RECETA MÉDICA' : 'PRESUPUESTO DENTAL', 105, 70, { align: 'center' }); const pData = patientOverride || (sessionData.patientId ? patientRecords[sessionData.patientId] : null); const pName = pData ? pData.personal.legalName : (sessionData.patientName || selectedPatientId || '...'); const pRut = pData ? pData.personal.rut : ''; const pAge = pData ? getAge(pData.personal.birthDate) + ' años' : ''; const pAddress = pData ? pData.personal.address : ''; doc.setFillColor(245, 245, 245); doc.rect(15, 80, 180, 25, 'F'); doc.setFontSize(10); doc.setTextColor(50); doc.text(`PACIENTE: ${pName}`, 20, 90); doc.text(`RUT: ${pRut}`, 120, 90); doc.text(`EDAD: ${pAge}`, 20, 98); doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 120, 98); if(pAddress) doc.text(`DIRECCIÓN: ${pAddress}`, 20, 106, { maxWidth: 160 }); if (type === 'rx') { autoTable(doc, { startY: 115, head: [['MEDICAMENTO', 'INDICACIÓN']], body: prescription.map(p => [p.name, p.dosage]), theme: 'grid', headStyles: { fillColor: primaryColor } }); } else { autoTable(doc, { startY: 115, head: [['TRATAMIENTO', 'VALOR']], body: [[sessionData.treatmentName || 'Tratamiento', `$${currentTotal.toLocaleString()}`]], theme: 'grid', headStyles: { fillColor: primaryColor } }); doc.setFontSize(14); doc.text(`TOTAL: $${currentTotal.toLocaleString()}`, 195, doc.lastAutoTable.finalY + 15, { align: 'right' }); } doc.setFontSize(8); doc.setTextColor(150); doc.text("Generado por ShiningCloud", 105, 280, { align: 'center' }); doc.save(`${type}_${pName.replace(/\s/g,'_')}.pdf`); notify("PDF Generado"); };
  const downloadExcel = () => { const ws = XLSX.utils.json_to_sheet(history); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Caja"); XLSX.writeFile(wb, "Reporte_Caja.xlsx"); notify("Excel Descargado"); };
  const getDaysInWeek = (date) => { const s=new Date(date); s.setDate(s.getDate()-s.getDay()+1); return Array.from({length:7}, (_,i)=>{const d=new Date(s); d.setDate(s.getDate()+i); return d;}); };
  const weekDays = getDaysInWeek(currentDate); const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  // DASHBOARD METRICS
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(a => a.date === today).sort((a,b) => a.time.localeCompare(b.time));
  const todaysIncome = history.filter(h => h.payments?.some(p => p.date === new Date().toLocaleDateString())).reduce((acc, h) => { const dailyPay = h.payments.filter(p => p.date === new Date().toLocaleDateString()).reduce((s, p) => s + p.amount, 0); return acc + dailyPay; }, 0);

  if (!session) return <AuthScreen />;
  const t = THEMES[themeMode] || THEMES.dark;

  return (
    <div className={`min-h-screen flex ${t.bg} ${t.text} transition-all font-sans`}>
      
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={()=>setMobileMenuOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform ${t.card} border-r`}>
        <div className="p-8 border-b border-white/5 flex items-center gap-2 relative">
            <button onClick={()=>setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 opacity-50"><X/></button>
            {config.logo ? <img src={config.logo} className="w-8 h-8 rounded bg-white/10 object-contain"/> : <Cloud className={t.accent} size={24}/>}<h1 className="text-xl font-black">ShiningCloud</h1>
        </div>
        <nav className="p-4 space-y-1">{[{ id: 'dashboard', label: 'Inicio', icon: TrendingUp }, { id: 'agenda', label: 'Agenda', icon: CalendarClock }, { id: 'ficha', label: 'Pacientes', icon: User }, { id: 'quote', label: 'Cotizador', icon: Calculator }, { id: 'history', label: 'Caja', icon: Wallet }, { id: 'clinical', label: 'Recetas', icon: Stethoscope }, { id: 'settings', label: 'Ajustes', icon: Settings }].map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatientId(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-xs uppercase ${activeTab === item.id ? `${t.accentBg} text-white` : 'opacity-50 hover:opacity-100'}`}><item.icon size={18}/> {item.label}</button>))}</nav>
        <div className="absolute bottom-4 w-full px-4 space-y-2"><button onClick={toggleTheme} className="w-full p-3 rounded-xl bg-white/5 flex items-center justify-center gap-2 text-xs font-bold">{themeMode==='dark'?<Moon size={14}/>:themeMode==='light'?<Sun size={14}/>:<Droplets size={14}/>} TEMA</button><button onClick={()=>supabase.auth.signOut()} className="w-full p-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs"><LogOut size={14} className="inline mr-2"/> SALIR</button></div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 h-screen overflow-y-auto">
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between mb-6">
           <button onClick={()=>setMobileMenuOpen(true)} className={`p-2 rounded-xl ${t.inputBg}`}><Menu/></button>
           <span className="font-black text-lg">ShiningCloud</span>
           <div className="w-8"></div>
        </div>

        {notification && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-cyan-500 text-white px-6 py-2 rounded-full font-bold animate-bounce">{notification}</div>}

        {/* DASHBOARD COCKPIT */}
        {activeTab === 'dashboard' && <div className="space-y-8 animate-in fade-in">
            <div><h1 className="text-4xl font-black mb-1">Hola, {config.name.split(' ')[0]} 👋</h1><p className="opacity-50 font-bold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card theme={themeMode} className="bg-emerald-500/10 border-emerald-500/20"><div className="flex justify-between items-center mb-4"><div className="p-3 bg-emerald-500 rounded-xl text-white"><DollarSign/></div><span className="text-xs font-bold uppercase text-emerald-500">Ingresos Hoy</span></div><h2 className="text-4xl font-black">${todaysIncome.toLocaleString()}</h2></Card><Card theme={themeMode} className="bg-blue-500/10 border-blue-500/20"><div className="flex justify-between items-center mb-4"><div className="p-3 bg-blue-500 rounded-xl text-white"><Users/></div><span className="text-xs font-bold uppercase text-blue-500">Pacientes Totales</span></div><h2 className="text-4xl font-black">{Object.keys(patientRecords).length}</h2></Card><Card theme={themeMode} className="bg-purple-500/10 border-purple-500/20"><div className="flex justify-between items-center mb-4"><div className="p-3 bg-purple-500 rounded-xl text-white"><Clock/></div><span className="text-xs font-bold uppercase text-purple-500">Citas Hoy</span></div><h2 className="text-4xl font-black">{todaysAppointments.length}</h2></Card></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-4"><h3 className="font-bold text-lg flex items-center gap-2"><CalendarClock className={t.accent} size={20}/> Agenda de Hoy</h3><div className="space-y-2">{todaysAppointments.length === 0 ? (<div className="p-8 border border-dashed border-white/10 rounded-2xl text-center opacity-50"><p>No tienes pacientes hoy.</p><Button theme={themeMode} className="mx-auto mt-4" onClick={()=>setModal('appt')}>Agendar Cita</Button></div>) : (todaysAppointments.map(a => (<div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 ${t.card} hover:scale-[1.01] transition-transform`}><div className={`p-3 rounded-xl font-black text-white ${t.accentBg}`}>{a.time}</div><div className="flex-1"><h4 className="font-bold">{a.name}</h4><p className="text-xs opacity-50">{a.treatment}</p></div><button className="p-2 bg-white/5 rounded-xl hover:bg-white/10"><ArrowRight size={16}/></button></div>)))}</div></div><div className="space-y-6"><h3 className="font-bold text-lg">Accesos Rápidos</h3><div className="grid grid-cols-2 gap-3"><button onClick={()=>setModal('appt')} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all"><CalendarClock size={24} className={t.accent}/><span className="text-xs font-bold">Agendar</span></button><button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null); setSearchTerm('');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all"><User size={24} className={t.accent}/><span className="text-xs font-bold">Paciente</span></button><button onClick={()=>{setActiveTab('quote'); setQuoteMode('calc');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all"><Calculator size={24} className={t.accent}/><span className="text-xs font-bold">Cotizar</span></button><button onClick={()=>{setActiveTab('history');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all"><Wallet size={24} className={t.accent}/><span className="text-xs font-bold">Cobrar</span></button></div></div></div>
        </div>}

        {/* AGENDA SEMANAL */}
        {activeTab === 'agenda' && <div className="space-y-4 h-full flex flex-col"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-4"><h2 className="text-2xl font-bold">Agenda Semanal</h2><div className="flex items-center gap-2 bg-white/5 rounded-xl p-1"><button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d)}} className="p-2 hover:bg-white/10 rounded"><ChevronLeft size={16}/></button><button onClick={()=>setCurrentDate(new Date())} className="text-xs font-bold px-2">HOY</button><button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d)}} className="p-2 hover:bg-white/10 rounded"><ChevronRight size={16}/></button></div></div><Button theme={themeMode} onClick={()=>setModal('appt')}><Plus/> Agendar</Button></div><div className="flex-1 overflow-auto bg-white/5 rounded-2xl border border-white/5"><div className="grid grid-cols-8 min-w-[800px]"><div className="p-4 border-b border-r border-white/5 text-xs font-bold text-center opacity-50">HORA</div>{weekDays.map(d => (<div key={d} className={`p-4 border-b border-white/5 text-center ${d.toDateString()===new Date().toDateString() ? t.accent : ''}`}><p className="text-xs font-bold opacity-70">{['LUN','MAR','MIE','JUE','VIE','SAB','DOM'][d.getDay()===0?6:d.getDay()-1]}</p><p className="text-xl font-black">{d.getDate()}</p></div>))}{hours.map(h => (<React.Fragment key={h}><div className="p-2 border-r border-b border-white/5 text-xs font-bold opacity-50 text-center h-24">{h}:00</div>{weekDays.map(d => { const dateStr = d.toISOString().split('T')[0]; const appt = appointments.find(a => a.date === dateStr && parseInt(a.time.split(':')[0]) === h); return (<div key={d+h} className={`border-b border-white/5 relative group h-24 transition-all hover:bg-white/5 ${appt ? 'p-1' : 'cursor-pointer'}`} onClick={()=>{if(!appt) { setNewAppt({...newAppt, date: dateStr, time: `${h}:00`}); setModal('appt'); }}}>{appt && (<div className={`w-full h-full rounded-xl ${t.accentBg} p-2 shadow-lg flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform`}><div><p className="text-xs font-black text-white truncate">{appt.name}</p><p className="text-[10px] text-white/80 truncate">{appt.treatment}</p></div><button onClick={(e)=>{e.stopPropagation(); supabase.from('appointments').delete().eq('id', appt.id).then(()=>setAppointments(appointments.filter(a=>a.id!==appt.id)))}} className="text-[10px] bg-black/20 self-end px-2 rounded hover:bg-red-500 text-white">X</button></div>)}{!appt && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus size={14} className="opacity-50"/></div>}</div>) })}</React.Fragment>))}</div></div></div>}

        {/* PACIENTES */}
        {activeTab === 'ficha' && !selectedPatientId && <div className="space-y-4">
          <div className="flex gap-2">
              <PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => { if(p.id==='new') savePatientData(searchTerm.toLowerCase(), getPatient(searchTerm.toLowerCase())); setSelectedPatientId(p.id==='new'?searchTerm.toLowerCase():p.id); }} placeholder="Buscar o Crear Paciente..." />
          </div>
          <div className="grid gap-2">{Object.keys(patientRecords).map(k=>(<Card key={k} theme={themeMode} onClick={()=>setSelectedPatientId(k)} className="cursor-pointer py-4 flex justify-between items-center"><span className="font-bold capitalize">{k}</span><ArrowRight size={14}/></Card>))}</div>
        </div>}

        {activeTab === 'ficha' && selectedPatientId && <div className="space-y-4">
          <button onClick={()=>setSelectedPatientId(null)} className="flex items-center gap-2 text-xs font-bold opacity-50"><ArrowLeft size={14}/> VOLVER</button>
          <h2 className="text-3xl font-black capitalize">{selectedPatientId}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[{id:'personal', label:'Datos', icon: User}, {id:'anamnesis', label:'Anamnesis', icon: FileQuestion}, {id:'clinical', label:'Odontograma', icon: Activity}, {id:'perio', label:'Periodontograma', icon: FileBarChart}, {id:'evolution', label:'Evolución', icon: FileText}, {id:'images', label:'Galería', icon: ImageIcon}].map(b=>(<button key={b.id} onClick={()=>setPatientTab(b.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap ${patientTab===b.id?t.accentBg:'bg-white/5'}`}>{b.label}</button>))}
          </div>

          {/* DATOS COMPLETOS */}
          {patientTab === 'personal' && <Card theme={themeMode} className="space-y-4">
             <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Completo" value={getPatient(selectedPatientId).personal.legalName} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, legalName: e.target.value}})} /><InputField theme={themeMode} label="RUT / DNI" value={getPatient(selectedPatientId).personal.rut} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, rut: e.target.value}})} /></div>
             <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Email" icon={Mail} value={getPatient(selectedPatientId).personal.email} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, email: e.target.value}})} /><InputField theme={themeMode} label="Teléfono" icon={Phone} value={getPatient(selectedPatientId).personal.phone} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, phone: e.target.value}})} /></div>
             <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Fecha Nacimiento" type="date" value={getPatient(selectedPatientId).personal.birthDate} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, birthDate: e.target.value}})} /><InputField theme={themeMode} label="Ocupación" value={getPatient(selectedPatientId).personal.occupation} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, occupation: e.target.value}})} /></div>
             <InputField theme={themeMode} label="Dirección" icon={MapPin} value={getPatient(selectedPatientId).personal.address} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, address: e.target.value}})} />
             <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Ciudad" value={getPatient(selectedPatientId).personal.city} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, city: e.target.value}})} /><InputField theme={themeMode} label="Comuna" value={getPatient(selectedPatientId).personal.commune} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, commune: e.target.value}})} /></div>
             <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Previsión" value={getPatient(selectedPatientId).personal.convention} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, convention: e.target.value}})} /><InputField theme={themeMode} label="Apoderado (Si aplica)" value={getPatient(selectedPatientId).personal.guardian} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, guardian: e.target.value}})} /></div>
          </Card>}
          {patientTab === 'anamnesis' && <Card theme={themeMode} className="space-y-4"><InputField theme={themeMode} textarea label="Motivo Consulta" value={getPatient(selectedPatientId).anamnesis.recent} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), anamnesis: {...getPatient(selectedPatientId).anamnesis, recent: e.target.value}})} /><InputField theme={themeMode} textarea label="Antecedentes Médicos" value={getPatient(selectedPatientId).anamnesis.remote} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), anamnesis: {...getPatient(selectedPatientId).anamnesis, remote: e.target.value}})} /></Card>}

          {/* ODONTOGRAMA */}
          {patientTab === 'clinical' && <Card theme={themeMode} className="flex flex-col items-center gap-8">
            <div className="flex gap-2 flex-wrap justify-center">{TEETH_UPPER.map(n=><Tooth key={n} number={n} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n, ...getPatient(selectedPatientId).clinical.teeth[n]}); setModal('tooth');}} theme={themeMode}/>)}</div>
            <div className="flex gap-2 flex-wrap justify-center">{TEETH_LOWER.map(n=><Tooth key={n} number={n} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n, ...getPatient(selectedPatientId).clinical.teeth[n]}); setModal('tooth');}} theme={themeMode}/>)}</div>
          </Card>}

          {/* PERIODONTOGRAMA VISUAL */}
          {patientTab === 'perio' && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <Card theme={themeMode} className="bg-red-500/10 border-red-500/20 text-center"><p className="text-red-500 font-bold text-xs uppercase">Índice Sangrado (BOP)</p><h2 className="text-4xl font-black text-red-500">{getPerioStats().bop}%</h2><p className="text-[10px] opacity-50">Calculado sobre 6 puntos</p></Card>
                 <Card theme={themeMode} className="bg-yellow-500/10 border-yellow-500/20 text-center"><p className="text-yellow-500 font-bold text-xs uppercase">Índice de Higiene</p><h2 className="text-4xl font-black text-yellow-500">{getPerioStats().plaque}%</h2><p className="text-[10px] opacity-50">O'Leary (4 caras)</p></Card>
            </div>
            
            <Card theme={themeMode} className="flex flex-col items-center gap-8">
               <div className="flex gap-2 flex-wrap justify-center">{TEETH_UPPER.map(n=><Tooth key={n} number={n} isPerioMode={true} perioData={getPatient(selectedPatientId).clinical.perio?.[n]} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = getPatient(selectedPatientId).clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {vd:'', v:'', vm:'', ld:'', l:'', lm:''}, bop: existing.bop || {vd:false, v:false, vm:false, ld:false, l:false, lm:false}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>)}</div>
               <div className="flex gap-2 flex-wrap justify-center">{TEETH_LOWER.map(n=><Tooth key={n} number={n} isPerioMode={true} perioData={getPatient(selectedPatientId).clinical.perio?.[n]} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = getPatient(selectedPatientId).clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {vd:'', v:'', vm:'', ld:'', l:'', lm:''}, bop: existing.bop || {vd:false, v:false, vm:false, ld:false, l:false, lm:false}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>)}</div>
            </Card>

            {/* TABLA DE HIGIENE (O'LEARY) */}
            <Card theme={themeMode} className="space-y-4">
                <h3 className="font-bold border-b border-white/10 pb-2">Tabla de Higiene (O'Leary)</h3>
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-2 min-w-max">
                        {[...TEETH_UPPER, ...TEETH_LOWER].map(t => {
                            const p = getPatient(selectedPatientId);
                            if(p.clinical.teeth[t]?.status === 'missing') return null;
                            return ( <HygieneCell key={t} tooth={t} data={p.clinical.hygiene?.[t]} onChange={(face) => { const current = p.clinical.hygiene?.[t] || {}; const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); }} /> );
                        })}
                    </div>
                </div>
                <div className="flex gap-4 text-xs opacity-50"><span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"/> Placa</span><span className="flex items-center gap-1"><div className="w-3 h-3 bg-white/10 border border-white/20 rounded-sm"/> Limpio</span></div>
            </Card>
          </div>}

          {patientTab === 'evolution' && <div className="space-y-2"><InputField theme={themeMode} textarea placeholder="Escribir evolución..." value={newEvolution} onChange={e=>setNewEvolution(e.target.value)} /><Button theme={themeMode} className="w-full" onClick={()=>{ const p=getPatient(selectedPatientId); const n={id:Date.now(), text:newEvolution, date:new Date().toLocaleDateString()}; savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, evolution: [n, ...(p.clinical.evolution||[])]}}); setNewEvolution(''); }}>GUARDAR</Button>{getPatient(selectedPatientId).clinical.evolution?.map(ev=>(<Card key={ev.id} theme={themeMode} className="py-3 text-xs"><div className="flex justify-between font-bold text-cyan-500 mb-1"><span>{ev.date}</span></div><p>{ev.text}</p></Card>))}</div>}
          {patientTab === 'images' && <div className="grid grid-cols-2 gap-2"><Card theme={themeMode} className="border-dashed flex items-center justify-center p-10"><Upload/></Card></div>}
        </div>}

        {activeTab === 'quote' && <div className="space-y-4">
            <div className="flex bg-white/5 p-1 rounded-xl mb-4"><button onClick={()=>setQuoteMode('calc')} className={`flex-1 p-2 rounded-lg text-xs font-bold ${quoteMode==='calc'?t.accentBg:'opacity-50'}`}>Calculadora</button><button onClick={()=>setQuoteMode('packs')} className={`flex-1 p-2 rounded-lg text-xs font-bold ${quoteMode==='packs'?t.accentBg:'opacity-50'}`}>Packs</button></div>
            {quoteMode === 'calc' ? (<Card theme={themeMode} className="space-y-4"><Button theme={themeMode} variant="secondary" onClick={()=>setModal('loadPack')}>CARGAR PACK</Button><PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => setSessionData({...sessionData, patientName: p.personal.legalName, patientId: p.id})} placeholder="Buscar Paciente..." /><div className="grid grid-cols-2 gap-2"><InputField theme={themeMode} label="Minutos" type="number" value={sessionData.clinicalTime} onChange={e=>setSessionData({...sessionData, clinicalTime:e.target.value})} /><InputField theme={themeMode} label="Costos" type="number" value={sessionData.baseCost} onChange={e=>setSessionData({...sessionData, baseCost:e.target.value})} /></div><div className="text-center py-6"><h3 className="text-5xl font-black text-cyan-400">${currentTotal.toLocaleString()}</h3></div><div className="grid grid-cols-2 gap-2"><Button theme={themeMode} onClick={()=>{ const id=Date.now().toString(); saveToSupabase('financials', id, {id, total:currentTotal, paid:0, patientName:sessionData.patientName, date:new Date().toLocaleDateString()}); notify("Guardado en Caja"); }}>GUARDAR</Button><Button theme={themeMode} variant="secondary" onClick={()=>generatePDF('quote')}><Printer/></Button></div></Card>) : (<Card theme={themeMode} className="space-y-4"><h3 className="font-bold">Crear Nuevo Pack</h3><InputField theme={themeMode} label="Nombre Pack" value={newPack.name} onChange={e=>setNewPack({...newPack, name:e.target.value})} /><div className="flex gap-2"><InputField theme={themeMode} placeholder="Item" value={newPackItem.name} onChange={e=>setNewPackItem({...newPackItem, name:e.target.value})}/><InputField theme={themeMode} placeholder="$" type="number" value={newPackItem.cost} onChange={e=>setNewPackItem({...newPackItem, cost:e.target.value})}/><Button theme={themeMode} onClick={()=>{if(newPackItem.name) setNewPack({...newPack, items:[...newPack.items, {name:newPackItem.name, cost:Number(newPackItem.cost)}]}); setNewPackItem({name:'', cost:''});}}><Plus/></Button></div><div className="bg-black/20 p-4 rounded-xl space-y-2">{newPack.items.map((it, i)=>(<div key={i} className="flex justify-between text-xs border-b border-white/5 pb-1"><span>{it.name}</span><span>${it.cost}</span></div>))}</div><Button theme={themeMode} className="w-full" onClick={()=>{ const id = Date.now().toString(); const packComplete = {...newPack, id, totalCost: newPack.items.reduce((a,b)=>a+b.cost,0)}; setProtocols([...protocols, packComplete]); saveToSupabase('packs', id, packComplete); setNewPack({name:'', items:[]}); notify("Pack Guardado"); }}>GUARDAR PACK</Button></Card>)}
        </div>}
        
        {activeTab === 'history' && <div className="space-y-4">
           <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Caja</h2><Button theme={themeMode} variant="secondary" onClick={downloadExcel}><FileSpreadsheet/> Excel</Button></div>
           {history.map(h=>(<Card key={h.id} theme={themeMode} onClick={()=>{setSelectedFinancialRecord(h); setModal('abono');}} className="flex justify-between items-center cursor-pointer border-l-4 border-cyan-500"><div><p className="font-bold">{h.patientName}</p><p className="text-[10px] opacity-40">{h.date}</p></div><div className="text-right font-black">${h.total?.toLocaleString()}</div></Card>))}
        </div>}

        {/* RECETARIO CON DATOS DE PACIENTE */}
        {activeTab === 'clinical' && <Card theme={themeMode} className="space-y-4">
           <PatientSelect theme={themeMode} patients={patientRecords} onSelect={setRxPatient} placeholder="Seleccionar Paciente para Receta..." />
           {rxPatient && (
               <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in">
                   <div className={`w-12 h-12 rounded-full ${t.accentBg} flex items-center justify-center font-bold text-white`}>{rxPatient.personal.legalName[0]}</div>
                   <div>
                       <p className="font-bold">{rxPatient.personal.legalName}</p>
                       <p className="text-xs opacity-60">RUT: {rxPatient.personal.rut} • Edad: {getAge(rxPatient.personal.birthDate)}</p>
                   </div>
               </div>
           )}
           <div className="flex gap-2"><InputField theme={themeMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/><InputField theme={themeMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/><Button theme={themeMode} onClick={()=>{setPrescription([...prescription, medInput]); setMedInput({name:'', dosage:''});}}><Plus/></Button></div>
           {prescription.map((p,i)=>(<div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between text-xs"><span>{p.name} - {p.dosage}</span><X size={14} onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}/></div>))}
           <Button theme={themeMode} className="w-full" onClick={()=>generatePDF('rx', rxPatient)}><Printer/> GENERAR PDF</Button>
        </Card>}

        {activeTab === 'settings' && <Card theme={themeMode} className="space-y-4"><div onClick={()=>logoInputRef.current.click()} className="p-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5"><input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>{config.logo ? <img src={config.logo} className="h-16 object-contain"/> : <><Camera className="mb-2 opacity-50"/><span className="text-xs font-bold opacity-50">SUBIR LOGO</span></>}</div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Clínica/Dr" value={config.name} onChange={e=>setConfigLocal({...config, name:e.target.value})} /><InputField theme={themeMode} label="RUT Profesional" value={config.rut} onChange={e=>setConfigLocal({...config, rut:e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Especialidad" value={config.specialty} onChange={e=>setConfigLocal({...config, specialty:e.target.value})} /><InputField theme={themeMode} label="Teléfono" value={config.phone} onChange={e=>setConfigLocal({...config, phone:e.target.value})} /></div><InputField theme={themeMode} label="Email Contacto" value={config.email} onChange={e=>setConfigLocal({...config, email:e.target.value})} /><InputField theme={themeMode} label="Dirección Consulta" value={config.address} onChange={e=>setConfigLocal({...config, address:e.target.value})} /><h3 className="font-bold pt-4">Datos Financieros (Calculadora)</h3><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Valor Hora" type="number" value={config.hourlyRate} onChange={e=>setConfigLocal({...config, hourlyRate:e.target.value})} /><InputField theme={themeMode} label="Margen %" type="number" value={config.profitMargin} onChange={e=>setConfigLocal({...config, profitMargin:e.target.value})} /></div><Button theme={themeMode} className="w-full" onClick={()=>{saveToSupabase('settings', 'general', config); notify("Ajustes Guardados");}}>GUARDAR DATOS</Button></Card>}
      </main>

      {/* MODAL DIENTE ODONTOGRAMA */}
      {modal === 'tooth' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
        <Card theme="dark" className="w-full max-w-sm space-y-6">
          <h3 className="text-2xl font-black">Diente {toothModalData.id}</h3>
          <div className="grid grid-cols-3 gap-2">
            {['caries', 'filled', 'crown'].map(st=>(<button key={st} onClick={()=>setToothModalData({...toothModalData, status:st})} className={`p-3 rounded-xl border text-[10px] font-bold uppercase ${toothModalData.status===st?'border-cyan-400 text-cyan-400':'border-white/10'}`}>{st}</button>))}
            <button onClick={()=>setToothModalData({...toothModalData, status: 'missing'})} className={`p-3 rounded-xl border text-[10px] font-bold uppercase ${toothModalData.status==='missing'?'border-red-500 text-red-500':'border-white/10'}`}>Ausente</button>
            <button onClick={()=>setToothModalData({...toothModalData, status:null})} className="p-3 bg-white/5 rounded-xl text-[10px] uppercase">Sano</button>
          </div>
          <InputField theme="dark" textarea label="Observaciones (Libre)" placeholder="Ej: Fractura, mancha..." value={toothModalData.notes || ''} onChange={e=>setToothModalData({...toothModalData, notes: e.target.value})}/>
          <Button theme="dark" className="w-full" onClick={()=>{
             const p = getPatient(selectedPatientId);
             const ut = {...p.clinical.teeth, [toothModalData.id]: {status: toothModalData.status, history: toothModalData.history, notes: toothModalData.notes}};
             savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, teeth: ut}});
             setModal(null); notify("Diente Guardado");
          }}>LISTO</Button>
        </Card>
      </div>}

      {/* MODAL PERIO (AVANZADO 6 PUNTOS) */}
      {modal === 'perio' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
        <Card theme="dark" className="w-full max-w-md space-y-4">
            <h3 className="font-bold text-xl">Diente {toothModalData.id} (Perio)</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <InputField theme="dark" label="Movilidad (0-3)" value={perioData.mobility} onChange={e=>setPerioData({...perioData, mobility: e.target.value})}/>
                <InputField theme="dark" label="Furca (I-III)" value={perioData.furcation} onChange={e=>setPerioData({...perioData, furcation: e.target.value})}/>
            </div>

            {/* VESTIBULAR */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase opacity-50 text-center">Vestibular</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                    {['D', 'C', 'M'].map((pos, i) => { const k = ['vd','v','vm'][i]; return (
                        <div key={k} className="space-y-1">
                            <input className="w-full bg-white/5 rounded text-center text-xs p-2" placeholder={pos} value={perioData.pd[k]||''} onChange={e=>setPerioData({...perioData, pd: {...perioData.pd, [k]: e.target.value}})} />
                            <div onClick={()=>setPerioData({...perioData, bop: {...perioData.bop, [k]: !perioData.bop[k]}})} className={`h-4 rounded cursor-pointer ${perioData.bop[k]?'bg-red-500':'bg-white/10'}`} title="Sangrado"></div>
                        </div>
                    )})}
                </div>
            </div>

            {/* LINGUAL / PALATINO */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase opacity-50 text-center">{toothModalData.id < 30 ? 'Palatino' : 'Lingual'}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                    {['D', 'C', 'M'].map((pos, i) => { const k = ['ld','l','lm'][i]; return (
                        <div key={k} className="space-y-1">
                            <input className="w-full bg-white/5 rounded text-center text-xs p-2" placeholder={pos} value={perioData.pd[k]||''} onChange={e=>setPerioData({...perioData, pd: {...perioData.pd, [k]: e.target.value}})} />
                            <div onClick={()=>setPerioData({...perioData, bop: {...perioData.bop, [k]: !perioData.bop[k]}})} className={`h-4 rounded cursor-pointer ${perioData.bop[k]?'bg-red-500':'bg-white/10'}`} title="Sangrado"></div>
                        </div>
                    )})}
                </div>
            </div>
            
            <div onClick={()=>setPerioData({...perioData, pus: !perioData.pus})} className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${perioData.pus ? 'bg-yellow-500 text-black border-yellow-500' : 'border-white/10'}`}>
                {perioData.pus ? 'SUPURACIÓN (PUS)' : 'SIN PUS'}
            </div>

            <Button theme="dark" className="w-full" onClick={()=>{
                const p = getPatient(selectedPatientId);
                const newPerio = { ...p.clinical.perio, [toothModalData.id]: perioData };
                savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: newPerio }});
                setModal(null); notify("Datos Perio Guardados");
            }}>GUARDAR DATOS</Button>
        </Card>
      </div>}

      {/* MODAL AGENDA */}
      {modal === 'appt' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm space-y-4"><h3 className="font-bold">Nueva Cita</h3><PatientSelect theme="dark" patients={patientRecords} onSelect={(p)=>setNewAppt({...newAppt, name: p.personal.legalName})} placeholder="Buscar Paciente..." /><InputField theme="dark" label="Tratamiento" value={newAppt.treatment} onChange={e=>setNewAppt({...newAppt, treatment:e.target.value})}/><div className="flex gap-2"><input type="date" className="bg-white/5 p-3 rounded-xl text-white outline-none flex-1" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/><input type="time" className="bg-white/5 p-3 rounded-xl text-white outline-none w-24" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/></div><Button theme="dark" className="w-full" onClick={async ()=>{ if(newAppt.name){ const id=Date.now().toString(); const nd={...newAppt, id}; setAppointments([...appointments, nd]); await saveToSupabase('appointments', id, nd); setModal(null); setNewAppt({name:'', treatment:'', date:'', time:''}); notify("Cita Agendada"); }}}>AGENDAR</Button><button onClick={()=>setModal(null)} className="w-full text-center text-xs opacity-50">Cancelar</button></Card></div>}
      {modal === 'loadPack' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm h-96 flex flex-col"><h3 className="font-bold mb-4">Cargar Protocolo</h3><div className="flex-1 overflow-y-auto space-y-2">{protocols.map(pr=>(<div key={pr.id} onClick={()=>{setSessionData({...sessionData, treatmentName:pr.name, baseCost:pr.totalCost}); setModal(null); notify("Pack Cargado");}} className="p-4 bg-white/5 rounded-xl cursor-pointer hover:border-cyan-400 border border-transparent"><p className="font-bold">{pr.name}</p><p className="text-cyan-400">${pr.totalCost}</p></div>))}</div><button onClick={()=>setModal(null)} className="mt-4 text-xs opacity-50">Cerrar</button></Card></div>}
      {modal === 'abono' && selectedFinancialRecord && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm space-y-4"><h3 className="text-xl font-bold">Registrar Pago</h3><p className="text-xs opacity-50">Deuda: ${(selectedFinancialRecord.total - (selectedFinancialRecord.paid||0)).toLocaleString()}</p><InputField theme="dark" type="number" placeholder="Monto" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} /><Button theme="dark" className="w-full" onClick={async ()=>{const nPaid = (selectedFinancialRecord.paid||0) + Number(paymentAmount); const nr = {...selectedFinancialRecord, paid: nPaid}; setHistory(history.map(h=>h.id===nr.id ? nr : h)); await saveToSupabase('financials', nr.id, nr); setModal(null); setPaymentAmount(''); notify("Pago Registrado");}}>ABONAR</Button><button onClick={()=>setModal(null)} className="w-full text-xs opacity-30 font-bold uppercase">Cancelar</button></Card></div>}
    </div>
  );
}