import React from 'react';
import { DollarSign, TrendingDown, BarChart2, PieChart, ArrowRight, Clock, CalendarClock, User, Calculator, Wallet, Plus, Calendar, AlertTriangle, FlaskConical, AlertCircle, Box } from 'lucide-react';
import { Card, Button, SimpleLineChart } from './UIComponents';
import { DashboardSkeleton } from './SkeletonLoaders';

export default function DashboardView({
    config, userRole, themeMode, t,
    totalCollected, totalExpenses, netProfit, chartData, todaysAppointments,
    setActiveTab, setFinanceTab, setModal, openApptModal, setSelectedPatientId, setQuoteMode,
    lowStockItems = [],
    pendingLabWorks = [],
    expirationAlerts = { expired: [], near: [] },
    incomeRecords = [],
    isLoading = false
}) {
    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in custom-scrollbar pb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D9D2C7]/50 pb-6 bg-gradient-to-r from-transparent to-[#FBFAF8] rounded-3xl p-2">
                    <div className="h-16 w-64 bg-[#D9D2C7]/20 animate-pulse rounded-2xl"></div>
                    <div className="flex gap-3">
                        <div className="h-12 w-32 bg-[#D9D2C7]/20 animate-pulse rounded-xl"></div>
                        <div className="h-12 w-40 bg-[#D9D2C7]/20 animate-pulse rounded-xl"></div>
                    </div>
                </div>
                <DashboardSkeleton />
            </div>
        );
    }
    const treatmentTotals = {};
    incomeRecords.forEach(r => {
        const cat = r.treatment || r.description?.split(':')[0]?.trim() || 'Otros';
        treatmentTotals[cat] = (treatmentTotals[cat] || 0) + Number(r.total || 0);
    });
    const sortedTreatments = Object.entries(treatmentTotals).sort((a, b) => b[1] - a[1]);
    const top2 = sortedTreatments.slice(0, 2);
    const grandTotal = sortedTreatments.reduce((sum, [, v]) => sum + v, 0);
    // Obtenemos la fecha actual formateada elegantemente
    const today = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('es-CL', dateOptions);

    const hasLowStock = lowStockItems && lowStockItems.length > 0;
    const hasExpired = expirationAlerts?.expired?.length > 0;
    const hasNearExpiry = expirationAlerts?.near?.length > 0;
    const noAlerts = !hasLowStock && !hasExpired && !hasNearExpiry;

    return (
        <div className="space-y-8 animate-in fade-in custom-scrollbar pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D9D2C7]/50 pb-6 bg-gradient-to-r from-transparent to-[#FBFAF8] rounded-3xl p-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar size={14} className="text-[#8A7F74]"/>
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">{formattedDate}</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#241F1B] tracking-tighter">Hola, {config.name.split(' ')[0]}</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => openApptModal ? openApptModal() : setModal('appt')} className="px-5 py-3 rounded-xl border border-[#D9D2C7] bg-white text-[#46523C] text-[11px] font-black uppercase tracking-widest hover:bg-[#FBFAF8] hover:border-[#46523C]/50 transition-all flex items-center gap-2 shadow-sm" title="Agendar cita (A)">
                        <CalendarClock size={16}/> Agendar
                    </button>
                    <button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null);}} className="px-5 py-3 rounded-xl bg-[#241F1B] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#1a1512] transition-all flex items-center gap-2 shadow-lg shadow-[#241F1B]/20 hover:-translate-y-0.5" title="Nuevo paciente (N)">
                        <Plus size={16}/> Nuevo Paciente
                    </button>
                </div>
            </div>
            
            {/* --- MÉTRICAS FINANCIERAS (Solo Admin) --- */}
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {/* Tarjeta Recaudado */}
                    <Card className="rounded-[2rem] border border-[#D9D2C7]/50 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                        <div className="flex justify-between mb-6 items-start">
                            <div className="p-3 bg-[#46523C]/10 rounded-2xl text-[#46523C]"><DollarSign size={24} strokeWidth={2.5}/></div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] bg-[#FBFAF8] px-3 py-1 rounded-full border border-[#D9D2C7]/50">Ingresos</span>
                        </div>
                        <h2 className="text-4xl font-black text-[#241F1B] tracking-tighter">${totalCollected.toLocaleString()}</h2>
                        <p className="text-[11px] font-bold text-[#8A7F74] mt-2">Recaudación Bruta</p>
                    </Card>
                    
                    {/* Tarjeta Gastos */}
                    <Card className="rounded-[2rem] border border-[#D9D2C7]/50 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                        <div className="flex justify-between mb-6 items-start">
                            <div className="p-3 bg-[#D3A9A0]/20 rounded-2xl text-[#D3A9A0]"><TrendingDown size={24} strokeWidth={2.5}/></div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] bg-[#FBFAF8] px-3 py-1 rounded-full border border-[#D9D2C7]/50">Egresos</span>
                        </div>
                        <h2 className="text-4xl font-black text-[#241F1B] tracking-tighter">${totalExpenses.toLocaleString()}</h2>
                        <p className="text-[11px] font-bold text-[#8A7F74] mt-2">Gastos Operativos</p>
                    </Card>
                    
                    {/* Tarjeta Utilidad (Con Brillo) */}
                    <div className={`col-span-1 md:col-span-2 relative overflow-hidden text-white shadow-2xl rounded-[2rem] p-8 group transition-colors duration-500 ${netProfit >= 0 ? 'bg-[#241F1B] shadow-[#241F1B]/20' : 'bg-red-600 shadow-red-600/20'}`}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D9D2C7 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        <div className="absolute -right-10 -bottom-10 opacity-5 text-[#D9D2C7] transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                            <DollarSign size={200} strokeWidth={1}/>
                        </div>
                        
                        <div className="relative z-10 flex flex-col justify-center h-full">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-[#D3A9A0] animate-pulse"></div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#D9D2C7]">Utilidad Neta del Mes</span>
                            </div>
                            <h2 className="text-6xl font-black mt-2 tracking-tighter text-white drop-shadow-md">${netProfit.toLocaleString()}</h2>
                            <p className="text-xs font-bold text-[#8A7F74] mt-4 uppercase tracking-widest border-t border-white/10 pt-4 w-fit">Balance Financiero Real</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ALERTAS Y LABORATORIO --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                
                {/* Panel de Alertas Clínicas e Inventario */}
                <Card className="p-6 rounded-[2rem] border border-[#D9D2C7]/50 shadow-sm bg-white">
                    <div className="flex justify-between items-end mb-6 border-b border-[#D9D2C7]/50 pb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl shadow-sm border ${hasExpired ? 'bg-red-50 text-red-600 border-red-200' : hasNearExpiry ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-[#FBFAF8] text-[#D3A9A0] border-[#D9D2C7]'}`}>
                                <AlertTriangle size={24} className={hasExpired ? "animate-pulse" : ""}/>
                            </div>
                            <div>
                                <h3 className="font-black text-[#241F1B] text-xl tracking-tight">Centro de Alertas</h3>
                                <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] mt-1">Seguridad e Inventario</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {noAlerts ? (
                            <div className="p-4 bg-[#FBFAF8] rounded-xl border border-[#D9D2C7]/50 text-center flex flex-col items-center gap-2">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#46523C] shadow-sm"><Box size={18}/></div>
                                <p className="text-xs font-bold text-[#46523C]">Stock saludable. Sin vencimientos.</p>
                            </div>
                        ) : (
                            <>
                                {/* 1. Vencidos (Rojo) */}
                                {expirationAlerts?.expired?.map((item, idx) => (
                                    <div key={`exp-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-red-50 border border-red-200">
                                        <span className="text-sm font-bold text-red-800 flex items-center gap-2">
                                            <AlertCircle size={14} className="text-red-500"/>
                                            {item.name}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-[11px] font-black text-white bg-red-500 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm">
                                                VENCIDO
                                            </span>
                                            <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mt-1">
                                                Lote: {item.batch.barcode || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* 2. Por Vencer (Amarillo) */}
                                {expirationAlerts?.near?.map((item, idx) => (
                                    <div key={`near-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-200">
                                        <span className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                            <Clock size={14} className="text-amber-500"/>
                                            {item.name}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-amber-600">
                                                Vence: {item.batch.expiry.split('-').reverse().join('/')}
                                            </span>
                                            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                                                Lote: {item.batch.barcode || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* 3. Stock Bajo (Naranjo) */}
                                {lowStockItems?.map((item, idx) => (
                                    <div key={`low-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-[#FBFAF8] border border-[#D9D2C7]/80">
                                        <span className="text-sm font-bold text-[#5E554E] flex items-center gap-2">
                                            <Box size={14} className="text-[#8A7F74]"/>
                                            {item.name}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-[#8A7F74]">
                                                Quedan {item.stock ?? 0} {item.unit || ''}
                                            </span>
                                            <p className="text-[11px] font-bold text-[#5E554E] uppercase tracking-widest mt-1">
                                                Mínimo: {item.min ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                    <button onClick={() => setActiveTab('inventory')} className="mt-4 w-full py-3 bg-white border border-[#D9D2C7] rounded-xl text-[11px] font-black uppercase tracking-widest text-[#241F1B] hover:bg-[#FBFAF8] transition-all flex items-center justify-center gap-2">
                        Ir al Inventario <ArrowRight size={14}/>
                    </button>
                </Card>

                {/* Panel de Resumen de Laboratorio */}
                <Card className="p-6 rounded-[2rem] border border-[#D9D2C7]/50 shadow-sm bg-white">
                    <div className="flex justify-between items-end mb-6 border-b border-[#D9D2C7]/50 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#FBFAF8] text-[#46523C] rounded-2xl border border-[#D9D2C7] shadow-sm"><FlaskConical size={24}/></div>
                            <div>
                                <h3 className="font-black text-[#241F1B] text-xl tracking-tight">Laboratorio</h3>
                                <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] mt-1">Próximas Entregas</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {pendingLabWorks.length === 0 ? (
                            <div className="p-4 bg-[#FBFAF8] rounded-xl border border-[#D9D2C7]/50 text-center">
                                <p className="text-xs font-bold text-[#5E554E]">No hay trabajos pendientes.</p>
                            </div>
                        ) : (
                            pendingLabWorks.map((work, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white border border-[#D9D2C7]/50 hover:border-[#46523C] transition-colors">
                                    <div>
                                        <p className="text-sm font-black text-[#241F1B]">{work.patientName}</p>
                                        <p className="text-[11px] font-bold text-[#5E554E] uppercase tracking-widest mt-1">{work.workType} - {work.labName}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="bg-[#FBFAF8] border border-[#D9D2C7] text-[#46523C] text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                                            {work.status}
                                        </span>
                                        <p className="text-[11px] font-bold text-[#241F1B] mt-1">Llega: {work.expectedDate}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

            </div>
            
            {/* --- GRÁFICOS (Solo Admin) --- */}
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gráfico de Líneas */}
                    <Card className="md:col-span-2 flex flex-col p-6 rounded-[2rem] border border-[#D9D2C7]/50 shadow-sm bg-white">
                        <div className="flex justify-between items-end mb-8 border-b border-[#D9D2C7]/50 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#FBFAF8] text-[#8A7F74] rounded-2xl border border-[#D9D2C7] shadow-sm"><BarChart2 size={24}/></div>
                                <div>
                                    <h3 className="font-black text-[#241F1B] text-xl tracking-tight">Crecimiento de Ingresos</h3>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] mt-1">Últimos 6 meses</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[200px]">
                            <SimpleLineChart data={chartData} />
                        </div>
                    </Card>

                    {/* Gráfico de Pie (Mini Resumen Boutique) */}
                    <Card className="flex flex-col justify-center items-center text-center p-8 bg-[#FBFAF8] border border-[#D9D2C7]/50 rounded-[2rem] shadow-inner">
                        <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border border-[#D9D2C7]/50 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-t-[#46523C] border-r-[#D3A9A0] border-b-[#D9D2C7] border-l-[#FBFAF8]"></div>
                            <PieChart size={32} className="text-[#241F1B]"/>
                        </div>
                        <h3 className="font-black text-xl text-[#241F1B] tracking-tight">Top Tratamientos</h3>
                        {top2.length >= 1 ? (
                            <div className="mt-4 w-full space-y-2 text-left">
                                {top2.map(([name, amount], i) => {
                                    const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
                                    return (
                                        <div key={name}>
                                            <div className="flex justify-between text-xs font-bold text-[#241F1B] mb-1">
                                                <span className="truncate max-w-[70%]">{name}</span>
                                                <span className={i === 0 ? 'text-[#46523C]' : 'text-[#D3A9A0]'}>{pct}%</span>
                                            </div>
                                            <div className="h-1.5 bg-[#D9D2C7]/40 rounded-full">
                                                <div className={`h-full rounded-full ${i === 0 ? 'bg-[#46523C]' : 'bg-[#D3A9A0]'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-[#5E554E] mt-4 font-bold">Aún no hay datos suficientes</p>
                        )}
                        
                        <button onClick={() => { setActiveTab('history'); setFinanceTab('ingresos'); }} className="mt-8 w-full py-3.5 bg-white border border-[#D9D2C7] rounded-xl text-[11px] font-black uppercase tracking-widest text-[#46523C] hover:bg-[#46523C] hover:text-white hover:border-[#46523C] transition-all flex items-center justify-center gap-2 shadow-sm">
                            Centro Financiero <ArrowRight size={14}/>
                        </button>
                    </Card>
                </div>
            )}

            {/* --- AGENDA Y ACCESOS RÁPIDOS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Agenda */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 border-b border-[#D9D2C7]/50 pb-4">
                        <div className="p-2 bg-[#FBFAF8] rounded-xl border border-[#D9D2C7]/50"><Clock className="text-[#241F1B]" size={20} strokeWidth={2.5}/></div>
                        <div>
                            <h3 className="font-black text-2xl text-[#241F1B] tracking-tight">Agenda de Hoy</h3>
                            <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">Pacientes Programados</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                        {todaysAppointments.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-[#D9D2C7] bg-[#FBFAF8]/50 rounded-[2rem] text-center flex flex-col items-center gap-5">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#D9D2C7]/50"><CalendarClock className="text-[#D9D2C7]" size={32}/></div>
                                <div>
                                    <h4 className="font-black text-[#241F1B] text-lg">Tu agenda está libre</h4>
                                    <p className="text-xs text-[#5E554E] mt-2 font-bold">No tienes pacientes agendados para el día de hoy.</p>
                                </div>
                                <button onClick={()=>setModal('appt')} className="mt-2 px-6 py-3 bg-white border border-[#D9D2C7] text-[#241F1B] text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#241F1B] hover:text-white transition-all shadow-sm">
                                    Agendar Primera Cita
                                </button>
                            </div>
                        ) : (
                            todaysAppointments.map(a => (
                                <div key={a.id} className="flex items-center gap-5 p-4 rounded-2xl bg-white border border-[#D9D2C7]/50 shadow-sm hover:shadow-md hover:border-[#D3A9A0] transition-all cursor-pointer group">
                                    <div className="px-5 py-3 rounded-xl font-black text-[#46523C] bg-[#46523C]/5 border border-[#46523C]/10 text-xl tracking-tighter">
                                        {a.time}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-[#241F1B] text-lg group-hover:text-[#D3A9A0] transition-colors">{a.name}</h4>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#5E554E] mt-1">{a.treatment}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-[#FBFAF8] rounded-full flex items-center justify-center text-[#5E554E] group-hover:bg-[#D3A9A0] group-hover:text-white transition-colors border border-[#D9D2C7]/50 group-hover:border-transparent">
                                        <ArrowRight size={18}/>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Accesos Rápidos */}
                <div className="space-y-4">
                    <div className="border-b border-[#D9D2C7]/50 pb-4">
                        <h3 className="font-black text-2xl text-[#241F1B] tracking-tight">Accesos</h3>
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">Acciones Rápidas</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button onClick={()=>setModal('appt')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#46523C] text-[#241F1B] hover:text-white rounded-[2rem] border border-[#D9D2C7]/50 transition-all shadow-sm group">
                            <div className="w-12 h-12 rounded-full bg-[#FBFAF8] group-hover:bg-white/20 flex items-center justify-center transition-colors"><CalendarClock size={20}/></div>
                            <span className="text-[11px] font-black uppercase tracking-widest">Agendar</span>
                        </button>
                        
                        <button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null);}} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#241F1B] text-[#241F1B] hover:text-white rounded-[2rem] border border-[#D9D2C7]/50 transition-all shadow-sm group">
                            <div className="w-12 h-12 rounded-full bg-[#FBFAF8] group-hover:bg-white/20 flex items-center justify-center transition-colors"><User size={20}/></div>
                            <span className="text-[11px] font-black uppercase tracking-widest">Paciente</span>
                        </button>
                        
                        {userRole !== 'dentist' && (
                            <button onClick={()=>{setActiveTab('quote'); setQuoteMode('calc');}} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#D3A9A0] text-[#241F1B] hover:text-white rounded-[2rem] border border-[#D9D2C7]/50 transition-all shadow-sm group">
                                <div className="w-12 h-12 rounded-full bg-[#FBFAF8] group-hover:bg-white/20 flex items-center justify-center transition-colors"><Calculator size={20}/></div>
                                <span className="text-[11px] font-black uppercase tracking-widest">Cotizar</span>
                            </button>
                        )}
                        
                        {(userRole === 'admin' || userRole === 'assistant') && (
                            <button onClick={()=>{setActiveTab('history');}} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#5E554E] text-[#241F1B] hover:text-white rounded-[2rem] border border-[#D9D2C7]/50 transition-all shadow-sm group">
                                <div className="w-12 h-12 rounded-full bg-[#FBFAF8] group-hover:bg-white/20 flex items-center justify-center transition-colors"><Wallet size={20}/></div>
                                <span className="text-[11px] font-black uppercase tracking-widest">Caja</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}