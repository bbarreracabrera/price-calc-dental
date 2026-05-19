import React, { useState, useEffect } from 'react';
import { Camera, Shield, Plus, Trash2, Settings, UserPlus, Save, Building2, FileSignature, Percent, Clock, CalendarDays, Link, Copy, FlaskConical, Phone, Mail, MessageCircle, CreditCard } from 'lucide-react';
import { Card } from './UIComponents';
import { formatRUT } from '../constants';
import { supabase } from '../supabase';
import { useDialog } from './DialogProvider';

export default function SettingsView({
    themeMode, t, config, setConfigLocal, logoInputRef, handleLogoUpload,
    userRole, saveToSupabase, notify, team, setTeam, newMember, setNewMember, session
}) {
    const { confirm } = useDialog();
    const inputClass = "w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    const [newLab, setNewLab] = useState({ name: '', email: '', phone: '' });
    const [colorPickerOpenFor, setColorPickerOpenFor] = useState(null);

    const TEAM_COLORS = ['#5B6651', '#A3968B', '#CBAAA2', '#D9A86C', '#7A8B7F', '#B89B85', '#9B7E7A', '#6B7B6E'];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (colorPickerOpenFor && !e.target.closest('.color-picker-container')) {
                setColorPickerOpenFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [colorPickerOpenFor]);

    useEffect(() => {
        const labs = config.laboratories;
        if (!labs || labs.length === 0) return;
        const needsBackfill = labs.some(l => !l.invited_at || l.accepted_at === undefined);
        if (!needsBackfill) return;
        if (window.__labsBackfillDone) return;
        window.__labsBackfillDone = true;

        const fallback = new Date('2026-01-01').toISOString();
        const backfilled = labs.map(l => ({
            ...l,
            invited_at: l.invited_at || fallback,
            accepted_at: l.accepted_at !== undefined ? l.accepted_at : fallback,
            last_invite_sent_at: l.last_invite_sent_at || fallback,
        }));

        const updatedConfig = { ...config, laboratories: backfilled };
        setConfigLocal(updatedConfig);
        saveToSupabase('settings', 'general', updatedConfig);
        saveToSupabase('clinic_config', session?.user?.email || 'general', updatedConfig);
    }, [config.laboratories]);

    const updateMemberColor = async (memberId, newColor) => {
        const updated = team.map(m => m.id === memberId ? { ...m, color: newColor } : m);
        setTeam(updated);
        const member = updated.find(m => m.id === memberId);
        if (member) await saveToSupabase('team', memberId, member);
    };

    const defaultSchedule = {
        Lunes: { active: true, start1: '09:00', end1: '13:00', start2: '15:00', end2: '19:00' },
        Martes: { active: true, start1: '09:00', end1: '13:00', start2: '15:00', end2: '19:00' },
        Miércoles: { active: true, start1: '09:00', end1: '13:00', start2: '15:00', end2: '19:00' },
        Jueves: { active: true, start1: '09:00', end1: '13:00', start2: '15:00', end2: '19:00' },
        Viernes: { active: true, start1: '09:00', end1: '13:00', start2: '15:00', end2: '19:00' },
        Sábado: { active: false, start1: '09:00', end1: '14:00', start2: '', end2: '' },
        Domingo: { active: false, start1: '', end1: '', start2: '', end2: '' }
    };

    const schedule = config.schedule || defaultSchedule;
    const laboratories = config.laboratories || []; 

    const handleScheduleChange = (day, field, value) => {
        const updatedSchedule = { ...schedule, [day]: { ...schedule[day], [field]: value } };
        setConfigLocal({ ...config, schedule: updatedSchedule });
    };

    // --- GUARDADO AUTOMÁTICO AL AÑADIR LAB ---
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim().toLowerCase());

    const sendLabInvitation = async (lab) => {
        const clinicName = config?.name || 'la clínica';

        // PASO 1: Supabase envía magic link nativo (siempre, como base)
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: lab.email,
            options: { emailRedirectTo: window.location.origin }
        });
        if (otpError) throw otpError;

        // PASO 2: Intentar email HTML personalizado via Edge Function (si Resend está configurado)
        try {
            const { data, error } = await supabase.functions.invoke('invite-lab', {
                body: {
                    lab_email: lab.email,
                    lab_name: lab.name,
                    clinic_name: clinicName,
                    magic_link: window.location.origin,
                }
            });
            if (error || data?.fallback) return { method: 'supabase_default' };
            return { method: 'resend_custom' };
        } catch {
            return { method: 'supabase_default' };
        }
    };

    const handleAddLab = async () => {
        if (!newLab.name) return notify("El nombre del laboratorio es obligatorio");

        const labId = Date.now().toString();
        const now = new Date().toISOString();
        const labEntry = {
            id: labId,
            name: newLab.name.trim(),
            email: (newLab.email || '').trim().toLowerCase(),
            phone: (newLab.phone || '').trim(),
            invited_at: now,
            accepted_at: null,
            last_invite_sent_at: now,
        };
        const updatedLabs = [...laboratories, labEntry];
        
        // 1. Actualizamos el estado local
        const updatedConfig = { ...config, laboratories: updatedLabs };
        setConfigLocal(updatedConfig);
        
        // 2. Forzamos el Guardado Automático en Supabase
        await saveToSupabase('settings', 'general', updatedConfig); 
        await saveToSupabase('clinic_config', session?.user?.email || 'general', updatedConfig);
        
        if (newLab.email) {
            if (!validateEmail(newLab.email)) {
                notify("El email del laboratorio no es válido");
                return;
            }
            const u = {
                id: labId,
                name: newLab.name,
                email: newLab.email.toLowerCase().trim(),
                role: 'lab',
                phone: newLab.phone || ''
            };
            setTeam([...team, u]);
            await saveToSupabase('team', labId, u);

            try {
                await sendLabInvitation({ email: u.email, name: newLab.name });
                notify("Laboratorio guardado e invitación enviada.");
            } catch (e) {
                notify("Laboratorio guardado, pero falló el envío de invitación: " + e.message);
            }
        } else {
            notify("Laboratorio agregado exitosamente.");
        }
        
        setNewLab({ name: '', email: '', phone: '' });
    };

    const MP_CLIENT_ID = import.meta.env.VITE_MP_CLIENT_ID;
    const MP_REDIRECT_URI = import.meta.env.VITE_MP_REDIRECT_URI;

    const updateConfig = async (partial) => {
        const updated = { ...config, ...partial };
        setConfigLocal(updated);
        await saveToSupabase('settings', 'general', updated);
    };

    const handleConnectMP = () => {
        const authUrl = `https://auth.mercadopago.cl/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(MP_REDIRECT_URI)}`;
        window.location.href = authUrl;
    };

    const handleResendInvite = async (lab) => {
        try {
            await sendLabInvitation(lab);

            const now = new Date().toISOString();
            const updatedLabs = laboratories.map(l =>
                l.id === lab.id ? { ...l, last_invite_sent_at: now } : l
            );
            const updatedConfig = { ...config, laboratories: updatedLabs };
            setConfigLocal(updatedConfig);
            await saveToSupabase('settings', 'general', updatedConfig);
            await saveToSupabase('clinic_config', session?.user?.email || 'general', updatedConfig);
            notify(`Invitación reenviada a ${lab.email}`);
        } catch (e) {
            notify('Error al reenviar invitación: ' + e.message);
        }
    };

    // --- GUARDADO AUTOMÁTICO AL ELIMINAR LAB ---
    const handleDeleteLab = async (id) => {
        if (await confirm("¿Seguro que deseas eliminar este laboratorio de tu directorio?")) {
            const updatedLabs = laboratories.filter(l => l.id !== id);
            
            // 1. Actualizamos el estado local
            const updatedConfig = { ...config, laboratories: updatedLabs };
            setConfigLocal(updatedConfig);

            // 2. Forzamos el Guardado Automático en Supabase
            await saveToSupabase('settings', 'general', updatedConfig); 
            await saveToSupabase('clinic_config', session?.user?.email || 'general', updatedConfig);

            notify("Laboratorio eliminado correctamente.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Settings size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Administración</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Ajustes de Clínica</h2>
                </div>
                {userRole === 'admin' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                const { tour_completed, ...rest } = config || {};
                                const updatedConfig = rest;
                                setConfigLocal(updatedConfig);
                                await saveToSupabase('settings', 'general', updatedConfig);
                                window.location.reload();
                            }}
                            className="flex items-center gap-2 px-5 py-3.5 bg-[#FDFBF7] border border-[#DFD2C4] text-[#312923] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#DFD2C4]/30 transition-all"
                        >
                            🎯 Repetir tour
                        </button>
                        <button
                            onClick={()=>{
                                const configToSave = { ...config, schedule: config.schedule || defaultSchedule };
                                saveToSupabase('settings', 'general', configToSave);
                                saveToSupabase('clinic_config', session?.user?.email || 'general', configToSave);
                                notify("Ajustes Guardados con éxito");
                            }}
                            className="flex items-center gap-2 px-8 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                        >
                            <Save size={16}/> Guardar Resto de Cambios
                        </button>
                    </div>
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
                            <div onClick={()=>logoInputRef.current.click()} className="w-full max-w-md p-8 border-2 border-dashed border-[#DFD2C4] bg-[#FDFBF7] rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#A3968B] transition-all shadow-inner group">
                                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                                {config.logo ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img src={config.logo} className="h-24 object-contain drop-shadow-sm transition-transform group-hover:scale-105" alt="Logo Clínica"/>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#A3968B] bg-white px-4 py-1.5 rounded-full border border-[#DFD2C4]/50 shadow-sm">Cambiar Logo</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-[#A3968B] border border-[#DFD2C4] group-hover:scale-110 transition-transform"><Camera size={28}/></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Click para subir logo</span>
                                        <p className="text-xs font-bold text-[#9A8F84]">Formato PNG transparente recomendado</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* --- DATOS GENERALES Y LINK PÚBLICO --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4">
                                <Building2 className="text-[#A3968B]"/> Datos de la Clínica
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div className="md:col-span-2 p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl mb-2">
                                    <div className="flex justify-between items-center mb-2 ml-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-800/60 block">Link de Reservas (Slug)</label>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex items-center flex-1">
                                            <Link size={16} className="absolute left-4 text-indigo-400" />
                                            <span className="absolute left-11 text-indigo-900/40 font-bold text-sm hidden sm:block">?reserva=</span>
                                            <input 
                                                className={`${inputClass} !bg-white !border-indigo-100 !text-indigo-900 focus:!border-indigo-400 sm:pl-[100px] pl-11`} 
                                                placeholder="clinica-shining" 
                                                value={config.publicSlug || ''} 
                                                onChange={e => {
                                                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                                                    setConfigLocal({...config, publicSlug: slug});
                                                }} 
                                            />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if(!config.publicSlug) {
                                                    notify("Primero escribe un nombre para tu enlace.");
                                                    return;
                                                }
                                                const fullLink = `${window.location.origin}/?reserva=${config.publicSlug}`;
                                                navigator.clipboard.writeText(fullLink);
                                                notify("🔗 Enlace copiado al portapapeles");
                                            }}
                                            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            <Copy size={16} /> Copiar Link
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-indigo-800/50 font-bold mt-3 ml-2 uppercase tracking-widest">
                                        Pega este enlace en tu Instagram o envíalo por WhatsApp a tus pacientes.
                                    </p>
                                </div>

                                <div><label className={labelClass}>Nombre Clínica / Doctor</label><input className={inputClass} placeholder="Ej: Clínica ShiningCloud" value={config.name || ''} onChange={e=>setConfigLocal({...config, name:e.target.value})} /></div>
                                <div><label className={labelClass}>RUT Profesional / Empresa</label><input className={inputClass} placeholder="12.345.678-9" value={config.rut || ''} onChange={e=>setConfigLocal({...config, rut: formatRUT(e.target.value)})} /></div>
                                <div><label className={labelClass}>Especialidad Principal</label><input className={inputClass} placeholder="Ej: Odontología Integral" value={config.specialty || ''} onChange={e=>setConfigLocal({...config, specialty:e.target.value})} /></div>
                                <div><label className={labelClass}>Teléfono de Contacto</label><input className={inputClass} placeholder="+56 9 1234 5678" value={config.phone || ''} onChange={e=>setConfigLocal({...config, phone:e.target.value})} /></div>
                                <div className="md:col-span-2"><label className={labelClass}>Dirección Física</label><input className={inputClass} placeholder="Av. Siempre Viva 123, Oficina 405" value={config.address || ''} onChange={e=>setConfigLocal({...config, address:e.target.value})} /></div>
                            </div>
                        </Card>

                        {/* --- PLANTILLAS DE WHATSAPP --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4">
                                <MessageCircle className="text-[#5B6651]"/> Plantillas de WhatsApp
                            </h3>
                            <p className="text-xs text-[#9A8F84] font-bold mb-4">Configura los mensajes automáticos. El sistema abrirá WhatsApp Web/App con el texto listo para enviar.</p>
                            
                            <div className="bg-[#CBAAA2]/10 p-4 rounded-2xl border border-[#CBAAA2]/30 mb-6 flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#CBAAA2]">Variables mágicas:</span>
                                <div className="flex gap-2 flex-wrap">
                                    <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-[#312923] shadow-sm">{'{paciente}'}</span>
                                    <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-[#312923] shadow-sm">{'{clinica}'}</span>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>Mensaje de Contacto General</label>
                                    <textarea 
                                        className={`${inputClass} resize-none h-24`} 
                                        placeholder="Hola {paciente}, nos comunicamos de {clinica}..." 
                                        value={config.wpGreeting || 'Hola {paciente}, nos comunicamos de {clinica}...'} 
                                        onChange={e=>setConfigLocal({...config, wpGreeting:e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Mensaje de Envío de Presupuesto</label>
                                    <textarea 
                                        className={`${inputClass} resize-none h-24`} 
                                        placeholder="Hola {paciente}, te adjuntamos tu plan de tratamiento..." 
                                        value={config.wpBudget || 'Hola {paciente}, te enviamos tu presupuesto dental de {clinica}. ¡Quedamos atentos a tus dudas!'} 
                                        onChange={e=>setConfigLocal({...config, wpBudget:e.target.value})} 
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* --- BIOSEGURIDAD Y ESTERILIZACIÓN --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4">
                                <Shield className="text-[#A3968B]"/> Bioseguridad y Caducidad
                            </h3>
                            <p className="text-xs text-[#9A8F84] font-bold mb-6">Ajusta los tiempos de caducidad del material estéril según el protocolo y tipo de envoltorio de tu clínica (Norma MINSAL).</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Tiempo de Caducidad Estéril</label>
                                    <div className="relative">
                                        <select 
                                            className={`${inputClass} cursor-pointer appearance-none`}
                                            value={config.sterilizationDays || 30} 
                                            onChange={e=>setConfigLocal({...config, sterilizationDays: Number(e.target.value)})}
                                        >
                                            <option value={15}>15 Días (Bolsa de Papel Simple)</option>
                                            <option value={30}>30 Días (Manga Mixta Estándar)</option>
                                            <option value={60}>60 Días (Manga Mixta Doble)</option>
                                            <option value={90}>90 Días (Contenedor Rígido con Filtro)</option>
                                            <option value={180}>6 Meses (Empaque Especializado)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* --- HORARIOS DE ATENCIÓN --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-inner">
                            <div className="flex justify-between items-center mb-6 border-b border-[#DFD2C4]/50 pb-4">
                                <div>
                                    <h3 className="font-black text-xl text-[#312923] flex items-center gap-2"><CalendarDays className="text-[#5B6651]"/> Horarios de Atención Online</h3>
                                    <p className="text-xs text-[#9A8F84] font-bold mt-1">Configura los bloques en los que los pacientes podrán agendar automáticamente.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {Object.keys(defaultSchedule).map((day) => (
                                    <div key={day} className={`flex flex-col xl:flex-row items-start xl:items-center gap-4 p-4 rounded-2xl border transition-colors ${schedule[day].active ? 'bg-white border-[#DFD2C4]/80 shadow-sm' : 'bg-stone-50 border-stone-200 opacity-60'}`}>
                                        <div className="flex items-center gap-3 w-40 shrink-0">
                                            <div className={`w-10 h-5 rounded-full flex items-center cursor-pointer transition-colors px-0.5 ${schedule[day].active ? 'bg-[#5B6651]' : 'bg-stone-300'}`} onClick={() => handleScheduleChange(day, 'active', !schedule[day].active)}>
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${schedule[day].active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </div>
                                            <span className={`font-black text-sm ${schedule[day].active ? 'text-[#312923]' : 'text-[#9A8F84]'}`}>{day}</span>
                                        </div>
                                        <div className={`flex flex-wrap md:flex-nowrap items-center gap-3 transition-opacity ${schedule[day].active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                            <div className="flex items-center gap-2 bg-[#FDFBF7] px-3 py-2 rounded-xl border border-[#DFD2C4]/50">
                                                <Clock size={12} className="text-[#A3968B]"/><span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mr-1">Mañana:</span>
                                                <input type="time" className="bg-transparent font-bold text-xs text-[#312923] outline-none" value={schedule[day].start1} onChange={(e) => handleScheduleChange(day, 'start1', e.target.value)} />
                                                <span className="text-[#DFD2C4] font-bold">-</span>
                                                <input type="time" className="bg-transparent font-bold text-xs text-[#312923] outline-none" value={schedule[day].end1} onChange={(e) => handleScheduleChange(day, 'end1', e.target.value)} />
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#FDFBF7] px-3 py-2 rounded-xl border border-[#DFD2C4]/50">
                                                <Clock size={12} className="text-[#A3968B]"/><span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mr-1">Tarde:</span>
                                                <input type="time" className="bg-transparent font-bold text-xs text-[#312923] outline-none" value={schedule[day].start2} onChange={(e) => handleScheduleChange(day, 'start2', e.target.value)} />
                                                <span className="text-[#DFD2C4] font-bold">-</span>
                                                <input type="time" className="bg-transparent font-bold text-xs text-[#312923] outline-none" value={schedule[day].end2} onChange={(e) => handleScheduleChange(day, 'end2', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* --- INFORMACIÓN LEGAL MINSAL --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-6 border-b border-[#DFD2C4]/50 pb-4">
                                <h3 className="font-black text-xl text-[#312923] flex items-center gap-2"><FileSignature className="text-[#5B6651]"/> Información Legal para Recetas</h3>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-[#FDFBF7] border border-[#DFD2C4] px-3 py-1 rounded-full text-[#9A8F84]">Requisito MINSAL</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div><label className={labelClass}>Registro Minsal (RNPI)</label><input className={inputClass} placeholder="N° de Registro" value={config.rnpi || ''} onChange={e=>setConfigLocal({...config, rnpi:e.target.value})} /></div>
                                <div><label className={labelClass}>Universidad de Egreso</label><input className={inputClass} placeholder="Ej: Universidad de Chile" value={config.university || ''} onChange={e=>setConfigLocal({...config, university:e.target.value})} /></div>
                            </div>
                        </Card>

                        {/* --- DIRECTORIO DE LABORATORIOS --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4">
                                <FlaskConical className="text-[#5B6651]"/> Directorio de Laboratorios
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#FDFBF7] p-5 rounded-3xl border border-[#DFD2C4]/50 mb-8 shadow-inner items-end">
                                <div className="md:col-span-4 space-y-1">
                                    <label className={labelClass}>Nombre del Lab</label>
                                    <input className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="Ej: Lab Cerámico Sur" value={newLab.name} onChange={e=>setNewLab({...newLab, name:e.target.value})}/>
                                </div>
                                <div className="md:col-span-4 space-y-1">
                                    <label className={labelClass}>Correo (Acceso Online)</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                        <input className="w-full pl-10 pr-3 py-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="contacto@lab.com" value={newLab.email} onChange={e=>setNewLab({...newLab, email:e.target.value})}/>
                                    </div>
                                </div>
                                <div className="md:col-span-4 space-y-1">
                                    <label className={labelClass}>Teléfono (Opcional)</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                        <input className="w-full pl-10 pr-3 py-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="+56 9..." value={newLab.phone} onChange={e=>setNewLab({...newLab, phone:e.target.value})}/>
                                    </div>
                                </div>
                                <div className="md:col-span-12 mt-2">
                                    <button 
                                        className="w-full h-[50px] bg-[#CBAAA2] hover:bg-[#b09088] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#CBAAA2]/30 flex items-center justify-center gap-2"
                                        onClick={handleAddLab}
                                    >
                                        <Plus size={16}/> Añadir Laboratorio
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className={labelClass}>Laboratorios Registrados ({laboratories.length})</label>
                                {laboratories.length === 0 ? (
                                    <p className="text-xs text-[#9A8F84] font-bold py-4 text-center border-2 border-dashed border-[#DFD2C4] rounded-2xl bg-[#FDFBF7]">Aún no has registrado laboratorios.</p>
                                ) : (
                                    laboratories.map(lab => {
                                        const isPending = !lab.accepted_at;
                                        const lastSent = lab.last_invite_sent_at ? new Date(lab.last_invite_sent_at) : null;
                                        const minutesSinceLastSent = lastSent
                                            ? Math.floor((Date.now() - lastSent.getTime()) / 60000)
                                            : null;
                                        const canResend = minutesSinceLastSent === null || minutesSinceLastSent >= 2;

                                        return (
                                            <div key={lab.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white rounded-2xl border border-[#DFD2C4]/40 hover:border-[#5B6651] transition-all shadow-sm">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-[#5B6651]/10 flex items-center justify-center text-[#5B6651] shrink-0"><FlaskConical size={20}/></div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <p className="font-black text-[#312923] truncate">{lab.name}</p>
                                                            {lab.email && (isPending ? (
                                                                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#D9A86C]/20 text-[#9A6E2C] shrink-0">Pendiente</span>
                                                            ) : (
                                                                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#5B6651]/20 text-[#5B6651] shrink-0">Activo</span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-3 flex-wrap">
                                                            {lab.email && <span className="text-[10px] font-bold text-[#9A8F84] truncate">{lab.email}</span>}
                                                            {lab.phone && <span className="text-[10px] font-bold text-[#9A8F84]">{lab.phone}</span>}
                                                        </div>
                                                        {lab.email && isPending && lab.invited_at && (
                                                            <p className="text-[10px] text-[#9A8F84] mt-1">
                                                                Invitado el {new Date(lab.invited_at).toLocaleDateString('es-CL')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {lab.email && isPending && (
                                                        <button
                                                            onClick={() => handleResendInvite(lab)}
                                                            disabled={!canResend}
                                                            title={canResend ? 'Reenviar invitación' : `Espera ${2 - (minutesSinceLastSent || 0)} min más`}
                                                            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-[#312923] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <Mail size={12}/> Reenviar
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteLab(lab.id)} className="p-2 text-[#DFD2C4] hover:bg-red-50 hover:text-red-500 rounded-lg transition-all" title="Eliminar Laboratorio"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Card>

                        {/* --- GESTIÓN DE EQUIPO --- */}
                        <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                            <h3 className="font-black text-xl text-[#312923] mb-6 flex items-center gap-2 border-b border-[#DFD2C4]/50 pb-4"><Shield className="text-[#CBAAA2]"/> Gestión de Accesos y Equipo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#FDFBF7] p-5 rounded-3xl border border-[#DFD2C4]/50 mb-8 shadow-inner items-end">
                                <div className="md:col-span-3 space-y-1"><label className={labelClass}>Nombre</label><input className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="Nombre completo" value={newMember.name || ''} onChange={e=>setNewMember({...newMember, name:e.target.value})}/></div>
                                <div className="md:col-span-3 space-y-1"><label className={labelClass}>Correo Electrónico</label><input className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="usuario@clinica.com" value={newMember.email || ''} onChange={e=>setNewMember({...newMember, email:e.target.value})}/></div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className={labelClass}>Rol</label>
                                    <select className="w-full p-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors appearance-none cursor-pointer" value={newMember.role || 'dentist'} onChange={e=>setNewMember({...newMember, role:e.target.value})}><option value="admin">Administrador</option><option value="dentist">Dentista</option><option value="assistant">Asistente</option></select>
                                </div>
                                <div className={`md:col-span-2 space-y-1 transition-opacity ${newMember.role === 'dentist' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                    <label className={labelClass}>Comisión %</label>
                                    <div className="relative">
                                        <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                        <input type="number" min="0" max="100" className="w-full pl-9 pr-3 py-3.5 rounded-xl bg-white border border-[#DFD2C4] outline-none font-bold text-sm text-[#312923] focus:border-[#5B6651] transition-colors" placeholder="0" value={newMember.commission || ''} onChange={e=>setNewMember({...newMember, commission: Number(e.target.value)})}/>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <button 
                                        className="w-full h-[50px] bg-[#5B6651] hover:bg-[#4a5442] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#5B6651]/20 flex items-center justify-center gap-2"
                                        onClick={async()=>{
                                            if (!newMember.name || !newMember.email) {
                                                notify("Por favor ingresa un nombre y correo electrónico válidos.");
                                                return;
                                            }
                                            if (!validateEmail(newMember.email)) {
                                                notify("El email ingresado no es válido");
                                                return;
                                            }
                                            const id = Date.now().toString();
                                            const comisionAsignada = newMember.role === 'dentist' ? (newMember.commission || 0) : 0;
                                            const dentistIndex = team.filter(m => m.role === 'admin' || m.role === 'dentist').length;

                                            const u = {
                                                ...newMember,
                                                id,
                                                commission: comisionAsignada,
                                                email: newMember.email.toLowerCase().trim(),
                                                color: TEAM_COLORS[dentistIndex % TEAM_COLORS.length],
                                            };

                                            setTeam([...team, u]);
                                            await saveToSupabase('team', id, u);

                                            const { error } = await supabase.auth.signInWithOtp({ email: u.email, options: { emailRedirectTo: window.location.origin } });
                                            if (error) {
                                                notify("Error enviando invitación: " + error.message);
                                            } else {
                                                setNewMember({ name: '', email: '', role: 'dentist', commission: 0 });
                                                notify("Usuario agregado e Invitación enviada 📩");
                                            }
                                        }}
                                    ><UserPlus size={16}/> Añadir</button>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className={labelClass}>Usuarios Registrados</label>
                                {team.map(member => (
                                    <div key={member.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 bg-white rounded-2xl border border-[#DFD2C4]/40 hover:border-[#A3968B] transition-all shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="color-picker-container relative shrink-0">
                                                <button
                                                    onClick={() => setColorPickerOpenFor(colorPickerOpenFor === member.id ? null : member.id)}
                                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform flex items-center justify-center font-black text-white text-sm"
                                                    style={{ backgroundColor: member.color || '#A3968B' }}
                                                    aria-label="Cambiar color"
                                                >
                                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                </button>

                                                {colorPickerOpenFor === member.id && (
                                                    <div className="absolute z-50 top-12 left-0 bg-white rounded-2xl shadow-xl border border-[#DFD2C4] p-3 min-w-[180px]">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] mb-2 px-1">
                                                            Color del profesional
                                                        </p>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {TEAM_COLORS.map(color => (
                                                                <button
                                                                    key={color}
                                                                    onClick={() => { updateMemberColor(member.id, color); setColorPickerOpenFor(null); }}
                                                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${member.color === color ? 'border-[#312923] scale-110' : 'border-white shadow-sm'}`}
                                                                    style={{ backgroundColor: color }}
                                                                    title={color}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-[#312923]">{member.name}</p>
                                                <p className="text-[10px] font-bold text-[#9A8F84] mt-0.5">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-full border tracking-widest ${member.role === 'admin' ? 'bg-[#5B6651]/10 text-[#5B6651] border-[#5B6651]/20' : member.role === 'dentist' ? 'bg-[#A3968B]/10 text-[#A3968B] border-[#A3968B]/20' : member.role === 'lab' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-[#CBAAA2]/10 text-[#CBAAA2] border-[#CBAAA2]/20'}`}>
                                                    {member.role === 'admin' ? 'Administrador' : member.role === 'dentist' ? 'Odontólogo' : member.role === 'lab' ? 'Laboratorio' : 'Asistente'}
                                                </span>
                                                {member.role === 'dentist' && <span className="text-[9px] font-black text-[#9A8F84] pr-2">Comisión: {member.commission || 0}%</span>}
                                            </div>
                                            <button 
                                                onClick={async()=>{ 
                                                    if(await confirm(`¿Estás seguro de eliminar a ${member.name}? Perderá acceso a la clínica.`)){
                                                        const f = team.filter(t => t.id !== member.id); 
                                                        setTeam(f); 
                                                        await supabase.from('team').update({ deleted_at: new Date().toISOString() }).eq('id', member.id);
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

                        {/* --- MERCADOPAGO --- */}
                        <Card theme={themeMode} className="p-8">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#DFD2C4]/50">
                                <CreditCard size={16} className="text-[#A3968B]"/>
                                <h3 className="font-black text-xl text-[#312923] tracking-tight">Cobros con MercadoPago</h3>
                            </div>

                            {!config?.mp_access_token ? (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-[#9A8F84] leading-relaxed">
                                        Conecta tu cuenta de MercadoPago para cobrar a pacientes al momento de agendar su hora.
                                    </p>
                                    <button
                                        onClick={handleConnectMP}
                                        className="flex items-center gap-3 px-6 py-3.5 bg-[#009ee3] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#007ab8] transition-all shadow-lg shadow-[#009ee3]/20"
                                    >
                                        Conectar MercadoPago
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2 px-4 py-3 bg-[#5B6651]/10 border border-[#5B6651]/20 rounded-2xl w-fit">
                                        <div className="w-2 h-2 rounded-full bg-[#5B6651]"></div>
                                        <span className="text-sm font-black text-[#5B6651]">Cuenta conectada</span>
                                    </div>

                                    <label className="flex items-center justify-between gap-4 p-5 bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl cursor-pointer hover:border-[#A3968B] transition-all">
                                        <div>
                                            <p className="font-black text-[#312923]">Cobro al agendar</p>
                                            <p className="text-xs font-bold text-[#9A8F84] mt-1">Los pacientes deben pagar para confirmar su hora</p>
                                        </div>
                                        <div
                                            onClick={() => updateConfig({ require_payment_at_booking: !(config?.require_payment_at_booking === true || config?.require_payment_at_booking === 'true') })}
                                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${(config?.require_payment_at_booking === true || config?.require_payment_at_booking === 'true') ? 'bg-[#5B6651]' : 'bg-[#DFD2C4]'}`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${(config?.require_payment_at_booking === true || config?.require_payment_at_booking === 'true') ? 'translate-x-6' : 'translate-x-0.5'}`}/>
                                        </div>
                                    </label>

                                    {(config?.require_payment_at_booking === true || config?.require_payment_at_booking === 'true') && (
                                        <div>
                                            <label className={labelClass}>Monto a cobrar (CLP)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#A3968B]">$</span>
                                                <input
                                                    type="number"
                                                    value={config?.appointment_price || ''}
                                                    onChange={(e) => updateConfig({ appointment_price: Number(e.target.value) })}
                                                    className={`${inputClass} pl-8`}
                                                    placeholder="Ej: 30000"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => updateConfig({ mp_access_token: null, require_payment_at_booking: false })}
                                        className="text-[10px] font-black uppercase tracking-widest text-[#CBAAA2] hover:text-red-500 transition-colors"
                                    >
                                        Desconectar cuenta
                                    </button>
                                </div>
                            )}
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