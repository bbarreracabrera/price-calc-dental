import React, { useState, useEffect } from 'react';
import { FlaskConical, Clock, CheckCircle2, Truck, AlertCircle, Building2, Calendar, MonitorPlay, Droplets, PaintBucket, ArrowRight, UserCircle, FileText, Users, Lock, DollarSign } from 'lucide-react';
import { Card } from './UIComponents';

export default function LabDashboard({ config, supabase, notify, session, clinicOwner }) {
    const [labJobs, setLabJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    // NUEVO ESTADO: Navegación del Lab
    const [activeTab, setActiveTab] = useState('kanban'); 

    const today = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('es-CL', dateOptions);

    useEffect(() => {
        fetchRealJobs();
    }, []);

    const fetchRealJobs = async () => {
        setLoading(true);
        const labEmail = session?.user?.email;
        if (!labEmail) { setLoading(false); return; }
        const { data, error } = await supabase.from('lab_works').select('*').eq('lab_email', labEmail);
        if (error) {
            notify("Error conectando con el servidor");
        } else if (data) {
            const formatted = data.map(job => {
                const d = job.data || {};
                return {
                    id: job.id,
                    dbId: job.id,
                    clinic: job.admin_email || 'Clínica Asociada',
                    patient: d.patientName || job.patientName || 'Anónimo',
                    type: d.workType || job.workType || 'Trabajo Prótesico',
                    shade: d.shade || 'N/A',
                    notes: d.notes || '',
                    dueDate: d.expectedDate || job.expectedDate || 'Sin fecha',
                    status: normalizeStatus(d.status || job.status),
                    tooth: d.tooth || job.tooth || '',
                };
            });
            setLabJobs(formatted);
        }
        setLoading(false);
    };

    const normalizeStatus = (status) => {
        const s = status?.toLowerCase();
        if (s === 'sent' || s === 'enviado' || s === 'recibido' || s === 'received') return 'recibido';
        if (s === 'cad_cam') return 'cad_cam';
        if (s === 'ceramica') return 'ceramica';
        if (s === 'listo' || s === 'terminado' || s === 'despachado') return 'listo';
        return 'recibido';
    };

    const updateJobStatus = async (id, newStatus) => {
        setLabJobs(jobs => jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
        notify(`Avanzando a: ${newStatus.replace('_', ' ').toUpperCase()}`);
        
        try {
            const jobToUpdate = labJobs.find(j => j.id === id);
            if (!jobToUpdate) return;
            const { data: currentData } = await supabase.from('lab_works').select('data').eq('id', jobToUpdate.dbId).single();
            if (currentData) {
                const updatedJson = { ...currentData.data, status: newStatus };
                await supabase.from('lab_works').update({ data: updatedJson, status: newStatus }).eq('id', jobToUpdate.dbId);
            }
        } catch (err) { console.error(err); }
    };

    const formatDueDate = (dueDate) => {
        if (!dueDate || typeof dueDate !== 'string') return 'Sin fecha';
        if (!dueDate.includes('-')) return dueDate;
        return dueDate.split('-').reverse().join('/');
    };

    const columns = [
        { id: 'recibido',   title: 'Nuevos / Recibidos',    icon: AlertCircle,  color: 'border-amber-200 bg-amber-50',     textColor: 'text-amber-600',   nextStatus: 'cad_cam',    btnText: 'A Diseño CAD' },
        { id: 'cad_cam',    title: 'Diseño & Fresado',       icon: MonitorPlay,  color: 'border-blue-200 bg-blue-50',       textColor: 'text-blue-600',    nextStatus: 'ceramica',   btnText: 'A Cerámica' },
        { id: 'ceramica',   title: 'Cerámica / Terminado',   icon: PaintBucket,  color: 'border-purple-200 bg-purple-50',   textColor: 'text-purple-600',  nextStatus: 'listo',      btnText: 'Aprobado' },
        { id: 'listo',      title: 'Control & Despacho',     icon: CheckCircle2, color: 'border-emerald-200 bg-emerald-50', textColor: 'text-emerald-600', nextStatus: 'despachado', btnText: 'Despachado' },
        { id: 'despachado', title: 'Despachado',             icon: Truck,        color: 'border-[#CBAAA2]/30 bg-[#CBAAA2]/10', textColor: 'text-[#CBAAA2]', nextStatus: null,        btnText: null },
    ];

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO Y NAVEGACIÓN LAB --- */}
            <div className="bg-white border border-[#DFD2C4]/50 rounded-[2rem] p-6 shadow-sm shrink-0">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FlaskConical size={14} className="text-blue-500"/>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Lab Partner Portal</p>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#312923] tracking-tighter">Panel Técnico</h1>
                    </div>

                    {/* Menú de Pestañas del Laboratorio */}
                    <div className="flex gap-2 bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4]/50 w-fit overflow-x-auto">
                        <button onClick={() => setActiveTab('kanban')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'kanban' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-[#9A8F84] hover:text-[#312923]'}`}>
                            <AlertCircle size={14}/> Trabajos
                        </button>
                        <button onClick={() => setActiveTab('arancel')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'arancel' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-[#9A8F84] hover:text-[#312923]'}`}>
                            <DollarSign size={14}/> Mi Arancel
                        </button>
                        <button onClick={() => setActiveTab('clinicas')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'clinicas' ? 'bg-white text-purple-600 shadow-sm border border-purple-100' : 'text-[#9A8F84] hover:text-[#312923]'}`}>
                            <Users size={14}/> Mis Clínicas
                        </button>
                    </div>
                </div>
            </div>

            {/* --- VISTA: KANBAN DE TRABAJOS --- */}
            {activeTab === 'kanban' && (
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    {loading ? (
                        <div className="w-full flex items-center justify-center p-20 text-[#9A8F84] font-bold">
                            <Droplets size={24} className="animate-bounce mr-2"/> Sincronizando órdenes...
                        </div>
                    ) : columns.map(col => {
                        const columnJobs = labJobs.filter(job => job.status === col.id);
                        
                        return (
                            <div key={col.id} className="flex-1 min-w-[320px] bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-3xl p-4 flex flex-col max-h-full">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg border ${col.color}`}><col.icon size={16} className={col.textColor} /></div>
                                        <h3 className="font-black text-[#312923] text-lg tracking-tight">{col.title}</h3>
                                    </div>
                                    <span className="bg-white border border-[#DFD2C4] text-[#6B615A] text-xs font-black px-2.5 py-1 rounded-full shadow-sm">{columnJobs.length}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                    {columnJobs.length === 0 ? (
                                        <div className="h-24 border-2 border-dashed border-[#DFD2C4] rounded-2xl flex items-center justify-center text-[#9A8F84] text-[10px] font-black uppercase tracking-widest bg-white/50">
                                            Vacío
                                        </div>
                                    ) : (
                                        columnJobs.map(job => (
                                            <Card key={job.id} className="p-4 bg-white border border-[#DFD2C4] shadow-sm hover:shadow-md hover:border-[#5B6651] transition-all group">
                                                
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 py-0.5 rounded-md border border-[#DFD2C4]/50">
                                                        ID: {job.id.substring(0,6)}
                                                    </span>
                                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                                                        <Clock size={10}/> {formatDueDate(job.dueDate)}
                                                    </span>
                                                </div>

                                                <h4 className="font-black text-[#312923] text-base leading-tight mb-2">{job.type}</h4>
                                                
                                                {/* NUEVO: Etiquetas de Pieza y Color integradas */}
                                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3">
                                                    {job.tooth && <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md">Pz: {job.tooth}</span>}
                                                    {job.shade && job.shade !== 'N/A' && <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-md">Color: {job.shade}</span>}
                                                </div>

                                                {/* NUEVO: Notas Clínicas */}
                                                {job.notes && (
                                                    <div className="mb-3 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-600 italic">
                                                        "{job.notes}"
                                                    </div>
                                                )}

                                                <div className="border-t border-[#DFD2C4]/40 pt-3 mb-4 flex items-center justify-between text-[11px] font-bold text-[#6B615A]">
                                                    <span className="flex items-center gap-1 truncate max-w-[120px]"><Building2 size={12} className="text-[#9A8F84] shrink-0"/> {job.clinic}</span>
                                                    <span className="flex items-center gap-1 text-[#9A8F84] shrink-0" title="Privacidad Activada"><UserCircle size={12}/> Ref: {job.patient.substring(0,3)}***</span>
                                                </div>

                                                {col.nextStatus && (
                                                    <button
                                                        onClick={() => updateJobStatus(job.id, col.nextStatus)}
                                                        className="w-full py-2.5 bg-[#FDFBF7] border border-[#DFD2C4] text-[#5B6651] hover:bg-[#5B6651] hover:text-white hover:border-[#5B6651] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {col.id === 'listo' && <Truck size={14}/>}
                                                        {col.btnText}
                                                        {col.id !== 'listo' && <ArrowRight size={14}/>}
                                                    </button>
                                                )}
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- VISTA: MI ARANCEL (Próximamente) --- */}
            {activeTab === 'arancel' && (
                <div className="flex-1 bg-white border border-[#DFD2C4]/50 rounded-[2rem] flex flex-col items-center justify-center p-10 text-center shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                        <DollarSign size={40}/>
                    </div>
                    <h2 className="text-3xl font-black text-[#312923] tracking-tighter mb-3">Tu Arancel Digital</h2>
                    <p className="text-[#6B615A] font-medium max-w-md mx-auto mb-8">
                        Próximamente podrás cargar tu lista de precios de laboratorio. Las clínicas asociadas verán estos valores automáticamente al generar una orden de trabajo.
                    </p>
                    <button className="px-8 py-3 bg-[#DFD2C4]/30 text-[#9A8F84] font-black text-[11px] uppercase tracking-widest rounded-xl cursor-not-allowed border border-[#DFD2C4]">
                        Módulo en Desarrollo
                    </button>
                </div>
            )}

            {/* --- VISTA: CLÍNICAS ASOCIADAS (El Plan Pro del Laboratorio) --- */}
            {activeTab === 'clinicas' && (
                <div className="flex-1 bg-white border border-[#DFD2C4]/50 rounded-[2rem] flex flex-col items-center justify-center p-10 text-center shadow-sm relative overflow-hidden">
                    {/* Efecto visual de fondo */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
                    
                    <div className="relative z-10 w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-6 border border-purple-100">
                        <Users size={40}/>
                    </div>
                    <h2 className="relative z-10 text-3xl font-black text-[#312923] tracking-tighter mb-3">Gestión de Clientes</h2>
                    <p className="relative z-10 text-[#6B615A] font-medium max-w-lg mx-auto mb-8">
                        Actualmente gestionas las órdenes de las clínicas que te invitaron a ShiningCloud de forma gratuita. ¿Quieres centralizar a <strong className="text-purple-600">todos tus clientes</strong> aunque no usen la plataforma?
                    </p>
                    
                    <div className="relative z-10 bg-gradient-to-br from-[#312923] to-[#1a1512] p-8 rounded-3xl text-white max-w-md w-full shadow-2xl border border-stone-700">
                        <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-1">
                            <Lock size={12}/> Plan Pro Lab
                        </div>
                        <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-2">
                            ShiningCloud <span className="text-[#CBAAA2]">Lab Pro</span>
                        </h3>
                        <ul className="text-sm font-medium text-stone-300 space-y-3 mb-8 text-left">
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Agrega clínicas manualmente.</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Crea órdenes de trabajo externas.</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Estadísticas de ingresos por clínica.</li>
                        </ul>
                        <button className="w-full py-3.5 bg-white text-[#312923] hover:bg-[#FDFBF7] rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
                            Mejorar mi Plan
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}