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
  Activity, AlertCircle, FileCheck, Check
} from 'lucide-react';

// --- ESTILOS & CONSTANTES ---
const goldGradient = "bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#B69121]";
const goldText = "bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F2D06B]";
const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

// --- COMPONENTES UI ---
const Card = ({ children, className = "", darkMode, ...props }) => (
  <div {...props} className={`p-6 rounded-3xl transition-all duration-300 relative border ${
    darkMode ? 'bg-[#1a1a1a]/90 border-white/10 shadow-2xl shadow-black' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/40'
  } ${className}`}>{children}</div>
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

const InputField = ({ label, icon: Icon, darkMode, textarea, ...props }) => (
  <div className="w-full">
    {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ml-1 ${darkMode ? 'text-amber-400' : 'text-stone-500'}`}>{label}</label>}
    <div className={`flex items-start p-3 rounded-xl border transition-all ${darkMode ? 'bg-black/40 border-white/10 focus-within:border-amber-400' : 'bg-white border-stone-300 focus-within:border-amber-500'}`}>
      {Icon && <Icon size={16} className="mr-3 text-amber-500 opacity-80 mt-1"/>}
      {textarea ? 
        <textarea {...props} rows="3" className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${darkMode ? 'text-white' : 'text-stone-800'}`}/> :
        <input {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${darkMode ? 'text-white' : 'text-stone-800'}`}/>
      }
    </div>
  </div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sc_theme') === 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- DATOS PERSISTENTES (v20 - Clinical Suite) ---
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('sc_v20_cfg')) || { hourlyRate: 25000, profitMargin: 30, bankName: "", accountType: "", accountNumber: "", rut: "", name: "Dr. Benjamín", mpLink: "" });
  const [protocols, setProtocols] = useState(() => JSON.parse(localStorage.getItem('sc_v20_pks')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('sc_v20_hst')) || []);
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem('sc_v20_apt')) || []);
  const [patientRecords, setPatientRecords] = useState(() => JSON.parse(localStorage.getItem('sc_v20_rec')) || {});

  // --- ESTADOS TEMPORALES ---
  const [session, setSession] = useState({ patientName: '', treatmentName: '', clinicalTime: 60, baseCost: 0 });
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
  const [prescription, setPrescription] = useState([]);
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '' });
  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  
  // Estados Ficha Clínica Compleja
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('clinical'); 
  const [paymentAmount, setPaymentAmount] = useState(''); 
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null); 
  
  // Estados Modal Odonto/Perio
  const [toothModalData, setToothModalData] = useState({ id: null, treatments: [], perio: { pd: '', bop: false, mobility: 0, furcation: 0 } });
  const [newTreatment, setNewTreatment] = useState('');
  const [newEvolution, setNewEvolution] = useState('');

  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [notification, setNotification] = useState('');

  // --- EFECTOS ---
  useEffect(() => { 
    localStorage.setItem('sc_theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sc_v20_cfg', JSON.stringify(config));
    localStorage.setItem('sc_v20_pks', JSON.stringify(protocols));
    localStorage.setItem('sc_v20_hst', JSON.stringify(history));
    localStorage.setItem('sc_v20_apt', JSON.stringify(appointments));
    localStorage.setItem('sc_v20_rec', JSON.stringify(patientRecords));
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

  // --- LÓGICA PACIENTES ---
  const getPatient = (id) => {
    const safeId = id || 'unknown';
    // Estructura v20 mejorada
    const emptyPatient = { 
      id: safeId, 
      personal: { name: safeId, rut: '', email: '', phone: '', address: '', city: '', commune: '', birthDate: '', gender: '', job: '' },
      anamnesis: {}, 
      clinical: {
        teeth: {}, // { 18: { status: 'caries', history: ['Resina O'], perio: {pd:3, bop:true} } }
        aap: { stage: '', grade: '' },
        evolution: [] // { date, tooth, note, id }
      },
      images: [] 
    };
    return patientRecords[safeId] || emptyPatient;
  };

  const handleCreatePatient = () => {
    if (!searchTerm.trim()) { notify("Escribe un nombre"); return; }
    const id = searchTerm.trim();
    if (!patientRecords[id]) {
      setPatientRecords(prev => ({ ...prev, [id]: getPatient(id) }));
      notify("Paciente Creado");
    }
    setSelectedPatientId(id); setSearchTerm('');
  };
  
  const updatePatient = (id, section, data) => setPatientRecords(prev => ({ ...prev, [id]: { ...prev[id], [section]: { ...prev[id][section], ...data } } }));
  
  // --- LÓGICA CLÍNICA PROFUNDA ---
  const openToothModal = (toothNum) => {
    const p = getPatient(selectedPatientId);
    const tData = p.clinical.teeth[toothNum] || { status: null, history: [], perio: { pd: '', bop: false, mobility: 0, furcation: 0 } };
    setToothModalData({ id: toothNum, ...tData });
    setModal('tooth');
  };

  const saveToothData = () => {
    const p = getPatient(selectedPatientId);
    const updatedTeeth = { ...p.clinical.teeth, [toothModalData.id]: { 
        status: toothModalData.status, 
        history: toothModalData.history, 
        perio: toothModalData.perio 
    }};
    
    setPatientRecords(prev => ({...prev, [selectedPatientId]: { 
      ...prev[selectedPatientId], 
      clinical: { ...prev[selectedPatientId].clinical, teeth: updatedTeeth } 
    }}));
    
    setModal(null);
    notify(`Diente ${toothModalData.id} Actualizado`);
  };

  const addTreatmentToTooth = () => {
    if(!newTreatment) return;
    setToothModalData(prev => ({...prev, history: [...(prev.history || []), newTreatment] }));
    setNewTreatment('');
  };

  const addEvolution = () => {
    if(!newEvolution) return notify("Escribe una nota");
    const p = getPatient(selectedPatientId);
    const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), text: newEvolution, tooth: toothModalData.id || 'General' };
    const updatedEvolution = [newEntry, ...(p.clinical.evolution || [])];
    
    setPatientRecords(prev => ({...prev, [selectedPatientId]: { 
      ...prev[selectedPatientId], 
      clinical: { ...prev[selectedPatientId].clinical, evolution: updatedEvolution } 
    }}));
    setNewEvolution('');
    notify("Evolución Guardada");
  };

  // --- TESORERÍA ---
  const saveBudgetToHistory = () => {
    if (!session.patientName) return notify("Falta nombre");
    const newRecord = { id: Date.now(), date: new Date().toLocaleDateString(), patientName: session.patientName, treatmentName: session.treatmentName, total: currentTotal, paid: 0, payments: [], status: 'pending' };
    setHistory([newRecord, ...history]); notify("Deuda Creada"); setActiveTab('history'); 
  };

  const registerPayment = () => {
    const amount = parseInt(paymentAmount);
    if (!amount || amount <= 0) return notify("Monto inválido");
    const updatedHistory = history.map(record => {
      if (record.id === selectedFinancialRecord.id) {
        const newPaid = (record.paid || 0) + amount;
        return { ...record, paid: newPaid, status: newPaid >= record.total ? 'paid' : 'partial', payments: [...(record.payments || []), { date: new Date().toLocaleDateString(), amount: amount }] };
      }
      return record;
    });
    setHistory(updatedHistory); setPaymentAmount(''); setModal(null); notify("Pago Registrado 💰");
  };

  // --- PDF ---
  const generatePDF = (type) => {
    const doc = new jsPDF();
    doc.text(`Dr. ${config.name}`, 20, 20);
    if (type === 'rx') { autoTable(doc, { startY: 40, head: [['Rx', 'Ind']], body: prescription.map(p => [p.name, p.dosage]) }); doc.save("Receta.pdf"); }
    else { autoTable(doc, { startY: 40, head: [['Item', 'Valor']], body: [[session.treatmentName, `$${currentTotal}`]] }); doc.save("Presupuesto.pdf"); }
    notify("PDF Listo");
  };

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
           <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold">{config.name?.[0]}</div><p className="text-xs font-bold truncate w-24">{config.name || 'Dr. Usuario'}</p></div>
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-amber-400">{darkMode?<Sun size={18}/>:<Moon size={18}/>}</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 h-screen overflow-y-auto">
        <div className="md:hidden flex justify-between items-center mb-8"><button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-xl"><Menu/></button><span className={`font-black ${goldText}`}>SHININGCLOUD</span><div className="w-8"></div></div>
        {notification && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] bg-black border border-amber-400 text-amber-400 px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold animate-bounce"><Diamond size={18}/> {notification}</div>}

        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card darkMode={darkMode} className={`${goldGradient} !border-none text-white`}><p className="text-[10px] font-bold uppercase opacity-80">Por Cobrar</p><h2 className="text-5xl font-black">${(totalInvoiced - totalCollected).toLocaleString()}</h2></Card>
              <Card darkMode={darkMode} className="bg-emerald-600 !border-none text-white"><p className="text-[10px] font-bold uppercase opacity-80">Recaudado</p><h2 className="text-5xl font-black">${totalCollected.toLocaleString()}</h2></Card>
            </div>
          </div>
        )}

        {/* --- CAJA (HISTORIAL) --- */}
        {activeTab === 'history' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center"><h2 className="text-3xl font-black">Caja</h2><Button darkMode={darkMode} variant="secondary" onClick={() => {const ws=XLSX.utils.json_to_sheet(history); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Caja"); XLSX.writeFile(wb,"Reporte_Caja.xlsx");}}><FileSpreadsheet/> Excel</Button></div>
             <InputField darkMode={darkMode} icon={Search} placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
             <div className="space-y-3">{history.filter(h=>h.patientName?.toLowerCase().includes(searchTerm.toLowerCase())).map(h=>(<Card key={h.id} darkMode={darkMode} className="flex justify-between items-center cursor-pointer border-l-4 hover:opacity-80" style={{borderLeftColor: (h.total-(h.paid||0))<=0 ? '#10b981':'#ef4444'}} onClick={()=>{setSelectedFinancialRecord(h); setModal('abono');}}><div><h4 className="font-bold">{h.patientName}</h4><p className="text-xs opacity-50">{h.treatmentName} • {h.date}</p></div><div className="text-right"><p className="font-black text-amber-400">${h.total?.toLocaleString()}</p><p className="text-xs opacity-50">Pagado: ${h.paid?.toLocaleString()}</p></div></Card>))}</div>
          </div>
        )}

        {/* --- FICHA PACIENTE 360 --- */}
        {activeTab === 'ficha' && (
          <div className="space-y-6 animate-in slide-in-from-right-5">
            {!selectedPatientId ? (
              <>
                <h2 className="text-3xl font-black">Pacientes</h2>
                <div className="flex gap-2"><InputField darkMode={darkMode} icon={Search} placeholder="Buscar o crear..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/><Button onClick={handleCreatePatient}><Plus/> Crear/Abrir</Button></div>
                <div className="grid gap-3">{Object.keys(patientRecords).filter(k => k.toLowerCase().includes(searchTerm.toLowerCase())).map(key => ( <Card key={key} darkMode={darkMode} className="flex justify-between items-center cursor-pointer hover:border-amber-400" onClick={() => setSelectedPatientId(key)}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">{key[0].toUpperCase()}</div><span className="font-bold capitalize">{key}</span></div><span className="text-xs opacity-40">Ver Ficha →</span></Card> ))}</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4"><button onClick={() => setSelectedPatientId(null)} className={`p-2 rounded-full ${darkMode ? 'bg-white/5' : 'bg-stone-200'}`}><ArrowLeft/></button><h2 className="text-3xl font-black capitalize">{selectedPatientId}</h2></div>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2">{[{id:'personal', label:'Datos', icon: User}, {id:'clinical', label:'Clínica', icon: Activity}, {id:'perio', label:'Periodoncia', icon: FileBarChart}, {id:'evolution', label:'Evolución', icon: FileText}].map(tab => (<button key={tab.id} onClick={() => setPatientTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${patientTab === tab.id ? 'bg-amber-400 text-white' : (darkMode ? 'bg-white/5 opacity-60' : 'bg-stone-200 text-stone-600')}`}><tab.icon size={14}/> {tab.label}</button>))}</div>
                
                {/* --- TAB: CLINICA (ODONTOGRAMA) --- */}
                {patientTab === 'clinical' && (
                  <div className="space-y-6 animate-in fade-in">
                    <Card darkMode={darkMode} className="text-center overflow-x-auto">
                      <h3 className="font-bold text-amber-400 text-xs uppercase tracking-widest mb-4">Odontograma Interactivo</h3>
                      <div className="flex flex-col gap-4 min-w-[500px]">
                        <div className="flex gap-1 justify-center">{TEETH_UPPER.map(t => <button key={t} onClick={() => openToothModal(t)} className={`w-8 h-10 rounded border text-[10px] font-bold ${getPatient(selectedPatientId).clinical.teeth[t]?.status ? 'bg-red-500 text-white' : (darkMode?'bg-white/5 border-white/10':'bg-stone-100 border-stone-300 text-stone-600')}`}>{t}</button>)}</div>
                        <div className="flex gap-1 justify-center">{TEETH_LOWER.map(t => <button key={t} onClick={() => openToothModal(t)} className={`w-8 h-10 rounded border text-[10px] font-bold ${getPatient(selectedPatientId).clinical.teeth[t]?.status ? 'bg-red-500 text-white' : (darkMode?'bg-white/5 border-white/10':'bg-stone-100 border-stone-300 text-stone-600')}`}>{t}</button>)}</div>
                      </div>
                      <p className="text-xs opacity-40 mt-4">Haz clic en un diente para agregar tratamientos</p>
                    </Card>
                  </div>
                )}

                {/* --- TAB: PERIODONCIA (AAP) --- */}
                {patientTab === 'perio' && (
                  <Card darkMode={darkMode} className="space-y-4 animate-in fade-in">
                    <h3 className="font-bold text-amber-400 text-xs uppercase tracking-widest">Diagnóstico AAP</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField darkMode={darkMode} label="Estadio (Stage)" placeholder="I - IV" value={getPatient(selectedPatientId).clinical.aap.stage} onChange={e => updatePatient(selectedPatientId, 'clinical', { aap: { ...getPatient(selectedPatientId).clinical.aap, stage: e.target.value } })}/>
                      <InputField darkMode={darkMode} label="Grado (Grade)" placeholder="A - C" value={getPatient(selectedPatientId).clinical.aap.grade} onChange={e => updatePatient(selectedPatientId, 'clinical', { aap: { ...getPatient(selectedPatientId).clinical.aap, grade: e.target.value } })}/>
                    </div>
                    <div className="overflow-x-auto mt-4">
                      <table className={`w-full text-xs text-left ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                        <thead><tr className="border-b border-white/10"><th className="p-2">Diente</th><th className="p-2">PS (mm)</th><th className="p-2">Sangrado</th><th className="p-2">Movilidad</th></tr></thead>
                        <tbody>
                          {Object.entries(getPatient(selectedPatientId).clinical.teeth).filter(([_, data]) => data.perio?.pd).map(([tooth, data]) => (
                            <tr key={tooth} className="border-b border-white/5">
                              <td className="p-2 font-bold">{tooth}</td>
                              <td className="p-2">{data.perio.pd}</td>
                              <td className="p-2">{data.perio.bop ? 'SÍ' : '-'}</td>
                              <td className="p-2">{data.perio.mobility || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {Object.keys(getPatient(selectedPatientId).clinical.teeth).filter(k => getPatient(selectedPatientId).clinical.teeth[k]?.perio?.pd).length === 0 && <p className="text-center opacity-30 py-4">Sin registros periodontales (Agrégalos desde el Odontograma)</p>}
                    </div>
                  </Card>
                )}

                {/* --- TAB: EVOLUCIÓN --- */}
                {patientTab === 'evolution' && (
                  <div className="space-y-4 animate-in fade-in">
                    <Card darkMode={darkMode} className="space-y-2">
                      <InputField darkMode={darkMode} textarea label="Nueva Evolución" placeholder="Describa el procedimiento..." value={newEvolution} onChange={e => setNewEvolution(e.target.value)}/>
                      <Button className="w-full" onClick={addEvolution}>Guardar</Button>
                    </Card>
                    <div className="space-y-3">
                      {getPatient(selectedPatientId).clinical.evolution?.map(evo => (
                        <div key={evo.id} className={`p-4 rounded-xl text-sm relative pl-6 ${darkMode ? 'bg-white/5' : 'bg-stone-100'}`}>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-xl"></div>
                          <div className="flex justify-between mb-1"><span className="font-bold text-amber-400 text-xs">{evo.date}</span><span className="text-xs opacity-50 font-bold">Diente: {evo.tooth}</span></div>
                          <p>{evo.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- TAB: PERSONAL --- */}
                {patientTab === 'personal' && <Card darkMode={darkMode} className="space-y-4 animate-in fade-in"><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} label="Nombre" value={getPatient(selectedPatientId).personal.name} onChange={e=>updatePatient(selectedPatientId,'personal',{name:e.target.value})}/><InputField darkMode={darkMode} label="RUT" value={getPatient(selectedPatientId).personal.rut} onChange={e=>updatePatient(selectedPatientId,'personal',{rut:e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} label="Teléfono" value={getPatient(selectedPatientId).personal.phone} onChange={e=>updatePatient(selectedPatientId,'personal',{phone:e.target.value})}/><InputField darkMode={darkMode} label="Email" value={getPatient(selectedPatientId).personal.email} onChange={e=>updatePatient(selectedPatientId,'personal',{email:e.target.value})}/></div></Card>}
              </>
            )}
          </div>
        )}

        {/* --- OTRAS PESTAÑAS (Resumidas) --- */}
        {activeTab === 'quote' && (<div className="space-y-6"><div className={`flex p-1 rounded-2xl ${darkMode?'bg-white/5':'bg-stone-200'}`}><button onClick={()=>setQuoteMode('calc')} className={`flex-1 p-3 rounded-xl font-bold text-xs ${quoteMode==='calc'?'bg-amber-400 text-white':'opacity-40'}`}>Calculadora</button><button onClick={()=>setQuoteMode('packs')} className={`flex-1 p-3 rounded-xl font-bold text-xs ${quoteMode==='packs'?'bg-amber-400 text-white':'opacity-40'}`}>Packs</button></div>{quoteMode==='calc'?(<><Button darkMode={darkMode} variant="secondary" className="w-full" onClick={()=>setModal('loadPack')}>Cargar Pack</Button><Card darkMode={darkMode} className="space-y-4"><InputField darkMode={darkMode} label="Paciente" value={session.patientName} onChange={e=>setSession({...session, patientName:e.target.value})}/><div className="grid grid-cols-2 gap-4"><InputField darkMode={darkMode} label="Min" type="number" value={session.clinicalTime} onChange={e=>setSession({...session, clinicalTime:e.target.value})}/><InputField darkMode={darkMode} label="Insumos" type="number" value={session.baseCost} onChange={e=>setSession({...session, baseCost:e.target.value})}/></div></Card><Card darkMode={darkMode} className="text-center py-10 border-amber-400/40"><h2 className={`text-6xl font-black ${goldText}`}>${currentTotal.toLocaleString()}</h2><div className="grid grid-cols-2 gap-2 mt-4 px-4"><Button variant="secondary" onClick={saveBudgetToHistory}><Save/> Guardar</Button><Button onClick={()=>setModal('pay')}><Share2/> Cobrar</Button></div></Card></>):(<Card darkMode={darkMode} className="space-y-4"><InputField darkMode={darkMode} label="Pack" value={newPack.name} onChange={e=>setNewPack({...newPack, name:e.target.value})}/><div className="flex gap-2"><InputField placeholder="Item" value={newPackItem.name} onChange={e=>setNewPackItem({...newPackItem, name:e.target.value})}/><InputField placeholder="$" type="number" value={newPackItem.cost} onChange={e=>setNewPackItem({...newPackItem, cost:e.target.value})}/><button onClick={()=>{if(newPackItem.name){setNewPack({...newPack, items:[...newPack.items, {name:newPackItem.name, cost:Number(newPackItem.cost)}]}); setNewPackItem({name:'', cost:''});}}} className="bg-amber-400 p-4 rounded-xl"><Plus/></button></div><Button className="w-full" onClick={()=>{if(newPack.name){setProtocols([...protocols, {...newPack, id:Date.now(), totalCost:newPack.items.reduce((a,b)=>a+b.cost,0)}]); notify("Pack OK");}}}>Guardar</Button></Card>)}</div>)}
        {activeTab === 'clinical' && <div className="space-y-6"><h2 className="text-3xl font-black">Recetario</h2><Card darkMode={darkMode} className="space-y-4"><div className="flex gap-2"><Button darkMode={darkMode} variant="secondary" className="flex-1 text-xs" onClick={()=>setPrescription([...prescription, {name:'Amoxicilina 500', dosage:'c/8h'}])}>Infección</Button><Button darkMode={darkMode} variant="secondary" className="flex-1 text-xs" onClick={()=>setPrescription([...prescription, {name:'Ketorolaco', dosage:'c/8h'}])}>Dolor</Button></div><div className="flex gap-2"><InputField darkMode={darkMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/><InputField darkMode={darkMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/><button onClick={()=>{if(medInput.name){setPrescription([...prescription, medInput]); setMedInput({name:'', dosage:''});}}} className="bg-amber-400 p-4 rounded-xl"><Plus/></button></div><div className="space-y-2">{prescription.map((p,i)=>(<div key={i} className={`p-2 rounded flex justify-between text-xs ${darkMode?'bg-white/5':'bg-stone-100'}`}><span>{p.name}</span><button onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}><X size={12}/></button></div>))}</div><Button className="w-full" onClick={()=>generatePDF('rx')}>PDF</Button></Card></div>}
        {activeTab === 'agenda' && <div className="space-y-6"><div className="flex justify-between"><h2 className="text-3xl font-black">Agenda</h2><Button darkMode={darkMode} onClick={()=>setModal('appt')}><Plus/></Button></div>{appointments.map(a=>(<Card key={a.id} darkMode={darkMode} className="flex justify-between items-center"><div className="flex gap-4"><div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 font-bold">{a.time}</div><div><h4 className="font-bold">{a.name}</h4><p className="text-xs opacity-50">{a.treatment}</p></div></div><button onClick={()=>setAppointments(appointments.filter(x=>x.id!==a.id))} className="text-red-500 bg-red-500/10 p-2 rounded"><Trash2/></button></Card>))}</div>}
        {activeTab === 'settings' && <div className="space-y-6"><h2 className="text-3xl font-black">Ajustes</h2><Card darkMode={darkMode} className="space-y-6"><InputField darkMode={darkMode} label="Valor Hora" type="number" value={config.hourlyRate} onChange={e=>setConfig({...config, hourlyRate:e.target.value})}/><InputField darkMode={darkMode} label="Margen %" type="number" value={config.profitMargin} onChange={e=>setConfig({...config, profitMargin:e.target.value})}/><InputField darkMode={darkMode} label="Nombre" value={config.name} onChange={e=>setConfig({...config, name:e.target.value})}/><InputField darkMode={darkMode} label="Banco" value={config.bankName} onChange={e=>setConfig({...config, bankName:e.target.value})}/><InputField darkMode={darkMode} label="Cuenta" value={config.accountNumber} onChange={e=>setConfig({...config, accountNumber:e.target.value})}/></Card></div>}

      </main>

      {/* --- MODALES --- */}
      {modal === 'tooth' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <Card darkMode={true} className="w-full max-w-sm border-amber-400/50 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-white text-center">Diente {toothModalData.id}</h3>
            
            {/* SECCIÓN 1: ESTADO VISUAL */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Estado Visual</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setToothModalData({...toothModalData, status: 'caries'})} className={`p-3 rounded-xl border font-bold text-xs ${toothModalData.status === 'caries' ? 'bg-red-500 border-red-500' : 'bg-white/5 border-white/10'}`}>Caries (Rojo)</button>
                <button onClick={() => setToothModalData({...toothModalData, status: 'filled'})} className={`p-3 rounded-xl border font-bold text-xs ${toothModalData.status === 'filled' ? 'bg-blue-500 border-blue-500' : 'bg-white/5 border-white/10'}`}>Obturado (Azul)</button>
                <button onClick={() => setToothModalData({...toothModalData, status: null})} className="p-3 rounded-xl border bg-white/5 border-white/10 font-bold text-xs opacity-50 col-span-2">Limpiar Estado</button>
              </div>
            </div>

            {/* SECCIÓN 2: TRATAMIENTOS (Multicapa) */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Historial de Tratamientos</p>
              <div className="flex gap-2 mb-2">
                <input placeholder="Ej: Resina Oclusal" className="flex-1 bg-white/5 p-2 rounded-lg text-sm outline-none" value={newTreatment} onChange={e => setNewTreatment(e.target.value)}/>
                <button onClick={addTreatmentToTooth} className="bg-amber-400 p-2 rounded-lg text-black font-bold">+</button>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {toothModalData.history?.map((t, i) => <div key={i} className="text-xs bg-white/5 p-2 rounded">{t}</div>)}
              </div>
            </div>

            {/* SECCIÓN 3: PERIODONCIA (AAP) */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Datos Periodontales</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] block mb-1">Profundidad (mm)</label><input type="number" className="w-full bg-white/5 p-2 rounded text-white text-center" value={toothModalData.perio.pd} onChange={e => setToothModalData({...toothModalData, perio: {...toothModalData.perio, pd: e.target.value}})}/></div>
                <div><label className="text-[9px] block mb-1">Movilidad (0-3)</label><input type="number" className="w-full bg-white/5 p-2 rounded text-white text-center" value={toothModalData.perio.mobility} onChange={e => setToothModalData({...toothModalData, perio: {...toothModalData.perio, mobility: e.target.value}})}/></div>
              </div>
              <button onClick={() => setToothModalData({...toothModalData, perio: {...toothModalData.perio, bop: !toothModalData.perio.bop}})} className={`w-full mt-2 p-2 rounded border text-xs font-bold ${toothModalData.perio.bop ? 'bg-red-500 border-red-500' : 'bg-white/5 border-white/10 opacity-50'}`}>Sangrado al Sondaje {toothModalData.perio.bop ? 'SÍ' : 'NO'}</button>
            </div>

            <Button className="w-full" onClick={saveToothData}>Guardar Cambios</Button>
            <button className="w-full mt-2 text-xs text-white/30" onClick={() => setModal(null)}>Cerrar</button>
          </Card>
        </div>
      )}

      {/* OTROS MODALES (Appt, Pack, Pay, Abono) - Mismos que antes */}
      {modal === 'appt' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card darkMode={true} className="w-full max-w-sm border-amber-400/50"><h3 className={`text-xl font-bold mb-4 ${goldText}`}>Nueva Cita</h3><div className="space-y-4"><InputField placeholder="Paciente" value={newAppt.name} onChange={e=>setNewAppt({...newAppt, name:e.target.value})}/><div className="flex gap-2"><input type="date" className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-white" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/><input type="time" className="w-24 bg-white/5 p-3 rounded-xl border border-white/10 text-white" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/></div><Button className="w-full" onClick={()=>{if(newAppt.name){setAppointments([...appointments, {...newAppt, id:Date.now()}]); setModal(null);}}}>Agendar</Button><button className="w-full text-xs text-white/30 mt-2" onClick={()=>setModal(null)}>CANCELAR</button></div></Card></div>}
      {modal === 'loadPack' && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card darkMode={true} className="w-full max-w-sm h-96 flex flex-col border-amber-400/50"><h3 className={`text-xl font-bold mb-4 ${goldText}`}>Packs</h3><div className="flex-1 overflow-y-auto space-y-2">{protocols.map(p=>(<button key={p.id} onClick={()=>{setSession({...session, treatmentName:p.name, baseCost:p.totalCost}); setModal(null); notify("Cargado");}} className="w-full text-left p-4 bg-white/5 rounded-xl border border-white/5 hover:border-amber-400 transition-all"><span className="font-bold">{p.name}</span> <span className="text-amber-400">${p.totalCost.toLocaleString()}</span></button>))}</div><button className="mt-4 text-xs text-white/30" onClick={()=>setModal(null)}>CERRAR</button></Card></div>}
      {modal === 'abono' && selectedFinancialRecord && (<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"><Card darkMode={true} className="w-full max-w-sm border-amber-400/50"><h3 className="text-xl font-bold mb-2 text-white">Registrar Abono</h3><p className="text-sm opacity-60 mb-4">{selectedFinancialRecord.patientName}</p><div className="bg-white/5 p-4 rounded-xl mb-4"><p className="text-xs font-bold text-amber-400">DEUDA ACTUAL</p><p className="text-2xl font-black text-white">${(selectedFinancialRecord.total - (selectedFinancialRecord.paid || 0)).toLocaleString()}</p></div><InputField placeholder="Monto a pagar..." type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}/><Button className="w-full !mt-4" onClick={registerPayment}>Confirmar Pago</Button><button className="w-full mt-4 text-xs text-white/30" onClick={() => setModal(null)}>CANCELAR</button></Card></div>)}
      {modal === 'pay' && <div className="fixed inset-0 z-50 bg-black/90 flex items-end justify-center p-4"><Card darkMode={true} className="w-full max-w-sm border-amber-400/50"><h3 className={`text-xl font-bold mb-6 ${goldText}`}>Cobrar</h3><Button className="w-full !bg-emerald-600 !py-4 mb-4" onClick={()=>window.open(`https://wa.me/?text=Total: $${currentTotal}`)}>Enviar WhatsApp</Button><button className="w-full text-xs text-white/30" onClick={()=>setModal(null)}>CERRAR</button></Card></div>}

    </div>
  );
}