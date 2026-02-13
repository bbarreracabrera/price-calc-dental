import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx'; 
import { 
  Calculator, User, Share2, X, Landmark, Settings, 
  Library, Plus, Trash2, Save, History, Search, MessageCircle, 
  Moon, Sun, TrendingUp, Cloud, Diamond, FileSpreadsheet, 
  Stethoscope, ClipboardList, FileText, ShieldCheck,
  CalendarClock, Clock, FileBarChart, Menu, ArrowLeft,
  MapPin, Phone, Mail, Upload, Image as ImageIcon, Wallet, 
  Activity, Droplets, Check, FileQuestion
} from 'lucide-react';

// --- CONFIGURACIÓN DE TEMAS ---
const THEMES = {
  dark: {
    bg: 'bg-[#090909]',
    text: 'text-white',
    card: 'bg-[#1a1a1a]/90 border-white/10 shadow-2xl shadow-black',
    accent: 'text-[#D4AF37]',
    accentBg: 'bg-[#D4AF37]',
    accentBorder: 'border-[#D4AF37]',
    gradient: 'bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#B69121]',
    textGradient: 'bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F2D06B]',
    inputBg: 'bg-black/40 border-white/10 focus-within:border-[#D4AF37]',
    subText: 'text-stone-400',
    buttonSecondary: 'bg-white/5 border border-white/10 text-[#D4AF37] hover:bg-white/10'
  },
  light: {
    bg: 'bg-[#F5F5F4]',
    text: 'text-stone-800',
    card: 'bg-white border-stone-300 shadow-xl shadow-stone-200/50',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-500',
    accentBorder: 'border-amber-500',
    gradient: 'bg-gradient-to-r from-amber-400 to-amber-600',
    textGradient: 'text-amber-600',
    inputBg: 'bg-white border-stone-300 focus-within:border-amber-500',
    subText: 'text-stone-600',
    buttonSecondary: 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
  },
  blue: {
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    card: 'bg-white border-slate-200 shadow-xl shadow-blue-100',
    accent: 'text-cyan-700',
    accentBg: 'bg-cyan-600',
    accentBorder: 'border-cyan-500',
    gradient: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    textGradient: 'text-cyan-700',
    inputBg: 'bg-white border-slate-300 focus-within:border-cyan-600',
    subText: 'text-slate-600',
    buttonSecondary: 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
  }
};

const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

// --- COMPONENTES UI ---
const Card = ({ children, className = "", theme, ...props }) => (
  <div {...props} className={`p-6 rounded-3xl transition-all duration-300 relative border ${THEMES[theme].card} ${className}`}>{children}</div>
);

const Button = ({ onClick, children, variant = "primary", className = "", theme }) => {
  const base = "p-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-sm";
  const styles = {
    primary: `${THEMES[theme].gradient} text-white shadow-lg opacity-95 hover:opacity-100`,
    secondary: THEMES[theme].buttonSecondary,
    danger: "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20"
  };
  return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

const InputField = ({ label, icon: Icon, theme, textarea, ...props }) => (
  <div className="w-full">
    {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ml-1 ${THEMES[theme].accent}`}>{label}</label>}
    <div className={`flex items-start p-3 rounded-xl border transition-all ${THEMES[theme].inputBg}`}>
      {Icon && <Icon size={16} className={`mr-3 opacity-70 mt-1 ${THEMES[theme].accent}`}/>}
      {textarea ? 
        <textarea {...props} rows="4" className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${THEMES[theme].text}`}/> :
        <input {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${THEMES[theme].text}`}/>
      }
    </div>
  </div>
);

const SelectField = ({ label, options, theme, ...props }) => (
  <div className="w-full">
    {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ml-1 ${THEMES[theme].accent}`}>{label}</label>}
    <div className={`flex items-center p-3 rounded-xl border transition-all ${THEMES[theme].inputBg}`}>
      <select {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${THEMES[theme].text} appearance-none cursor-pointer`}>
        {options.map(opt => <option key={opt} value={opt} className="bg-black text-white">{opt}</option>)}
      </select>
    </div>
  </div>
);

// --- APP ---
export default function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('sc_theme_mode') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- DATOS PERSISTENTES ---
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('sc_v22_cfg')) || { hourlyRate: 25000, profitMargin: 30, bankName: "", accountType: "", accountNumber: "", rut: "", name: "Dr. Benjamín", mpLink: "" });
  const [protocols, setProtocols] = useState(() => JSON.parse(localStorage.getItem('sc_v22_pks')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('sc_v22_hst')) || []);
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem('sc_v22_apt')) || []);
  const [patientRecords, setPatientRecords] = useState(() => JSON.parse(localStorage.getItem('sc_v22_rec')) || {});

  // --- ESTADOS ---
  const [session, setSession] = useState({ patientName: '', treatmentName: '', clinicalTime: 60, baseCost: 0 });
  const [prescription, setPrescription] = useState([]);
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '' });
  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  
  // Ficha
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal'); 
  const [paymentAmount, setPaymentAmount] = useState(''); 
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null); 
  const [toothModalData, setToothModalData] = useState({ id: null, treatments: [], perio: { pd: '', bop: false, mobility: 0, furcation: 0 } });
  const [newTreatment, setNewTreatment] = useState('');
  const [newEvolution, setNewEvolution] = useState('');

  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => { 
    localStorage.setItem('sc_theme_mode', themeMode);
    localStorage.setItem('sc_v22_cfg', JSON.stringify(config));
    localStorage.setItem('sc_v22_pks', JSON.stringify(protocols));
    localStorage.setItem('sc_v22_hst', JSON.stringify(history));
    localStorage.setItem('sc_v22_apt', JSON.stringify(appointments));
    localStorage.setItem('sc_v22_rec', JSON.stringify(patientRecords));
  }, [themeMode, config, protocols, history, appointments, patientRecords]);

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };
  const toggleTheme = () => { setThemeMode(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'blue' : 'dark'); };

  const currentTotal = useMemo(() => {
    const time = parseFloat(session.clinicalTime) || 0;
    const base = parseFloat(session.baseCost) || 0;
    const hourly = parseFloat(config.hourlyRate) || 0;
    const margin = parseFloat(config.profitMargin) || 0;
    const costLabor = (hourly / 60) * time;
    const totalCost = costLabor + base;
    const marginDecimal = margin / 100;
    return isFinite(totalCost / (1 - marginDecimal)) ? Math.round(totalCost / (1 - marginDecimal)) : 0;
  }, [session, config]);

  const totalInvoiced = history.reduce((a, b) => a + (Number(b.total) || 0), 0);
  const totalCollected = history.reduce((a, b) => a + (Number(b.paid) || 0), 0);

  const getPatient = (id) => {
    const safeId = id || 'unknown';
    const emptyPatient = { 
      id: safeId, 
      personal: { 
        legalName: safeId, socialName: '', surnames: '', rut: '', email: '', phone: '', 
        address: '', city: '', commune: '', birthDate: '', gender: 'Seleccionar', sex: 'Seleccionar', 
        convention: 'Sin Convenio', internalNum: '', notes: '' 
      },
      anamnesis: { remote: '', recent: '', alerts: {} }, 
      clinical: { teeth: {}, aap: { stage: '', grade: '' }, evolution: [] }, 
      images: [] 
    };
    return patientRecords[safeId] || emptyPatient;
  };

  const handleCreatePatient = () => {
    if (!searchTerm.trim()) { notify("Escribe un nombre"); return; }
    const id = searchTerm.trim();
    if (!patientRecords[id]) { setPatientRecords(prev => ({ ...prev, [id]: getPatient(id) })); notify("Paciente Creado"); }
    setSelectedPatientId(id); setSearchTerm('');
  };
  
  const updatePatient = (id, section, data) => setPatientRecords(prev => ({ ...prev, [id]: { ...prev[id], [section]: { ...prev[id][section], ...data } } }));
  const updateAnamnesis = (id, field, value) => setPatientRecords(prev => ({ ...prev, [id]: { ...prev[id], anamnesis: { ...prev[id].anamnesis, [field]: value } } }));
  const updateImages = (id, newImage) => setPatientRecords(prev => ({ ...prev, [id]: { ...prev[id], images: [newImage, ...(prev[id].images || [])] } }));
  
  const openToothModal = (toothNum) => { const p = getPatient(selectedPatientId); const tData = p.clinical.teeth[toothNum] || { status: null, history: [], perio: { pd: '', bop: false, mobility: 0, furcation: 0 } }; setToothModalData({ id: toothNum, ...tData }); setModal('tooth'); };
  const saveToothData = () => { 
    const p = getPatient(selectedPatientId); 
    const updatedTeeth = { ...p.clinical.teeth, [toothModalData.id]: { status: toothModalData.status, history: toothModalData.history, perio: toothModalData.perio }};
    setPatientRecords(prev => ({...prev, [selectedPatientId]: { ...prev[selectedPatientId], clinical: { ...prev[selectedPatientId].clinical, teeth: updatedTeeth } }}));
    setModal(null); notify("Diente Actualizado"); 
  };
  const addTreatmentToTooth = () => { if(!newTreatment) return; setToothModalData(prev => ({...prev, history: [...(prev.history || []), newTreatment] })); setNewTreatment(''); };
  
  const addEvolution = () => {
    if(!newEvolution) return notify("Escribe una nota");
    const p = getPatient(selectedPatientId);
    const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), text: newEvolution, tooth: toothModalData.id || 'General' };
    setPatientRecords(prev => ({...prev, [selectedPatientId]: { ...prev[selectedPatientId], clinical: { ...prev[selectedPatientId].clinical, evolution: [newEntry, ...(p.clinical.evolution || [])] } }}));
    setNewEvolution(''); notify("Evolución Guardada");
  };

  const handleFileUpload = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => { updateImages(selectedPatientId, { id: Date.now(), url: reader.result, name: file.name, date: new Date().toLocaleDateString() }); notify("Imagen subida"); }; reader.readAsDataURL(file); };
  const saveBudgetToHistory = () => { if (!session.patientName) return notify("Falta nombre"); const newRecord = { id: Date.now(), date: new Date().toLocaleDateString(), patientName: session.patientName, treatmentName: session.treatmentName, total: currentTotal, paid: 0, payments: [], status: 'pending' }; setHistory([newRecord, ...history]); notify("Deuda Creada"); setActiveTab('history'); };
  const registerPayment = () => { const amount = parseInt(paymentAmount); if (!amount || amount <= 0) return notify("Monto inválido"); const updatedHistory = history.map(record => { if (record.id === selectedFinancialRecord.id) { const newPaid = (record.paid || 0) + amount; return { ...record, paid: newPaid, status: newPaid >= record.total ? 'paid' : 'partial', payments: [...(record.payments || []), { date: new Date().toLocaleDateString(), amount: amount }] }; } return record; }); setHistory(updatedHistory); setPaymentAmount(''); setModal(null); notify("Pago Registrado 💰"); };
  const generatePDF = (type) => { const doc = new jsPDF(); doc.text(`Dr. ${config.name}`, 20, 20); if (type === 'rx') { autoTable(doc, { startY: 40, head: [['Rx', 'Ind']], body: prescription.map(p => [p.name, p.dosage]) }); doc.save("Receta.pdf"); } else { autoTable(doc, { startY: 40, head: [['Item', 'Valor']], body: [[session.treatmentName, `$${currentTotal}`]] }); doc.save("Presupuesto.pdf"); } notify("PDF Listo"); };

  const menuItems = [
    { id: 'dashboard', label: 'Resumen', icon: TrendingUp },
    { id: 'agenda', label: 'Agenda', icon: CalendarClock },
    { id: 'ficha', label: 'Pacientes', icon: User },
    { id: 'quote', label: 'Cotizador', icon: Calculator },
    { id: 'history', label: 'Caja', icon: Wallet },
    { id: 'clinical', label: 'Recetas', icon: Stethoscope },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex ${THEMES[themeMode].bg} ${THEMES[themeMode].text} transition-colors duration-500`}>
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform ${themeMode === 'dark' ? 'bg-black/95 border-white/5' : 'bg-white border-slate-200'} border-r backdrop-blur-2xl`}>
        <div className={`p-8 border-b flex items-center gap-2 ${themeMode === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <Cloud className={`${THEMES[themeMode].accent} fill-current opacity-20`} size={32}/>
          <h1 className={`text-xl font-black ${themeMode === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            ShiningCloud
            <span className={`block text-[10px] tracking-widest uppercase ${THEMES[themeMode].accent}`}>| Dental</span>
          </h1>
        </div>
        <nav className="p-4 mt-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); setSelectedPatientId(null); }} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? `${THEMES[themeMode].accentBg} text-white shadow-lg` : `${THEMES[themeMode].subText} hover:bg-black/5`}`}>
              <item.icon size={20}/> {item.label}
            </button>
          ))}
        </nav>
        <div className={`absolute bottom-0 w-full p-6 border-t flex items-center justify-between ${themeMode === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
           <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${THEMES[themeMode].accentBg} flex items-center justify-center text-white font-bold`}>{config.name?.[0]}</div><p className="text-xs font-bold truncate w-24">{config.name}</p></div>
           <button onClick={toggleTheme} className={`p-2 rounded-full hover:bg-black/5 ${THEMES[themeMode].accent}`}>{themeMode==='dark'?<Moon size={18}/>: (themeMode==='light'?<Sun size={18}/>:<Droplets size={18}/>)}</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 h-screen overflow-y-auto">
        <div className="md:hidden flex justify-between items-center mb-8"><button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-black/5 rounded-xl"><Menu/></button><span className="font-black">ShiningCloud</span><div className="w-8"></div></div>
        {notification && <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[60] px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold animate-bounce ${themeMode === 'dark' ? 'bg-black border border-amber-400 text-amber-400' : 'bg-white border border-slate-200 text-slate-800'}`}><Diamond size={18}/> {notification}</div>}

        {/* --- VISTAS --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card theme={themeMode} className={`${THEMES[themeMode].gradient} !border-none text-white`}><p className="text-[10px] font-bold uppercase opacity-80">Por Cobrar</p><h2 className="text-5xl font-black">${(totalInvoiced - totalCollected).toLocaleString()}</h2></Card>
              <Card theme={themeMode} className="bg-emerald-500 !border-none text-white"><p className="text-[10px] font-bold uppercase opacity-80">Recaudado</p><h2 className="text-5xl font-black">${totalCollected.toLocaleString()}</h2></Card>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Card theme={themeMode} className="text-center"><History size={32} className={`mx-auto mb-2 ${THEMES[themeMode].accent}`}/><span className="text-4xl font-black">{Object.keys(patientRecords).length}</span><p className="text-[10px] opacity-40 uppercase">Pacientes</p></Card>
               <Card theme={themeMode} className="text-center"><Library size={32} className={`mx-auto mb-2 ${THEMES[themeMode].accent}`}/><span className="text-4xl font-black">{protocols.length}</span><p className="text-[10px] opacity-40 uppercase">Packs</p></Card>
            </div>
          </div>
        )}

        {activeTab === 'ficha' && (
          <div className="space-y-6 animate-in slide-in-from-right-5">
            {!selectedPatientId ? (
              <>
                <h2 className="text-3xl font-black">Pacientes</h2>
                <div className="flex gap-2"><InputField theme={themeMode} icon={Search} placeholder="Buscar o crear..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/><Button theme={themeMode} onClick={handleCreatePatient}><Plus/> Crear/Abrir</Button></div>
                <div className="grid gap-3">{Object.keys(patientRecords).filter(k => k.toLowerCase().includes(searchTerm.toLowerCase())).map(key => ( <Card key={key} theme={themeMode} className={`flex justify-between items-center cursor-pointer hover:border-current ${THEMES[themeMode].accentBorder}`} onClick={() => setSelectedPatientId(key)}><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full ${THEMES[themeMode].accentBg} text-white flex items-center justify-center font-bold`}>{key[0].toUpperCase()}</div><span className="font-bold capitalize">{key}</span></div><span className="text-xs opacity-40">Ver Ficha →</span></Card> ))}</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4"><button onClick={() => setSelectedPatientId(null)} className={`p-2 rounded-full ${themeMode === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}><ArrowLeft/></button><h2 className="text-3xl font-black capitalize">{selectedPatientId}</h2></div>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                  {[{id:'personal', label:'Datos', icon: User}, {id:'anamnesis', label:'Anamnesis', icon: FileQuestion}, {id:'clinical', label:'Clínica', icon: Activity}, {id:'perio', label:'Periodoncia', icon: FileBarChart}, {id:'evolution', label:'Evolución', icon: FileText}, {id:'images', label:'Galería', icon: ImageIcon}].map(tab => (
                    <button key={tab.id} onClick={() => setPatientTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${patientTab === tab.id ? `${THEMES[themeMode].accentBg} text-white` : 'bg-black/5 opacity-60'}`}><tab.icon size={14}/> {tab.label}</button>
                  ))}
                </div>
                
                {patientTab === 'personal' && (
                  <Card theme={themeMode} className="space-y-4 animate-in fade-in">
                    <h3 className={`font-bold ${THEMES[themeMode].accent} text-xs uppercase tracking-widest mb-2`}>Identificación</h3>
                    <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Legal" value={getPatient(selectedPatientId).personal.legalName} onChange={e => updatePatient(selectedPatientId, 'personal', {legalName: e.target.value})}/><InputField theme={themeMode} label="Nombre Social" value={getPatient(selectedPatientId).personal.socialName} onChange={e => updatePatient(selectedPatientId, 'personal', {socialName: e.target.value})}/></div>
                    <InputField theme={themeMode} label="Apellidos" value={getPatient(selectedPatientId).personal.surnames} onChange={e => updatePatient(selectedPatientId, 'personal', {surnames: e.target.value})}/>
                    <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="RUT" value={getPatient(selectedPatientId).personal.rut} onChange={e => updatePatient(selectedPatientId, 'personal', {rut: e.target.value})}/><InputField theme={themeMode} label="Email" value={getPatient(selectedPatientId).personal.email} onChange={e => updatePatient(selectedPatientId, 'personal', {email: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-4"><SelectField theme={themeMode} label="Convenio" options={['Sin Convenio', 'Fonasa', 'Isapre', 'Particular']} value={getPatient(selectedPatientId).personal.convention} onChange={e => updatePatient(selectedPatientId, 'personal', {convention: e.target.value})}/><InputField theme={themeMode} label="N° Interno" value={getPatient(selectedPatientId).personal.internalNum} onChange={e => updatePatient(selectedPatientId, 'personal', {internalNum: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-4"><SelectField theme={themeMode} label="Sexo" options={['Seleccionar', 'Masculino', 'Femenino', 'Intersexual']} value={getPatient(selectedPatientId).personal.sex} onChange={e => updatePatient(selectedPatientId, 'personal', {sex: e.target.value})}/><SelectField theme={themeMode} label="Género" options={['Seleccionar', 'Masculino', 'Femenino', 'No Binario', 'Otro']} value={getPatient(selectedPatientId).personal.gender} onChange={e => updatePatient(selectedPatientId, 'personal', {gender: e.target.value})}/></div>
                    <InputField theme={themeMode} label="Fecha Nacimiento" type="date" value={getPatient(selectedPatientId).personal.birthDate} onChange={e => updatePatient(selectedPatientId, 'personal', {birthDate: e.target.value})}/>
                    <div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Ciudad" value={getPatient(selectedPatientId).personal.city} onChange={e => updatePatient(selectedPatientId, 'personal', {city: e.target.value})}/><InputField theme={themeMode} label="Comuna" value={getPatient(selectedPatientId).personal.commune} onChange={e => updatePatient(selectedPatientId, 'personal', {commune: e.target.value})}/></div>
                    <InputField theme={themeMode} label="Dirección" value={getPatient(selectedPatientId).personal.address} onChange={e => updatePatient(selectedPatientId, 'personal', {address: e.target.value})}/>
                    <InputField theme={themeMode} label="Anotaciones" textarea value={getPatient(selectedPatientId).personal.notes} onChange={e => updatePatient(selectedPatientId, 'personal', {notes: e.target.value})}/>
                  </Card>
                )}

                {patientTab === 'anamnesis' && (
                  <div className="space-y-4 animate-in fade-in">
                    <Card theme={themeMode} className="space-y-4"><h3 className={`font-bold ${THEMES[themeMode].accent} text-xs uppercase tracking-widest`}>Alertas Médicas</h3><div className="grid grid-cols-2 gap-2">{['Alergias', 'Diabetes', 'Hipertensión', 'Fumador', 'Cardiopatía', 'Embarazo'].map(tag => { const active = getPatient(selectedPatientId).anamnesis.alerts?.[tag]; return ( <button key={tag} onClick={() => updateAnamnesis(selectedPatientId, 'alerts', {...getPatient(selectedPatientId).anamnesis.alerts, [tag]: !active})} className={`p-3 rounded-xl text-xs font-bold border ${active ? 'bg-red-500 border-red-500 text-white' : (themeMode==='dark'?'opacity-30 border-white/10':'bg-stone-100 border-stone-200 text-stone-500')}`}>{tag} {active && '⚠️'}</button>) })}</div></Card>
                    <Card theme={themeMode} className="space-y-4"><h3 className={`font-bold ${THEMES[themeMode].accent} text-xs uppercase tracking-widest`}>Historia Clínica</h3><InputField theme={themeMode} textarea label="Anamnesis Próxima" placeholder="Motivo de consulta..." value={getPatient(selectedPatientId).anamnesis.recent} onChange={e => updateAnamnesis(selectedPatientId, 'recent', e.target.value)}/><InputField theme={themeMode} textarea label="Anamnesis Remota" placeholder="Antecedentes..." value={getPatient(selectedPatientId).anamnesis.remote} onChange={e => updateAnamnesis(selectedPatientId, 'remote', e.target.value)}/></Card>
                  </div>
                )}

                {patientTab === 'clinical' && <Card theme={themeMode} className="text-center overflow-x-auto"><h3 className={`font-bold ${THEMES[themeMode].accent} text-xs uppercase tracking-widest mb-4`}>Odontograma</h3><div className="flex flex-col gap-4 min-w-[500px]"><div className="flex gap-1 justify-center">{TEETH_UPPER.map(t => <button key={t} onClick={() => openToothModal(t)} className={`w-8 h-10 rounded border text-[10px] font-bold ${getPatient(selectedPatientId).clinical.teeth[t]?.status ? 'bg-red-500 text-white border-red-500' : (themeMode==='dark'?'bg-white/5 border-white/10':'bg-slate-100 border-slate-200 text-slate-500')}`}>{t}</button>)}</div><div className="flex gap-1 justify-center">{TEETH_LOWER.map(t => <button key={t} onClick={() => openToothModal(t)} className={`w-8 h-10 rounded border text-[10px] font-bold ${getPatient(selectedPatientId).clinical.teeth[t]?.status ? 'bg-red-500 text-white border-red-500' : (themeMode==='dark'?'bg-white/5 border-white/10':'bg-slate-100 border-slate-200 text-slate-500')}`}>{t}</button>)}</div></div></Card>}
                {patientTab === 'perio' && <Card theme={themeMode} className="space-y-4"><h3 className={`font-bold ${THEMES[themeMode].accent} text-xs uppercase tracking-widest`}>Diagnóstico AAP</h3><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Estadio" placeholder="I - IV" value={getPatient(selectedPatientId).clinical.aap.stage} onChange={e => updatePatient(selectedPatientId, 'clinical', { aap: { ...getPatient(selectedPatientId).clinical.aap, stage: e.target.value } })}/><InputField theme={themeMode} label="Grado" placeholder="A - C" value={getPatient(selectedPatientId).clinical.aap.grade} onChange={e => updatePatient(selectedPatientId, 'clinical', { aap: { ...getPatient(selectedPatientId).clinical.aap, grade: e.target.value } })}/></div></Card>}
                {patientTab === 'evolution' && <div className="space-y-4"><Card theme={themeMode} className="space-y-2"><InputField theme={themeMode} textarea label="Nueva Evolución" placeholder="Describa el procedimiento..." value={newEvolution} onChange={e => setNewEvolution(e.target.value)}/><Button theme={themeMode} className="w-full" onClick={addEvolution}>Guardar</Button></Card><div className="space-y-3">{getPatient(selectedPatientId).clinical.evolution?.map(evo => (<div key={evo.id} className={`p-4 rounded-xl text-sm relative pl-6 ${themeMode === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}><div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${THEMES[themeMode].accentBg}`}></div><div className="flex justify-between mb-1"><span className={`font-bold text-xs ${THEMES[themeMode].accent}`}>{evo.date}</span><span className="text-xs opacity-50 font-bold">Diente: {evo.tooth}</span></div><p>{evo.text}</p></div>))}</div></div>}
                {patientTab === 'images' && <div className="space-y-6"><Card theme={themeMode} className="text-center border-dashed border-2 !bg-transparent opacity-60 hover:opacity-100 cursor-pointer" onClick={() => fileInputRef.current.click()}><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/><Upload className="mx-auto mb-2 opacity-50"/><p className="text-xs font-bold uppercase">Subir Documento</p></Card><div className="grid grid-cols-2 gap-4">{getPatient(selectedPatientId).images?.map(img => (<div key={img.id} className="relative group"><img src={img.url} alt="doc" className="rounded-xl w-full h-32 object-cover border border-white/10"/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all"><span className="text-[10px] text-white font-bold">{img.name}</span></div></div>))}</div></div>}
              </>
            )}
          </div>
        )}

        {/* --- OTRAS SECCIONES (Resumidas) --- */}
        {activeTab === 'history' && <div className="space-y-6"><div className="flex justify-between"><h2 className="text-3xl font-black">Caja</h2><Button theme={themeMode} variant="secondary" onClick={() => {const ws=XLSX.utils.json_to_sheet(history); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Caja"); XLSX.writeFile(wb,"Reporte.xlsx");}}><FileSpreadsheet/></Button></div><InputField theme={themeMode} icon={Search} placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/><div className="space-y-3">{history.filter(h=>h.patientName?.toLowerCase().includes(searchTerm.toLowerCase())).map(h=>(<Card key={h.id} theme={themeMode} className="flex justify-between items-center cursor-pointer border-l-4 hover:opacity-80" style={{borderLeftColor: (h.total-(h.paid||0))<=0 ? '#10b981':'#ef4444'}} onClick={()=>{setSelectedFinancialRecord(h); setModal('abono');}}><div><h4 className="font-bold">{h.patientName}</h4><p className="text-xs opacity-50">{h.treatmentName}</p></div><div className="text-right"><p className={`font-black ${THEMES[themeMode].accent}`}>${h.total?.toLocaleString()}</p></div></Card>))}</div></div>}
        {activeTab === 'quote' && <div className="space-y-6"><div className={`flex p-1 rounded-2xl ${themeMode==='dark'?'bg-white/5':'bg-black/5'}`}><button onClick={()=>setQuoteMode('calc')} className={`flex-1 p-3 rounded-xl font-bold text-xs ${quoteMode==='calc'?`${THEMES[themeMode].accentBg} text-white`:'opacity-40'}`}>Calculadora</button><button onClick={()=>setQuoteMode('packs')} className={`flex-1 p-3 rounded-xl font-bold text-xs ${quoteMode==='packs'?`${THEMES[themeMode].accentBg} text-white`:'opacity-40'}`}>Packs</button></div>{quoteMode==='calc'?(<><Button theme={themeMode} variant="secondary" className="w-full" onClick={()=>setModal('loadPack')}>Cargar Pack</Button><Card theme={themeMode} className="space-y-4"><InputField theme={themeMode} label="Paciente" value={session.patientName} onChange={e=>setSession({...session, patientName:e.target.value})}/><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Min" type="number" value={session.clinicalTime} onChange={e=>setSession({...session, clinicalTime:e.target.value})}/><InputField theme={themeMode} label="Insumos" type="number" value={session.baseCost} onChange={e=>setSession({...session, baseCost:e.target.value})}/></div></Card><Card theme={themeMode} className={`text-center py-10 border ${THEMES[themeMode].accentBorder}`}><h2 className={`text-6xl font-black ${THEMES[themeMode].textGradient}`}>${currentTotal.toLocaleString()}</h2><div className="grid grid-cols-2 gap-2 mt-4 px-4"><Button theme={themeMode} variant="secondary" onClick={saveBudgetToHistory}><Save/> Guardar</Button><Button theme={themeMode} onClick={()=>setModal('pay')}><Share2/> Cobrar</Button></div></Card></>):(<Card theme={themeMode} className="space-y-4"><InputField theme={themeMode} label="Pack" value={newPack.name} onChange={e=>setNewPack({...newPack, name:e.target.value})}/><div className="flex gap-2"><InputField theme={themeMode} placeholder="Item" value={newPackItem.name} onChange={e=>setNewPackItem({...newPackItem, name:e.target.value})}/><InputField theme={themeMode} placeholder="$" type="number" value={newPackItem.cost} onChange={e=>setNewPackItem({...newPackItem, cost:e.target.value})}/><button onClick={()=>{if(newPackItem.name){setNewPack({...newPack, items:[...newPack.items, {name:newPackItem.name, cost:Number(newPackItem.cost)}]}); setNewPackItem({name:'', cost:''});}}} className={`p-4 rounded-xl text-white ${THEMES[themeMode].accentBg}`}><Plus/></button></div><Button theme={themeMode} className="w-full" onClick={()=>{if(newPack.name){setProtocols([...protocols, {...newPack, id:Date.now(), totalCost:newPack.items.reduce((a,b)=>a+b.cost,0)}]); notify("Pack OK");}}}>Guardar</Button></Card>)}</div>}
        {activeTab === 'clinical' && <div className="space-y-6"><h2 className="text-3xl font-black">Recetario</h2><Card theme={themeMode} className="space-y-4"><div className="flex gap-2"><Button theme={themeMode} variant="secondary" className="flex-1 text-xs" onClick={()=>setPrescription([...prescription, {name:'Amoxicilina 500', dosage:'c/8h'}])}>Infección</Button><Button theme={themeMode} variant="secondary" className="flex-1 text-xs" onClick={()=>setPrescription([...prescription, {name:'Ketorolaco', dosage:'c/8h'}])}>Dolor</Button></div><div className="flex gap-2"><InputField theme={themeMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/><InputField theme={themeMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/><button onClick={()=>{if(medInput.name){setPrescription([...prescription, medInput]); setMedInput({name:'', dosage:''});}}} className={`p-4 rounded-xl text-white ${THEMES[themeMode].accentBg}`}><Plus/></button></div><div className="space-y-2">{prescription.map((p,i)=>(<div key={i} className={`p-2 rounded flex justify-between text-xs ${themeMode==='dark'?'bg-white/5':'bg-black/5'}`}><span>{p.name}</span><button onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}><X size={12}/></button></div>))}</div><Button theme={themeMode} className="w-full" onClick={()=>generatePDF('rx')}>PDF</Button></Card></div>}
        {activeTab === 'agenda' && <div className="space-y-6"><div className="flex justify-between"><h2 className="text-3xl font-black">Agenda</h2><Button theme={themeMode} onClick={()=>setModal('appt')}><Plus/></Button></div>{appointments.map(a=>(<Card key={a.id} theme={themeMode} className="flex justify-between items-center"><div className="flex gap-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${THEMES[themeMode].accentBg} bg-opacity-10 ${THEMES[themeMode].accent}`}>{a.time}</div><div><h4 className="font-bold">{a.name}</h4><p className="text-xs opacity-50">{a.treatment}</p></div></div><button onClick={()=>setAppointments(appointments.filter(x=>x.id!==a.id))} className="text-red-500 bg-red-500/10 p-2 rounded"><Trash2/></button></Card>))}</div>}
        {activeTab === 'settings' && <div className="space-y-6"><h2 className="text-3xl font-black">Ajustes</h2><Card theme={themeMode} className="space-y-6"><InputField theme={themeMode} label="Valor Hora" type="number" value={config.hourlyRate} onChange={e=>setConfig({...config, hourlyRate:e.target.value})}/><InputField theme={themeMode} label="Margen %" type="number" value={config.profitMargin} onChange={e=>setConfig({...config, profitMargin:e.target.value})}/><InputField theme={themeMode} label="Nombre" value={config.name} onChange={e=>setConfig({...config, name:e.target.value})}/><InputField theme={themeMode} label="Banco" value={config.bankName} onChange={e=>setConfig({...config, bankName:e.target.value})}/><InputField theme={themeMode} label="Cuenta" value={config.accountNumber} onChange={e=>setConfig({...config, accountNumber:e.target.value})}/></Card></div>}

      </main>

      {/* --- MODALES --- */}
      {modal === 'appt' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className={`w-full max-w-sm border ${THEMES[themeMode].accentBorder}`}><h3 className={`text-xl font-bold mb-4 ${THEMES.dark.accent}`}>Nueva Cita</h3><div className="space-y-4"><InputField theme="dark" placeholder="Paciente" value={newAppt.name} onChange={e=>setNewAppt({...newAppt, name:e.target.value})}/><div className="flex gap-2"><input type="date" className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-white" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/><input type="time" className="w-24 bg-white/5 p-3 rounded-xl border border-white/10 text-white" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/></div><Button theme="dark" className="w-full" onClick={()=>{if(newAppt.name){setAppointments([...appointments, {...newAppt, id:Date.now()}]); setModal(null);}}}>Agendar</Button><button className="w-full text-xs text-white/30 mt-2" onClick={()=>setModal(null)}>CANCELAR</button></div></Card></div>}
      {modal === 'loadPack' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm h-96 flex flex-col border-white/20"><h3 className={`text-xl font-bold mb-4 ${THEMES.dark.accent}`}>Packs</h3><div className="flex-1 overflow-y-auto space-y-2">{protocols.map(p=>(<button key={p.id} onClick={()=>{setSession({...session, treatmentName:p.name, baseCost:p.totalCost}); setModal(null); notify("Cargado");}} className="w-full text-left p-4 bg-white/5 rounded-xl border border-white/5 hover:border-amber-400 transition-all"><span className="font-bold text-white">{p.name}</span> <span className="text-amber-400 block">${p.totalCost.toLocaleString()}</span></button>))}</div><button className="mt-4 text-xs text-white/30" onClick={()=>setModal(null)}>CERRAR</button></Card></div>}
      {modal === 'tooth' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className={`w-full max-w-sm border ${THEMES[themeMode].accentBorder} max-h-[90vh] overflow-y-auto`}><h3 className="text-2xl font-bold mb-4 text-white text-center">Diente {toothModalData.id}</h3><div className="mb-6"><p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Estado</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setToothModalData({...toothModalData, status: 'caries'})} className={`p-3 rounded-xl border font-bold text-xs ${toothModalData.status === 'caries' ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}>Caries</button><button onClick={() => setToothModalData({...toothModalData, status: 'filled'})} className={`p-3 rounded-xl border font-bold text-xs ${toothModalData.status === 'filled' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}>Obturado</button></div></div><div className="mb-6"><p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Historial</p><div className="flex gap-2 mb-2"><input placeholder="Ej: Resina..." className="flex-1 bg-white/5 p-2 rounded-lg text-sm outline-none text-white" value={newTreatment} onChange={e => setNewTreatment(e.target.value)}/><button onClick={addTreatmentToTooth} className="bg-amber-400 p-2 rounded-lg text-black font-bold">+</button></div><div className="space-y-1 max-h-24 overflow-y-auto">{toothModalData.history?.map((t, i) => <div key={i} className="text-xs bg-white/5 p-2 rounded text-white">{t}</div>)}</div></div><Button theme="dark" className="w-full" onClick={saveToothData}>Guardar</Button><button className="w-full mt-2 text-xs text-white/30" onClick={() => setModal(null)}>Cerrar</button></Card></div>}
      {modal === 'abono' && selectedFinancialRecord && (<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card theme="dark" className="w-full max-w-sm border-white/20"><h3 className="text-xl font-bold mb-2 text-white">Abonar</h3><div className="bg-white/5 p-4 rounded-xl mb-4"><p className="text-xs font-bold text-amber-400">DEUDA</p><p className="text-2xl font-black text-white">${(selectedFinancialRecord.total - (selectedFinancialRecord.paid || 0)).toLocaleString()}</p></div><InputField theme="dark" placeholder="Monto..." type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}/><Button theme="dark" className="w-full !mt-4" onClick={registerPayment}>Pagar</Button><button className="w-full mt-4 text-xs text-white/30" onClick={() => setModal(null)}>CANCELAR</button></Card></div>)}
      {modal === 'pay' && <div className="fixed inset-0 z-50 bg-black/90 flex items-end justify-center p-4"><Card theme="dark" className="w-full max-w-sm border-white/20"><h3 className="text-xl font-bold mb-6 text-white">Cobrar</h3><Button theme="dark" className="w-full !bg-emerald-600 !py-4 mb-4" onClick={()=>window.open(`https://wa.me/?text=Total: $${currentTotal}`)}>Enviar WhatsApp</Button><button className="w-full text-xs text-white/30" onClick={()=>setModal(null)}>CERRAR</button></Card></div>}

    </div>
  );
}