import React from 'react';
import { X, User, Calendar, FileText, Palette, Mail, ArrowRight } from 'lucide-react';

const STATUS_FLOW   = ['recibido', 'cad_cam', 'ceramica', 'listo', 'despachado'];
const STATUS_LABELS = {
    recibido:   'Recibido',
    cad_cam:    'CAD/CAM',
    ceramica:   'Cerámica',
    listo:      'Listo',
    despachado: 'Despachado',
};

const formatDate = (str) => {
    if (!str) return 'Sin fecha';
    try {
        if (str.includes('/')) return str;
        return new Date(str).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return str;
    }
};

export default function JobDetailModal({ job, onClose, onUpdateStatus }) {
    if (!job) return null;

    const currentIdx  = STATUS_FLOW.indexOf(job.status);
    const nextStatus  = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

    return (
        <div className="fixed inset-0 bg-[#312923]/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95 duration-150">

                {/* Header sticky */}
                <div className="sticky top-0 bg-white border-b border-[#DFD2C4] px-6 py-4 flex items-center justify-between rounded-t-3xl">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-black">Detalle del trabajo</p>
                        <h2 className="text-lg font-black text-[#312923] leading-tight">{job.workType || 'Sin tipo'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Estado + avanzar */}
                    <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-black mb-1">Estado actual</p>
                        <p className="text-xl font-black text-[#5B6651]">
                            {STATUS_LABELS[job.status] || job.status}
                        </p>

                        {/* Progreso visual */}
                        <div className="flex items-center gap-1 mt-3">
                            {STATUS_FLOW.map((s, i) => (
                                <React.Fragment key={s}>
                                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIdx ? 'bg-[#5B6651]' : 'bg-[#DFD2C4]'}`} />
                                    {i < STATUS_FLOW.length - 1 && <div className="w-1" />}
                                </React.Fragment>
                            ))}
                        </div>

                        {nextStatus && (
                            <button
                                onClick={() => onUpdateStatus(job.id, nextStatus)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#312923] text-white rounded-xl text-sm font-black hover:bg-[#1a1512] transition-colors"
                            >
                                Avanzar a "{STATUS_LABELS[nextStatus]}" <ArrowRight size={14} />
                            </button>
                        )}
                    </div>

                    {/* Paciente */}
                    <Section icon={<User size={15} />} title="Paciente">
                        <p className="text-sm font-bold text-[#312923]">{job.patientName || 'Sin nombre'}</p>
                        {job.tooth && <p className="text-xs text-[#9A8F84] mt-0.5">Diente: {job.tooth}</p>}
                    </Section>

                    {/* Fechas */}
                    <Section icon={<Calendar size={15} />} title="Fechas">
                        <p className="text-sm text-[#312923]">Envío: <span className="font-bold">{formatDate(job.sendDate)}</span></p>
                        <p className="text-sm text-[#312923] mt-1">Entrega esperada: <span className="font-bold">{formatDate(job.expectedDate)}</span></p>
                    </Section>

                    {/* Detalles técnicos */}
                    {(job.shade || job.notes) && (
                        <Section icon={<Palette size={15} />} title="Detalles técnicos">
                            {job.shade && (
                                <p className="text-sm text-[#312923]">
                                    <span className="font-bold">Color:</span> {job.shade}
                                </p>
                            )}
                            {job.notes && (
                                <p className="text-sm text-[#9A8F84] mt-2 whitespace-pre-wrap leading-relaxed italic">
                                    "{job.notes}"
                                </p>
                            )}
                        </Section>
                    )}

                    {/* Archivo adjunto */}
                    {job.file_url && (
                        <Section icon={<FileText size={15} />} title="Archivo adjunto">
                            <button
                                onClick={async () => {
                                    const { getSecureUrl } = await import('../../utils/securityFixes');
                                    const url = await getSecureUrl('patient-images', job.file_url);
                                    if (url) window.open(url, '_blank');
                                }}
                                className="inline-flex items-center gap-2 text-sm text-[#5B6651] font-bold hover:underline"
                            >
                                <FileText size={14} />
                                {job.file_name || 'Descargar archivo seguro'}�
                            </button>
                        </Section>
                    )}

                    {/* Clínica */}
                    <Section icon={<Mail size={15} />} title="Clínica que asignó">
                        <p className="text-sm text-[#312923] font-bold">{job.admin_email}</p>
                        <a
                            href={`mailto:${job.admin_email}`}
                            className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#5B6651] font-bold hover:underline"
                        >
                            <Mail size={12} /> Contactar por email
                        </a>
                    </Section>

                    {/* ID del trabajo */}
                    <p className="text-[10px] text-[#DFD2C4] font-mono text-right">
                        ID: {job.id}
                    </p>
                </div>
            </div>
        </div>
    );
}

function Section({ icon, title, children }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[#A3968B]">{icon}</span>
                <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-black">{title}</p>
            </div>
            <div className="pl-6">{children}</div>
        </div>
    );
}
