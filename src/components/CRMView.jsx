import React from 'react';
import { Users, Star, MessageCircle, CalendarClock, ArrowRight } from 'lucide-react';

export default function CRMView({ 
    themeMode, t, getRecalls, patientRecords, 
    setActiveTab, setSelectedPatientId, sendWhatsApp, getPatientPhone 
}) {
    return (
        <div className="space-y-8 animate-in fade-in custom-scrollbar pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 mb-4 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Marketing & Retención</p>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter">CRM Pacientes</h2>
                    <p className="text-xs font-bold text-[#A3968B] mt-2">Pacientes inactivos por más de 6 meses sin citas futuras.</p>
                </div>

                <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-2xl border border-[#DFD2C4]/60 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-[#CBAAA2]/20 flex items-center justify-center text-[#CBAAA2] font-black text-lg">
                            {getRecalls.length}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Pacientes</span>
                            <span className="text-sm font-black text-[#312923]">Por Recuperar</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ESTADO VACÍO (Si no hay pacientes a recuperar) --- */}
            {getRecalls.length === 0 ? (
                <div className="p-16 border border-dashed border-[#DFD2C4] bg-[#FDFBF7]/50 rounded-[2rem] text-center flex flex-col items-center gap-5">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#DFD2C4]/50 text-[#CBAAA2]">
                        <Star size={40} strokeWidth={1.5}/>
                    </div>
                    <div>
                        <h4 className="font-black text-[#312923] text-2xl tracking-tight">¡Excelente trabajo!</h4>
                        <p className="text-sm text-[#9A8F84] mt-2 font-bold max-w-md mx-auto leading-relaxed">
                            No tienes pacientes inactivos o atrasados en sus controles. Tu retención de clínica está al 100%.
                        </p>
                    </div>
                </div>
            ) : (
                /* --- CUADRÍCULA DE PACIENTES A RECUPERAR --- */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {getRecalls.map(appt => (
                        <div key={appt.id} className="p-6 rounded-[2rem] bg-white border border-[#DFD2C4]/50 shadow-sm hover:shadow-lg hover:border-[#CBAAA2]/50 transition-all flex flex-col justify-between group">
                            
                            {/* Información del Paciente */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-full bg-[#FDFBF7] flex items-center justify-center font-black text-2xl text-[#A3968B] border border-[#DFD2C4]/40 group-hover:bg-[#CBAAA2] group-hover:text-white transition-colors shadow-sm">
                                        {appt.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#312923] text-xl group-hover:text-[#CBAAA2] transition-colors">{appt.name}</h4>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <CalendarClock size={12} className="text-[#A3968B]"/>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84]">
                                                Última visita: <span className="text-[#CBAAA2]">{appt.date.split('-').reverse().join('/')}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tratamiento Previo */}
                            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#DFD2C4]/30 mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">Tratamiento Previo</p>
                                <p className="text-sm font-bold text-[#312923]">{appt.treatment || 'Sin registro en agenda'}</p>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                                <button onClick={()=>{
                                    setActiveTab('ficha'); 
                                    setSelectedPatientId(Object.keys(patientRecords).find(k => patientRecords[k].personal?.legalName === appt.name));
                                }} className="flex-1 py-3.5 bg-white border border-[#DFD2C4] hover:bg-[#FDFBF7] text-[#312923] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">
                                    Ver Ficha <ArrowRight size={14}/>
                                </button>
                                
                                <button onClick={()=>{
                                    // Mensaje persuasivo, amigable y muy clínico
                                    const msg = `Hola ${appt.name.split(' ')[0]}, nos comunicamos de la Clínica. Vemos que han pasado más de 6 meses desde tu última atención (${appt.treatment}). Nos encantaría agendar un control preventivo gratuito para asegurar que todo esté perfecto. ¿Te gustaría que te envíe los horarios disponibles?`;
                                    sendWhatsApp(getPatientPhone(appt.name), msg);
                                }} 
                                className="flex-[1.5] py-3.5 bg-[#5B6651] hover:bg-[#4a5442] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#5B6651]/20 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                                    <MessageCircle size={16}/> Contactar por WhatsApp
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}