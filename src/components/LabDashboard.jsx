import React, { useState, useEffect } from 'react';
import { FlaskConical, Clock, CheckCircle2, Truck, AlertCircle, Building2, Calendar, MonitorPlay, Droplets, PaintBucket, ArrowRight, UserCircle } from 'lucide-react';
import { Card } from './UIComponents';

export default function LabDashboard({ config, supabase, notify }) {
    const [labJobs, setLabJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('es-CL', dateOptions);

    // 1. CARGAR DATOS REALES DE SUPABASE
    useEffect(() => {
        fetchRealJobs();
    }, []);

    const fetchRealJobs = async () => {
        setLoading(true);
        // Supabase solo le devolverá los trabajos de SU correo gracias a la política SQL que pusimos
        const { data, error } = await supabase.from('lab_works').select('*');
        if (error) {
            console.error("Error cargando trabajos:", error);
            notify("Error conectando con el servidor");
        } else if (data) {
            // Formateamos la data para que el Kanban la entienda
            const formatted = data.map(job => {
                const d = job.data || {};
                return {
                    id: job.id,
                    dbId: job.id, // ID real de Supabase
                    clinic: job.admin_email || 'Clínica Asociada',
                    patient: d.patientName || 'Anónimo',
                    type: d.workType || 'Trabajo Prótesico',
                    shade: d.shade || 'No especificado',
                    dueDate: d.expectedDate || 'Sin fecha',
                    status: normalizeStatus(d.status),
                    tooth: d.tooth || '',
                };
            });
            setLabJobs(formatted);
        }
        setLoading(false);
    };

    // Normalizador de estados por si vienen en inglés desde la clínica
    const normalizeStatus = (status) => {
        const s = status?.toLowerCase();
        if (s === 'sent' || s === 'enviado' || s === 'recibido') return 'recibido';
        if (s === 'cad_cam') return 'cad_cam';
        if (s === 'ceramica') return 'ceramica';
        if (s === 'listo' || s === 'terminado') return 'listo';
        return 'recibido';
    };

    // 2. ACTUALIZAR ESTADOS EN LA BASE DE DATOS REAL
    const updateJobStatus = async (id, newStatus) => {
        // Actualización optimista en pantalla
        setLabJobs(jobs => jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
        notify(`Avanzando a: ${newStatus.replace('_', ' ').toUpperCase()}`);
        
        // Actualización en el backend para que el dentista lo vea en vivo
        try {
            const jobToUpdate = labJobs.find(j => j.id === id);
            if (!jobToUpdate) return;
            
            // Obtenemos el registro actual para no sobreescribir la otra data
            const { data: currentData } = await supabase.from('lab_works').select('data').eq('id', jobToUpdate.dbId).single();
            if (currentData) {
                const updatedJson = { ...currentData.data, status: newStatus };
                await supabase.from('lab_works').update({ data: updatedJson }).eq('id', jobToUpdate.dbId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Columnas adaptadas a un Laboratorio Dental REAL
    const columns = [
        { id: 'recibido', title: 'Impresiones / Recibidos', icon: AlertCircle, color: 'border-amber-200 bg-amber-50', textColor: 'text-amber-600', nextStatus: 'cad_cam', btnText: 'Pasar a Diseño CAD' },
        { id: 'cad_cam', title: 'Diseño CAD & Fresado', icon: MonitorPlay, color: 'border-blue-200 bg-blue-50', textColor: 'text-blue-600', nextStatus: 'ceramica', btnText: 'Pasar a Cerámica/Horno' },
        { id: 'ceramica', title: 'Terminación / Cerámica', icon: PaintBucket, color: 'border-purple-200 bg-purple-50', textColor: 'text-purple-600', nextStatus: 'listo', btnText: 'Marcar Terminado' },
        { id: 'listo', title: 'Control de Calidad & Despacho', icon: CheckCircle2, color: 'border-emerald-200 bg-emerald-50', textColor: 'text-emerald-600', nextStatus: 'despachado', btnText: 'Despachar a Clínica' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO LAB PARTNER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#DFD2C4]/50 pb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FlaskConical size={14} className="text-blue-500"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Sistema de Laboratorio</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter">Panel Técnico 🔬</h1>
                    <p className="text-[#9A8F84] font-bold mt-2 flex items-center gap-2">
                        <Calendar size={14}/> {formattedDate}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white border border-[#DFD2C4]/50 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#6B615A]">Sincronización en Vivo</span>
                    </div>
                </div>
            </div>

            {/* --- TABLERO KANBAN PARA LABORATORIO --- */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {loading ? (
                    <div className="w-full flex items-center justify-center p-20 text-[#9A8F84] font-bold">
                        <Droplets size={24} className="animate-bounce mr-2"/> Cargando trabajos del servidor...
                    </div>
                ) : columns.map(col => {
                    const columnJobs = labJobs.filter(job => job.status === col.id);
                    
                    return (
                        <div key={col.id} className="flex-1 min-w-[320px] bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-3xl p-4 flex flex-col max-h-full">
                            
                            {/* Cabecera de la Columna */}
                            <div className="flex justify-between items-center mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg border ${col.color}`}>
                                        <col.icon size={16} className={col.textColor} />
                                    </div>
                                    <h3 className="font-black text-[#312923] text-lg tracking-tight">{col.title}</h3>
                                </div>
                                <span className="bg-white border border-[#DFD2C4] text-[#6B615A] text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                                    {columnJobs.length}
                                </span>
                            </div>

                            {/* Tarjetas de Trabajo Técnico */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                {columnJobs.length === 0 ? (
                                    <div className="h-32 border-2 border-dashed border-[#DFD2C4] rounded-2xl flex items-center justify-center text-[#9A8F84] text-xs font-bold bg-white/50">
                                        Sin trabajos en esta etapa
                                    </div>
                                ) : (
                                    columnJobs.map(job => (
                                        <Card key={job.id} className="p-4 bg-white border border-[#DFD2C4] shadow-sm hover:shadow-md hover:border-[#5B6651] transition-all group">
                                            
                                            {/* Info Tarjeta Técnica */}
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#312923] px-2 py-1 rounded-md shadow-sm">
                                                    ID: {job.id.substring(0,8).toUpperCase()}
                                                </span>
                                                <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                    Entrega: {job.dueDate}
                                                </span>
                                            </div>

                                            <h4 className="font-black text-[#312923] text-lg leading-tight mb-2">{job.type}</h4>
                                            
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#6B615A] mb-4">
                                                {job.tooth && <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md">Pieza: {job.tooth}</span>}
                                                <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-md">Color: {job.shade}</span>
                                            </div>

                                            <div className="space-y-2 border-t border-[#DFD2C4]/40 pt-3 mb-4">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-[#6B615A]">
                                                    <span className="flex items-center gap-1"><Building2 size={12} className="text-[#9A8F84]"/> {job.clinic}</span>
                                                    <span className="flex items-center gap-1 text-[#9A8F84]" title="Privacidad Activada"><UserCircle size={12}/> Ref: {job.patient.substring(0,3)}***</span>
                                                </div>
                                            </div>

                                            {/* Botón de Acción */}
                                            <button 
                                                onClick={() => updateJobStatus(job.id, col.nextStatus)}
                                                className="w-full py-2.5 bg-[#FDFBF7] border border-[#DFD2C4] text-[#5B6651] hover:bg-[#5B6651] hover:text-white hover:border-[#5B6651] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                {col.id === 'listo' && <Truck size={14}/>}
                                                {col.btnText}
                                                {col.id !== 'listo' && <ArrowRight size={14}/>}
                                            </button>
                                        </Card>
                                    ))
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}