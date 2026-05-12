import React from 'react';
import { X, Trash2, MessageCircle, CalendarDays, Clock, FileText, Activity, Stethoscope } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { supabase } from '../supabase';

export default function ApptModal({
    themeMode, newAppt, setNewAppt, setModal, patientRecords, setPatientRecords,
    getPatient, savePatientData, notify, appointments, setAppointments,
    saveToSupabase, sendWhatsApp, getPatientPhone, team, session, adminEmail
}) {
    return (
        <div className="fixed inset-0 z-[100] bg-[#312923]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Contenedor principal con alto máximo controlado */}
            <Card className="w-full max-w-md shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] bg-white/95 border-[#DFD2C4]/50">
                
                {/* --- HEADER DEL MODAL (Fijo arriba) --- */}
                <div className="flex justify-between items-center border-b border-[#DFD2C4]/40 pb-4 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight">
                            {newAppt.id ? 'Editar Cita' : 'Agendar Cita'}
                        </h3>
                        {newAppt.id && <p className="text-xs font-bold text-[#5B6651] mt-1 uppercase tracking-widest">{newAppt.name}</p>}
                    </div>
                    <button 
                        onClick={() => setModal(null)} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFBF7] text-[#9A8F84] hover:bg-[#DFD2C4]/30 hover:text-[#312923] transition-colors border border-[#DFD2C4]/50 shrink-0"
                    >
                        <X size={20}/>
                    </button>
                </div>
                
                {/* --- CONTENIDO CON SCROLL INTERNO --- */}
                <div className="overflow-y-auto custom-scrollbar flex-1 py-4 space-y-5 pr-1 -mr-1">
                    
                    {/* SELECCIÓN DE PACIENTE */}
                    {!newAppt.id && (
                        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#DFD2C4]/40">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] mb-2 block ml-1">Seleccionar Paciente</label>
                            <PatientSelect
                                theme={themeMode}
                                patients={patientRecords}
                                placeholder="Buscar o Crear Paciente..."
                                adminEmail={adminEmail}
                                onSelect={(p) => {
                                    if (p.id === 'new') {
                                        const newId = "pac_" + Date.now().toString();
                                        const nombreReal = p.name;
                                        const newPatient = getPatient(newId);
                                        newPatient.id = newId;
                                        newPatient.name = nombreReal;
                                        if (!newPatient.personal) newPatient.personal = {};
                                        newPatient.personal.legalName = nombreReal;

                                        savePatientData(newId, newPatient);
                                        setNewAppt({...newAppt, name: nombreReal});
                                        notify("Paciente Creado Exitosamente");
                                    } else {
                                        setPatientRecords(prev => ({...prev, [p.id]: p}));
                                        setNewAppt({...newAppt, name: p.personal?.legalName || p.name});
                                    }
                                }}
                            />
                        </div>
                    )}
                    
                    {/* FORMULARIO RESTANTE */}
                    <div className="space-y-5">
                        <InputField 
                            label="Tratamiento o Motivo" 
                            value={newAppt.treatment} 
                            onChange={e => setNewAppt({...newAppt, treatment: e.target.value})}
                            placeholder="Ej. Limpieza, Ortodoncia..."
                            icon={FileText}
                        />

                        {/* ODONTÓLOGO TRATANTE */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] ml-1">Odontólogo Tratante</label>
                            <div className="relative">
                                <Stethoscope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                <select 
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-bold text-[#312923] text-sm appearance-none cursor-pointer" 
                                    value={newAppt.dentist_email || ''} 
                                    onChange={e => {
                                        const selectedDoc = team.find(m => m.email === e.target.value);
                                        setNewAppt({...newAppt, dentist_email: e.target.value, dentist_name: selectedDoc ? selectedDoc.name : ''});
                                    }}
                                >
                                    <option value="">Selecciona al Doctor...</option>
                                    {(team || []).filter(m => m.role === 'admin' || m.role === 'dentist').map(doc => (
                                        <option key={doc.email} value={doc.email}>Dr/a. {doc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] ml-1">Fecha</label>
                                <div className="relative">
                                    <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-medium text-[#312923] text-sm" 
                                        value={newAppt.date} 
                                        onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] ml-1">Hora Inicio</label>
                                <div className="relative">
                                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                    <input 
                                        type="time" 
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-medium text-[#312923] text-sm" 
                                        value={newAppt.time} 
                                        onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] ml-1">Duración</label>
                                <div className="relative">
                                    <Activity size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                    <select 
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-bold text-[#312923] text-sm appearance-none cursor-pointer" 
                                        value={newAppt.duration} 
                                        onChange={e => setNewAppt({...newAppt, duration: Number(e.target.value)})}
                                    >
                                        <option value={15}>15 minutos</option>
                                        <option value={30}>30 minutos</option>
                                        <option value={45}>45 minutos</option>
                                        <option value={60}>1 Hora</option>
                                        <option value={90}>1.5 Horas</option>
                                        <option value={120}>2 Horas</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] ml-1">Estado</label>
                                <select 
                                    className={`w-full px-4 py-3.5 rounded-2xl border focus:ring-4 outline-none transition-all font-bold text-sm appearance-none cursor-pointer ${
                                        newAppt.status === 'agendado' ? 'bg-[#FDFBF7] text-[#6B615A] border-[#DFD2C4]/70 focus:border-[#9A8F84] focus:ring-[#9A8F84]/20' :
                                        newAppt.status === 'confirmado' ? 'bg-[#5B6651]/10 text-[#5B6651] border-[#5B6651]/30 focus:border-[#5B6651] focus:ring-[#5B6651]/20' :
                                        newAppt.status === 'espera' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:border-amber-500 focus:ring-amber-200' :
                                        newAppt.status === 'atendiendo' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:border-blue-500 focus:ring-blue-200' :
                                        'bg-[#CBAAA2]/10 text-[#CBAAA2] border-[#CBAAA2]/30 focus:border-[#CBAAA2] focus:ring-[#CBAAA2]/20'
                                    }`} 
                                    value={newAppt.status} 
                                    onChange={e => setNewAppt({...newAppt, status: e.target.value})}
                                >
                                    <option value="agendado">⚪ Agendado</option>
                                    <option value="confirmado">🟢 Confirmado</option>
                                    <option value="espera">🟡 En Espera</option>
                                    <option value="atendiendo">🔵 En Box</option>
                                    <option value="no_asistio">🔴 No Asistió</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BOTONES DE ACCIÓN (Fijos abajo) --- */}
                <div className="flex flex-col gap-3 pt-4 border-t border-[#DFD2C4]/40 shrink-0">
                    <div className="flex gap-3">
                        {newAppt.id && (
                            <Button 
                                variant="danger"
                                className="px-5 !bg-[#CBAAA2]/10 !text-[#CBAAA2] hover:!bg-[#CBAAA2]/20 !border-transparent"
                                onClick={async (e) => {
                                    e.stopPropagation(); 
                                    try {
                                        const { error } = await supabase.from('appointments').delete().eq('id', newAppt.id);
                                        if (error) throw error;
                                        setAppointments(appointments.filter(a => a.id !== newAppt.id)); 
                                        setModal(null); 
                                        notify("Cita Eliminada");
                                    } catch (err) {
                                        alert("Error al eliminar la cita. Revisa tu conexión.");
                                    }
                                }}
                            >
                                <Trash2 size={20}/>
                            </Button>
                        )}
                        
                        <Button 
                            variant="primary" 
                            className="flex-1 py-4 text-xs tracking-widest uppercase shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5" 
                            onClick={async () => { 
                                if(newAppt.name) { 
                                    const id = newAppt.id || Date.now().toString(); 
                                    const nd = {...newAppt, id}; 
                                    if (newAppt.id) {
                                        setAppointments(appointments.map(a => a.id === id ? nd : a));
                                    } else {
                                        setAppointments([...appointments, nd]); 
                                    }
                                    await saveToSupabase('appointments', id, nd); 
                                    setModal(null); 
                                    notify(newAppt.id ? "Cita Actualizada" : "Cita Agendada"); 
                                }
                            }}
                        >
                            {newAppt.id ? 'ACTUALIZAR CITA' : 'AGENDAR CITA'}
                        </Button>
                    </div>
                    
                    {newAppt.id && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                sendWhatsApp(getPatientPhone(newAppt.name), `Hola ${newAppt.name}, le escribimos de ShiningCloud Dental para confirmar su cita con el/la Dr/a. ${newAppt.dentist_name || ''} para el ${newAppt.date.split('-').reverse().join('/')} a las ${newAppt.time}. ¿Nos confirma su asistencia?`); 
                            }} 
                            className="w-full flex items-center justify-center gap-2 text-[11px] bg-[#5B6651]/5 border border-[#5B6651]/10 py-3 rounded-2xl hover:bg-[#5B6651]/10 text-[#5B6651] transition-colors font-bold uppercase tracking-widest"
                        >
                            <MessageCircle size={16} /> Enviar WhatsApp
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
}