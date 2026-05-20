import React, { useState, useMemo } from 'react';
import { FlaskConical, Clock, CheckCircle2, Truck, AlertCircle, Building2, MonitorPlay, Droplets, PaintBucket, ArrowRight, UserCircle, Users, Lock, DollarSign } from 'lucide-react';
import { Card } from './UIComponents';
import { useLabData } from '../hooks/useLabData';
import MyPricingTab from './lab/MyPricingTab';
import MyClinicsTab from './lab/MyClinicsTab';
import JobDetailModal from './lab/JobDetailModal';

export default function LabDashboard({ config, supabase, notify, session, clinicOwner }) {
    const [activeTab, setActiveTab] = useState('kanban');
    const [detailJob, setDetailJob] = useState(null);

    const { jobs, pricing, isLoading, refreshJobs, refreshPricing } = useLabData(session);

    const normalizeStatus = (status) => {
        const valid = ['recibido', 'cad_cam', 'ceramica', 'listo', 'despachado'];
        return valid.includes(status) ? status : 'recibido';
    };

    const kanbanStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().slice(0, 10);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        let receivedToday = 0;
        let inProgress = 0;
        let dueThisWeek = 0;

        jobs.forEach(job => {
            if (job.created_at?.slice(0, 10) === todayStr) receivedToday++;
            if (job.status !== 'despachado') inProgress++;
            if (job.expectedDate) {
                const exp = new Date(job.expectedDate);
                if (exp >= today && exp <= weekFromNow && job.status !== 'despachado') dueThisWeek++;
            }
        });

        return { receivedToday, inProgress, dueThisWeek };
    }, [jobs]);

    const updateJobStatus = async (jobId, newStatus) => {
        const job = jobs.find(j => j.id === jobId);
        const existingData = job?.data || {};

        const { error } = await supabase
            .from('lab_works')
            .update({
                status: newStatus,
                data: { ...existingData, status: newStatus },
            })
            .eq('id', jobId);

        if (error) {
            notify('Error al actualizar estado');
            return;
        }

        notify(`Avanzando a: ${newStatus.replace('_', ' ').toUpperCase()}`);
        refreshJobs();
    };

    const formatDueDate = (dueDate) => {
        if (!dueDate || typeof dueDate !== 'string') return 'Sin fecha';
        if (!dueDate.includes('-')) return dueDate;
        return dueDate.split('-').reverse().join('/');
    };

    const columns = [
        { id: 'recibido',   title: 'Nuevos / Recibidos',    icon: AlertCircle,  color: 'border-amber-200 bg-amber-50',        textColor: 'text-amber-600',   nextStatus: 'cad_cam',    btnText: 'A Diseño CAD' },
        { id: 'cad_cam',    title: 'Diseño & Fresado',       icon: MonitorPlay,  color: 'border-blue-200 bg-blue-50',          textColor: 'text-blue-600',    nextStatus: 'ceramica',   btnText: 'A Cerámica' },
        { id: 'ceramica',   title: 'Cerámica / Terminado',   icon: PaintBucket,  color: 'border-purple-200 bg-purple-50',      textColor: 'text-purple-600',  nextStatus: 'listo',      btnText: 'Aprobado' },
        { id: 'listo',      title: 'Control & Despacho',     icon: CheckCircle2, color: 'border-emerald-200 bg-emerald-50',    textColor: 'text-emerald-600', nextStatus: 'despachado', btnText: 'Despachado' },
        { id: 'despachado', title: 'Despachado',             icon: Truck,        color: 'border-[#CBAAA2]/30 bg-[#CBAAA2]/10', textColor: 'text-[#CBAAA2]',  nextStatus: null,         btnText: null },
    ];

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-10">

            {/* ENCABEZADO */}
            <div className="bg-white border border-[#DFD2C4]/50 rounded-[2rem] p-6 shadow-sm shrink-0">
                <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <FlaskConical size={14} className="text-blue-500"/>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Lab Partner Portal</p>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#312923] tracking-tighter mb-4">Panel Técnico</h1>

                        {/* Stats del kanban */}
                        {!isLoading && (
                            <div className="grid grid-cols-3 gap-3">
                                <StatCard label="Recibidos hoy"      value={kanbanStats.receivedToday} color="#5B6651" />
                                <StatCard label="En curso"           value={kanbanStats.inProgress}    color="#312923" />
                                <StatCard label="Vencen esta semana" value={kanbanStats.dueThisWeek}   color="#D9A86C" />
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4]/50 w-fit overflow-x-auto shrink-0">
                        <TabBtn active={activeTab === 'kanban'}   onClick={() => setActiveTab('kanban')}   icon={<AlertCircle size={14}/>}  label="Trabajos"    activeColor="text-blue-600 border-blue-100" />
                        <TabBtn active={activeTab === 'arancel'}  onClick={() => setActiveTab('arancel')}  icon={<DollarSign size={14}/>}   label="Mi Arancel"  activeColor="text-emerald-600 border-emerald-100" />
                        <TabBtn active={activeTab === 'clinicas'} onClick={() => setActiveTab('clinicas')} icon={<Users size={14}/>}        label="Mis Clínicas" activeColor="text-purple-600 border-purple-100" />
                    </div>
                </div>
            </div>

            {/* KANBAN */}
            {activeTab === 'kanban' && (
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="w-full flex items-center justify-center p-20 text-[#9A8F84] font-bold">
                            <Droplets size={24} className="animate-bounce mr-2"/> Sincronizando órdenes...
                        </div>
                    ) : columns.map(col => {
                        const columnJobs = jobs.filter(job => normalizeStatus(job.status) === col.id);

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
                                    ) : columnJobs.map(job => (
                                        <Card
                                            key={job.id}
                                            onClick={() => setDetailJob(job)}
                                            className="p-4 bg-white border border-[#DFD2C4] shadow-sm hover:shadow-md hover:border-[#5B6651] transition-all group cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 py-0.5 rounded-md border border-[#DFD2C4]/50">
                                                    ID: {job.id.substring(0, 6)}
                                                </span>
                                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                                                    <Clock size={10}/> {formatDueDate(job.expectedDate)}
                                                </span>
                                            </div>

                                            <h4 className="font-black text-[#312923] text-base leading-tight mb-2">{job.workType || 'Trabajo Protésico'}</h4>

                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3">
                                                {job.tooth && <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md">Pz: {job.tooth}</span>}
                                                {job.shade && job.shade !== 'N/A' && <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-md">Color: {job.shade}</span>}
                                            </div>

                                            {job.notes && (
                                                <div className="mb-3 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-600 italic line-clamp-2">
                                                    "{job.notes}"
                                                </div>
                                            )}

                                            <div className="border-t border-[#DFD2C4]/40 pt-3 mb-4 flex items-center justify-between text-[11px] font-bold text-[#6B615A]">
                                                <span className="flex items-center gap-1 truncate max-w-[120px]"><Building2 size={12} className="text-[#9A8F84] shrink-0"/> {job.admin_email || 'Clínica Asociada'}</span>
                                                <span className="flex items-center gap-1 text-[#9A8F84] shrink-0" title="Privacidad Activada"><UserCircle size={12}/> Ref: {(job.patientName || 'Anónimo').substring(0, 3)}***</span>
                                            </div>

                                            {col.nextStatus && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); updateJobStatus(job.id, col.nextStatus); }}
                                                    className="w-full py-2.5 bg-[#FDFBF7] border border-[#DFD2C4] text-[#5B6651] hover:bg-[#5B6651] hover:text-white hover:border-[#5B6651] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    {col.id === 'listo' && <Truck size={14}/>}
                                                    {col.btnText}
                                                    {col.id !== 'listo' && <ArrowRight size={14}/>}
                                                </button>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MI ARANCEL */}
            {activeTab === 'arancel' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <MyPricingTab
                        pricing={pricing}
                        refreshPricing={refreshPricing}
                        notify={notify}
                        session={session}
                    />
                </div>
            )}

            {/* MIS CLÍNICAS */}
            {activeTab === 'clinicas' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <MyClinicsTab jobs={jobs} />
                </div>
            )}

            {/* MODAL DETALLE */}
            {detailJob && (
                <JobDetailModal
                    job={detailJob}
                    onClose={() => setDetailJob(null)}
                    onUpdateStatus={(id, status) => {
                        updateJobStatus(id, status);
                        setDetailJob(null);
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#9A8F84] font-black mb-1">{label}</p>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
        </div>
    );
}

function TabBtn({ active, onClick, icon, label, activeColor }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${active ? `bg-white shadow-sm border ${activeColor}` : 'text-[#9A8F84] hover:text-[#312923]'}`}
        >
            {icon} {label}
        </button>
    );
}
