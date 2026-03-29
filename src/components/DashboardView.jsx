import React from 'react';
import { DollarSign, TrendingDown, BarChart2, PieChart, ArrowRight, Clock, CalendarClock, User, Calculator, Wallet, Plus, Calendar } from 'lucide-react';
import { Card, Button, SimpleLineChart } from './UIComponents';

export default function DashboardView({ 
    config, userRole, themeMode, t, 
    totalCollected, totalExpenses, netProfit, chartData, todaysAppointments,
    setActiveTab, setFinanceTab, setModal, setSelectedPatientId, setQuoteMode 
}) {
    // Obtenemos la fecha actual formateada elegantemente
    const today = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('es-CL', dateOptions);

    return (
        <div className="space-y-8 animate-in fade-in custom-scrollbar pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#DFD2C4]/50 pb-6 bg-gradient-to-r from-transparent to-[#FDFBF7] rounded-3xl p-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">{formattedDate}</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter">Hola, {config.name.split(' ')[0]} 👋</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={()=>setModal('appt')} className="px-5 py-3 rounded-xl border border-[#DFD2C4] bg-white text-[#5B6651] text-[11px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] hover:border-[#5B6651]/50 transition-all flex items-center gap-2 shadow-sm">
                        <CalendarClock size={16}/> Agendar
                    </button>
                    <button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null);}} className="px-5 py-3 rounded-xl bg-[#312923] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#1a1512] transition-all flex items-center gap-2 shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5">
                        <Plus size={16}/> Nuevo Paciente
                    </button>
                </div>
            </div>
            
            {/* --- MÉTRICAS FINANCIERAS (Solo Admin) --- */}
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Tarjeta Recaudado */}
                    <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                        <div className="flex justify-between mb-6 items-start">
                            <div className="p-3 bg-[#5B6651]/10 rounded-2xl text-[#5B6651]"><DollarSign size={24} strokeWidth={2.5}/></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full border border-[#DFD2C4]/50">Ingresos</span>
                        </div>
                        <h2 className="text-4xl font-black text-[#312923] tracking-tighter">${totalCollected.toLocaleString()}</h2>
                        <p className="text-[11px] font-bold text-[#A3968B] mt-2">Recaudación Bruta</p>
                    </Card>
                    
                    {/* Tarjeta Gastos */}
                    <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                        <div className="flex justify-between mb-6 items-start">
                            <div className="p-3 bg-[#CBAAA2]/20 rounded-2xl text-[#CBAAA2]"><TrendingDown size={24} strokeWidth={2.5}/></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full border border-[#DFD2C4]/50">Egresos</span>
                        </div>
                        <h2 className="text-4xl font-black text-[#312923] tracking-tighter">${totalExpenses.toLocaleString()}</h2>
                        <p className="text-[11px] font-bold text-[#A3968B] mt-2">Gastos Operativos</p>
                    </Card>
                    
                    {/* --- AQUÍ ESTÁ LA CORRECCIÓN: Cambiamos <Card> por <div> para que el fondo brille --- */}
                    <div className={`col-span-1 md:col-span-2 relative overflow-hidden text-white shadow-2xl rounded-[2rem] p-8 group transition-colors duration-500 ${netProfit >= 0 ? 'bg-[#312923] shadow-[#312923]/20' : 'bg-red-600 shadow-red-600/20'}`}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #DFD2C4 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        <div className="absolute -right-10 -bottom-10 opacity-5 text-[#DFD2C4] transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                            <DollarSign size={200} strokeWidth={1}/>
                        </div>
                        
                        <div className="relative z-10 flex flex-col justify-center h-full">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-[#CBAAA2] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#DFD2C4]">Utilidad Neta del Mes</span>
                            </div>
                            <h2 className="text-6xl font-black mt-2 tracking-tighter text-white drop-shadow-md">${netProfit.toLocaleString()}</h2>
                            <p className="text-xs font-bold text-[#A3968B] mt-4 uppercase tracking-widest border-t border-white/10 pt-4 w-fit">Balance Financiero Real</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- GRÁFICOS (Solo Admin) --- */}
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gráfico de Líneas */}
                    <Card className="md:col-span-2 flex flex-col p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm bg-white">
                        <div className="flex justify-between items-end mb-8 border-b border-[#DFD2C4]/50 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#FDFBF7] text-[#A3968B] rounded-2xl border border-[#DFD2C4] shadow-sm"><BarChart2 size={24}/></div>
                                <div>
                                    <h3 className="font-black text-[#312923] text-xl tracking-tight">Crecimiento de Ingresos</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Últimos 6 meses</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[200px]">
                            <SimpleLineChart data={chartData} />
                        </div>
                    </Card>

                    {/* Gráfico de Pie (Mini Resumen Boutique) */}
                    <Card className="flex flex-col justify-center items-center text-center p-8 bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-[2rem] shadow-inner">
                        <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border border-[#DFD2C4]/50 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-t-[#5B6651] border-r-[#CBAAA2] border-b-[#DFD2C4] border-l-[#FDFBF7]"></div>
                            <PieChart size={32} className="text-[#312923]"/>
                        </div>
                        <h3 className="font-black text-xl text-[#312923] tracking-tight">Top Tratamientos</h3>
                        <p className="text-xs text-[#6B615A] mt-4 font-bold leading-relaxed">El 60% de tus ingresos proviene de <span className="text-[#5B6651]">Ortodoncia</span> y <span className="text-[#CBAAA2]">Limpiezas</span>.</p>
                        
                        <button onClick={() => { setActiveTab('history'); setFinanceTab('ingresos'); }} className="mt-8 w-full py-3.5 bg-white border border-[#DFD2C4] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#5B6651] hover:bg-[#5B6651] hover:text-white hover:border-[#5B6651] transition-all flex items-center justify-center gap-2 shadow-sm">
                            Centro Financiero <ArrowRight size={14}/>
                        </button>
                    </Card>
                </div>
            )}

            {/* --- AGENDA Y ACCESOS RÁPIDOS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Agenda */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 border-b border-[#DFD2C4]/50 pb-4">
                        <div className="p-2 bg-[#FDFBF7] rounded-xl border border-[#DFD2C4]/50"><Clock className="text-[#312923]" size={20} strokeWidth={2.5}/></div>
                        <div>
                            <h3 className="font-black text-2xl text-[#312923] tracking-tight">Agenda de Hoy</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Pacientes Programados</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                        {todaysAppointments.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-[#DFD2C4] bg-[#FDFBF7]/50 rounded-[2rem] text-center flex flex-col items-center gap-5">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#DFD2C4]/50"><CalendarClock className="text-[#DFD2C4]" size={32}/></div>
                                <div>
                                    <h4 className="font-black text-[#312923] text-lg">Tu agenda está libre</h4>
                                    <p className="text-xs text-[#9A8F84] mt-2 font-bold">No tienes pacientes agendados para el día de hoy.</p>
                                </div>
                                <button onClick={()=>setModal('appt')} className="mt-2 px-6 py-3 bg-white border border-[#DFD2C4] text-[#312923] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#312923] hover:text-white transition-all shadow-sm">
                                    Agendar Primera Cita
                                </button>
                            </div>
                        ) : (
                            todaysAppointments.map(a => (
                                <div key={a.id} className="flex items-center gap-5 p-4 rounded-2xl bg-white border border-[#DFD2C4]/50 shadow-sm hover:shadow-md hover:border-[#CBAAA2] transition-all cursor-pointer group">
                                    <div className="px-5 py-3 rounded-xl font-black text-[#5B6651] bg-[#5B6651]/5 border border-[#5B6651]/10 text-xl tracking-tighter">
                                        {a.time}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-[#312923] text-lg group-hover:text-[#CBAAA2] transition-colors">{a.name}</h4>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A8F84] mt-1">{a.treatment}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-[#FDFBF7] rounded-full flex items-center justify-center text-[#9A8F84] group-hover:bg-[#CBAAA2] group-hover:text-white transition-colors border border-[#DFD2C4]/50 group-hover:border-transparent">
                                        <ArrowRight size={18}/>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Accesos Rápidos */}
                <div className="space-y-4">
                    <div className="border-b border-[#DFD2C4]/50 pb-4">
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight">Accesos</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Acciones Rápidas</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button onClick={()=>setModal('appt')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#5B6651] text-[#312923] hover:text-white rounded-[2rem] border border-[#DFD2C4]/50 transition-all shadow-sm group">
                            <div className="w-12 h-12 rounded-full bg-[#FDFBF7] group-hover:bg-white/20 flex items-center justify-center transition-colors"><CalendarClock size={20}/></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Agendar</span>
                        </button>
                        
                        <button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null);}} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#312923] text-[#312923] hover:text-white rounded-[2rem] border border-[#DFD2C4]/50 transition-all shadow-sm group">
                            <div className="w-12 h-12 rounded-full bg-[#FDFBF7] group-hover:bg-white/20 flex items-center justify-center transition-colors"><User size={20}/></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Paciente</span>
                        </button>
                        
                        {userRole !== 'dentist' && (
                            <button onClick={()=>{setActiveTab('quote'); setQuoteMode('calc');}} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#CBAAA2] text-[#312923] hover:text-white rounded-[2rem] border border-[#DFD2C4]/50 transition-all shadow-sm group">
                                <div className="w-12 h-12 rounded-full bg-[#FDFBF7] group-hover:bg-white/20 flex items-center justify-center transition-colors"><Calculator size={20}/></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Cotizar</span>
                            </button>
                        )}
                        
                        {(userRole === 'admin' || userRole === 'assistant') && (
                            <button onClick={()=>{setActiveTab('history');}} className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-[#9A8F84] text-[#312923] hover:text-white rounded-[2rem] border border-[#DFD2C4]/50 transition-all shadow-sm group">
                                <div className="w-12 h-12 rounded-full bg-[#FDFBF7] group-hover:bg-white/20 flex items-center justify-center transition-colors"><Wallet size={20}/></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Caja</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}