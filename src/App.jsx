import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx'; 
import { 
  Calculator, User, Share2, X, Landmark, CreditCard, Settings, 
  Library, Plus, Trash2, Save, History, Search, MessageCircle, 
  Moon, Sun, TrendingUp, Cloud, Diamond, FileSpreadsheet, 
  Stethoscope, ClipboardList, FileText, ShieldCheck,
  CalendarClock, Clock, FileBarChart, Menu, ArrowLeft,
  MapPin, Phone, Mail, Upload, Image as ImageIcon, Wallet, CheckCircle2
} from 'lucide-react';

// --- ESTILOS ---
const goldGradient = "bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#B69121]";
const goldText = "bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F2D06B]";
const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

// --- COMPONENTES UI (CORREGIDO: Ahora acepta clicks) ---
const Card = ({ children, className = "", darkMode, ...props }) => (
  <div 
    {...props} // Esto permite que el onClick funcione
    className={`p-6 rounded-3xl transition-all duration-300 relative border ${
      darkMode ? 'bg-[#1a1a1a]/90 border-white/10 shadow-2xl shadow-black' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/40'
    } ${className}`}
  >
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", darkMode }) => {
  const base = "p-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm";
  const styles = {
    primary: `${goldGradient} text-white shadow-lg shadow-amber-500/20`,
    secondary: darkMode ? "bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10" : "bg-stone-100 border border-stone-300 text-stone-600 hover:bg-stone-200",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/10"
  };
  return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

const InputField = ({ label, icon: Icon, darkMode, type="text", ...props }) => (
  <div className="w-full">
    {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ml-1 ${darkMode ? 'text-amber-400' : 'text-stone-500'}`}>{label}</label>}
    <div className={`flex items-center p-3 rounded-xl border transition-all ${darkMode ? 'bg-black/40 border-white/10 focus-within:border-amber-400' : 'bg-white border-stone-300 focus-within:border-amber-500'}`}>
      {Icon && <Icon size={16} className="mr-3 text-amber-500 opacity-80"/>}
      <input type={type} {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${darkMode ? 'text-white' : 'text-stone-800'}`}/>
    </div>
  </div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sc_theme') === 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- DATOS PERSISTENTES (v19) ---
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('sc_v19_cfg')) || { hourlyRate: 25000, profitMargin: 30, bankName: "", accountType: "", accountNumber: "", rut: "", name: "Dr. Benjamín", mpLink: "" });
  const [protocols, setProtocols] = useState(() => JSON.parse(localStorage.getItem('sc_v19_pks')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('sc_v19_hst')) || []);
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem('sc_v19_apt')) || []);
  const [patientRecords, setPatientRecords] = useState(() => JSON.parse(localStorage.getItem('sc_v19_rec')) || {});

  // --- ESTADOS TEMPORALES ---
  const [session, setSession] = useState({ patientName: '', treatmentName: '', clinicalTime: 60, baseCost: 0 });
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
  const [prescription, setPrescription] = useState([]);
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '' });
  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  
  // Ficha y Caja
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal'); 
  const [paymentAmount, setPaymentAmount] = useState(''); 
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null); 

  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [notification, setNotification] = useState('');

  // --- EFECTOS ---
  useEffect(() => { 
    localStorage.setItem('sc_theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sc_v19_cfg', JSON.stringify(config));
    localStorage.setItem('sc_v19_pks', JSON.stringify(protocols));
    localStorage.setItem('sc_v19_hst', JSON.stringify(history));
    localStorage.setItem('sc_v19_apt', JSON.stringify(appointments));
    localStorage.setItem('sc_v19_rec', JSON.stringify(patientRecords));
  }, [darkMode, config, protocols, history, appointments, patientRecords]);

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  // --- CÁLCULOS ---
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

  // --- TESORERÍA ---
  const saveBudgetToHistory = () => {
    if (!session.patientName) return notify("Falta nombre");
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      patientName: session.patientName,
      treatmentName: session.treatmentName,
      total: currentTotal,
      paid: 0, 
      payments: [], 
      status: 'pending' 
    };
    setHistory([newRecord, ...history]);
    notify("Deuda Creada");
    setActiveTab('history'); 
  };

  const registerPayment = () => {
    const amount = parseInt(paymentAmount);
    if (!amount || amount <= 0) return notify("Monto inválido");
    if (!selectedFinancialRecord) return;

    const updatedHistory = history.map(record => {
      if (record.id === selectedFinancialRecord.id) {
        const newPaid = (record.paid || 0) + amount;
        const newStatus = newPaid >= record.total ? 'paid' : 'partial';
        return {
          ...record,
          paid: newPaid,
          status: newStatus,
          payments: [...(record.payments || []), { date: new Date().toLocaleDateString(), amount: amount }]
        };
      }
      return record;
    });

    setHistory(updatedHistory);
    setPaymentAmount('');
    setModal(null);
    notify("Pago Registrado 💰");
  };

  // --- PACIENTES ---
  const getPatient = (id) => {
    const safeId = id || 'unknown';
    const emptyPatient = { id: safeId, personal: { name: safeId, rut: '', email: '', phone: '', address: '', city: '', commune: '', birthDate: '', gender: '', job: '' }, anamnesis: {}, teeth: {}, images: [] };
    return patientRecords[safeId] || emptyPatient;
  };

  const handleCreatePatient = () => {
    if (!searchTerm.trim()) { notify("Escribe un nombre"); return; }
    const id = searchTerm.trim();
    if (!patientRecords[id]) {
      setPatientRecords(prev => ({ ...prev, [id]: { id: id, personal: { name: id, rut: '', email: '', phone: '', address: '', city: '', commune: '', birthDate: '', gender: '', job: '' }, anamnesis: {}, teeth: {}, images: [] } }));
      notify("Paciente Creado");
    }
    setSelectedPatientId(id); setSearchTerm('');
  };
  
  const updatePatient = (id, section, data) => setPatientRecords({ ...patientRecords, [id]: { ...getPatient(id), [section]: { ...getPatient(id)[section], ...data } } });
  const updateImages = (id, newImage) => setPatientRecords({ ...patientRecords, [id]: { ...getPatient(id), images: [newImage, ...(getPatient(id).images || [])] } });
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { updateImages(selectedPatientId, { id: Date.now(), url: reader.result, name: file.name, date: new Date().toLocaleDateString() }); notify("Imagen subida"); };
    reader.readAsDataURL(file);
  };

  // --- PDF ---
  const generatePDF = (type) => {
    const doc = new jsPDF();
    doc.text(`Dr. ${config.name}`, 20, 20);
    if (type === 'rx') {
        autoTable(doc, { startY: 40, head: [['Rx', 'Ind']], body: prescription.map(p => [p.name, p.dosage]) });
        doc.save("Receta.pdf");
    } else {
        autoTable(doc, { startY: 40, head: [['Item', 'Valor']], body: [[session.treatmentName, `$${currentTotal}`]] });
        doc.save("Presupuesto.pdf");
    }
    notify("PDF Listo");
  };

  const menuItems = [
    { id: 'dashboard', label: 'Resumen', icon: TrendingUp },
    { id: 'agenda', label: 'Agenda', icon: CalendarClock },
    { id: 'ficha', label: 'Pacientes', icon: User },
    { id: 'quote', label: 'Cotizador', icon: Calculator },
    { id: 'history', label: 'Caja y Deudas', icon: Wallet },
    { id: 'clinical', label: 'Recetas', icon: Stethoscope },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-[#090909] text-white' : 'bg-[#F5F5F4] text-stone-800'}`}>
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform ${darkMode ? 'bg-black/95 border-white/5' : 'bg-white border-stone-200'} border-r`}>
        <div className={`p-8 border-b flex items-center gap-2 ${darkMode ? 'border-white/5' : 'border-stone-200'}`}>
          <Cloud className="text-amber-400 fill-amber-400/20" size={32}/>
          <h1 className={`text-2xl font-black ${goldText}`}>ShiningCloud</h1>
        </div>
        <nav className="p-4 mt-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); setSelectedPatientId(null); }} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-amber-400/10 text-amber-400 border-l-4 border-amber-400' : (darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100')}`}>
              <item.icon size={20}/> {item.label}
            </button>
          ))}
        </nav>
        <div className={`absolute bottom-0 w-full p-6 border-t flex items-center justify-between ${darkMode ? 'border-white/5' : 'border-stone-200'}`}>
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold">{config.name?.[0]}</div>
              <p className="text-xs font-bold truncate w-24">{config.name || 'Dr. Usuario'}</p>
           </div>
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-amber-400">{darkMode?<Sun size={18}/>:<Moon size={18}/>}</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 h-screen overflow-y-auto">
        <div className="md:hidden flex justify-between items-center mb-8"><button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-xl"><Menu/></button><span className={`font-black ${goldText}`}>SHININGCLOUD</span><div className="w-8"></div></div>
        {notification && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] bg-black border border-amber-400 text-amber-400 px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold animate-bounce"><Diamond size={18}/> {notification}</div>}

        {/* --- CONTENIDO --- */}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card darkMode={darkMode} className={`${goldGradient} !border-none text-white`}>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Por Cobrar (Deuda)</p>
                 <h2 className="text-5xl font-black">${(totalInvoiced - totalCollected).toLocaleString()}</h2>
              </Card>
              <Card darkMode={darkMode} className="bg-emerald-600 !border-none text-white shadow-emerald-500/20">
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">En Caja (Recaudado)</p>
                 <h2 className="text-5xl font-black">${totalCollected.toLocaleString()}</h2>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Card darkMode={darkMode} className="text-center"><History size={32} className="mx-auto text-amber-400 mb-2"/><span className="text-4xl font-black">{Object.keys(patientRecords).length}</span><p className="text-[10px] opacity-40 uppercase">Pacientes</p></Card>
               <Card darkMode={darkMode} className="text-center"><Library size={32} className="mx-auto text-amber-400 mb-2"/><span className="text-4xl font-black">{protocols.length}</span><p className="text-[10px] opacity-40 uppercase">Packs</p></Card>
            </div>
          </div>
        )}

        {/* --- CAJA Y DEUDAS (CLICK FIXED) --- */}
        {activeTab === 'history' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center"><h2 className="text-3xl font-black">Caja y Deudas</h2><Button darkMode={darkMode} variant="secondary" onClick={() => {const ws=XLSX.utils.json_to_sheet(history); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Caja"); XLSX.writeFile(wb,"Reporte_Caja.xlsx");}}><FileSpreadsheet/> Excel</Button></div>
             <InputField darkMode={darkMode} icon={Search} placeholder="Buscar tratamiento..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
             
             <div className="space-y-3">
               {history.length === 0 ? <p className="text-center opacity-30 py-10">No hay movimientos.</p> : history.filter(h => h.patientName?.toLowerCase().includes(searchTerm.toLowerCase())).map(h => {
                 const debt = h.total - (h.paid || 0);
                 const isPaid = debt <= 0;
                 return (
                   <Card key={h.id} darkMode={darkMode} className={`flex justify-between items-center cursor-pointer border-l-4 ${isPaid ? 'border-l-emerald-500' : 'border-l-red-500'} hover:opacity-80`} onClick={() => { setSelectedFinancialRecord(h); setModal('abono'); }}>
                     <div>
                       <h4 className="font-bold text-lg">{h.patientName}</h4>
                       <p className="text-xs opacity-50">{h.treatmentName} • {h.date}</p>
                       {debt > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg mt-1 inline-block">DEBE: ${debt.toLocaleString()}</span>}
                       {isPaid && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg mt-1 inline-block">PAGADO</span>}
                     </div>
                     <div className="text-right">
                       <p className="font-black text-xl text-amber-400">${h.total?.toLocaleString()}</p>
                       <p className="text-xs opacity-50">Pagado: ${h.paid?.toLocaleString() || 0}</p>
                     </div>
                   </Card>
                 );
               })}
             </div>
          </div>
        )}

        {/* --- FICHA PACIENTE --- */}
        {activeTab === 'ficha' && (
          <div className="space-y-6 animate-in slide-in-from-right-5">
            {!selectedPatientId ? (
              <>
                <h2 className="text-3xl font-black">Pacientes</h2>
                <div className="flex gap-2"><InputField darkMode={darkMode} icon={Search} placeholder="Buscar o crear paciente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/><Button onClick={handleCreatePatient}><Plus/> Crear/Abrir</Button></div>
                <div className="grid gap-3">{Object.keys(patientRecords).filter(k => k.toLowerCase().includes(searchTerm.toLowerCase())).map(key => ( <Card key={key} darkMode={darkMode} className="flex justify-between items-center cursor-pointer hover:border-amber-400" onClick={() => setSelectedPatientId(key)}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">{key[0].toUpperCase()}</div><span className="font-bold capitalize">{key}</span></div><span className="text-xs opacity-40">Ver Ficha →</span></Card> ))}</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4"><button onClick={() => setSelectedPatientId(null)} className={`p-2 rounded-full ${darkMode ? 'bg-white/5' : 'bg-stone-200'}`}><ArrowLeft/></button><h2 className="text-3xl font-black capitalize">{selectedPatientId}</h2></div>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2">{[{id:'personal', label:'Datos', icon: User}, {id:'clinical', label:'Clínica', icon: FileBarChart}, {id:'images', label:'Galería', icon: ImageIcon}].map(tab => (<button key={tab.id} onClick={() => setPatientTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${patientTab === tab.id ? 'bg-amber-400 text-white' : (darkMode ? 'bg-white/5 opacity-60' : 'bg-stone-200 text-stone-600')}`}><tab.icon size={14}/> {tab.label}</button>))}</div>
                {/* SUB-VISTAS FICHA */}
                {patientTab === 'personal' && <Card darkMode={darkMode} className="space-y-4 animate-in fade-in"><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} label="Nombre Legal" value={getPatient(selectedPatientId).personal.name} onChange={e => updatePatient(selectedPatientId, 'personal', {name: e.target.value})}/><InputField darkMode={darkMode} label="RUT" value={getPatient(selectedPatientId).personal.rut} onChange={e => updatePatient(selectedPatientId, 'personal', {rut: e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} icon={Phone} label="Teléfono" value={getPatient(selectedPatientId).personal.phone} onChange={e => updatePatient(selectedPatientId, 'personal', {phone: e.target.value})}/><InputField darkMode={darkMode} icon={Mail} label="Email" value={getPatient(selectedPatientId).personal.email} onChange={e => updatePatient(selectedPatientId, 'personal', {email: e.target.value})}/></div><InputField darkMode={darkMode} icon={MapPin} label="Dirección" value={getPatient(selectedPatientId).personal.address} onChange={e => updatePatient(selectedPatientId, 'personal', {address: e.target.value})}/><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} label="Comuna" value={getPatient(selectedPatientId).personal.commune} onChange={e => updatePatient(selectedPatientId, 'personal', {commune: e.target.value})}/><InputField darkMode={darkMode} label="Ciudad" value={getPatient(selectedPatientId).personal.city} onChange={e => updatePatient(selectedPatientId, 'personal', {city: e.target.value})}/></div></Card>}
                {patientTab === 'clinical' && <Card darkMode={darkMode} className="space-y-4 animate-in fade-in"><h3 className="font-bold text-amber-400 text-xs uppercase">Anamnesis</h3><div className="grid grid-cols-2 gap-2">{['Alergias', 'Diabetes', 'Hipertensión', 'Fumador'].map(tag => { const active = getPatient(selectedPatientId).anamnesis?.[tag]; return ( <button key={tag} onClick={() => updatePatient(selectedPatientId, 'anamnesis', {[tag]: !active})} className={`p-3 rounded-xl text-xs font-bold border ${active ? 'bg-red-500 border-red-500 text-white' : (darkMode ? 'opacity-30 border-white/10' : 'bg-stone-100 border-stone-200 text-stone-500')}`}>{tag} {active && '⚠️'}</button>) })}</div></Card>}
                {patientTab === 'images' && <div className="space-y-6 animate-in fade-in"><Card darkMode={darkMode} className="text-center border-dashed border-2 !bg-transparent opacity-60 hover:opacity-100 cursor-pointer" onClick={() => fileInputRef.current.click()}><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/><Upload className="mx-auto mb-2 text-amber-400"/><p className="text-xs font-bold uppercase">Subir Documento</p></Card><div className="grid grid-cols-2 gap-4">{getPatient(selectedPatientId).images?.map(img => (<div key={img.id} className="relative group"><img src={img.url} alt="doc" className="rounded-xl w-full h-32 object-cover border border-white/10"/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all"><span className="text-[10px] text-white font-bold">{img.name}</span></div></div>))}</div></div>}
              </>
            )}
          </div>
        )}

        {/* --- OTRAS PESTAÑAS --- */}
        {activeTab === 'quote' && (
          <div className="space-y-6">
             <div className={`flex p-1 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-stone-200'}`}><button onClick={() => setQuoteMode('calc')} className={`flex-1 p-3 rounded-xl font-bold text-xs ${quoteMode === 'calc' ? 'bg-amber-400 text-white shadow-lg' : 'opacity-40'}`}>Calculadora</button><button onClick={() => setQuoteMode('packs')} className={`flex-1 p-3 rounded-xl font-bold text-xs ${quoteMode === 'packs' ? 'bg-amber-400 text-white shadow-lg' : 'opacity-40'}`}>Packs</button></div>
             {quoteMode === 'calc' ? (<><Button darkMode={darkMode} variant="secondary" className="w-full" onClick={() => setModal('loadPack')}>Cargar Pack</Button><Card darkMode={darkMode} className="space-y-4"><InputField darkMode={darkMode} label="Paciente" value={session.patientName} onChange={e=>setSession({...session, patientName:e.target.value})}/><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} label="Min" type="number" value={session.clinicalTime} onChange={e=>setSession({...session, clinicalTime:e.target.value})}/><InputField darkMode={darkMode} label="$ Insumos" type="number" value={session.baseCost} onChange={e=>setSession({...session, baseCost:e.target.value})}/></div></Card><Card darkMode={darkMode} className="text-center py-10 border-amber-400/40"><h2 className={`text-6xl font-black ${goldText}`}>${currentTotal.toLocaleString()}</h2><div className="grid grid-cols-2 gap-2 mt-4 px-4"><Button variant="secondary" onClick={saveBudgetToHistory}><Save/> Guardar Deuda</Button><Button onClick={()=>setModal('pay')}><Share2/> Cobrar</Button></div></Card></>) : (<Card darkMode={darkMode} className="space-y-4"><InputField darkMode={darkMode} label="Pack" value={newPack.name} onChange={e=>setNewPack({...newPack, name:e.target.value})}/><div className="flex gap-2"><InputField placeholder="Item" value={newPackItem.name} onChange={e=>setNewPackItem({...newPackItem, name:e.target.value})}/><InputField placeholder="$" type="number" value={newPackItem.cost} onChange={e=>setNewPackItem({...newPackItem, cost:e.target.value})}/><button onClick={()=>{if(newPackItem.name){setNewPack({...newPack, items:[...newPack.items, {name:newPackItem.name, cost:Number(newPackItem.cost)}]}); setNewPackItem({name:'', cost:''});}}} className="bg-amber-400 p-4 rounded-xl"><Plus/></button></div><Button className="w-full" onClick={()=>{if(newPack.name){setProtocols([...protocols, {...newPack, id:Date.now(), totalCost:newPack.items.reduce((a,b)=>a+b.cost,0)}]); notify("Pack OK");}}}>Guardar</Button><div className="space-y-2 mt-4">{protocols.map(p=>(<div key={p.id} className={`flex justify-between p-3 rounded-xl text-xs ${darkMode?'bg-white/5':'bg-stone-100'}`}><span>{p.name}</span><button onClick={()=>setProtocols(protocols.filter(x=>x.id!==p.id))} className="text-red-500"><Trash2 size={14}/></button></div>))}</div></Card>)}
          </div>
        )}

        {activeTab === 'clinical' && <div className="space-y-6"><h2 className="text-3xl font-black">Recetario</h2><Card darkMode={darkMode} className="space-y-4"><div className="flex gap-2"><Button darkMode={darkMode} variant="secondary" className="flex-1 text-xs" onClick={()=>setPrescription([...prescription, {name:'Amoxicilina 500', dosage:'c/8h'}])}>Pack Infección</Button><Button darkMode={darkMode} variant="secondary" className="flex-1 text-xs" onClick={()=>setPrescription([...prescription, {name:'Ketorolaco', dosage:'c/8h'}])}>Pack Dolor</Button></div><div className="flex gap-2"><InputField darkMode={darkMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/><InputField darkMode={darkMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/><button onClick={()=>{if(medInput.name){setPrescription([...prescription, medInput]); setMedInput({name:'', dosage:''});}}} className="bg-amber-400 p-4 rounded-xl"><Plus/></button></div><div className="space-y-2">{prescription.map((p,i)=>(<div key={i} className={`p-2 rounded flex justify-between text-xs ${darkMode?'bg-white/5':'bg-stone-100'}`}><span>{p.name}</span><button onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}><X size={12}/></button></div>))}</div><Button className="w-full" onClick={()=>generatePDF('rx')}>PDF Receta</Button></Card></div>}
        {activeTab === 'agenda' && <div className="space-y-6"><div className="flex justify-between"><h2 className="text-3xl font-black">Agenda</h2><Button darkMode={darkMode} onClick={()=>setModal('appt')}><Plus/></Button></div>{appointments.map(a=>(<Card key={a.id} darkMode={darkMode} className="flex justify-between items-center"><div className="flex gap-4"><div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 font-bold">{a.time}</div><div><h4 className="font-bold">{a.name}</h4><p className="text-xs opacity-50">{a.treatment}</p></div></div><button onClick={()=>setAppointments(appointments.filter(x=>x.id!==a.id))} className="text-red-500 bg-red-500/10 p-2 rounded"><Trash2/></button></Card>))}</div>}
        {activeTab === 'settings' && <div className="space-y-6"><h2 className="text-3xl font-black">Ajustes</h2><Card darkMode={darkMode} className="space-y-6"><InputField darkMode={darkMode} label="Valor Hora" type="number" value={config.hourlyRate} onChange={e=>setConfig({...config, hourlyRate:e.target.value})}/><InputField darkMode={darkMode} label="Margen %" type="number" value={config.profitMargin} onChange={e=>setConfig({...config, profitMargin:e.target.value})}/><InputField darkMode={darkMode} label="Nombre" value={config.name} onChange={e=>setConfig({...config, name:e.target.value})}/><InputField darkMode={darkMode} label="Banco" value={config.bankName} onChange={e=>setConfig({...config, bankName:e.target.value})}/><InputField darkMode={darkMode} label="Cuenta" value={config.accountNumber} onChange={e=>setConfig({...config, accountNumber:e.target.value})}/></Card></div>}

      </main>

      {/* --- MODALES --- */}
      {modal === 'appt' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card darkMode={true} className="w-full max-w-sm border-amber-400/50"><h3 className={`text-xl font-bold mb-4 ${goldText}`}>Nueva Cita</h3><div className="space-y-4"><InputField placeholder="Paciente" value={newAppt.name} onChange={e=>setNewAppt({...newAppt, name:e.target.value})}/><div className="flex gap-2"><input type="date" className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-white" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/><input type="time" className="w-24 bg-white/5 p-3 rounded-xl border border-white/10 text-white" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/></div><Button className="w-full" onClick={()=>{if(newAppt.name){setAppointments([...appointments, {...newAppt, id:Date.now()}]); setModal(null);}}}>Agendar</Button><button className="w-full text-xs text-white/30 mt-2" onClick={()=>setModal(null)}>CANCELAR</button></div></Card></div>}
      {modal === 'loadPack' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card darkMode={true} className="w-full max-w-sm h-96 flex flex-col border-amber-400/50"><h3 className={`text-xl font-bold mb-4 ${goldText}`}>Packs</h3><div className="flex-1 overflow-y-auto space-y-2">{protocols.map(p=>(<button key={p.id} onClick={()=>{setSession({...session, treatmentName:p.name, baseCost:p.totalCost}); setModal(null); notify("Cargado");}} className="w-full text-left p-4 bg-white/5 rounded-xl border border-white/5 hover:border-amber-400 transition-all"><span className="font-bold">{p.name}</span> <span className="text-amber-400">${p.totalCost.toLocaleString()}</span></button>))}</div><button className="mt-4 text-xs text-white/30" onClick={()=>setModal(null)}>CERRAR</button></Card></div>}
      {modal === 'abono' && selectedFinancialRecord && ( <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"> <Card darkMode={true} className="w-full max-w-sm border-amber-400/50"> <h3 className="text-xl font-bold mb-2 text-white">Registrar Abono</h3> <p className="text-sm opacity-60 mb-4">{selectedFinancialRecord.patientName}</p> <div className="bg-white/5 p-4 rounded-xl mb-4"> <p className="text-xs font-bold text-amber-400">DEUDA ACTUAL</p> <p className="text-2xl font-black text-white">${(selectedFinancialRecord.total - (selectedFinancialRecord.paid || 0)).toLocaleString()}</p> </div> <InputField placeholder="Monto a pagar..." type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}/> <Button className="w-full !mt-4" onClick={registerPayment}>Confirmar Pago</Button> <button className="w-full mt-4 text-xs text-white/30" onClick={() => setModal(null)}>CANCELAR</button> </Card> </div> )}
      {modal === 'pay' && <div className="fixed inset-0 z-50 bg-black/90 flex items-end justify-center p-4"><Card darkMode={true} className="w-full max-w-sm border-amber-400/50"><h3 className={`text-xl font-bold mb-6 ${goldText}`}>Cobrar</h3><Button className="w-full !bg-emerald-600 !py-4 mb-4" onClick={()=>window.open(`https://wa.me/?text=Total: $${currentTotal}`)}>Enviar WhatsApp</Button><button className="w-full text-xs text-white/30" onClick={()=>setModal(null)}>CERRAR</button></Card></div>}

    </div>
  );
}