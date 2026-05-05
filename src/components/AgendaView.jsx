import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarClock, Filter } from 'lucide-react';

export default function AgendaView({ appointments, onOpenModal, team }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDentistFilter, setSelectedDentistFilter] = useState('all');

    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    const statusColors = {
        agendado:   'border-l-[#9A8F84] bg-[#FDFBF7] text-[#6B615A] hover:bg-white border border-[#DFD2C4]/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]',
        confirmado: 'border-l-[#5B6651] bg-[#5B6651]/10 text-[#312923] hover:bg-[#5B6651]/20 border border-[#5B6651]/20 shadow-[0_2px_10px_-4px_rgba(91,102,81,0.2)]',
        espera:     'border-l-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 shadow-[0_2px_10px_-4px_rgba(251,191,36,0.2)]',
        atendiendo: 'border-l-blue-400 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 shadow-[0_2px_10px_-4px_rgba(96,165,250,0.2)]',
        no_asistio: 'border-l-[#CBAAA2] bg-[#CBAAA2]/10 text-[#312923] hover:bg-[#CBAAA2]/20 border border-[#CBAAA2]/30 shadow-[0_2px_10px_-4px_rgba(203,170,162,0.2)]'
    };

    // Aplicamos el filtro: Si es 'all' muestra todos, sino, solo los del dentista seleccionado
    const filteredAppts = appointments.filter(a => 
        selectedDentistFilter === 'all' || a.dentist_email === selectedDentistFilter
    );

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in pb-4">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 mb-4 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarClock size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Gestión de Citas</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <h2 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter capitalize">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        
                        {/* Filtro de Doctores */}
                        <div className="flex items-center bg-white border border-[#DFD2C4] rounded-xl px-3 py-1 shadow-sm mt-2 md:mt-0">
                            <Filter size={14} className="text-[#A3968B] mr-2"/>
                            <select 
                                className="bg-transparent text-[11px] font-bold text-[#312923] outline-none cursor-pointer"
                                value={selectedDentistFilter}
                                onChange={(e) => setSelectedDentistFilter(e.target.value)}
                            >
                                <option value="all">Todas las agendas</option>
                                {(team || []).filter(m => m.role === 'admin' || m.role === 'dentist').map(doc => (
                                    <option key={doc.email} value={doc.email}>Agenda Dr. {doc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                    <div className="flex flex-wrap items-center justify-end gap-4">
                        
                        <div className="hidden lg:flex gap-4 text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-white px-5 py-3 rounded-2xl border border-[#DFD2C4]/50 shadow-sm">
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#DFD2C4]"></div>Agendado</span>
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#5B6651]"></div>Confirmado</span>
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>Espera</span>
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>En Box</span>
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#CBAAA2]"></div>No Asistió</span>
                        </div>

                        <div className="flex items-center p-1.5 bg-white rounded-2xl border border-[#DFD2C4]/60 shadow-sm">
                            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-2 rounded-xl hover:bg-[#FDFBF7] text-[#9A8F84] hover:text-[#312923] transition-colors">
                                <ChevronLeft size={18}/>
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#312923] hover:text-[#5B6651] transition-all">
                                Hoy
                            </button>
                            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-2 rounded-xl hover:bg-[#FDFBF7] text-[#9A8F84] hover:text-[#312923] transition-colors">
                                <ChevronRight size={18}/>
                            </button>
                        </div>

                        <button 
                            onClick={() => onOpenModal({name: '', treatment: '', date: '', time: '', duration: 60, status: 'agendado', id: null})} 
                            className="flex items-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                        >
                            <Plus size={16}/> Agendar
                        </button>
                    </div>
                </div>
            </div>
            
            {/* --- CUADRÍCULA DEL CALENDARIO --- */}
            <div className="flex-1 overflow-auto rounded-[2rem] border border-[#DFD2C4]/60 bg-white shadow-xl custom-scrollbar relative" style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
                <div className="grid grid-cols-8 min-w-[900px]">
                    
                    <div className="p-2 border-b border-r border-[#DFD2C4]/40 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-center rounded-tl-[2rem]">
                        <span className="text-[9px] font-black text-[#9A8F84] uppercase tracking-widest">Hora</span>
                    </div>
                    
                    {Array.from({length: 7}, (_, i) => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1) + i);
                        const isToday = d.toDateString() === new Date().toDateString();

                        return (
                            <div key={d} className={`py-3 px-2 border-b border-r text-center sticky top-0 z-20 backdrop-blur-md transition-colors ${isToday ? 'bg-[#5B6651]/[0.07] border-[#5B6651]/30 border-b-2 border-b-[#5B6651]' : 'bg-white/95 border-[#DFD2C4]/40'}`}>
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-[#5B6651]' : 'text-[#9A8F84]'}`}>
                                        {dayNames[i]}
                                    </p>
                                    <div className={`w-9 h-9 flex items-center justify-center rounded-full text-lg font-black ${isToday ? 'bg-[#5B6651] text-white shadow-md shadow-[#5B6651]/30' : 'text-[#312923] bg-[#FDFBF7] border border-[#DFD2C4]/40'}`}>
                                        {d.getDate()}
                                    </div>
                                    {isToday && (
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#5B6651] mt-0.5">
                                            HOY
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {Array.from({length: 12}, (_, i) => 8 + i).map(h => (
                        <React.Fragment key={h}>
                            <div className="border-r border-b border-[#DFD2C4]/40 text-[11px] font-black text-[#A3968B] text-center h-[72px] flex items-start justify-center pt-2 bg-[#FDFBF7]">
                                {h}:00
                            </div>
                            
                            {Array.from({length: 7}, (_, i) => {
                                const d = new Date(currentDate);
                                d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1) + i);
                                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                const isTodayCell = d.toDateString() === new Date().toDateString();
                                const hourAppts = filteredAppts.filter(a => a.date === dateStr && parseInt(a.time.split(':')[0]) === h);

                                return (
                                    <div
                                        key={d+h}
                                        className={`border-b border-r border-[#DFD2C4]/30 relative group h-[72px] transition-colors cursor-pointer ${isTodayCell ? 'bg-[#5B6651]/[0.03] hover:bg-[#5B6651]/[0.07]' : 'hover:bg-[#FDFBF7]'}`}
                                        onClick={() => onOpenModal({name: '', treatment: '', date: dateStr, time: `${h.toString().padStart(2, '0')}:00`, duration: 60, status: 'agendado', id: null})}
                                    >
                                        {hourAppts.map((appt, index) => {
                                            const minutes = parseInt(appt.time.split(':')[1]) || 0;
                                            const topOffset = (minutes / 60) * 100;
                                            const heightPercent = (appt.duration || 60) / 60 * 100;

                                            return (
                                                <div 
                                                    key={appt.id || index}
                                                    onClick={(e) => { e.stopPropagation(); onOpenModal(appt); }}
                                                    className={`absolute left-1.5 right-1.5 rounded-xl border-l-[4px] flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-[2px] hover:z-30 p-2 z-10 overflow-hidden ${statusColors[appt.status || 'agendado']}`}
                                                    style={{ 
                                                        top: `calc(${topOffset}% + 2px)`, 
                                                        height: `calc(${heightPercent}% - 4px)`,
                                                        minHeight: '40px' 
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-[11px] font-black truncate leading-none">{appt.name}</p>
                                                        {(appt.duration || 60) >= 30 && (
                                                            <p className="text-[9px] font-bold opacity-80 truncate mt-1.5 leading-none tracking-wide">{appt.time} • {appt.treatment}</p>
                                                        )}
                                                    </div>
                                                    {/* Mostrar el dentista si la duración permite el espacio visual */}
                                                    {(appt.duration || 60) >= 45 && appt.dentist_name && (
                                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-1 truncate">
                                                            👨‍⚕️ Dr. {appt.dentist_name.split(' ')[0]}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        
                                        {hourAppts.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-[#DFD2C4] text-[#A3968B] group-hover:scale-110 transition-transform">
                                                    <Plus size={16}/>
                                                </div>
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