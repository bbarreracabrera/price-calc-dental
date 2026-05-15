import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Wallet, FileSpreadsheet, TrendingDown, MessageCircle, Box, Plus, Trash2, ArrowUpRight, ArrowDownRight, User, Calculator, CheckCircle2, Banknote, ArrowRightLeft, CreditCard, Smartphone, MoreHorizontal, FileText, Check } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants';
import { supabase } from '../supabase';
import { useDialog } from './DialogProvider';
import BoletaAssistantModal from './BoletaAssistantModal';

export default function FinanceCenter({
    themeMode, t, financialRecords, setFinancialRecords,
    incomeRecords, expenseRecords, totalCollected, totalExpenses, totalDebt, netProfit,
    patientRecords, saveToSupabase, notify, onOpenAbonoModal, sendWhatsApp, getPatientPhone, financeTab, setFinanceTab,
    session, team = [], userRole, adminEmail
}) {
    const { confirm } = useDialog();
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Insumos', date: getLocalDate(), patientRef: '' });
    const [dateRange, setDateRange] = useState('this_month');
    const [boletaModal, setBoletaModal] = useState({ open: false, payment: null, patient: null });

    const today = new Date();
    const isPaymentInRange = (paymentDate) => {
        if (!paymentDate) return true; // sin fecha → siempre incluido
        if (dateRange === 'all') return true;
        const d = new Date(paymentDate + 'T12:00:00');
        if (dateRange === 'this_month') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
        if (dateRange === 'last_month') {
            const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
        }
        if (dateRange === 'last_3_months') return d >= new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        return true;
    };
    const isExpenseInRange = (expenseDate) => {
        if (!expenseDate) return true;
        if (dateRange === 'all') return true;
        const d = new Date(expenseDate + 'T12:00:00');
        if (dateRange === 'this_month') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
        if (dateRange === 'last_month') {
            const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
        }
        if (dateRange === 'last_3_months') return d >= new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        return true;
    };

    const filteredPayments = incomeRecords.flatMap(r => (r.payments || []).filter(p => isPaymentInRange(p.date)));
    const legacyCollected = incomeRecords
        .filter(r => r.paid && !r.payments && isPaymentInRange(r.date))
        .reduce((s, r) => s + Number(r.paid), 0);
    const filteredCollected = filteredPayments.reduce((s, p) => s + p.amount, 0) + legacyCollected;
    const filteredExpenses = expenseRecords.filter(ex => isExpenseInRange(ex.date)).reduce((s, ex) => s + Number(ex.amount), 0);
    const filteredProfit = filteredCollected - filteredExpenses;

    const PAYMENT_METHODS = [
        { key: 'Efectivo', Icon: Banknote },
        { key: 'Transferencia', Icon: ArrowRightLeft },
        { key: 'Tarjeta', Icon: CreditCard },
        { key: 'Mercado Pago', Icon: Smartphone },
        { key: 'Otro', Icon: MoreHorizontal },
    ];
    const methodBreakdown = PAYMENT_METHODS.map(({ key, Icon }) => {
        const bucket = filteredPayments.filter(p => (p.method === key) || (!p.method && key === 'Otro'));
        const total = bucket.reduce((s, p) => s + p.amount, 0);
        const count = bucket.length;
        const pct = filteredCollected > 0 ? Math.round((total / filteredCollected) * 100) : 0;
        return { key, Icon, total, count, pct };
    });

    const exportToExcel = () => {
        const formattedData = financialRecords.map(record => {
            const isIncome = record.type === 'income';
            let incomeAmount = 0;
            if (isIncome) {
                incomeAmount = (record.payments || []).reduce((s,p) => s + p.amount, 0) + (record.paid && !record.payments ? record.paid : 0);
            }
            const expenseAmount = !isIncome ? Number(record.amount) : 0;

            return {
                "Fecha": record.date || getLocalDate(),
                "Tipo de Movimiento": isIncome ? 'Ingreso (Abono/Pago)' : 'Egreso (Gasto)',
                "Descripción": record.description || record.treatment || 'Sin descripción',
                "Categoría": record.category || (isIncome ? 'Atención Clínica' : 'General'),
                "Paciente Asociado": record.patientName || record.patientRef || '---',
                "Ingresos ($)": isIncome ? incomeAmount : 0,
                "Egresos ($)": !isIncome ? expenseAmount : 0,
                "Registrado Por": record.created_by || 'Desconocido'
            };
        });

        formattedData.push({ "Fecha": "", "Tipo de Movimiento": "", "Descripción": "", "Categoría": "", "Paciente Asociado": "", "Ingresos ($)": "", "Egresos ($)": "", "Registrado Por": "" });
        formattedData.push({ "Fecha": "RESUMEN", "Tipo de Movimiento": "", "Descripción": "", "Categoría": "", "Paciente Asociado": "TOTALES:", "Ingresos ($)": totalCollected, "Egresos ($)": totalExpenses, "Registrado Por": "" });
        formattedData.push({ "Fecha": "", "Tipo de Movimiento": "", "Descripción": "", "Categoría": "", "Paciente Asociado": "UTILIDAD NETA:", "Ingresos ($)": netProfit, "Egresos ($)": "", "Registrado Por": "" });

        const ws = XLSX.utils.json_to_sheet(formattedData);
        ws['!cols'] = [ { wch: 12 }, { wch: 22 }, { wch: 45 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 } ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Flujo de Caja");
        XLSX.writeFile(wb, `Reporte_Financiero_ShiningCloud_${getLocalDate()}.xlsx`);
        
        notify("📊 Reporte Excel generado con éxito");
    };

    // --- LÓGICA AVANZADA DE HONORARIOS ---
    const getDentistsCommissions = () => {
        let dentistas = team.filter(m => m.role === 'dentist');
        
        if(userRole === 'dentist') {
            dentistas = dentistas.filter(m => m.email === session?.user?.email);
        }

        return dentistas.map(doc => {
            // 1. Buscamos lo que ha producido históricamente
            const tratamientosDelDoc = incomeRecords.filter(inc => inc.created_by === doc.email);
            
            const produccionReal = tratamientosDelDoc.reduce((acc, inc) => {
                const pago = (inc.payments || []).reduce((s, p) => s + p.amount, 0) + (inc.paid && !inc.payments ? inc.paid : 0);
                return acc + pago;
            }, 0);

            const porcentaje = doc.commission || 0;
            const comisionTotalHistorica = (produccionReal * porcentaje) / 100;

            // 2. Buscamos cuánto YA LE HEMOS PAGADO leyendo los egresos que tienen su email
            const pagosYaRealizados = expenseRecords
                .filter(ex => ex.category === 'Sueldos' && ex.doctor_email === doc.email)
                .reduce((acc, ex) => acc + Number(ex.amount), 0);

            // 3. Calculamos la diferencia
            const saldoPendiente = comisionTotalHistorica - pagosYaRealizados;

            return {
                ...doc,
                produccion: produccionReal,
                comisionTotal: comisionTotalHistorica,
                pagado: pagosYaRealizados,
                aPagar: saldoPendiente > 0 ? saldoPendiente : 0
            };
        });
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
                <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-3 bg-white border border-[#DFD2C4] hover:bg-[#FDFBF7] text-[#312923] text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                    <FileSpreadsheet size={16}/> Exportar Excel
                </button>
            </div>

            {/* --- NAVEGACIÓN --- */}
            <div className="flex flex-wrap bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4]/60 shadow-inner shrink-0 gap-1 md:gap-0">
                {[
                    { id: 'resumen', label: 'Resumen', color: 'bg-[#312923]' },
                    { id: 'ingresos', label: 'Ingresos y Caja', color: 'bg-[#5B6651]' },
                    { id: 'deudores', label: 'Cuentas x Cobrar', color: 'bg-red-500' },
                    { id: 'gastos', label: 'Gastos / Lab', color: 'bg-[#A3968B]' },
                    { id: 'honorarios', label: 'Honorarios y Comisiones', color: 'bg-indigo-600' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setFinanceTab(tab.id)}
                        className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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

                        {/* Filtro de rango de fechas */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'this_month', label: 'Este mes' },
                                { id: 'last_month', label: 'Último mes' },
                                { id: 'last_3_months', label: 'Últimos 3 meses' },
                                { id: 'all', label: 'Todo el tiempo' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setDateRange(opt.id)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        dateRange === opt.id
                                        ? 'bg-[#312923] text-white border-[#312923]'
                                        : 'bg-white text-[#9A8F84] border-[#DFD2C4] hover:border-[#312923] hover:text-[#312923]'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="rounded-[2rem] border border-[#DFD2C4]/50 p-6 flex flex-col justify-between bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#5B6651]/10 text-[#5B6651] rounded-2xl"><ArrowUpRight size={20}/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Recaudado</span>
                                </div>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter">${filteredCollected.toLocaleString()}</h2>
                            </Card>

                            <Card className="rounded-[2rem] border border-[#DFD2C4]/50 p-6 flex flex-col justify-between bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ArrowDownRight size={20}/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Egresos Totales</span>
                                </div>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter">${filteredExpenses.toLocaleString()}</h2>
                            </Card>

                            <Card className="rounded-[2rem] border border-[#DFD2C4]/50 p-6 flex flex-col justify-between bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Plus size={20}/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Deuda Pacientes</span>
                                </div>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter">${totalDebt.toLocaleString()}</h2>
                            </Card>
                        </div>

                        <div className={`relative overflow-hidden rounded-[2.5rem] py-12 text-center shadow-2xl transition-all duration-500 ${
                            filteredProfit >= 0 ? 'bg-[#312923] text-white' : 'bg-red-600 text-white'
                        }`}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                            <div className="relative z-10">
                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-60 mb-3">Utilidad Real de la Clínica</p>
                                <h2 className="text-7xl font-black tracking-tighter mb-4">${filteredProfit.toLocaleString()}</h2>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${filteredProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'}`}>
                                    {filteredProfit >= 0 ? 'Caja en Positivo' : 'Caja en Negativo'}
                                </div>
                            </div>
                        </div>

                        {/* Ingresos por método de pago */}
                        <div>
                            <h3 className="font-black text-[#312923] text-lg tracking-tight mb-4">Ingresos por método de pago</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {methodBreakdown.map(({ key, Icon, total, count, pct }) => (
                                    <Card key={key} className={`rounded-[2rem] border p-5 flex flex-col gap-3 bg-white transition-all ${count === 0 ? 'border-[#DFD2C4]/30 opacity-40' : 'border-[#DFD2C4]/60'}`}>
                                        <div className="p-3 bg-[#FDFBF7] rounded-2xl w-fit">
                                            <Icon size={20} className="text-[#A3968B]"/>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">{key}</p>
                                            <p className="text-2xl font-black text-[#312923] tracking-tighter">${total.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-[#5B6651]">{pct}% del total</p>
                                            <p className="text-[10px] font-bold text-[#9A8F84]">{count} {count === 1 ? 'pago' : 'pagos'}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: INGRESOS --- */}
                {financeTab === 'ingresos' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom">
                        {(() => {
                            const sinBoleta = incomeRecords.filter(h => !h.boleta_emitida);
                            if (sinBoleta.length === 0) return null;
                            return (
                                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                    <FileText size={18} className="text-amber-500 shrink-0" />
                                    <div>
                                        <p className="font-black text-amber-800 text-sm">{sinBoleta.length} {sinBoleta.length === 1 ? 'pago sin boleta' : 'pagos sin boleta'}</p>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Emite las boletas pendientes en el portal SII</p>
                                    </div>
                                </div>
                            );
                        })()}
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
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">{h.date} • Total: ${h.total?.toLocaleString()}</p>
                                                    {h.created_by && (
                                                        <span className="text-[8px] bg-[#DFD2C4]/30 text-[#A3968B] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                            Gen: {team.find(m => m.email === h.created_by)?.name || h.created_by.split('@')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <p className={`font-black text-lg ${pending <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {pending <= 0 ? 'PAGADO' : `PENDIENTE: $${pending.toLocaleString()}`}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-[#A3968B] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click para abonar</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const patient = Object.values(patientRecords).find(p => p?.personal?.legalName === h.patientName);
                                                        setBoletaModal({ open: true, payment: h, patient: patient || null });
                                                    }}
                                                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all border ${
                                                        h.boleta_emitida
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            : 'bg-[#FDFBF7] text-[#312923] border-[#DFD2C4] hover:border-[#5B6651] hover:bg-[#5B6651]/5'
                                                    }`}
                                                >
                                                    {h.boleta_emitida
                                                        ? <><Check size={10} /> Boleta</>
                                                        : <><FileText size={10} /> Boleta SII</>}
                                                </button>
                                            </div>
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
                                        <option value="Sueldos">Sueldos y Honorarios</option>
                                        <option value="Otros">Otros Egresos</option>
                                    </select>
                                </div>
                                
                                {newExpense.category === 'Laboratorio' && (
                                    <div className="col-span-1 md:col-span-2 p-5 bg-white border border-[#DFD2C4]/60 rounded-3xl animate-in zoom-in-95">
                                        <label className="text-[10px] font-black text-[#5B6651] uppercase tracking-widest block mb-3">Vincular a Paciente (Para cálculo de rentabilidad)</label>
                                        <PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => setNewExpense({...newExpense, patientRef: p.personal.legalName})} placeholder="Busca el paciente del trabajo de lab..." adminEmail={adminEmail} />
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
                                                const autor = session?.user?.email || 'Desconocido';
                                                const ex = {...newExpense, id, type: 'expense', amount: Number(newExpense.amount), created_by: autor};
                                                
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
                                <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest">No hay egresos registrados</div>
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
                                                    {ex.created_by && (
                                                        <span className="text-[9px] bg-[#DFD2C4]/30 text-[#A3968B] px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                                            <User size={8}/> {team.find(m => m.email === ex.created_by)?.name || ex.created_by.split('@')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-black text-red-500 text-xl tracking-tighter">-${Number(ex.amount).toLocaleString()}</span>
                                            <button
                                                onClick={async()=>{
                                                    if (!await confirm(`¿Eliminar el egreso "${ex.description}"? Esta acción no se puede deshacer.`)) return;
                                                    try {
                                                        const { error } = await supabase.from('financials').delete().eq('id', ex.id);
                                                        if (error) throw error;
                                                        setFinancialRecords(financialRecords.filter(f => f.id !== ex.id));
                                                        notify("Egreso Eliminado");
                                                    } catch (err) {
                                                        notify("Error al eliminar el egreso");
                                                        console.error('Error eliminando egreso:', err.message);
                                                    }
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

                {/* --- PESTAÑA: HONORARIOS (CON BOTÓN DE LIQUIDACIÓN MÁGICA) --- */}
                {financeTab === 'honorarios' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">
                        <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex flex-col justify-center items-center text-center gap-2 mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                                <Calculator size={32} />
                            </div>
                            <h3 className="text-indigo-900 font-black text-2xl tracking-tight">Liquidación de Honorarios</h3>
                            <p className="text-xs text-indigo-600/80 font-bold uppercase tracking-widest max-w-md mx-auto">
                                Descuenta automáticamente los pagos realizados para evitar pagos dobles y mantener tu caja al día.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getDentistsCommissions().length === 0 ? (
                                <div className="col-span-full text-center py-10 opacity-40 font-bold uppercase tracking-widest text-[#312923]">
                                    No hay odontólogos con comisiones configuradas.
                                </div>
                            ) : (
                                getDentistsCommissions().map(doc => (
                                    <Card key={doc.email} className="rounded-3xl border border-[#DFD2C4]/60 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-lg transition-all flex flex-col justify-between">
                                        <div className="flex justify-between items-start border-b border-[#DFD2C4]/40 pb-4 mb-4">
                                            <div>
                                                <h4 className="font-black text-xl text-[#312923] capitalize">Dr. {doc.name.split(' ')[0]}</h4>
                                                <span className="text-[10px] bg-[#FDFBF7] border border-[#DFD2C4]/50 px-2 py-1 rounded-full font-black text-[#9A8F84] uppercase tracking-widest mt-2 inline-block">
                                                    Comisión: {doc.commission || 0}%
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-400">
                                                {doc.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#9A8F84] mb-0.5">Producción</p>
                                                    <p className="font-black text-[#5B6651] text-lg">${doc.produccion.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#9A8F84] mb-0.5">Ya Pagado</p>
                                                    <p className="font-black text-[#A3968B] text-lg">${doc.pagado.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-4 border-t border-dashed border-[#DFD2C4]">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-1">Saldo por Pagar</p>
                                                <h3 className="font-black text-indigo-600 text-3xl tracking-tighter">${doc.aPagar.toLocaleString()}</h3>
                                            </div>

                                            {/* BOTÓN MÁGICO DE LIQUIDACIÓN */}
                                            {userRole === 'admin' && doc.aPagar > 0 && (
                                                <button 
                                                    onClick={async () => {
                                                        if(await confirm(`¿Quieres registrar el pago de $${doc.aPagar.toLocaleString()} al Dr. ${doc.name}?\n\nEsto se descontará de la caja automáticamente.`)) {
                                                            const exId = Date.now().toString();
                                                            const newEx = {
                                                                id: exId,
                                                                type: 'expense',
                                                                description: `Honorarios Clínicos: Dr. ${doc.name}`,
                                                                amount: doc.aPagar,
                                                                category: 'Sueldos',
                                                                date: getLocalDate(),
                                                                created_by: session?.user?.email,
                                                                doctor_email: doc.email // Dato clave para que el sistema sepa que ya se le pagó
                                                            };
                                                            setFinancialRecords([...financialRecords, newEx]);
                                                            await saveToSupabase('financials', exId, newEx);
                                                            notify(`Honorarios liquidados con éxito 💰`);
                                                        }
                                                    }}
                                                    className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                                                >
                                                    <Wallet size={16}/> Liquidar Saldo
                                                </button>
                                            )}

                                            {doc.aPagar === 0 && (
                                                <div className="w-full mt-4 py-3 bg-emerald-50 text-emerald-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100">
                                                    <CheckCircle2 size={16}/> Pagos al Día
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>

            <BoletaAssistantModal
                isOpen={boletaModal.open}
                onClose={() => setBoletaModal({ open: false, payment: null, patient: null })}
                payment={boletaModal.payment}
                patient={boletaModal.patient}
                onMarkEmitted={(id) => {
                    setFinancialRecords(prev => prev.map(f =>
                        f.id === id ? { ...f, boleta_emitida: true, boleta_fecha: new Date().toISOString() } : f
                    ));
                }}
            />
        </div>
    );
}