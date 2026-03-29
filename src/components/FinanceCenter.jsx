import React, { useState } from 'react';
import * as XLSX from 'xlsx'; 
import { Wallet, FileSpreadsheet, TrendingDown, MessageCircle, Box, Plus, Trash2, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants'; 
import { supabase } from '../supabase';

export default function FinanceCenter({ 
    themeMode, t, financialRecords, setFinancialRecords, 
    incomeRecords, expenseRecords, totalCollected, totalExpenses, totalDebt, netProfit,
    patientRecords, saveToSupabase, notify, onOpenAbonoModal, sendWhatsApp, getPatientPhone, financeTab, setFinanceTab
}) {
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Insumos', date: getLocalDate(), patientRef: '' });

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(financialRecords); 
        const wb = XLSX.utils.book_new(); 
        XLSX.utils.book_append_sheet(wb, ws, "Finanzas"); 
        XLSX.writeFile(wb, `Reporte_Finanzas_${getLocalDate()}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col custom-scrollbar pb-10">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Contabilidad & Caja</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Centro Financiero</h2>
                </div>
                <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-[#DFD2C4] hover:bg-[#FDFBF7] text-[#312923] text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                >
                    <FileSpreadsheet size={16}/> Exportar Excel
                </button>
            </div>

            {/* --- NAVEGACIÓN (TABS BOUTIQUE) --- */}
            <div className="flex bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4]/60 shadow-inner shrink-0">
                {[
                    { id: 'resumen', label: 'Resumen', color: 'bg-[#312923]' },
                    { id: 'ingresos', label: 'Ingresos y Caja', color: 'bg-[#5B6651]' },
                    { id: 'deudores', label: 'Cuentas x Cobrar', color: 'bg-red-500' },
                    { id: 'gastos', label: 'Gastos / Lab', color: 'bg-[#A3968B]' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setFinanceTab(tab.id)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            financeTab === tab.id 
                            ? `${tab.color} text-white shadow-md` 
                            : 'text-[#9A8F84] hover:text-[#312923]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {/* --- TAB 1: RESUMEN --- */}
                {financeTab === 'resumen' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="rounded-[2rem] border border-[#DFD2C4]/50 p-6 flex flex-col justify-between bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#5B6651]/10 text-[#5B6651] rounded-2xl"><ArrowUpRight size={20}/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Recaudado</span>
                                </div>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter">${totalCollected.toLocaleString()}</h2>
                            </Card>

                            <Card className="rounded-[2rem] border border-[#DFD2C4]/50 p-6 flex flex-col justify-between bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ArrowDownRight size={20}/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Egresos</span>
                                </div>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter">${totalExpenses.toLocaleString()}</h2>
                            </Card>

                            <Card className="rounded-[2rem] border border-[#DFD2C4]/50 p-6 flex flex-col justify-between bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Plus size={20}/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Deuda Pacientes</span>
                                </div>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter">${totalDebt.toLocaleString()}</h2>
                            </Card>
                        </div>

                        <Card className={`relative overflow-hidden rounded-[2.5rem] py-12 text-center border-0 shadow-2xl transition-all duration-500 ${
                            netProfit >= 0 ? 'bg-[#312923] text-white' : 'bg-red-600 text-white'
                        }`}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                            <div className="relative z-10">
                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-60 mb-3">Utilidad Real del Periodo</p>
                                <h2 className="text-7xl font-black tracking-tighter mb-4">${netProfit.toLocaleString()}</h2>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'}`}>
                                    {netProfit >= 0 ? 'Balance Positivo' : 'Balance en Negativo'}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- TAB 2: INGRESOS --- */}
                {financeTab === 'ingresos' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom">
                        {incomeRecords.length === 0 ? (
                            <div className="text-center py-20 opacity-40 font-bold">No hay registros de ingresos.</div>
                        ) : (
                            incomeRecords.map(h => {
                                const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                                const pending = (h.total || 0) - paid; 
                                return (
                                    <div key={h.id} onClick={()=>onOpenAbonoModal(h, pending)} className="group flex justify-between items-center p-6 bg-white rounded-3xl border border-[#DFD2C4]/40 hover:border-[#5B6651]/50 hover:shadow-lg transition-all cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${pending <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {h.patientName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-[#312923] text-lg">{h.patientName}</p>
                                                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-1">{h.date} • Total: ${h.total?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-lg ${pending <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {pending <= 0 ? 'PAGADO' : `PENDIENTE: $${pending.toLocaleString()}`}
                                            </p>
                                            <span className="text-[9px] font-black text-[#A3968B] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click para abonar</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* --- TAB 3: DEUDORES --- */}
                {financeTab === 'deudores' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">
                        <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-red-600 font-black text-xl tracking-tight">Planilla de Morosidad</h3>
                                <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-1">Pacientes con saldos pendientes por cobrar</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] block mb-1">Total por Recuperar</span>
                                <h2 className="text-4xl font-black text-red-600 tracking-tighter">${totalDebt.toLocaleString()}</h2>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {incomeRecords.filter(h => {
                                const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                                return (h.total || 0) - paid > 0;
                            }).map(h => {
                                const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                                const pending = (h.total || 0) - paid; 
                                return (
                                    <div key={h.id} className="p-6 bg-white rounded-3xl border border-red-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-black"><User size={20}/></div>
                                            <div>
                                                <p className="font-black text-[#312923]">{h.patientName}</p>
                                                <p className="text-[10px] text-[#9A8F84] font-bold uppercase tracking-widest mt-1">Atención: {h.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Saldo</span>
                                                <p className="font-black text-red-500 text-2xl tracking-tighter">${pending.toLocaleString()}</p>
                                            </div>
                                            <button 
                                                onClick={()=>{ sendWhatsApp(getPatientPhone(h.patientName), `Hola ${h.patientName}, nos comunicamos de la Clínica. Le recordamos amablemente que su ficha registra un saldo pendiente de $${pending.toLocaleString()}. ¿Desea que le enviemos los datos de pago?`); }} 
                                                className="flex items-center gap-2 px-6 py-3 bg-[#5B6651] hover:bg-[#4a5442] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#5B6651]/20 transition-all"
                                            >
                                                <MessageCircle size={16}/> Cobrar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- TAB 4: GASTOS --- */}
                {financeTab === 'gastos' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom">
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 p-8 bg-[#FDFBF7] shadow-inner">
                            <h3 className="font-black text-[#312923] text-xl mb-6 flex items-center gap-2">
                                <Plus className="text-[#A3968B]"/> Registrar Nuevo Egreso
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest ml-2">Descripción</label>
                                    <InputField theme={themeMode} placeholder="Ej: Coronas de Zirconio, Insumos..." value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description:e.target.value})}/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest ml-2">Categoría</label>
                                    <select 
                                        className="w-full h-[52px] bg-white border border-[#DFD2C4] rounded-2xl px-4 text-xs font-bold text-[#312923] outline-none focus:border-[#5B6651] transition-all"
                                        value={newExpense.category} 
                                        onChange={e=>setNewExpense({...newExpense, category:e.target.value})}
                                    >
                                        <option value="Insumos">Insumos Clínicos</option>
                                        <option value="Laboratorio">Gastos de Laboratorio</option>
                                        <option value="Arriendo">Arriendo y Servicios</option>
                                        <option value="Marketing">Publicidad y Marketing</option>
                                        <option value="Sueldos">Honorarios Personal</option>
                                        <option value="Otros">Otros Egresos</option>
                                    </select>
                                </div>
                                
                                {newExpense.category === 'Laboratorio' && (
                                    <div className="col-span-1 md:col-span-2 p-5 bg-white border border-[#DFD2C4]/60 rounded-3xl animate-in zoom-in-95">
                                        <label className="text-[10px] font-black text-[#5B6651] uppercase tracking-widest block mb-3">Vincular a Paciente (Para cálculo de rentabilidad)</label>
                                        <PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => setNewExpense({...newExpense, patientRef: p.personal.legalName})} placeholder="Busca el paciente del trabajo de lab..." />
                                        {newExpense.patientRef && <p className="text-[10px] mt-3 font-black text-white bg-[#5B6651] inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm">✓ Asociado a: {newExpense.patientRef}</p>}
                                    </div>
                                )}
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest ml-2">Monto del Gasto</label>
                                    <InputField theme={themeMode} type="number" placeholder="$ 00.000" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount:e.target.value})}/> 
                                </div>

                                <div className="flex items-end">
                                    <button 
                                        onClick={async()=>{ 
                                            if(newExpense.description && newExpense.amount){ 
                                                const id = Date.now().toString(); 
                                                const ex = {...newExpense, id, type: 'expense', amount: Number(newExpense.amount)};
                                                setFinancialRecords([...financialRecords, ex]); 
                                                await saveToSupabase('financials', id, ex); 
                                                setNewExpense({description:'', amount:'', category:'Insumos', date: getLocalDate(), patientRef:''}); 
                                                notify("Gasto registrado con éxito"); 
                                            } 
                                        }}
                                        className="w-full h-[52px] bg-[#312923] text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl hover:bg-[#1a1512] transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Plus size={18}/> Guardar Egreso
                                    </button>
                                </div>
                            </div>
                        </Card>
                        
                        <div className="grid gap-3">
                            {expenseRecords.length === 0 ? (
                                <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest">No hay egresos este mes</div>
                            ) : (
                                [...expenseRecords].reverse().map(ex => (
                                    <div key={ex.id} className="flex justify-between items-center p-5 rounded-3xl bg-white border border-[#DFD2C4]/40 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${ex.category==='Laboratorio' ? 'bg-[#5B6651]/10 text-[#5B6651]' : 'bg-[#FDFBF7] text-[#A3968B]'}`}>
                                                {ex.category==='Laboratorio' ? <Box size={20}/> : <TrendingDown size={20}/>}
                                            </div>
                                            <div>
                                                <p className="font-black text-[#312923]">{ex.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">{ex.date} • {ex.category}</p>
                                                    {ex.patientRef && <span className="text-[9px] bg-[#CBAAA2]/20 text-[#CBAAA2] px-2 py-0.5 rounded-full font-black">PAC: {ex.patientRef}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-black text-red-500 text-xl tracking-tighter">-${Number(ex.amount).toLocaleString()}</span>
                                            <button 
                                                onClick={async()=>{ 
                                                    const filtered = financialRecords.filter(f=>f.id!==ex.id); 
                                                    setFinancialRecords(filtered); 
                                                    await supabase.from('financials').delete().eq('id', ex.id); 
                                                    notify("Egreso Eliminado"); 
                                                }} 
                                                className="p-2.5 rounded-xl text-[#9A8F84] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}