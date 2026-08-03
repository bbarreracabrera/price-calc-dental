import React from 'react';
import { FlaskConical, Trash2, Plus, AlertCircle, CheckCircle2, Clock, User, Send, Paperclip } from 'lucide-react';
import { Card, SecureFileLink } from './UIComponents';
import { supabase } from '../supabase';
import { getLocalDate } from '../constants';
import { getSecureUrl } from '../utils/securityFixes';
import { useDialog } from './DialogProvider';

export default function LabView({ 
    themeMode, t, labWorks, setLabWorks, setNewLabWork, setModal, notify, team,
    sendWhatsApp, config
}) {
    const { confirm, prompt } = useDialog();

    const getStatusText = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'enviado' || s === 'sent') return 'Enviado';
        if (s === 'recibido' || s === 'received') return 'Recibido por Lab';
        if (s === 'cad_cam') return 'En Diseño CAD/CAM';
        if (s === 'ceramica') return 'En Cerámica';
        if (s === 'listo' || s === 'despachado') return 'Terminado / Despachado';
        return 'Enviado';
    };

    const getStatusStyle = (workStatus, isLate, isReceivedOrProgress) => {
        if (workStatus === 'listo' || workStatus === 'despachado') return 'bg-emerald-100 text-emerald-600 border border-emerald-200';
        if (isReceivedOrProgress) return 'bg-blue-100 text-blue-600 border border-blue-200';
        if (isLate) return 'bg-red-100 text-red-600 border border-red-200';
        return 'bg-amber-100 text-amber-600 border border-amber-200';
    };

    const sortedWorks = [...labWorks].sort((a,b) => new Date(a.expectedDate) - new Date(b.expectedDate));

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-4 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FlaskConical size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Logística Externa</p>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#312923] tracking-tighter">Control de Laboratorio</h2>
                </div>
                <button 
                    onClick={() => {
                        setNewLabWork({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
                        setModal('labWork');
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 w-full sm:w-auto justify-center"
                >
                    <Plus size={16}/> Nuevo Trabajo
                </button>
            </div>

            {/* --- VISTA MÓVIL: Cards --- */}
            <div className="flex flex-col gap-4 lg:hidden">
                {sortedWorks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-50">
                        <FlaskConical size={40} className="text-[#A3968B] mb-3"/>
                        <p className="text-sm font-bold uppercase tracking-widest text-[#9A8F84]">No hay trabajos en curso</p>
                    </div>
                ) : (
                    sortedWorks.map(work => {
                        const workStatus = work.data?.status || work.status;
                        const isLate = new Date(work.expectedDate) < new Date() && (workStatus === 'sent' || workStatus === 'enviado');
                        const isReceivedOrProgress = workStatus !== 'sent' && workStatus !== 'enviado';

                        return (
                            <div key={work.id} className={`bg-white border rounded-[1.5rem] p-4 shadow-sm ${isLate ? 'border-red-200 bg-red-50/20' : 'border-[#DFD2C4]/60'}`}>
                                {/* Header de la card */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isReceivedOrProgress ? 'bg-[#5B6651]/10 text-[#5B6651]' : isLate ? 'bg-red-100 text-red-500' : 'bg-[#DFD2C4]/30 text-[#A3968B]'}`}>
                                            {work.patientName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#312923] text-sm">{work.patientName}</p>
                                            <p className="text-[10px] font-bold text-[#9A8F84] truncate max-w-[160px]">{work.workType}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${getStatusStyle(workStatus, isLate, isReceivedOrProgress)}`}>
                                        {isReceivedOrProgress ? <CheckCircle2 size={10}/> : isLate ? <AlertCircle size={10}/> : <Clock size={10}/>}
                                        <span>{getStatusText(workStatus)}</span>
                                    </div>
                                </div>

                                {/* Detalles */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-[#FDFBF7] rounded-xl p-2.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] mb-0.5">Laboratorio</p>
                                        <p className="text-xs font-bold text-[#312923] truncate">{work.labName || 'No especificado'}</p>
                                    </div>
                                    <div className="bg-[#FDFBF7] rounded-xl p-2.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] mb-0.5">Entrega</p>
                                        <p className={`text-xs font-black ${isLate ? 'text-red-500' : 'text-[#312923]'}`}>
                                            {work.expectedDate?.split('-').reverse().join('/') || '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Adjuntos y pieza */}
                                {(work.tooth || work.file_url) && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {work.tooth && (
                                            <span className="inline-block text-[9px] bg-[#CBAAA2]/10 text-[#CBAAA2] px-2 py-0.5 rounded-full font-black border border-[#CBAAA2]/20">
                                                Pieza {work.tooth}
                                            </span>
                                        )}
                                        {work.file_url && (
                                            <SecureFileLink bucket="lab-work-files" filePath={work.file_url} fileName={work.file_name} />
                                        )}
                                        {work.data?.file_count > 1 && (
                                            <span className="text-[9px] font-black text-[#9A8F84] bg-[#FDFBF7] px-2 py-0.5 rounded-full border border-[#DFD2C4]">
                                                +{work.data.file_count - 1} más
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="flex items-center gap-2 pt-3 border-t border-[#DFD2C4]/40">
                                    <button 
                                        onClick={async () => {
                                            const labData = config?.laboratories?.find(l => l.name === work.labName);
                                            const labPhone = labData ? labData.phone : null;
                                            let message = `Hola${work.labName ? ` ${work.labName}` : ''}, nueva orden desde *${config?.name || 'la clínica'}*.\n🦷 *Trabajo:* ${work.workType}\n🗓️ *Entrega:* ${work.expectedDate?.split('-').reverse().join('/')}`;
                                            if(labPhone) { sendWhatsApp(labPhone, message); }
                                            else { const p = await prompt("Teléfono del laboratorio:"); if(p) sendWhatsApp(p, message); }
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 transition-all"
                                    >
                                        <Send size={13}/> WhatsApp
                                    </button>
                                    {!isReceivedOrProgress && (
                                        <button onClick={async () => {
                                            const updated = { ...work, status: 'received' };
                                            setLabWorks(labWorks.map(w => w.id === work.id ? updated : w));
                                            await supabase.from('lab_works').update({ status: 'received' }).eq('id', work.id);
                                            notify("Trabajo marcado como RECIBIDO");
                                        }} 
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#5B6651] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            <CheckCircle2 size={13}/> Recibido
                                        </button>
                                    )}
                                    <button onClick={async () => {
                                        if(await confirm("¿Eliminar este registro?")) {
                                            setLabWorks(labWorks.filter(w => w.id !== work.id));
                                            await supabase.from('lab_works').update({ deleted_at: new Date().toISOString() }).eq('id', work.id);
                                        }
                                    }} className="p-2 text-[#DFD2C4] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- VISTA DESKTOP: Tabla --- */}
            <div className="hidden lg:block flex-1 overflow-auto rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white shadow-xl custom-scrollbar relative">
                <div className="min-w-[900px]">
                    <div className="grid grid-cols-12 gap-4 p-5 border-b border-[#DFD2C4]/50 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-30">
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest pl-2">Paciente</div>
                        <div className="col-span-3 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Trabajo y Adjuntos</div>
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Laboratorio</div>
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest text-center">Fechas</div>
                        <div className="col-span-1 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest text-center">Estado</div>
                        <div className="col-span-2 text-[10px] font-black text-[#9A8F84] uppercase tracking-widest text-right pr-2">Acciones</div>
                    </div>
                    <div className="flex flex-col">
                        {sortedWorks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <FlaskConical size={48} className="text-[#A3968B] mb-4"/>
                                <p className="text-sm font-bold uppercase tracking-widest text-[#9A8F84]">No hay trabajos en curso</p>
                            </div>
                        ) : (
                            sortedWorks.map(work => {
                                const workStatus = work.data?.status || work.status;
                                const isLate = new Date(work.expectedDate) < new Date() && (workStatus === 'sent' || workStatus === 'enviado');
                                const isReceivedOrProgress = workStatus !== 'sent' && workStatus !== 'enviado';

                                return (
                                    <div key={work.id} className={`grid grid-cols-12 gap-4 p-5 items-center border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors ${isLate ? 'bg-red-50/30' : ''}`}>
                                        <div className="col-span-2 pl-2 flex flex-col justify-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isReceivedOrProgress ? 'bg-[#5B6651]/10 text-[#5B6651]' : isLate ? 'bg-red-100 text-red-500' : 'bg-[#DFD2C4]/30 text-[#A3968B]'}`}>
                                                    {work.patientName.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-black text-[#312923] truncate text-sm">{work.patientName}</p>
                                            </div>
                                            {work.created_by && (
                                                <div className="flex items-center gap-1 mt-1.5 ml-11 opacity-60">
                                                    <User size={10} className="text-[#A3968B]"/>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-[#A3968B] truncate">
                                                        {team?.find(m => m.email === work.created_by)?.name || work.created_by.split('@')[0]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-3">
                                            <p className="font-bold text-[#312923] truncate text-sm" title={work.workType}>{work.workType}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {work.tooth && <span className="inline-block text-[9px] bg-[#CBAAA2]/10 text-[#CBAAA2] px-2 py-0.5 rounded-full font-black border border-[#CBAAA2]/20">Pieza {work.tooth}</span>}
                                                {work.file_url && <SecureFileLink bucket="lab-work-files" filePath={work.file_url} fileName={work.file_name} />}
                                            {work.data?.file_count > 1 && (
                                                <span className="text-[9px] font-black text-[#9A8F84] bg-[#FDFBF7] px-2 py-0.5 rounded-full border border-[#DFD2C4] ml-1">
                                                    +{work.data.file_count - 1} archivos adicionales
                                                </span>
                                            )}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm font-bold text-[#6B615A] truncate">{work.labName || 'No especificado'}</p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">{work.sendDate?.split('-').reverse().join('/')}</span>
                                                <span className="text-stone-300 my-0.5">|</span>
                                                <div className={`flex items-center gap-1 text-[11px] font-black ${isLate ? 'text-red-500' : isReceivedOrProgress ? 'text-[#5B6651]' : 'text-[#312923]'}`}>
                                                    {isLate && <AlertCircle size={12}/>}
                                                    <span>{work.expectedDate?.split('-').reverse().join('/')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(workStatus, isLate, isReceivedOrProgress)}`}>
                                                {isReceivedOrProgress ? <CheckCircle2 size={12}/> : isLate ? <AlertCircle size={12}/> : <Clock size={12}/>}
                                                <span className="hidden xl:inline">{getStatusText(workStatus)}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 pr-2 flex items-center justify-end gap-2">
                                            <button 
                                                onClick={async () => {
                                                    const labData = config?.laboratories?.find(l => l.name === work.labName);
                                                    const labPhone = labData ? labData.phone : null;
                                                    let message = `Hola${work.labName ? ` ${work.labName}` : ''}, te enviamos una nueva orden desde *${config?.name || 'la clínica'}*.\n🦷 *Trabajo:* ${work.workType}\n🗓️ *Entrega:* ${work.expectedDate?.split('-').reverse().join('/')}`;
                                                    if(labPhone) { sendWhatsApp(labPhone, message); }
                                                    else { const p = await prompt("Teléfono del laboratorio:"); if(p) sendWhatsApp(p, message); }
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
                                                title="Marcar Recepción">
                                                    <CheckCircle2 size={16}/>
                                                </button>
                                            )}
                                            <button onClick={async () => {
                                                if(await confirm("¿Eliminar este registro?")) {
                                                    setLabWorks(labWorks.filter(w => w.id !== work.id));
                                                    await supabase.from('lab_works').update({ deleted_at: new Date().toISOString() }).eq('id', work.id);
                                                }
                                            }} className="p-2 text-[#DFD2C4] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
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
