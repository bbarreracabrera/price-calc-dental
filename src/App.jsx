import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; // Nueva librería para tablas PDF
import * as XLSX from 'xlsx'; // Nueva librería para Excel Real
import { 
  Calculator, User, Share2, X, Landmark, CreditCard, Settings, 
  Activity, Library, Plus, Trash2, Save, History, 
  Search, MessageCircle, Moon, Sun, TrendingUp, Cloud, Diamond, FileSpreadsheet
} from 'lucide-react';

// --- ESTILOS DE LUJO ---
const goldGradient = "bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#B69121]";
const goldText = "bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F2D06B]";

// --- COMPONENTES VISUALES ---
const Card = ({ children, className = "", darkMode, noBorder = false }) => (
  <div className={`p-5 rounded-3xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
    darkMode 
      ? `bg-[#1a1a1a]/60 ${noBorder ? '' : 'border border-white/10'} shadow-2xl shadow-black/50` 
      : `bg-white/70 ${noBorder ? '' : 'border border-amber-900/5'} shadow-xl shadow-amber-900/5`
  } ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", darkMode }) => {
  const baseStyle = "p-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide relative overflow-hidden";
  let variantStyle = "";
  if (variant === "primary") variantStyle = `${goldGradient} text-white shadow-lg shadow-[#D4AF37]/40 hover:brightness-110`;
  if (variant === "secondary") variantStyle = darkMode 
    ? "bg-white/5 border border-white/10 text-[#F2D06B] hover:bg-white/10" 
    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50";
  return <button onClick={onClick} className={`${baseStyle} ${variantStyle} ${className}`}>{children}</button>;
};

const InputField = ({ label, icon: Icon, darkMode, ...props }) => (
  <div className="w-full">
    {label && <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ml-1 opacity-70 ${darkMode ? 'text-[#F2D06B]' : 'text-stone-500'}`}>{label}</label>}
    <div className={`flex items-center p-3.5 rounded-2xl border transition-all duration-300 group ${
      darkMode 
        ? 'bg-black/40 border-white/5 focus-within:border-[#D4AF37]/60 focus-within:bg-black/60' 
        : 'bg-white/60 border-stone-200 focus-within:border-[#D4AF37]/60 focus-within:bg-white'
    }`}>
      {Icon && <Icon size={18} className={`mr-3 transition-colors ${darkMode ? 'text-white/40 group-focus-within:text-[#D4AF37]' : 'text-stone-400 group-focus-within:text-[#D4AF37]'}`}/>}
      <input {...props} className={`bg-transparent outline-none w-full font-medium ${darkMode ? 'text-white placeholder-white/20' : 'text-stone-800 placeholder-stone-400'}`}/>
    </div>
  </div>
);

// --- APP PRINCIPAL ---
function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeTab, setActiveTab] = useState('dashboard'); 

  // Datos Persistentes
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('priceCalcConfig')) || {
    hourlyRate: 25000, profitMargin: 30, bankName: "Banco Estado", accountType: "Cuenta RUT", accountNumber: "", rut: "", email: "", name: "Dr. Benjamín", mpLink: ""
  });
  const [protocols, setProtocols] = useState(() => JSON.parse(localStorage.getItem('dentalProtocols')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('dentalHistory')) || []);

  const [session, setSession] = useState({ patientName: '', treatmentName: '', clinicalTime: 60, baseCost: 0 });
  const [newProtocol, setNewProtocol] = useState({ name: '', time: 30, items: [] });
  const [newItem, setNewItem] = useState({ name: '', cost: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [notification, setNotification] = useState('');

  useEffect(() => { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => { localStorage.setItem('priceCalcConfig', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('dentalProtocols', JSON.stringify(protocols)); }, [protocols]);
  useEffect(() => { localStorage.setItem('dentalHistory', JSON.stringify(history)); }, [history]);

  const calculateTotal = (time, cost, margin) => {
    const costLabor = (Number(config.hourlyRate) / 60) * Number(time);
    const totalCost = costLabor + Number(cost);
    const marginDecimal = Number(margin) / 100;
    if (marginDecimal >= 1) return totalCost;
    const final = totalCost / (1 - marginDecimal);
    return isFinite(final) ? Math.round(final) : 0;
  };
  const currentTotal = calculateTotal(session.clinicalTime, session.baseCost, config.profitMargin);
  const totalIncome = history.reduce((acc, curr) => acc + curr.total, 0);

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const handleSaveHistory = () => {
    if (!session.patientName) return notify("Falta nombre");
    const newRecord = { 
      ...session, 
      id: Date.now(), 
      date: new Date().toLocaleDateString(), 
      total: currentTotal, 
      profit: currentTotal - (Number(session.baseCost) + ((Number(config.hourlyRate)/60)*Number(session.clinicalTime))), // Calculamos Ganancia Real
      details: { ...session } 
    };
    setHistory([newRecord, ...history]);
    notify("Guardado en Historial"); setActiveTab('dashboard');
  };

  // --- FUNCIÓN EXCEL PRO ---
  const exportToExcel = () => {
    if (history.length === 0) return notify("No hay datos");
    
    // 1. Preparamos los datos limpios para el Excel
    const dataToExport = history.map(h => ({
      Fecha: h.date,
      Paciente: h.patientName,
      Tratamiento: h.treatmentName,
      "Minutos": h.details.clinicalTime,
      "Costo Insumos": h.details.baseCost,
      "Precio Cobrado": h.total,
      "Ganancia Estimada": h.profit ? Math.round(h.profit) : 0 // Nueva columna CEO
    }));

    // 2. Creamos el libro y la hoja
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas ShiningCloud");

    // 3. Ajustamos ancho de columnas (Estética)
    const wscols = [
      {wch: 12}, {wch: 25}, {wch: 25}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}
    ];
    ws['!cols'] = wscols;

    // 4. Descargar
    XLSX.writeFile(wb, "Reporte_ShiningCloud.xlsx");
    notify("📊 Excel Pro Descargado");
  };

  // --- FUNCIÓN PDF PRO ---
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Encabezado Corporativo
    doc.setFillColor(15, 15, 15); // Negro
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(212, 175, 55); doc.setFontSize(26); doc.text("ShiningCloud", 15, 20); // Logo
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text(`Dr. ${config.name}`, 15, 30);
    doc.text(`RUT: ${config.rut}`, 15, 35);
    
    // Fecha alineada a la derecha
    doc.setFontSize(10); doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 30);

    // Datos del Paciente (Estilo ficha)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14); doc.text("Presupuesto Clínico", 15, 55);
    
    doc.setFontSize(11);
    doc.text(`Paciente: ${session.patientName}`, 15, 65);
    doc.text(`Tratamiento Solicitado: ${session.treatmentName}`, 15, 72);

    // Tabla Profesional (Usando autoTable)
    autoTable(doc, {
      startY: 80,
      head: [['Concepto', 'Detalle', 'Valor']],
      body: [
        ['Honorarios Clínicos', 'Atención profesional y tiempo de sillón', `$ ${Math.round(currentTotal * 0.7).toLocaleString('es-CL')}`],
        ['Insumos y Laboratorio', 'Materiales estériles y desechables', `$ ${Math.round(currentTotal * 0.3).toLocaleString('es-CL')}`],
        [{content: 'TOTAL PRESUPUESTO', colSpan: 2, styles: {fontStyle: 'bold', halign: 'right'}}, {content: `$ ${currentTotal.toLocaleString('es-CL')}`, styles: {fontStyle: 'bold'}}]
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] }, // Cabecera Negra y Dorada
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Pie de Página Legal
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text("Términos y Condiciones:", 15, finalY);
    doc.setFontSize(8);
    doc.text("1. Este presupuesto tiene una validez de 15 días hábiles.", 15, finalY + 5);
    doc.text("2. El pago puede realizarse vía transferencia o tarjeta de crédito.", 15, finalY + 10);
    doc.text("3. No incluye tratamientos adicionales no descritos en este documento.", 15, finalY + 15);

    // Línea de Firma
    doc.setDrawColor(0, 0, 0);
    doc.line(130, finalY + 30, 190, finalY + 30);
    doc.text("Firma Profesional Responsable", 135, finalY + 35);

    doc.save(`Presupuesto_${session.patientName}.pdf`);
    notify("✅ PDF Legal Generado");
  };

  const sendWhatsApp = () => {
    const text = `👋 Hola *${session.patientName}*,\n\nAdjunto el detalle de tu presupuesto para el tratamiento de *${session.treatmentName}*.\n\n────────────────\n💎 *Total a Pagar: $${currentTotal.toLocaleString('es-CL')}*\n────────────────\n\n🏦 *Datos de Transferencia:*\nBanco: ${config.bankName}\nTipo: ${config.accountType}\nN°: ${config.accountNumber}\nRut: ${config.rut}\n\n💳 *O paga con tarjeta aquí:*\n${config.mpLink}\n\nQuedo atento a tus dudas.\n*Dr. ${config.name}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setModal({ type: null });
  };

  // --- RENDERIZADO (IGUAL QUE ANTES) ---
  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-700 pb-32 selection:bg-[#D4AF37]/30 ${darkMode ? 'text-white' : 'text-stone-800'}`}
      style={{
        backgroundColor: darkMode ? '#090909' : '#F5F5F4',
        backgroundImage: darkMode 
          ? `radial-gradient(at 0% 0%, rgba(212, 175, 55, 0.15) 0px, transparent 50%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.07'/%3E%3C/svg%3E")`
          : `radial-gradient(at 0% 0%, rgba(212, 175, 55, 0.1) 0px, transparent 50%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`
      }}
    >
      
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-black/90 border border-[#D4AF37] text-[#D4AF37] px-6 py-3 rounded-full shadow-2xl animate-bounce flex gap-2 items-center text-sm font-bold tracking-wide">
          <Diamond size={16} className="text-[#D4AF37] fill-[#D4AF37]"/> {notification}
        </div>
      )}

      {/* HEADER */}
      <div className={`sticky top-0 z-20 px-6 py-5 flex justify-between items-center backdrop-blur-md border-b transition-colors duration-500 ${darkMode ? 'bg-[#090909]/80 border-white/5' : 'bg-[#F5F5F4]/80 border-stone-200'}`}>
        <div className="flex items-center gap-2">
          <Cloud size={28} className="text-[#D4AF37] fill-[#D4AF37]/20 drop-shadow-lg" />
          <h1 className={`text-2xl font-black tracking-tighter ${goldText} drop-shadow-sm`}>
            Shining<span className={darkMode ? 'text-white' : 'text-stone-700'}>Cloud</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-full transition-all border ${darkMode ? 'bg-white/5 border-white/10 text-[#D4AF37]' : 'bg-white border-stone-200 text-stone-500 shadow-sm'}`}>
            {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`p-2.5 rounded-full transition-all border ${darkMode ? 'bg-white/5 border-white/10 text-[#D4AF37]' : 'bg-white border-stone-200 text-stone-500 shadow-sm'}`}>
            <Settings size={18}/>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-8 animate-in fade-in duration-700">
        
        {/* === DASHBOARD === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <Card noBorder darkMode={darkMode} className={`relative overflow-hidden min-h-[200px] flex flex-col justify-between ${goldGradient} shadow-[#D4AF37]/20`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-10 -mt-20 mix-blend-overlay"></div>
              <div className="relative z-10">
                <p className="text-amber-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Cloud size={12}/> Flujo de Caja</p>
                <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-md">${totalIncome.toLocaleString('es-CL')}</h2>
              </div>
              <Button darkMode={darkMode} variant="secondary" className="relative z-10 !bg-white/20 !text-white !border-none backdrop-blur-md hover:!bg-white/30 w-full mt-4 !shadow-none" onClick={() => setActiveTab('quote')}>
                <Plus size={18}/> Nuevo Presupuesto
              </Button>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card darkMode={darkMode} className="flex flex-col items-center justify-center gap-2 py-8">
                <History size={24} className={darkMode ? 'text-[#D4AF37]' : 'text-stone-400'}/>
                <span className="text-3xl font-black tracking-tight">{history.length}</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'text-white/40' : 'text-stone-400'}`}>Pacientes</span>
              </Card>
              <Card darkMode={darkMode} className="flex flex-col items-center justify-center gap-2 py-8">
                <Library size={24} className={darkMode ? 'text-[#D4AF37]' : 'text-stone-400'}/>
                <span className="text-3xl font-black tracking-tight">{protocols.length}</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'text-white/40' : 'text-stone-400'}`}>Packs</span>
              </Card>
            </div>
          </div>
        )}

        {/* === COTIZADOR === */}
        {activeTab === 'quote' && (
          <div className="space-y-6">
            <Button darkMode={darkMode} variant="secondary" className="w-full !py-4" onClick={() => setModal({ type: 'loadProtocol' })}>
              <Library size={18}/> Cargar desde Catálogo
            </Button>

            <Card darkMode={darkMode} className="space-y-5">
              <div className="space-y-4">
                <InputField darkMode={darkMode} icon={User} label="Paciente" placeholder="Nombre Completo" value={session.patientName} onChange={e => setSession({...session, patientName: e.target.value})}/>
                <InputField darkMode={darkMode} label="Tratamiento" placeholder="Ej. Carillas" value={session.treatmentName} onChange={e => setSession({...session, treatmentName: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <InputField darkMode={darkMode} label="Minutos" type="number" placeholder="Min" value={session.clinicalTime} onChange={e => setSession({...session, clinicalTime: e.target.value})}/>
                <InputField darkMode={darkMode} label="Insumos ($)" type="number" placeholder="$" value={session.baseCost} onChange={e => setSession({...session, baseCost: e.target.value})}/>
              </div>
            </Card>

            <div className="relative group">
              <div className={`absolute inset-0 ${goldGradient} rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700`}></div>
              <Card darkMode={darkMode} className="relative text-center !py-10 overflow-hidden border-[#D4AF37]/30">
                 <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${darkMode ? 'text-[#D4AF37]':'text-stone-400'}`}>Valor Sugerido</p>
                 <h2 className={`text-6xl font-black mb-8 tracking-tighter ${goldText} drop-shadow-sm`}>${currentTotal.toLocaleString('es-CL')}</h2>
                 <div className="grid grid-cols-3 gap-3 px-2">
                   <Button darkMode={darkMode} variant="secondary" onClick={handleSaveHistory}><Save size={20}/></Button>
                   <Button darkMode={darkMode} variant="secondary" onClick={generatePDF} className="flex flex-col items-center"><span className="text-[9px] font-black uppercase">PDF</span></Button>
                   <Button darkMode={darkMode} onClick={() => setModal({ type: 'payment' })}><Share2 size={20}/></Button>
                 </div>
              </Card>
            </div>
          </div>
        )}

        {/* === HISTORIAL === */}
        {activeTab === 'history' && (
           <div className="space-y-6">
             <div className="flex gap-2">
                <div className="flex-1"><InputField darkMode={darkMode} icon={Search} placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                <Button darkMode={darkMode} variant="secondary" onClick={exportToExcel}><FileSpreadsheet size={20}/></Button>
             </div>
             
             <div className="space-y-4">
               {history.filter(h => h.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(h => (
                 <Card darkMode={darkMode} key={h.id} className="!p-5 group hover:border-[#D4AF37]/40 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{h.patientName}</h4>
                        <p className={`text-xs font-bold mt-1 ${darkMode ? 'text-[#D4AF37]' : 'text-stone-500'}`}>{h.treatmentName}</p>
                      </div>
                      <span className={`block font-black text-xl ${goldText}`}>${h.total.toLocaleString()}</span>
                    </div>
                    <div className={`flex gap-3 pt-4 border-t ${darkMode ? 'border-white/5' : 'border-stone-100'}`}>
                      <button onClick={() => { setSession(h.details); setActiveTab('quote'); notify("Cargado"); }} className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}>
                        Recotizar
                      </button>
                      <button className="px-4 text-red-400/50 hover:text-red-500 transition-all" onClick={() => setHistory(history.filter(x=>x.id!==h.id))}><Trash2 size={18}/></button>
                    </div>
                 </Card>
               ))}
             </div>
           </div>
        )}

        {/* === AJUSTES === */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-right-10">
            <Card darkMode={darkMode} className="space-y-5">
              <h3 className={`font-bold flex items-center gap-2 ${goldText}`}><Settings size={20}/> Configuración Clínica</h3>
              <InputField darkMode={darkMode} label="Tu Valor Hora Estimado" type="number" value={config.hourlyRate} onChange={e => setConfig({...config, hourlyRate: e.target.value})}/>
              <div className="pt-2">
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block opacity-60 ml-2 ${darkMode ? 'text-white' : 'text-stone-800'}`}>Margen de Ganancia: {config.profitMargin}%</label>
                <input type="range" min="10" max="90" className="w-full h-1.5 bg-gray-300 rounded-lg accent-[#D4AF37] cursor-pointer" value={config.profitMargin} onChange={e => setConfig({...config, profitMargin: e.target.value})}/>
              </div>
            </Card>

            <Card darkMode={darkMode} className="space-y-5">
              <h3 className={`font-bold flex items-center gap-2 ${goldText}`}><Landmark size={20}/> Datos de Cobro</h3>
              <div className="grid grid-cols-2 gap-4">
                 <InputField darkMode={darkMode} label="Banco" placeholder="Banco Estado" value={config.bankName} onChange={e => setConfig({...config, bankName: e.target.value})}/>
                 <InputField darkMode={darkMode} label="Tipo Cta" placeholder="Cta RUT" value={config.accountType} onChange={e => setConfig({...config, accountType: e.target.value})}/>
              </div>
              <InputField darkMode={darkMode} label="Número Cuenta" placeholder="12345678" value={config.accountNumber} onChange={e => setConfig({...config, accountNumber: e.target.value})}/>
              <InputField darkMode={darkMode} label="RUT" placeholder="11.222.333-k" value={config.rut} onChange={e => setConfig({...config, rut: e.target.value})}/>
              <InputField darkMode={darkMode} label="Nombre Titular" placeholder="Dr. Juan Pérez" value={config.name} onChange={e => setConfig({...config, name: e.target.value})}/>
              <InputField darkMode={darkMode} label="Link MP" placeholder="https://link..." value={config.mpLink} onChange={e => setConfig({...config, mpLink: e.target.value})}/>
            </Card>
            <p className="text-center text-xs opacity-30 pb-24">ShiningCloud v4.0 - CEO Edition</p>
          </div>
        )}

        {/* === CATÁLOGO === */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <Card darkMode={darkMode}>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-[#D4AF37]"/> Nuevo Pack</h3>
              <InputField darkMode={darkMode} placeholder="Nombre Pack" value={newProtocol.name} onChange={e => setNewProtocol({...newProtocol, name: e.target.value})}/>
              
              <div className="space-y-2 my-4">
                {newProtocol.items.map((item, i) => (
                  <div key={i} className={`flex justify-between text-sm p-3 rounded-xl ${darkMode ? 'bg-white/5 text-white/80' : 'bg-stone-50 text-stone-600'}`}><span>{item.name}</span> <span>${item.cost}</span></div>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                 <div className="flex-1"><InputField darkMode={darkMode} placeholder="Insumo" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}/></div>
                 <div className="w-24"><InputField darkMode={darkMode} type="number" placeholder="$" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})}/></div>
                 <button onClick={() => { if(newItem.name && newItem.cost) { setNewProtocol({...newProtocol, items: [...newProtocol.items, {name: newItem.name, cost: Number(newItem.cost)}]}); setNewItem({name:'', cost:''}); }}} className="bg-[#D4AF37] text-white p-3 rounded-xl mt-[22px] shadow-lg shadow-[#D4AF37]/30"><Plus size={20}/></button>
              </div>
              <Button darkMode={darkMode} className="w-full" onClick={() => { if(!newProtocol.name) return notify("Falta Nombre"); const total = newProtocol.items.reduce((a,b)=>a+b.cost,0); setProtocols([...protocols, { ...newProtocol, id: Date.now(), totalCost: total }]); setNewProtocol({ name:'', time:30, items:[] }); notify("Pack Guardado"); }}>Guardar Pack</Button>
            </Card>
            <div className="space-y-3">
              {protocols.map(p => (
                <Card darkMode={darkMode} key={p.id} className="!p-5 flex justify-between items-center group">
                  <div><h4 className="font-bold">{p.name}</h4><p className="text-xs opacity-50 font-bold tracking-wide">${p.totalCost} insumos</p></div>
                  <button onClick={() => setProtocols(protocols.filter(x=>x.id!==p.id))} className="text-red-400 opacity-50 hover:opacity-100 p-2"><Trash2 size={18}/></button>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MENU INFERIOR */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex p-1.5 rounded-full shadow-2xl border backdrop-blur-xl z-30 transition-all duration-500 ${darkMode ? 'bg-black/60 border-white/10 shadow-black/80' : 'bg-white/80 border-white/50 shadow-stone-300/50'}`}>
        {['dashboard', 'quote', 'catalog', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="relative p-4 rounded-full transition-all duration-300 group">
            {activeTab === tab && <div className={`absolute inset-0 rounded-full opacity-20 blur-lg ${goldGradient}`}></div>}
            <div className={`relative z-10 transition-transform duration-300 ${activeTab === tab ? '-translate-y-1 scale-110' : 'opacity-40 hover:opacity-100'}`}>
              <div className={activeTab === tab ? (darkMode ? 'text-[#D4AF37]' : 'text-amber-500') : (darkMode ? 'text-white' : 'text-stone-500')}>
                {tab === 'dashboard' && <TrendingUp size={24}/>}
                {tab === 'quote' && <Calculator size={24}/>}
                {tab === 'catalog' && <Library size={24}/>}
                {tab === 'history' && <History size={24}/>}
              </div>
            </div>
          </button>
        ))}
      </div>
      
       {/* MODALES */}
       {modal.type === 'loadProtocol' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card darkMode={darkMode} className="w-full max-w-sm h-3/4 flex flex-col border-[#D4AF37]/30 !bg-[#0f0f0f] text-white">
            <div className="flex justify-between items-center mb-6"><h3 className={`font-bold text-xl ${goldText}`}>Seleccionar Pack</h3><button onClick={() => setModal({type:null})}><X className="text-white/50"/></button></div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {protocols.map(p => (
                <button key={p.id} onClick={() => { setSession({...session, treatmentName: p.name, baseCost: p.totalCost, clinicalTime: p.time}); setModal({type:null}); notify("Cargado"); }} className="w-full text-left p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all group">
                  <span className="font-bold block text-lg mb-1">{p.name}</span> <span className="text-xs font-bold text-[#D4AF37] tracking-wider">${p.totalCost} insumos</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {modal.type === 'payment' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <Card darkMode={darkMode} className="w-full max-w-sm animate-in slide-in-from-bottom-10 border-[#D4AF37]/30 !bg-[#0f0f0f]">
            <div className="flex justify-between mb-8 items-center"><h3 className={`font-bold text-xl ${goldText}`}>Finalizar Atención</h3><button onClick={() => setModal({type:null})}><X className="text-white/50"/></button></div>
            <Button darkMode={darkMode} className="w-full !bg-emerald-600 !shadow-emerald-500/20 mb-4 !text-white !py-4" onClick={sendWhatsApp}>
               <MessageCircle size={22}/> Enviar por WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-4 mt-2">
               <Button darkMode={darkMode} variant="secondary" onClick={() => { navigator.clipboard.writeText(config.accountNumber); notify("Copiado"); }}><Landmark size={18}/> Banco</Button>
               <Button darkMode={darkMode} variant="secondary" onClick={() => { navigator.clipboard.writeText(config.mpLink); notify("Copiado"); }}><CreditCard size={18}/> Link</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
export default App;