import React from 'react';
import { Camera, Shield, Plus, Trash2, Settings, UserPlus, Save, Building2, FileSignature } from 'lucide-react';
import { Card } from './UIComponents';
import { formatRUT } from '../constants';
import { supabase } from '../supabase';

export default function SettingsView({
    themeMode, t, config, setConfigLocal, logoInputRef, handleLogoUpload,
    userRole, saveToSupabase, notify, team, setTeam, newMember, setNewMember
}) {
    const inputClass = "w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Settings size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Administración</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Ajustes de Clínica</h2>
                </div>
                {userRole === 'admin' && (
                    <button 
                        onClick={()=>{saveToSupabase('settings', 'general', config); notify("Ajustes Guardados con éxito");}}
                        className="flex items-center gap-2 px-8 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                    >
                        <Save size={16}/> Guardar Cambios
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
                {userRole === 'admin' ? (
                    <>
                        {/* --- IDENTIDAD VISUAL --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2">
                                <Camera className="text-[#CBAAA2]"/> Identidad Visual
                            </h3>
                            
                            <div 
                                onClick={()=>logoInputRef.current.click()} 
                                className="w-full max-w-md p-8 border-2 border-dashed border-[#DFD2C4] bg-[#FDFBF7] rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#A3968B] transition-all shadow-inner group"
                            >
                                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                                {config.logo ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img src={config.logo} className="h-24 object-contain drop-shadow-sm transition-transform group-hover:scale-105" alt="Logo Clínica"/>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#A3968B] bg-white px-4 py-1.5 rounded-full border border-[#DFD2C4]/50 shadow-sm">Cambiar Logo</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-[#A3968B] border border-[#DFD2C4] group-hover:scale-110 transition-transform">
                                            <Camera size={28}/>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Click para subir logo</span>
                                        <p className="text-xs font-bold text-[#9A8F84]">Formato PNG transparente recomendado</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* --- DATOS GENERALES --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4">
                                <Building2 className="text-[#A3968B]"/> Datos de la Clínica
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Nombre Clínica / Doctor</label>
                                    <input className={inputClass} placeholder="Ej: Clínica ShiningCloud" value={config.name || ''} onChange={e=>setConfigLocal({...config, name:e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>RUT Profesional / Empresa</label>
                                    <input className={inputClass} placeholder="12.345.678-9" value={config.rut || ''} onChange={e=>setConfigLocal({...config, rut: formatRUT(e.target.value)})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Especialidad Principal</label>
                                    <input className={inputClass} placeholder="Ej: Odontología Integral" value={config.specialty || ''} onChange={e=>setConfigLocal({...config, specialty:e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Teléfono de Contacto</label>
                                    <input className={inputClass} placeholder="+56 9 1234 5678" value={config.phone || ''} onChange={e=>setConfigLocal({...config, phone:e.target.value})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Dirección Física</label>
                                    <input className={inputClass} placeholder="Av. Siempre Viva 123, Oficina 405" value={config.address || ''} onChange={e=>setConfigLocal({...config, address:e.target.value})} />
                                </div>
                            </div>
                        </Card>

                        {/* --- INFORMACIÓN LEGAL MINSAL --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-inner">
                            <div className="flex justify-between items-center mb-6 border-b border-[#DFD2C4]/50 pb-4">
                                <h3 className="font-black text-xl text-[#312923] flex items-center gap-2">
                                    <FileSignature className="text-[#5B6651]"/> Información Legal para Recetas
                                </h3>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white border border-[#DFD2C4] px-3 py-1 rounded-full text-[#9A8F84]">Requisito MINSAL</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className={labelClass}>Registro Minsal (RNPI)</label>
                                    <input className={`${inputClass} bg-white`} placeholder="N° de Registro" value={config.rnpi || ''} onChange={e=>setConfigLocal({...config, rnpi:e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Universidad de Egreso</label>
                                    <input className={`${inputClass} bg-white`} placeholder="Ej: Universidad de Chile" value={config.university || ''} onChange={e=>setConfigLocal({...config, university:e.target.value})} />
                                </div>
                            </div>
                            <p className="text-xs text-[#A3968B] font-bold">
                                * El RUT, RNPI y la Universidad son obligatorios en Chile para que las recetas generadas por el sistema sean válidas en farmacias.
                            </p>
                        </Card>

                        {/* --- GESTIÓN DE EQUIPO --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4">
                                <Shield className="text-[#CBAAA2]"/> Gestión de Accesos y Equipo
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#FDFBF7] p-5 rounded-3xl border border-[#DFD2C4]/50 mb-8 shadow-inner">
                                <div className="md:col-span-4 space-y-1">
                                    <label className={labelClass}>Nombre</label>
                                    <input className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="Nombre completo" value={newMember.name} onChange={e=>setNewMember({...newMember, name:e.target.value})}/>
                                </div>
                                <div className="md:col-span-4 space-y-1">
                                    <label className={labelClass}>Correo Electrónico</label>
                                    <input className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="usuario@clinica.com" value={newMember.email} onChange={e=>setNewMember({...newMember, email:e.target.value})}/>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className={labelClass}>Rol</label>
                                    <select className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors appearance-none cursor-pointer" value={newMember.role} onChange={e=>setNewMember({...newMember, role:e.target.value})}>
                                        <option value="admin">Administrador</option>
                                        <option value="dentist">Dentista</option>
                                        <option value="assistant">Asistente</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex items-end">
                                    <button 
                                        className="w-full h-[50px] bg-[#5B6651] hover:bg-[#4a5442] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#5B6651]/20 flex items-center justify-center gap-2"
                                        onClick={async()=>{ 
                                            if(newMember.email && newMember.name){ 
                                                const id = Date.now().toString(); 
                                                const u = { ...newMember, id }; 
                                                
                                                // 1. Guardar en estado local y Supabase
                                                setTeam([...team, u]); 
                                                await saveToSupabase('team', id, u); 
                                                
                                                // 2. MAGIA: Enviar correo de invitación (Magic Link)
                                                const { error } = await supabase.auth.signInWithOtp({
                                                    email: newMember.email,
                                                    options: { emailRedirectTo: window.location.origin }
                                                });

                                                if(error) {
                                                    notify("Error enviando invitación: " + error.message);
                                                } else {
                                                    setNewMember({name:'', email:'', role:'dentist'}); 
                                                    notify("Usuario agregado e Invitación enviada 📩"); 
                                                }
                                            } else {
                                                alert("Por favor ingresa un nombre y correo electrónico válidos.");
                                            }
                                        }}
                                    >
                                        <UserPlus size={16}/> Añadir
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className={labelClass}>Usuarios Registrados</label>
                                {team.map(member => (
                                    <div key={member.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 bg-white rounded-2xl border border-[#DFD2C4]/40 hover:border-[#A3968B] transition-all shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#FDFBF7] border border-[#DFD2C4] flex items-center justify-center font-black text-[#A3968B]">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-[#312923]">{member.name}</p>
                                                <p className="text-[10px] font-bold text-[#9A8F84] mt-0.5">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                            <span className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-full border tracking-widest ${
                                                member.role === 'admin' ? 'bg-[#5B6651]/10 text-[#5B6651] border-[#5B6651]/20' : 
                                                member.role === 'dentist' ? 'bg-[#A3968B]/10 text-[#A3968B] border-[#A3968B]/20' : 
                                                'bg-[#CBAAA2]/10 text-[#CBAAA2] border-[#CBAAA2]/20'
                                            }`}>
                                                {member.role === 'admin' ? 'Administrador' : member.role === 'dentist' ? 'Odontólogo' : 'Asistente'}
                                            </span>
                                            <button 
                                                onClick={async()=>{ 
                                                    if(window.confirm(`¿Estás seguro de eliminar a ${member.name}?`)){
                                                        const f=team.filter(t=>t.id!==member.id); 
                                                        setTeam(f); 
                                                        await supabase.from('team').delete().eq('id', member.id); 
                                                        notify("Usuario Eliminado"); 
                                                    }
                                                }} 
                                                className="p-2 text-[#DFD2C4] hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Shield size={48} className="text-[#A3968B] mb-4"/>
                        <h3 className="font-black text-xl text-[#312923]">Acceso Restringido</h3>
                        <p className="text-sm font-bold mt-2 text-[#9A8F84]">Contacta al administrador para editar la configuración de la clínica.</p>
                    </div>
                )}
            </div>
        </div>
    );
}