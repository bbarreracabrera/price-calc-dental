import React from 'react';
import { Calculator, Plus, Trash2, Printer } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants';

export default function QuoteView({
    themeMode, t, quoteItems, setQuoteItems, newQuoteItem, setNewQuoteItem,
    catalog, patientRecords, sessionData, setSessionData, getPatient, savePatientData,
    saveToSupabase, notify, generatePDF, setActiveTab
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator className={t.accent}/> Creador de Presupuestos</h2>
                    <p className="text-xs opacity-50 mt-1">Arma presupuestos de forma rápida y envíalos directo a caja.</p>
                </div>
                <Button theme={themeMode} variant="secondary" onClick={() => setQuoteItems([])}>Limpiar Lista</Button>
            </div>
            
            <Card theme={themeMode} className="space-y-6">
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
                
                {sessionData.patientId && (
                    <div className={`animate-in fade-in space-y-4 border-t ${t.border} pt-4`}>
                        <h3 className="font-bold">Agregar Procedimientos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="md:col-span-2 relative">
                                <input 
                                    list="arancel-options"
                                    className={`w-full outline-none font-bold text-sm p-3 rounded-2xl border-2 border-black/10 dark:border-white/10 ${t.inputBg} ${t.text} focus:border-cyan-400 transition-all`}
                                    placeholder="Procedimiento (Busca o escribe)"
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
                            <div><InputField theme={themeMode} placeholder="N° Diente (Opcional)" value={newQuoteItem.tooth} onChange={e=>setNewQuoteItem({...newQuoteItem, tooth:e.target.value})}/></div>
                            <div className="md:col-span-2 flex gap-2">
                                <InputField theme={themeMode} type="number" placeholder="$ Valor" value={newQuoteItem.price} onChange={e=>setNewQuoteItem({...newQuoteItem, price:e.target.value})}/>
                                <Button theme={themeMode} onClick={()=>{
                                    if(newQuoteItem.name && newQuoteItem.price) {
                                        setQuoteItems([...quoteItems, { id: Date.now(), name: newQuoteItem.name, tooth: newQuoteItem.tooth, price: Number(newQuoteItem.price) }]);
                                        setNewQuoteItem({name:'', price:'', tooth:''});
                                    }
                                }}><Plus/></Button>
                            </div>
                        </div>

                        <div className={`rounded-xl p-4 space-y-2 mt-4 max-h-48 overflow-y-auto bg-black/5 dark:bg-white/5 border ${t.border}`}>
                            {quoteItems.length === 0 ? <p className="text-center text-xs opacity-50 py-4">El presupuesto está vacío.</p> : (
                                quoteItems.map((item) => (
                                    <div key={item.id} className={`flex justify-between items-center text-sm border-b ${t.border} pb-2 last:border-0 hover:opacity-70 transition-colors p-1 rounded`}>
                                        <div>
                                            <span className="font-bold">{item.name}</span>
                                            {item.tooth && <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/20">Diente {item.tooth}</span>}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">${item.price.toLocaleString()}</span>
                                            <button onClick={()=>setQuoteItems(quoteItems.filter(i=>i.id !== item.id))} className="text-red-500 opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={`flex justify-between items-center py-4 border-t border-b ${t.border} my-4`}>
                            <span className="text-sm font-bold opacity-50 uppercase tracking-widest">Total Presupuesto</span>
                            <h3 className="text-4xl font-black text-cyan-600 dark:text-cyan-400">${quoteItems.reduce((acc, item) => acc + item.price, 0).toLocaleString()}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button theme={themeMode} disabled={quoteItems.length===0} onClick={async ()=>{ 
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
                            }}>✅ APROBAR Y ENVIAR A CAJA</Button>
                            
                            <Button theme={themeMode} variant="secondary" disabled={quoteItems.length===0} onClick={()=>generatePDF('quote', quoteItems)}>
                                <Printer/> IMPRIMIR / PDF
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}