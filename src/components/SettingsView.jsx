import React from 'react';
import { Camera, Shield, Plus, Trash2 } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { formatRUT } from '../constants';
import { supabase } from '../supabase';

export default function SettingsView({
    themeMode, t, config, setConfigLocal, logoInputRef, handleLogoUpload,
    userRole, saveToSupabase, notify, team, setTeam, newMember, setNewMember
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom h-full">
            <Card theme={themeMode} className="space-y-4">
                <div onClick={()=>logoInputRef.current.click()} className="p-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                    {config.logo ? <img src={config.logo} className="h-16 object-contain"/> : <><Camera className="mb-2 opacity-50"/><span className="text-xs font-bold opacity-50">SUBIR LOGO</span></>}
                </div>
                {userRole === 'admin' ? (
                    <>
                        <h3 className="text-xs font-black text-cyan-600 dark:text-cyan-500 mt-2 uppercase tracking-widest border-b border-white/10 pb-2">
                            Datos Generales
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField theme={themeMode} label="Nombre Clínica/Dr" value={config.name || ''} onChange={e=>setConfigLocal({...config, name:e.target.value})} />
                            <InputField theme={themeMode} label="RUT Profesional" value={config.rut || ''} onChange={e=>setConfigLocal({...config, rut: formatRUT(e.target.value)})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField theme={themeMode} label="Especialidad" value={config.specialty || ''} onChange={e=>setConfigLocal({...config, specialty:e.target.value})} />
                            <InputField theme={themeMode} label="Teléfono" value={config.phone || ''} onChange={e=>setConfigLocal({...config, phone:e.target.value})} />
                        </div>
                        
                        <h3 className="text-xs font-black text-cyan-600 dark:text-cyan-500 mt-6 uppercase tracking-widest border-b border-white/10 pb-2">
                            Información Legal para Recetas (MINSAL)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField theme={themeMode} label="Registro Minsal (RNPI)" value={config.rnpi || ''} onChange={e=>setConfigLocal({...config, rnpi:e.target.value})} />
                            <InputField theme={themeMode} label="Universidad / Título" value={config.university || ''} onChange={e=>setConfigLocal({...config, university:e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <InputField theme={themeMode} label="Dirección Clínica" value={config.address || ''} onChange={e=>setConfigLocal({...config, address:e.target.value})} />
                        </div>
                        <p className="text-[10px] opacity-50 font-medium italic mb-2">
                            * El RUT, RNPI y la Universidad son obligatorios en Chile para la validez de recetas en farmacias.
                        </p>

                        <Button theme={themeMode} className="w-full mt-4" onClick={()=>{saveToSupabase('settings', 'general', config); notify("Ajustes Guardados");}}>GUARDAR DATOS</Button>
                    </>
                ) : <p className="text-center opacity-50 py-4">Contacta al administrador para editar datos.</p>}
            </Card>

            {userRole === 'admin' && (
                <Card theme={themeMode} className="space-y-4 border-l-4 border-cyan-500">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Shield size={20}/> Gestión de Equipo</h3>
                    <div className="flex gap-2">
                        <InputField theme={themeMode} placeholder="Nombre" value={newMember.name} onChange={e=>setNewMember({...newMember, name:e.target.value})}/>
                        <InputField theme={themeMode} placeholder="Email" value={newMember.email} onChange={e=>setNewMember({...newMember, email:e.target.value})}/>
                        <select className={`bg-transparent border border-white/10 rounded-xl px-2 text-xs font-bold outline-none ${t.text}`} value={newMember.role} onChange={e=>setNewMember({...newMember, role:e.target.value})}><option className="bg-[#121212] text-white" value="admin">Admin</option><option className="bg-[#121212] text-white" value="dentist">Dentista</option><option className="bg-[#121212] text-white" value="assistant">Asistente</option></select>
                        <Button theme={themeMode} onClick={async()=>{ 
                            if(newMember.email && newMember.name){ 
                                const id=Date.now().toString(); 
                                const u={...newMember, id}; 
                                setTeam([...team, u]); 
                                await saveToSupabase('team', id, u); 
                                setNewMember({name:'', email:'', role:'dentist'}); 
                                notify("Usuario Agregado"); 
                            } 
                        }}><Plus/></Button>
                    </div>
                    <div className="space-y-2">
                        {team.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div><p className="font-bold">{member.name}</p><p className="text-[10px] opacity-50">{member.email}</p></div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/10 ${member.role==='admin'?'text-emerald-400':member.role==='dentist'?'text-blue-400':'text-stone-400'}`}>{member.role}</span>
                                    <button onClick={async()=>{ const f=team.filter(t=>t.id!==member.id); setTeam(f); await supabase.from('team').delete().eq('id', member.id); notify("Usuario Eliminado"); }} className="text-red-500 opacity-50 hover:opacity-100"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}