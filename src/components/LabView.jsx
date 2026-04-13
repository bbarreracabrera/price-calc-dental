import React from 'react';
import { FlaskConical, Trash2, Plus, AlertCircle, CheckCircle2, Clock, User, Send, Paperclip } from 'lucide-react';
import { Card } from './UIComponents';
import { supabase } from '../supabase';
import { getLocalDate } from '../constants';

export default function LabView({ 
    themeMode, t, labWorks, setLabWorks, setNewLabWork, setModal, notify, team,
    sendWhatsApp, config 
}) {

    // Normalizador de Status para que la clínica entienda los estados del Kanban
    const getStatusText = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'enviado' || s === 'sent') return 'Enviado';
        if (s === 'recibido' || s === 'received') return 'Recibido por Lab';
        if (s === 'cad_cam') return 'En Diseño CAD/CAM';
        if (s === 'ceramica') return 'En Cerámica';
        if (s === 'listo' || s === 'despachado') return 'Terminado / Despachado';
        return 'Enviado';
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FlaskConical size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Logística Externa</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Control de Laboratorio</h2>
                </div>
                <button 
                    onClick={() => {
                        setNewLabWork({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
                        setModal('labWork');
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                >
                    <Plus size={16}/> Nuevo Trabajo
                </button>
            </div>

            {/* --- TABLA DE TRABAJOS --- */}
            <div className="flex-1 overflow-auto rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white shadow-xl custom-scrollbar relative" style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
                <div className="min-w-[1000px]">
                    
                    {/* Header de Tabla */}
                    <div className="grid grid-cols-12 gap-4 p-5 border-b border-[#DFD2C4]/50 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-30">
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest pl-2">Paciente</div>
                        <div className="col-span-3 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Trabajo y Adjuntos</div>
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Laboratorio</div>
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest text-center">Fechas (Envío / Entrega)</div>
                        <div className="col-span-1 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest text-center">Estado</div>
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest text-right pr-2">Acciones</div>
                    </div>
                    
                    {/* Cuerpo de Tabla */}
                    <div className="flex flex-col">
                        {labWorks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <FlaskConical size={48} className="text-[#A3968B] mb-4"/>
                                <p className="text-sm font-bold uppercase tracking-widest text-[#9A8F84]">No hay trabajos en curso</p>
                            </div>
                        ) : (
                            labWorks.sort((a,b) => new Date(a.expectedDate) - new Date(b.expectedDate)).map(work => {
                                // Aquí nos aseguramos de que el doctor vea el estado real de la DB, o el que tiene guardado localmente
                                const workStatus = work.data?.status || work.status; 
                                const isLate = new Date(work.expectedDate) < new Date() && (workStatus === 'sent' || workStatus === 'enviado');
                                const isReceivedOrProgress = workStatus !== 'sent' && workStatus !== 'enviado';

                                return (
                                    <div key={work.id} className={`grid grid-cols-12 gap-4 p-5 items-center border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors ${isLate ? 'bg-red-50/30' : ''}`}>
                                        
                                        {/* Paciente y Quién Pide */}
                                        <div className="col-span-2 pl-2 flex flex-col justify-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isReceivedOrProgress ? 'bg-[#5B6651]/10 text-[#5B6651]' : isLate ? 'bg-red-100 text-red-500' : 'bg-[#DFD2C4]/30 text-[#A3968B]'}`}>
                                                    {work.patientName.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-black text-[#312923] truncate">{work.patientName}</p>
                                            </div>
                                            {/* HUELLA DIGITAL */}
                                            {work.created_by && (
                                                <div className="flex items-center gap-1 mt-1.5 ml-11 opacity-60">
                                                    <User size={10} className="text-[#A3968B]"/>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-[#A3968B] truncate">
                                                        Ped: {team?.find(m => m.email === work.created_by)?.name || work.created_by.split('@')[0]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Trabajo y Pieza + Archivo Adjunto */}
                                        <div className="col-span-3">
                                            <p className="font-bold text-[#312923] truncate" title={work.workType}>{work.workType}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {work.tooth && (
                                                    <span className="inline-block text-[9px] bg-[#CBAAA2]/10 text-[#CBAAA2] px-2 py-0.5 rounded-full font-black border border-[#CBAAA2]/20">
                                                        Pieza {work.tooth}
                                                    </span>
                                                )}
                                                {work.file_url && (
                                                    <a href={work.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded-full font-black border border-indigo-200 transition-colors" title={work.file_name}>
                                                        <Paperclip size={10}/> Archivo Adjunto
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Laboratorio */}
                                        <div className="col-span-2">
                                            <p className="text-sm font-bold text-[#6B615A] truncate">{work.labName || 'No especificado'}</p>
                                        </div>
                                        
                                        {/* Fechas */}
                                        <div className="col-span-2 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">{work.sendDate.split('-').reverse().join('/')}</span>
                                                <span className="text-stone-300 my-0.5">|</span>
                                                <div className={`flex items-center gap-1 text-[11px] font-black ${isLate ? 'text-red-500' : isReceivedOrProgress ? 'text-[#5B6651]' : 'text-[#312923]'}`}>
                                                    {isLate && <AlertCircle size={12}/>}
                                                    <span>{work.expectedDate.split('-').reverse().join('/')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Estado */}
                                        <div className="col-span-1 flex justify-center">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${workStatus === 'listo' || workStatus === 'despachado' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : isReceivedOrProgress ? 'bg-blue-100 text-blue-600 border border-blue-200' : isLate ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                                {isReceivedOrProgress ? <CheckCircle2 size={12}/> : isLate ? <AlertCircle size={12}/> : <Clock size={12}/>}
                                                <span className="hidden xl:inline">{getStatusText(workStatus)}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Acciones */}
                                        <div className="col-span-2 pr-2 flex items-center justify-end gap-2">
                                            
                                            {/* NUEVO BOTÓN: Enviar WhatsApp */}
                                            <button 
                                                onClick={() => {
                                                    const labData = config?.laboratories?.find(l => l.name === work.labName);
                                                    const labPhone = labData ? labData.phone : null;

                                                    let message = `Hola${work.labName ? ` ${work.labName}` : ''}, te enviamos una nueva orden de trabajo clínico desde *${config?.name || 'la clínica'}*.\n\n`;
                                                    message += `🦷 *Trabajo Solicitado:* ${work.workType}\n`;
                                                    if (work.tooth) message += `📍 *Pieza Dental:* ${work.tooth}\n`;
                                                    message += `🗓️ *Fecha Esperada:* ${work.expectedDate.split('-').reverse().join('/')}\n\n`;
                                                    
                                                    if (work.file_url) {
                                                        message += `📁 *Archivo Adjunto (Rx / Escáner 3D):*\n${work.file_url}\n\n`;
                                                    }
                                                    
                                                    message += `Por favor revisar en tu panel técnico. ¡Saludos!`;

                                                    if(labPhone) {
                                                        sendWhatsApp(labPhone, message);
                                                    } else {
                                                        const manualPhone = window.prompt("No tenemos el teléfono de este laboratorio. Ingrésalo a continuación para enviar:");
                                                        if (manualPhone) sendWhatsApp(manualPhone, message);
                                                    }
                                                }}
                                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl shadow-sm border border-emerald-200 hover:border-emerald-500 transition-all"
                                                title="Avisar por WhatsApp"
                                            >
                                                <Send size={16}/>
                                            </button>

                                            {!isReceivedOrProgress && (
                                                <button onClick={async () => {
                                                    const updated = { ...work, status: 'received' };
                                                    setLabWorks(labWorks.map(w => w.id === work.id ? updated : w));
                                                    await supabase.from('lab_works').update({ status: 'received' }).eq('id', work.id);
                                                    notify("Trabajo marcado como RECIBIDO");
                                                }} 
                                                className="p-2 bg-[#5B6651] text-white rounded-xl shadow-md hover:-translate-y-0.5 transition-all"
                                                title="Marcar Recepción Manual">
                                                    <CheckCircle2 size={16}/>
                                                </button>
                                            )}
                                            
                                            <button onClick={async () => {
                                                if(window.confirm("¿Seguro que deseas eliminar este registro?")){
                                                    setLabWorks(labWorks.filter(w => w.id !== work.id));
                                                    await supabase.from('lab_works').delete().eq('id', work.id);
                                                }
                                            }} 
                                            className="p-2 text-[#DFD2C4] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Eliminar Registro">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                        
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}