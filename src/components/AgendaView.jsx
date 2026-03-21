import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from './UIComponents'; // Asegúrate que esta ruta apunte bien a tus UIComponents

export default function AgendaView({ themeMode, t, appointments, onOpenModal }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <div className="space-y-4 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Agenda Semanal</h2>
                    <div className={`flex items-center gap-2 rounded-xl p-1 border ${t.border} ${t.cardBg}`}>
                        <button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d)}} className="p-2 rounded hover:opacity-50 transition-opacity"><ChevronLeft size={16}/></button>
                        <button onClick={()=>setCurrentDate(new Date())} className="text-xs font-bold px-2">HOY</button>
                        <button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d)}} className="p-2 rounded hover:opacity-50 transition-opacity"><ChevronRight size={16}/></button>
                    </div>
                </div>
                <div className="hidden md:flex gap-2 text-[9px] font-bold uppercase opacity-60">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-stone-500"></div>Agendado</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Confirmado</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>En Espera</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Atendiendo</span>
                </div>
                <Button theme={themeMode} onClick={() => onOpenModal({name: '', treatment: '', date: '', time: '', duration: 60, status: 'agendado', id: null})}>
                    <Plus/> Agendar
                </Button>
            </div>
            
            <div className={`flex-1 overflow-auto rounded-2xl border ${t.border} ${t.cardBg} custom-scrollbar`}>
                <div className="grid grid-cols-8 min-w-[800px]">
                    <div className={`p-4 border-b border-r ${t.border} text-xs font-bold text-center opacity-50 sticky top-0 z-20 ${t.bg}`}>HORA</div>
                    {Array.from({length:7}, (_,i)=>{const d=new Date(currentDate); d.setDate(d.getDate()-d.getDay()+1+i); return d;}).map(d => (
                        <div key={d} className={`p-4 border-b ${t.border} text-center sticky top-0 z-20 ${t.bg} ${d.toDateString()===new Date().toDateString() ? t.accent : ''}`}>
                            <p className="text-xs font-bold opacity-70">{['LUN','MAR','MIE','JUE','VIE','SAB','DOM'][d.getDay()===0?6:d.getDay()-1]}</p>
                            <p className="text-xl font-black">{d.getDate()}</p>
                        </div>
                    ))}
                    
                    {Array.from({length:12}, (_,i)=>8+i).map(h => (
                        <React.Fragment key={h}>
                            <div className="p-2 border-r border-b border-white/5 text-xs font-bold opacity-50 text-center h-24">{h}:00</div>
                            {Array.from({length:7}, (_,i)=>{const d=new Date(currentDate); d.setDate(d.getDate()-d.getDay()+1+i); return d;}).map(d => { 
                                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; 
                                const hourAppts = appointments.filter(a => a.date === dateStr && parseInt(a.time.split(':')[0]) === h); 

                                const statusColors = {
                                    agendado: 'border-stone-500 bg-stone-500/20 text-stone-300',
                                    confirmado: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
                                    espera: 'border-yellow-500 bg-yellow-500/20 text-yellow-300',
                                    atendiendo: 'border-blue-500 bg-blue-500/20 text-blue-300',
                                    no_asistio: 'border-red-500 bg-red-500/20 text-red-300'
                                };

                                return (
                                    <div 
                                        key={d+h} 
                                        className="border-b border-white/5 border-r relative group h-24 transition-all hover:bg-white/5 cursor-pointer" 
                                        onClick={() => onOpenModal({name: '', treatment: '', date: dateStr, time: `${h.toString().padStart(2, '0')}:00`, duration: 60, status: 'agendado', id: null})}
                                    >
                                        {hourAppts.map((appt, index) => {
                                            const minutes = parseInt(appt.time.split(':')[1]) || 0;
                                            const topOffset = (minutes / 60) * 100;

                                            return (
                                                <div 
                                                    key={appt.id || index}
                                                    onClick={(e) => { e.stopPropagation(); onOpenModal(appt); }}
                                                    className={`absolute left-0 w-full rounded-xl border-l-4 shadow-lg flex flex-col justify-between cursor-pointer hover:scale-105 transition-all p-2 z-10 overflow-hidden ${statusColors[appt.status || 'agendado']}`}
                                                    style={{ top: `${topOffset}%`, height: `${(appt.duration || 60) / 60 * 100}%`, minHeight: '60px' }}
                                                >
                                                    <div>
                                                        <p className="text-xs font-black truncate leading-tight">{appt.name}</p>
                                                        <p className="text-[9px] opacity-80 truncate">{appt.time} • {appt.treatment}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {hourAppts.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Plus size={14} className="opacity-50"/>
                                            </div>
                                        )}
                                    </div>
                                ) 
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}