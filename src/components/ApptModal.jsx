import React from 'react';
import { X, Trash2, MessageCircle } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { supabase } from '../supabase';

export default function ApptModal({
    themeMode, newAppt, setNewAppt, setModal, patientRecords, setPatientRecords,
    getPatient, savePatientData, notify, appointments, setAppointments,
    saveToSupabase, sendWhatsApp, getPatientPhone
}) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">{newAppt.id ? 'Editar Cita' : 'Agendar Cita'}</h3>
                    <button onClick={()=>setModal(null)} className="opacity-50 hover:opacity-100"><X size={20}/></button>
                </div>
                
                {!newAppt.id && (
                    <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
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
                    }} />
                )}
                
                {newAppt.id && <p className="font-bold text-lg text-cyan-400">{newAppt.name}</p>}
                
                <InputField theme={themeMode} label="Tratamiento" value={newAppt.treatment} onChange={e=>setNewAppt({...newAppt, treatment:e.target.value})}/>
                
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Fecha y Hora</label>
                        <input type="date" className="w-full bg-white/5 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/>
                        <input type="time" className="w-full bg-white/5 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Detalles</label>
                        <select className="w-full bg-[#121212] border border-white/10 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.duration} onChange={e=>setNewAppt({...newAppt, duration: Number(e.target.value)})}>
                            <option value={15}>15 minutos</option>
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>1 Hora</option>
                            <option value={90}>1.5 Horas</option>
                            <option value={120}>2 Horas</option>
                        </select>
                        <select className={`w-full border border-white/10 p-3 rounded-xl text-white outline-none text-xs font-bold bg-[#121212] ${newAppt.status==='agendado'?'text-stone-400':newAppt.status==='confirmado'?'text-emerald-400':newAppt.status==='espera'?'text-yellow-400':newAppt.status==='atendiendo'?'text-blue-400':'text-red-400'}`} value={newAppt.status} onChange={e=>setNewAppt({...newAppt, status:e.target.value})}>
                            <option value="agendado">⚪ Por Confirmar</option>
                            <option value="confirmado">🟢 Confirmado</option>
                            <option value="espera">🟡 En Sala Espera</option>
                            <option value="atendiendo">🔵 En Box (Atendiendo)</option>
                            <option value="no_asistio">🔴 No Asistió</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    {newAppt.id && (
                        <button onClick={async (e) => {
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
                        }} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl">
                            <Trash2 size={20}/>
                        </button>
                    )}
                    <Button theme={themeMode} className="flex-1" onClick={async ()=>{ 
                        if(newAppt.name){ 
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
                    }}>{newAppt.id ? 'ACTUALIZAR' : 'AGENDAR'}</Button>
                </div>
                
                {newAppt.id && (
                    <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(newAppt.name), `Hola ${newAppt.name}, le escribimos de ShiningCloud Dental para confirmar su cita para el ${newAppt.date.split('-').reverse().join('/')} a las ${newAppt.time}. ¿Nos confirma su asistencia?`); }} className="w-full flex items-center justify-center gap-2 text-[10px] bg-white/5 py-2 rounded-xl hover:bg-white/10 text-stone-400 transition-colors uppercase font-bold tracking-widest mt-2">
                        <MessageCircle size={14} className="text-emerald-400"/> Enviar WhatsApp de Confirmación
                    </button>
                )}
            </Card>
        </div>
    );
}