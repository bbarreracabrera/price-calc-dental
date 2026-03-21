import React, { useState } from 'react';
import * as XLSX from 'xlsx'; 
import { Wallet, FileSpreadsheet, TrendingDown, MessageCircle, Box, Plus, Trash2 } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants'; 

export default function FinanceCenter({ 
    themeMode, t, financialRecords, setFinancialRecords, 
    incomeRecords, expenseRecords, totalCollected, totalExpenses, totalDebt, netProfit,
    patientRecords, saveToSupabase, notify, onOpenAbonoModal, sendWhatsApp, getPatientPhone, financeTab, setFinanceTab
}) {
    // Estos estados solo le importan al centro financiero, así que los sacamos de App.jsx
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Insumos', date: getLocalDate(), patientRef: '' });

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(financialRecords); 
        const wb = XLSX.utils.book_new(); 
        XLSX.utils.book_append_sheet(wb, ws, "Finanzas"); 
        XLSX.writeFile(wb, "Reporte_Finanzas.xlsx");
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className={t.accent}/> Centro Financiero</h2>
                <Button theme={themeMode} variant="secondary" onClick={exportToExcel}>
                    <FileSpreadsheet/> Excel
                </Button>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                <button onClick={()=>setFinanceTab('resumen')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='resumen'?t.accentBg:'opacity-50'}`}> Resumen</button>
                <button onClick={()=>setFinanceTab('ingresos')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='ingresos'?t.accentBg:'opacity-50'}`}> Ingresos y Caja</button>
                <button onClick={()=>setFinanceTab('deudores')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='deudores'?'bg-red-500 text-white':'opacity-50'}`}> Por Cobrar</button>
                <button onClick={()=>setFinanceTab('gastos')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='gastos'?t.accentBg:'opacity-50'}`}> Gastos / Lab</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {/* --- SUB-TAB 1: RESUMEN (Dueño) --- */}
                {financeTab === 'resumen' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card theme={themeMode} className="bg-emerald-500/10 border-emerald-500/20 text-center">
                                <p className="text-emerald-500 font-bold text-xs uppercase mb-2">Recaudado (En Banco)</p>
                                <h2 className="text-3xl font-black text-emerald-400">${totalCollected.toLocaleString()}</h2>
                            </Card>
                            <Card theme={themeMode} className="bg-red-500/10 border-red-500/20 text-center">
                                <p className="text-red-500 font-bold text-xs uppercase mb-2">Gastos (Operación)</p>
                                <h2 className="text-3xl font-black text-red-400">${totalExpenses.toLocaleString()}</h2>
                            </Card>
                            <Card theme={themeMode} className="bg-yellow-500/10 border-yellow-500/20 text-center">
                                <p className="text-yellow-500 font-bold text-xs uppercase mb-2"> Deudas </p>
                                <h2 className="text-3xl font-black text-yellow-400">${totalDebt.toLocaleString()}</h2>
                            </Card>
                        </div>
                        <Card theme={themeMode} className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-600'} text-white text-center py-8 shadow-2xl`}>
                            <p className="text-xs font-bold uppercase opacity-80 mb-2">Utilidad Real (Flujo de Caja)</p>
                            <h2 className="text-5xl font-black">${netProfit.toLocaleString()}</h2>
                        </Card>
                    </div>
                )}

                {/* --- SUB-TAB 2: INGRESOS GENERALES --- */}
                {financeTab === 'ingresos' && (
                    <div className="space-y-4 animate-in fade-in">
                        {incomeRecords.map(h=>{ 
                            const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                            const pending = (h.total || 0) - paid; 
                            return (
                            <Card key={h.id} theme={themeMode} onClick={()=>onOpenAbonoModal(h, pending)} className={`flex justify-between items-center cursor-pointer border-l-4 ${pending<=0?'border-emerald-500':'border-yellow-500'} hover:scale-[1.01] transition-transform`}>
                                <div><p className="font-bold">{h.patientName}</p><p className="text-[10px] opacity-40">{h.date} • Presupuesto: ${h.total?.toLocaleString()}</p></div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className={`font-black ${pending<=0?'text-emerald-500':'text-yellow-500'}`}>{pending <= 0 ? 'PAGADO' : `FALTA: $${pending.toLocaleString()}`}</p>
                                </div>
                            </Card>
                            )
                        })}
                    </div>
                )}

                {/* --- SUB-TAB 3: DEUDORES (CRM Financiero) --- */}
                {financeTab === 'deudores' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center">
                            <div><h3 className="text-red-500 font-bold">Planilla de Morosidad</h3><p className="text-[10px] text-red-400/70">Solo pacientes con saldo pendiente</p></div>
                            <h2 className="text-2xl font-black text-red-500">${totalDebt.toLocaleString()}</h2>
                        </div>
                        {incomeRecords.filter(h => {
                            const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                            return (h.total || 0) - paid > 0;
                        }).map(h=>{ 
                            const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                            const pending = (h.total || 0) - paid; 
                            return (
                            <Card key={h.id} theme={themeMode} onClick={()=>onOpenAbonoModal(h, pending)} className="flex flex-col md:flex-row justify-between items-center cursor-pointer border-l-4 border-red-500 hover:scale-[1.01] transition-transform gap-4">
                                <div className="w-full md:w-auto"><p className="font-bold">{h.patientName}</p><p className="text-[10px] opacity-40">{h.date} • Total tto: ${h.total?.toLocaleString()}</p></div>
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                                    <p className="font-black text-red-500 text-xl">-$ {pending.toLocaleString()}</p>
                                    <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(h.patientName), `Hola ${h.patientName}, me comunico de ShiningCloud Dental. Le recordamos amablemente que su ficha registra un saldo pendiente de $${pending.toLocaleString()}. ¿Gusta que le envíe los datos de transferencia para regularizarlo?`); }} className="flex items-center gap-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg transition-colors"><MessageCircle size={14}/> Cobrar Deuda</button>
                                </div>
                            </Card>
                            )
                        })}
                    </div>
                )}

                {/* --- SUB-TAB 4: GASTOS Y LABORATORIO --- */}
                {financeTab === 'gastos' && (
                    <div className="space-y-6 animate-in fade-in">
                        <Card theme={themeMode} className="space-y-4 border-l-4 border-stone-500">
                            <h3 className="font-bold text-lg">Egresos / Costos Clínica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InputField theme={themeMode} placeholder="Ítem (ej: Coronas Zirconio, Internet...)" value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description:e.target.value})}/>
                                <select className={`bg-[#121212] border border-white/10 rounded-xl px-3 p-3 text-xs font-bold outline-none ${t.text}`} value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category:e.target.value})}>
                                    <option value="Insumos">Caja: Insumos</option>
                                    <option value="Laboratorio">Caja: Trabajos de Laboratorio</option>
                                    <option value="Arriendo">Caja: Arriendo / Servicios</option>
                                    <option value="Marketing">Caja: Publicidad</option>
                                    <option value="Sueldos">Caja: Honorarios</option>
                                    <option value="Otros">Caja: Otros Egresos</option>
                                </select>
                                
                                {newExpense.category === 'Laboratorio' && (
                                    <div className="col-span-1 md:col-span-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-in zoom-in">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Asociar Costo a un Paciente</label>
                                        <PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => setNewExpense({...newExpense, patientRef: p.personal.legalName})} placeholder="Buscar paciente..." />
                                        {newExpense.patientRef && <p className="text-[10px] mt-2 font-bold bg-blue-500 text-white inline-block px-2 py-1 rounded">Costo asignado a: {newExpense.patientRef}</p>}
                                    </div>
                                )}
                                
                                <InputField theme={themeMode} type="number" placeholder="$ Monto Exacto" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount:e.target.value})}/> 
                                <Button theme={themeMode} onClick={async()=>{ 
                                    if(newExpense.description && newExpense.amount){ 
                                        const id = Date.now().toString(); 
                                        const ex = {...newExpense, id, type: 'expense', amount: Number(newExpense.amount)};
                                        setFinancialRecords([...financialRecords, ex]); 
                                        await saveToSupabase('financials', id, ex); 
                                        setNewExpense({description:'', amount:'', category:'Insumos', date: getLocalDate(), patientRef:''}); 
                                        notify("Gasto registrado con éxito"); 
                                    } 
                                }}><Plus/></Button>
                            </div>
                        </Card>
                        
                        <div className="space-y-2">
                            {expenseRecords.map(ex => (
                                <div key={ex.id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${ex.category==='Laboratorio' ? 'bg-blue-500/20 text-blue-400' : 'bg-stone-500/20 text-stone-400'}`}>
                                            {ex.category==='Laboratorio' ? <Box size={18}/> : <TrendingDown size={18}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold">{ex.description}</p>
                                            <p className="text-[10px] opacity-60 mt-1">{ex.date} • {ex.category}</p>
                                            {ex.patientRef && <span className="text-[9px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded ml-1 font-bold">Pac: {ex.patientRef}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-red-500 text-lg">-${Number(ex.amount).toLocaleString()}</span>
                                        <button onClick={async()=>{ const filtered = financialRecords.filter(f=>f.id!==ex.id); setFinancialRecords(filtered); await supabase.from('financials').delete().eq('id', ex.id); notify("Egreso Eliminado"); }} className="p-2 bg-black/40 rounded-lg text-stone-500 hover:text-red-500 hover:bg-red-500/20 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}