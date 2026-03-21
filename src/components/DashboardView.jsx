import React from 'react';
import { DollarSign, TrendingDown, BarChart2, PieChart, ArrowRight, Clock, CalendarClock, User, Calculator, Wallet, Plus } from 'lucide-react';
import { Card, Button, SimpleLineChart } from './UIComponents';

export default function DashboardView({ 
    config, userRole, themeMode, t, 
    totalCollected, totalExpenses, netProfit, chartData, todaysAppointments,
    setActiveTab, setFinanceTab, setModal, setSelectedPatientId, setQuoteMode 
}) {
    return (
        <div className="space-y-8 animate-in fade-in">
            <h1 className="text-4xl font-black">Hola, {config.name.split(' ')[0]} 👋</h1>
            
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card theme={themeMode} className="bg-emerald-500/10 border-emerald-500/20">
                        <div className="flex justify-between mb-4">
                            <div className="p-3 bg-emerald-500 rounded-xl text-white"><DollarSign/></div>
                            <span className="text-xs font-bold uppercase text-emerald-500">Recaudado</span>
                        </div>
                        <h2 className="text-3xl font-black">${totalCollected.toLocaleString()}</h2>
                    </Card>
                    <Card theme={themeMode} className="bg-red-500/10 border-red-500/20">
                        <div className="flex justify-between mb-4">
                            <div className="p-3 bg-red-500 rounded-xl text-white"><TrendingDown/></div>
                            <span className="text-xs font-bold uppercase text-red-500">Gastos</span>
                        </div>
                        <h2 className="text-3xl font-black">${totalExpenses.toLocaleString()}</h2>
                    </Card>
                    <Card theme={themeMode} className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-600'} text-white col-span-2 relative overflow-hidden`}>
                        <div className="relative z-10">
                            <span className="text-xs font-bold uppercase opacity-80">Utilidad Neta</span>
                            <h2 className="text-4xl font-black mt-2">${netProfit.toLocaleString()}</h2>
                            <p className="text-xs opacity-60 mt-1">Ganancia Real</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-20"><DollarSign size={100}/></div>
                    </Card>
                </div>
            )}
            
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card theme={themeMode} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4"><BarChart2 className={t.accent} size={20}/><h3 className="font-bold">Crecimiento de Ingresos</h3></div>
                        <SimpleLineChart data={chartData} theme={themeMode} />
                        <div className="flex justify-between text-[10px] opacity-40 mt-2 px-1"><span>6 Meses</span><span>Hoy</span></div>
                    </Card>
                    <Card theme={themeMode} className="flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                        <PieChart size={64} className="opacity-20 mb-4"/>
                        <h3 className="font-bold text-xl">Top Tratamientos</h3>
                        <p className={`text-xs ${t.subText} mt-2 max-w-xs`}>El 60% de tus ingresos proviene de tratamientos de Ortodoncia y Limpiezas.</p>
                        <button onClick={() => { setActiveTab('history'); setFinanceTab('ingresos'); }} className="mt-4 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 mx-auto">Ir al Centro Financiero <ArrowRight size={12}/></button>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Clock className={t.accent} size={20}/> Agenda de Hoy</h3>
                    <div className="space-y-2">
                        {todaysAppointments.length === 0 ? (
                            <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center opacity-50 flex flex-col items-center gap-4">
                                <p>No tienes pacientes hoy.</p>
                                <Button theme={themeMode} onClick={()=>setModal('appt')}>Agendar Cita</Button>
                            </div>
                        ) : (
                            todaysAppointments.map(a => (
                                <div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 ${t.card} hover:scale-[1.01] transition-transform`}>
                                    <div className={`p-4 rounded-xl font-black text-white ${t.accentBg}`}>{a.time}</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg">{a.name}</h4>
                                        <p className="text-xs opacity-50">{a.treatment}</p>
                                    </div>
                                    <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><ArrowRight size={16}/></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="font-bold text-lg">Accesos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={()=>setModal('appt')} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><CalendarClock size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Agendar</span></button>
                        <button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null);}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><User size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Paciente</span></button>
                        {userRole !== 'dentist' && <button onClick={()=>{setActiveTab('quote'); setQuoteMode('calc');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><Calculator size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Cotizar</span></button>}
                        {(userRole === 'admin' || userRole === 'assistant') && <button onClick={()=>{setActiveTab('history');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><Wallet size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Caja</span></button>}
                    </div>
                </div>
            </div>
        </div>
    );
}