import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { 
  Calculator, Download, User, Stethoscope, 
  Share2, X, Landmark, CreditCard, Settings, 
  ChevronRight, Activity 
} from 'lucide-react';

function App() {
  // --- ESTADOS: CARGA INICIAL DESDE MEMORIA (PERSISTENCIA) ---
  const [activeTab, setActiveTab] = useState('quote'); // 'quote' o 'settings'
  
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

  const [session, setSession] = useState({
    patientName: '',
    treatmentName: '',
    clinicalTime: 60,
    baseCost: 0
  });

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  // --- EFECTO: AUTO-GUARDADO DE CONFIGURACIÓN ---
  useEffect(() => {
    localStorage.setItem('priceCalcConfig', JSON.stringify(config));
  }, [config]);

  // --- CÁLCULOS ---
  const calculateTotal = () => {
    const costLabor = (Number(config.hourlyRate) / 60) * Number(session.clinicalTime);
    const totalCost = costLabor + Number(session.baseCost);
    const marginDecimal = Number(config.profitMargin) / 100;
    
    if (marginDecimal >= 1) return totalCost;
    
    let finalPrice = totalCost / (1 - marginDecimal);
    return isFinite(finalPrice) ? Math.round(finalPrice) : 0;
  };

  const total = calculateTotal();

  // --- HANDLERS ---
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    setSession(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // --- GENERADORES (PDF Y TEXTO) ---
  const generatePDF = () => {
    if (!session.patientName || total === 0) {
      showNotification("❌ Faltan datos para el PDF");
      return;
    }
    const doc = new jsPDF();
    
    // Diseño del PDF
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Presupuesto Dental", 20, 20);
    doc.setFontSize(12);
    doc.text(`Emitido por: ${config.name}`, 20, 30);
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 30);

    doc.setFontSize(14);
    doc.text(`Paciente: ${session.patientName}`, 20, 60);
    doc.text(`Tratamiento: ${session.treatmentName}`, 20, 70);

    // Tabla
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 80, 190, 80);
    doc.setFontSize(12);
    doc.text("Descripción", 25, 90);
    doc.text("Valor Total", 160, 90);
    doc.line(20, 95, 190, 95);

    doc.setFont("helvetica", "bold");
    doc.text("Tratamiento Integral", 25, 110);
    doc.text(`$ ${total.toLocaleString('es-CL')}`, 160, 110);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("(Incluye honorarios clínicos, insumos y laboratorio)", 25, 116);

    // Total box
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(100, 130, 90, 30, 3, 3, 'F');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(`TOTAL: $ ${total.toLocaleString('es-CL')}`, 110, 150);

    doc.save(`Presupuesto_${session.patientName}.pdf`);
    showNotification("✅ PDF Generado");
  };

  const copyTransferData = () => {
    const text = `Hola ${session.patientName}, aquí tienes los datos para tu tratamiento (${session.treatmentName}):\n\n💰 Total: $${total.toLocaleString('es-CL')}\n\n🏦 Datos Transferencia:\nBanco: ${config.bankName}\nTipo: ${config.accountType}\nN°: ${config.accountNumber}\nRUT: ${config.rut}\nNombre: ${config.name}\nCorreo: ${config.email}`;
    navigator.clipboard.writeText(text);
    showNotification("✅ Datos copiados");
    setPaymentModalOpen(false);
  };

  const copyCardLink = () => {
    const text = `Hola ${session.patientName}, para pagar con Tarjeta de Crédito/Débito el valor de $${total.toLocaleString('es-CL')}, usa este link seguro:\n${config.mpLink}`;
    navigator.clipboard.writeText(text);
    showNotification("✅ Link copiado");
    setPaymentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2">
          <Activity size={18} className="text-green-400"/> {notification}
        </div>
      )}

      {/* HEADER TIPO APP */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
          PriceCalc <span className="text-slate-300 font-light">| Pro</span>
        </h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('quote')}
            className={`p-2 rounded-md transition-all ${activeTab === 'quote' ? 'bg-white shadow text-blue-700' : 'text-slate-400'}`}
          >
            <Calculator size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-md transition-all ${activeTab === 'settings' ? 'bg-white shadow text-blue-700' : 'text-slate-400'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 mt-2 animate-in fade-in duration-500">
        
        {/* --- PESTAÑA: COTIZADOR (DÍA A DÍA) --- */}
        {activeTab === 'quote' && (
          <div className="space-y-5">
            {/* Tarjeta Paciente */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Paciente</label>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-300" size={18} />
                  <input 
                    name="patientName"
                    type="text" 
                    placeholder="Nombre completo" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={session.patientName} 
                    onChange={handleSessionChange}
                  />
                </div>
                <input 
                  name="treatmentName"
                  type="text" 
                  placeholder="Tratamiento (ej. Destartraje)" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={session.treatmentName} 
                  onChange={handleSessionChange}
                />
              </div>
            </div>

            {/* Tarjeta Variables */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Variables del Caso</label>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-medium mb-1 block">Tiempo (min)</span>
                    <input 
                      name="clinicalTime"
                      type="number" 
                      className="w-full p-3 bg-blue-50/50 border border-blue-100 text-blue-900 font-bold rounded-xl text-center text-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={session.clinicalTime} 
                      onChange={handleSessionChange}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium mb-1 block">Costo Insumos</span>
                    <input 
                      name="baseCost"
                      type="number" 
                      placeholder="$0"
                      className="w-full p-3 bg-slate-50 border border-slate-200 font-bold rounded-xl text-center text-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={session.baseCost} 
                      onChange={handleSessionChange}
                    />
                  </div>
               </div>
            </div>

            {/* Resultado */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-300/50 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all"></div>
              
              <div className="relative z-10 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Precio Sugerido</p>
                <div className="text-5xl font-black text-white tracking-tight mb-8">
                  ${total.toLocaleString('es-CL')}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={generatePDF} 
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl transition-all font-medium active:scale-95"
                  >
                    <Download size={18}/> PDF
                  </button>
                  <button 
                    onClick={() => setPaymentModalOpen(true)} 
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-900/40 active:scale-95"
                  >
                    <Share2 size={18}/> Cobrar
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-center text-xs text-slate-400">
              *Calculado con un valor hora de ${Number(config.hourlyRate).toLocaleString('es-CL')}
            </p>
          </div>
        )}

        {/* --- PESTAÑA: CONFIGURACIÓN (BACK OFFICE) --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
              <Activity className="text-blue-600 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-blue-900 text-sm">Configuración Global</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Estos datos se guardan automáticamente en tu celular. Solo necesitas configurarlos una vez.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Stethoscope size={18} className="text-blue-500"/> Parámetros Clínicos
              </h3>
              <hr className="border-slate-100"/>
              
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Tu Valor Hora Estimado</label>
                <input name="hourlyRate" type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={config.hourlyRate} onChange={handleConfigChange}/>
                <p className="text-[10px] text-slate-400 mt-1">Cuánto te cuesta una hora de sillón (Arriendo + Luz + Tu tiempo).</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Margen de Ganancia Deseado (%)</label>
                <div className="flex items-center gap-4">
                  <input name="profitMargin" type="range" min="10" max="90" className="w-full h-2 bg-slate-200 rounded-lg accent-blue-600" value={config.profitMargin} onChange={handleConfigChange}/>
                  <span className="font-bold text-blue-600 w-10">{config.profitMargin}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Landmark size={18} className="text-green-500"/> Datos Bancarios (Para Cobrar)
              </h3>
              <hr className="border-slate-100"/>
              
              <div className="grid grid-cols-2 gap-3">
                <input name="bankName" type="text" placeholder="Banco" className="p-3 bg-slate-50 border rounded-xl text-sm" value={config.bankName} onChange={handleConfigChange}/>
                <input name="accountType" type="text" placeholder="Tipo Cuenta" className="p-3 bg-slate-50 border rounded-xl text-sm" value={config.accountType} onChange={handleConfigChange}/>
              </div>
              <input name="accountNumber" type="text" placeholder="Número de Cuenta" className="w-full p-3 bg-slate-50 border rounded-xl text-sm" value={config.accountNumber} onChange={handleConfigChange}/>
              <div className="grid grid-cols-2 gap-3">
                 <input name="rut" type="text" placeholder="RUT" className="p-3 bg-slate-50 border rounded-xl text-sm" value={config.rut} onChange={handleConfigChange}/>
                 <input name="name" type="text" placeholder="Nombre Titular" className="p-3 bg-slate-50 border rounded-xl text-sm" value={config.name} onChange={handleConfigChange}/>
              </div>
              <input name="email" type="text" placeholder="Correo para comprobante" className="w-full p-3 bg-slate-50 border rounded-xl text-sm" value={config.email} onChange={handleConfigChange}/>
              
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Tu Link de Mercado Pago (Opcional)</label>
                <input name="mpLink" type="text" placeholder="https://link.mercadopago.cl/..." className="w-full p-3 bg-slate-50 border rounded-xl text-sm" value={config.mpLink} onChange={handleConfigChange}/>
              </div>
            </div>

            <div className="h-10"></div> {/* Espacio extra abajo */}
          </div>
        )}
      </div>

      {/* MODAL DE COBRO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
            <button onClick={() => setPaymentModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Método de cobro</h2>
            <p className="text-slate-500 text-sm mb-6">Elige cómo enviar los datos al paciente:</p>

            <button onClick={copyTransferData} className="w-full flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl mb-3 hover:bg-green-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-green-200 p-2 rounded-xl text-green-700"><Landmark size={24}/></div>
                <div className="text-left">
                  <h3 className="font-bold text-green-900">Transferencia</h3>
                  <p className="text-xs text-green-700">Sin comisión (100% tuyo)</p>
                </div>
              </div>
              <ChevronRight className="text-green-300 group-hover:text-green-600"/>
            </button>

            <button onClick={copyCardLink} className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-blue-200 p-2 rounded-xl text-blue-700"><CreditCard size={24}/></div>
                <div className="text-left">
                  <h3 className="font-bold text-blue-900">Tarjeta / Link</h3>
                  <p className="text-xs text-blue-700">Vía Mercado Pago</p>
                </div>
              </div>
              <ChevronRight className="text-blue-300 group-hover:text-blue-600"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;