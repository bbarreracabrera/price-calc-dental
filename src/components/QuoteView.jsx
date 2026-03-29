import React from 'react';
import { Calculator, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { Card } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants';

export default function QuoteView({
    themeMode, t, quoteItems, setQuoteItems, newQuoteItem, setNewQuoteItem,
    catalog, patientRecords, sessionData, setSessionData, getPatient, savePatientData,
    saveToSupabase, notify, generatePDF, setActiveTab
}) {
    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Presupuestos</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Cotizador Clínico</h2>
                </div>
                <button 
                    onClick={() => setQuoteItems([])}
                    className="px-5 py-3 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] hover:text-[#312923] transition-all shadow-sm"
                >
                    Limpiar Cotización
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- PANEL IZQUIERDO: AGREGAR ÍTEMS --- */}
                <Card className="lg:col-span-7 space-y-6 rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                    
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">1. Seleccionar Paciente</label>
                        <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
                            if (p.id === 'new') {
                                let nombreReal = p.name;
                                if (!nombreReal || nombreReal.trim() === "") { nombreReal = window.prompt("Confirma el nombre:"); if (!nombreReal) return; }
                                const newId = "pac_" + Date.now().toString();
                                const newPatient = getPatient(newId);
                                newPatient.id = newId; newPatient.name = nombreReal;
                                if (!newPatient.personal) newPatient.personal = {};
                                newPatient.personal.legalName = nombreReal;
                                savePatientData(newId, newPatient);
                                setSessionData({...sessionData, patientName: nombreReal, patientId: newId});
                                notify("Paciente Creado");
                            } else {
                                setSessionData({...sessionData, patientName: p.personal?.legalName || p.name, patientId: p.id});
                            }
                        }} />
                    </div>
                    
                    {sessionData.patientId && (
                        <div className="animate-in fade-in space-y-5 pt-6 border-t border-[#DFD2C4]/40">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 block">2. Agregar Procedimientos</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="md:col-span-3 relative">
                                    <input 
                                        list="arancel-options"
                                        className="w-full outline-none font-bold text-sm p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-[#312923] focus:border-[#5B6651] transition-all"
                                        placeholder="Busca en tu arancel..."
                                        value={newQuoteItem.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const found = catalog.find(c => c.name === val);
                                            if (found) { setNewQuoteItem({...newQuoteItem, name: val, price: found.price}); } 
                                            else { setNewQuoteItem({...newQuoteItem, name: val}); }
                                        }}
                                    />
                                    <datalist id="arancel-options">
                                        {catalog.map(c => <option key={c.id} value={c.name} />)}
                                    </datalist>
                                </div>
                                <div className="md:col-span-2">
                                    <input 
                                        className="w-full outline-none font-bold text-sm p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-[#312923] focus:border-[#5B6651] transition-all" 
                                        placeholder="Diente (Opcional)" 
                                        value={newQuoteItem.tooth} 
                                        onChange={e=>setNewQuoteItem({...newQuoteItem, tooth:e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#A3968B]">$</span>
                                    <input 
                                        type="number" 
                                        className="w-full outline-none font-black text-lg pl-8 p-3.5 rounded-2xl border border-[#DFD2C4] bg-white text-[#5B6651] focus:border-[#5B6651] transition-all shadow-inner" 
                                        placeholder="Valor" 
                                        value={newQuoteItem.price} 
                                        onChange={e=>setNewQuoteItem({...newQuoteItem, price:e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={()=>{
                                        if(newQuoteItem.name && newQuoteItem.price) {
                                            setQuoteItems([...quoteItems, { id: Date.now(), name: newQuoteItem.name, tooth: newQuoteItem.tooth, price: Number(newQuoteItem.price) }]);
                                            setNewQuoteItem({name:'', price:'', tooth:''});
                                        }
                                    }}
                                    className="px-8 py-3.5 bg-[#312923] text-white rounded-2xl hover:bg-[#1a1512] transition-all flex items-center justify-center shadow-md"
                                >
                                    <Plus size={20}/>
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* --- PANEL DERECHO: RESUMEN Y ACCIONES --- */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-sm flex flex-col h-full min-h-[400px]">
                        <h3 className="font-black text-xl text-[#312923] mb-6 border-b border-[#DFD2C4]/50 pb-4">Detalle del Presupuesto</h3>
                        
                        <div className="flex-1 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-6">
                            {quoteItems.length === 0 ? (
                                <p className="text-center text-xs font-bold text-[#9A8F84] py-10 uppercase tracking-widest opacity-60">Aún no hay tratamientos agregados.</p>
                            ) : (
                                quoteItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#DFD2C4]/40 shadow-sm group">
                                        <div className="flex-1 pr-2">
                                            <span className="font-bold text-sm text-[#312923] block leading-tight">{item.name}</span>
                                            {item.tooth && <span className="inline-block mt-1 text-[9px] bg-[#CBAAA2]/10 text-[#CBAAA2] px-2 py-0.5 rounded-full font-black border border-[#CBAAA2]/20">Pieza {item.tooth}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 border-l border-[#DFD2C4]/40 pl-3">
                                            <span className="font-black text-[#5B6651] whitespace-nowrap">${item.price.toLocaleString()}</span>
                                            <button onClick={()=>setQuoteItems(quoteItems.filter(i=>i.id !== item.id))} className="text-[#DFD2C4] hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 border-t border-[#DFD2C4]/60 mt-auto">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-[10px] font-black opacity-60 uppercase tracking-widest text-[#9A8F84]">Total a Pagar</span>
                                <h3 className="text-4xl font-black text-[#312923] tracking-tighter">${quoteItems.reduce((acc, item) => acc + item.price, 0).toLocaleString()}</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    disabled={quoteItems.length===0} 
                                    onClick={async ()=>{ 
                                        const total = quoteItems.reduce((acc, item) => acc + item.price, 0);
                                        const id = Date.now().toString(); 
                                        const detalle = quoteItems.map(i => `${i.name}${i.tooth ? ` (D${i.tooth})` : ''}`).join(' + ');
                                        
                                        await saveToSupabase('financials', id, {
                                            id, total: total, paid: 0, payments: [], patientName: sessionData.patientName, 
                                            date: getLocalDate(), type: 'income', description: detalle
                                        }); 
                                        
                                        notify("Aprobado y enviado a Caja"); 
                                        setQuoteItems([]);
                                        setActiveTab('history');
                                    }}
                                    className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        quoteItems.length === 0 
                                        ? 'bg-[#DFD2C4]/30 text-[#9A8F84] cursor-not-allowed' 
                                        : 'bg-[#5B6651] text-white hover:bg-[#4a5442] shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5'
                                    }`}
                                >
                                    <CheckCircle size={18}/> APROBAR Y COBRAR
                                </button>
                                
                                <button 
                                    disabled={quoteItems.length===0} 
                                    onClick={()=>generatePDF('quote', quoteItems)}
                                    className={`py-4 rounded-2xl border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        quoteItems.length === 0 
                                        ? 'border-[#DFD2C4]/50 text-[#9A8F84] cursor-not-allowed bg-white/50' 
                                        : 'border-[#DFD2C4] bg-white text-[#312923] hover:bg-[#FDFBF7]'
                                    }`}
                                >
                                    <Printer size={18}/> IMPRIMIR PDF
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}