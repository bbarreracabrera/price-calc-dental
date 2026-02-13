import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { 
  Calculator, Download, User, Stethoscope, 
  Share2, X, Landmark, CreditCard, Settings, 
  ChevronRight, Activity, Library, Plus, Trash2, 
  Save, History, FileText, RefreshCw, Search, 
  FileSpreadsheet, MessageCircle 
} from 'lucide-react';

function App() {
  // --- NAVEGACIÓN ---
  const [activeTab, setActiveTab] = useState('quote'); 

  // --- CONFIGURACIÓN (PERSISTENTE) ---
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('priceCalcConfig');
    return saved ? JSON.parse(saved) : {
      hourlyRate: 25000,
      profitMargin: 30,
      bankName: "Banco Estado",
      accountType: "Cuenta RUT",
      accountNumber: "",
      rut: "",
      email: "",
      name: "Dr. Benjamín",
      mpLink: ""
    };
  });

  // --- CATÁLOGO (PERSISTENTE) ---
  const [protocols, setProtocols] = useState(() => {
    const saved = localStorage.getItem('dentalProtocols');
    return saved ? JSON.parse(saved) : [];
  });

  // --- HISTORIAL (PERSISTENTE) ---
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('dentalHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // --- ESTADOS DE SESIÓN ---
  const [session, setSession] = useState({
    patientName: '',
    treatmentName: '',
    clinicalTime: 60,
    baseCost: 0
  });

  // --- ESTADOS TEMPORALES ---
  const [newProtocolName, setNewProtocolName] = useState('');
  const [newProtocolTime, setNewProtocolTime] = useState(30);
  const [newProtocolItems, setNewProtocolItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Nuevo para buscar

  // --- MODALES ---
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoadProtocolOpen, setLoadProtocolOpen] = useState(false);
  const [notification, setNotification] = useState('');

  // --- EFECTOS ---
  useEffect(() => { localStorage.setItem('priceCalcConfig', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('dentalProtocols', JSON.stringify(protocols)); }, [protocols]);
  useEffect(() => { localStorage.setItem('dentalHistory', JSON.stringify(history)); }, [history]);

  // --- CÁLCULOS ---
  const calculateTotal = (time, cost, margin) => {
    const costLabor = (Number(config.hourlyRate) / 60) * Number(time);
    const totalCost = costLabor + Number(cost);
    const marginDecimal = Number(margin) / 100;
    if (marginDecimal >= 1) return totalCost;
    let finalPrice = totalCost / (1 - marginDecimal);
    return isFinite(finalPrice) ? Math.round(finalPrice) : 0;
  };

  const total = calculateTotal(session.clinicalTime, session.baseCost, config.profitMargin);

  // --- FUNCIONES NUEVAS V5.0 ---
  
  // 1. WhatsApp Directo
  const sendWhatsApp = () => {
    const text = `Hola ${session.patientName}, aquí tienes el detalle de tu tratamiento (${session.treatmentName}).\n\n💰 Total: $${total.toLocaleString('es-CL')}\n\n🏦 Datos Transferencia:\n${config.bankName} / ${config.accountType}\nN°: ${config.accountNumber}\nRUT: ${config.rut}\n${config.email}\n\nO paga con tarjeta aquí: ${config.mpLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setPaymentModalOpen(false);
  };

  // 2. Exportar a Excel (CSV)
  const exportToCSV = () => {
    if (history.length === 0) {
      showNotification("❌ No hay datos para exportar");
      return;
    }
    // Encabezados
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Paciente,Tratamiento,Tiempo(min),Costo Base,Total Cobrado\n";
    
    // Filas
    history.forEach(row => {
      csvContent += `${row.date},${row.patientName},${row.treatmentName},${row.details.clinicalTime},${row.details.baseCost},${row.total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_ingresos_dental.csv");
    document.body.appendChild(link);
    link.click();
    showNotification("✅ Reporte Excel Descargado");
  };

  // --- LOGICA HISTORIAL Y OTROS ---
  const saveToHistory = () => {
    if (!session.patientName || total === 0) { showNotification("❌ Faltan datos"); return; }
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      patientName: session.patientName,
      treatmentName: session.treatmentName,
      total: total,
      details: { ...session }
    };
    setHistory([newRecord, ...history]);
    showNotification("✅ Guardado en Historial");
  };

  const loadFromHistory = (record) => {
    setSession(record.details);
    setActiveTab('quote');
    showNotification(`✅ Cargado: ${record.patientName}`);
  };

  const deleteFromHistory = (id) => {
    if(confirm("¿Borrar este registro?")) {
      setHistory(history.filter(h => h.id !== id));
      showNotification("🗑️ Registro eliminado");
    }
  };

  const addItemToProtocol = () => {
    if (!newItemName || !newItemCost) return;
    setNewProtocolItems([...newProtocolItems, { name: newItemName, cost: Number(newItemCost) }]);
    setNewItemName(''); setNewItemCost('');
  };

  const removeItemFromProtocol = (index) => {
    const updated = [...newProtocolItems];
    updated.splice(index, 1);
    setNewProtocolItems(updated);
  };

  const saveProtocol = () => {
    if (!newProtocolName) { showNotification("❌ Falta nombre"); return; }
    const totalMaterialCost = newProtocolItems.reduce((acc, item) => acc + item.cost, 0);
    const newProtocol = {
      id: Date.now(),
      name: newProtocolName,
      time: newProtocolTime,
      totalCost: totalMaterialCost,
      items: newProtocolItems
    };
    setProtocols([...protocols, newProtocol]);
    setNewProtocolName(''); setNewProtocolItems([]); setNewProtocolTime(30);
    showNotification("✅ Protocolo Guardado");
  };

  const deleteProtocol = (id) => setProtocols(protocols.filter(p => p.id !== id));

  const loadProtocolToSession = (protocol) => {
    setSession(prev => ({
      ...prev, treatmentName: protocol.name, clinicalTime: protocol.time, baseCost: protocol.totalCost
    }));
    setLoadProtocolOpen(false);
    setActiveTab('quote');
    showNotification(`✅ Cargado: ${protocol.name}`);
  };

  const handleConfigChange = (e) => setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSessionChange = (e) => setSession(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const generatePDF = () => {
    if (!session.patientName || total === 0) { showNotification("❌ Faltan datos"); return; }
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.text("Presupuesto Dental", 20, 20);
    doc.setFontSize(12); doc.text(`Dr(a). ${config.name}`, 20, 30);
    doc.setTextColor(40, 40, 40); doc.setFontSize(10); doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 30);
    doc.setFontSize(14); doc.text(`Paciente: ${session.patientName}`, 20, 60); doc.text(`Tratamiento: ${session.treatmentName}`, 20, 70);
    doc.setDrawColor(200, 200, 200); doc.line(20, 85, 190, 85);
    doc.setFontSize(12); doc.text("Concepto", 25, 92); doc.text("Valor", 160, 92); doc.line(20, 98, 190, 98);
    doc.setFont("helvetica", "bold"); doc.text("Tratamiento Integral", 25, 110); doc.text(`$ ${total.toLocaleString('es-CL')}`, 160, 110);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text("(Incluye honorarios clínicos, insumos y esterilización)", 25, 118);
    doc.setFillColor(245, 247, 250); doc.roundedRect(100, 130, 90, 30, 3, 3, 'F');
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(37, 99, 235); doc.text(`TOTAL: $ ${total.toLocaleString('es-CL')}`, 110, 150);
    doc.save(`Presupuesto_${session.patientName}.pdf`);
    showNotification("✅ PDF Generado");
  };

  const copyData = (type) => {
    let text = type === 'transfer' 
      ? `Hola ${session.patientName}, tratamiento: ${session.treatmentName}\n💰 Total: $${total.toLocaleString('es-CL')}\n\n🏦 Datos:\n${config.bankName} / ${config.accountType}\nN°: ${config.accountNumber}\nRUT: ${config.rut}\n${config.name}\n${config.email}`
      : `Hola ${session.patientName}, paga tu tratamiento de $${total.toLocaleString('es-CL')} aquí:\n${config.mpLink}`;
    navigator.clipboard.writeText(text);
    showNotification("✅ Copiado"); setPaymentModalOpen(false);
  };

  // Filtrado de Historial
  const filteredHistory = history.filter(h => 
    h.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.treatmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-28">
      
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl animate-bounce flex gap-2 items-center">
          <Activity size={16} className="text-green-400"/> {notification}
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-extrabold text-blue-700 tracking-tight flex items-center gap-1">
            PriceCalc <span className="text-slate-300 font-light">| CEO</span>
          </h1>
          {/* TOTAL ACUMULADO */}
          <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-green-600">Proyectado</span>
            <span className="text-xs font-bold text-green-800">${history.reduce((a,b)=>a+b.total,0).toLocaleString()}</span>
          </div>
        </div>

        {/* NAV BAR */}
        <div className="flex bg-slate-100 p-1 rounded-xl justify-between">
          {[
            { id: 'quote', icon: Calculator, label: 'Cotizar' },
            { id: 'catalog', icon: Library, label: 'Packs' },
            { id: 'history', icon: History, label: 'Historial' },
            { id: 'settings', icon: Settings, label: 'Ajustes' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 p-2 rounded-lg transition-all flex justify-center ${activeTab === tab.id ? 'bg-white shadow text-blue-700' : 'text-slate-400'}`}>
              <tab.icon size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 mt-2 animate-in fade-in duration-500">
        
        {/* --- 1. COTIZADOR --- */}
        {activeTab === 'quote' && (
          <div className="space-y-4">
            <button onClick={() => setLoadProtocolOpen(true)} className="w-full bg-blue-50 border border-blue-200 text-blue-700 font-bold p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100">
              <Library size={18} /> Cargar Protocolo
            </button>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-300" size={18} />
                  <input name="patientName" type="text" placeholder="Nombre Paciente" className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={session.patientName} onChange={handleSessionChange}/>
              </div>
              <input name="treatmentName" type="text" placeholder="Tratamiento" className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={session.treatmentName} onChange={handleSessionChange}/>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Tiempo (min)</span>
                  <input name="clinicalTime" type="number" className="w-full p-3 bg-blue-50 text-blue-900 font-bold rounded-xl text-center text-lg outline-none" value={session.clinicalTime} onChange={handleSessionChange}/>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Insumos ($)</span>
                  <input name="baseCost" type="number" className="w-full p-3 bg-slate-50 font-bold rounded-xl text-center text-lg outline-none" value={session.baseCost} onChange={handleSessionChange}/>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-400 to-blue-500"></div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Total a Cobrar</p>
              <div className="text-5xl font-black text-white mb-6">${total.toLocaleString('es-CL')}</div>
              
              <div className="grid grid-cols-3 gap-2">
                <button onClick={saveToHistory} className="col-span-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl flex flex-col items-center justify-center gap-1 font-medium text-xs">
                  <Save size={18} className="text-green-400"/> Guardar
                </button>
                <button onClick={generatePDF} className="col-span-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl flex flex-col items-center justify-center gap-1 font-medium text-xs">
                  <Download size={18}/> PDF
                </button>
                <button onClick={() => setPaymentModalOpen(true)} className="col-span-1 bg-blue-600 hover:bg-blue-500 p-3 rounded-xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-lg shadow-blue-900/40">
                  <Share2 size={18}/> Cobrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. CATÁLOGO --- */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 animate-in slide-in-from-right-5">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3"><Plus size={18}/> Nuevo Protocolo</h3>
              <div className="space-y-2 mb-3">
                <input type="text" placeholder="Nombre Pack" className="w-full p-2 bg-slate-50 border rounded-lg text-sm" value={newProtocolName} onChange={(e) => setNewProtocolName(e.target.value)}/>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Minutos:</span>
                  <input type="number" className="flex-1 p-2 bg-slate-50 border rounded-lg text-sm font-bold" value={newProtocolTime} onChange={(e) => setNewProtocolTime(e.target.value)}/>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                <div className="space-y-2 mb-2">
                  {newProtocolItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs">
                      <span>{item.name}</span>
                      <div className="flex gap-2"><b>${item.cost}</b> <button onClick={() => removeItemFromProtocol(index)} className="text-red-400"><X size={14}/></button></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Material" className="flex-1 p-2 text-xs border rounded-lg" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}/>
                  <input type="number" placeholder="$" className="w-16 p-2 text-xs border rounded-lg" value={newItemCost} onChange={(e) => setNewItemCost(e.target.value)}/>
                  <button onClick={addItemToProtocol} className="bg-green-100 text-green-700 p-2 rounded-lg"><Plus size={16}/></button>
                </div>
              </div>
              <button onClick={saveProtocol} className="w-full bg-blue-600 text-white font-bold p-2 rounded-xl text-sm">Guardar Protocolo</button>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-400 text-xs uppercase px-2">Mis Packs</h3>
              {protocols.map((p) => (
                <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div><h4 className="font-bold text-sm text-slate-800">{p.name}</h4><p className="text-[10px] text-slate-500">{p.time} min | Materiales: ${p.totalCost}</p></div>
                  <button onClick={() => deleteProtocol(p.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
            <div className="h-10"></div>
          </div>
        )}

        {/* --- 3. HISTORIAL (MEJORADO V5) --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-right-5">
            
            {/* BUSCADOR Y EXPORTAR */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                  type="text" 
                  placeholder="Buscar paciente..." 
                  className="w-full pl-10 p-2 bg-white border border-slate-200 rounded-xl text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={exportToCSV} className="bg-green-600 text-white p-2 rounded-xl shadow-md active:scale-95">
                <FileSpreadsheet size={20}/>
              </button>
            </div>

            <div className="flex justify-between items-end px-2">
               <h3 className="font-bold text-slate-700">Pacientes</h3>
               <span className="text-xs text-slate-400">{filteredHistory.length} registros</span>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FileText size={48} className="mx-auto mb-2 opacity-20"/>
                <p>No se encontraron pacientes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">{record.patientName}</h4>
                        <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md inline-block">{record.treatmentName}</p>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-lg text-slate-700">${record.total.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">{record.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 relative z-10">
                      <button onClick={() => loadFromHistory(record)} className="flex-1 bg-slate-50 text-slate-600 text-xs font-bold p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center gap-2">
                        <RefreshCw size={14}/> Recotizar
                      </button>
                      <button onClick={() => deleteFromHistory(record.id)} className="px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="h-10"></div>
          </div>
        )}

        {/* --- 4. AJUSTES --- */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in slide-in-from-right-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-700 text-sm">Parámetros</h3>
              <div><label className="text-xs font-bold text-slate-500 block">Valor Hora ($)</label><input name="hourlyRate" type="number" className="w-full p-2 bg-slate-50 border rounded-xl" value={config.hourlyRate} onChange={handleConfigChange}/></div>
              <div><label className="text-xs font-bold text-slate-500 block">Margen: {config.profitMargin}%</label><input name="profitMargin" type="range" min="10" max="90" className="w-full h-2 bg-slate-200 rounded-lg accent-blue-600" value={config.profitMargin} onChange={handleConfigChange}/></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
               <h3 className="font-bold text-slate-700 text-sm">Datos Bancarios</h3>
               <input name="bankName" type="text" placeholder="Banco" className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={config.bankName} onChange={handleConfigChange}/>
               <input name="accountNumber" type="text" placeholder="N° Cuenta" className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={config.accountNumber} onChange={handleConfigChange}/>
               <input name="rut" type="text" placeholder="RUT" className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={config.rut} onChange={handleConfigChange}/>
               <input name="name" type="text" placeholder="Nombre" className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={config.name} onChange={handleConfigChange}/>
               <input name="email" type="text" placeholder="Email" className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={config.email} onChange={handleConfigChange}/>
               <input name="mpLink" type="text" placeholder="Link MP" className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={config.mpLink} onChange={handleConfigChange}/>
            </div>
            <div className="h-10"></div>
          </div>
        )}
      </div>

      {/* MODALES FLOTANTES */}
      {isLoadProtocolOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 h-3/4 flex flex-col">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Cargar Pack</h3><button onClick={() => setLoadProtocolOpen(false)}><X size={20}/></button></div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {protocols.map((p) => (
                <button key={p.id} onClick={() => loadProtocolToSession(p)} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:bg-blue-50 group">
                  <div className="flex justify-between"><span className="font-bold text-sm text-slate-800">{p.name}</span><ChevronRight size={16} className="text-slate-300"/></div>
                  <div className="text-xs text-slate-500">${p.totalCost} insumos</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10">
            <button onClick={() => setPaymentModalOpen(false)} className="absolute top-4 right-4"><X size={20}/></button>
            <h2 className="text-lg font-bold mb-4">Enviar cobro</h2>
            
            {/* NUEVO BOTÓN WHATSAPP */}
            <button onClick={sendWhatsApp} className="w-full flex justify-between items-center p-3 bg-green-500 text-white rounded-xl mb-3 shadow-lg hover:bg-green-600 transition-all">
               <div className="flex gap-2 items-center"><MessageCircle size={20}/> <span className="font-bold">Enviar por WhatsApp</span></div>
               <ChevronRight size={20}/>
            </button>

            <div className="flex gap-2">
                <button onClick={() => copyData('transfer')} className="flex-1 flex justify-center p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-200">
                   Copiar Datos
                </button>
                <button onClick={() => copyData('mp')} className="flex-1 flex justify-center p-3 bg-blue-50 rounded-xl text-xs font-bold text-blue-600 border border-blue-100 hover:bg-blue-100">
                   Copiar Link
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;