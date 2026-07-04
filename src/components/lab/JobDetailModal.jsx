import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Palette, Mail, ArrowRight, Image, File, Download, Loader2, Lock, Files } from 'lucide-react';
import { supabase } from '../../supabase';
import { getSecureUrl } from '../../utils/securityFixes';

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

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Icono según tipo MIME
function FileTypeIcon({ mimeType, size = 16 }) {
    if (mimeType?.startsWith('image/')) return <Image size={size} className="text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText size={size} className="text-red-500" />;
    return <File size={size} className="text-[#9A8F84]" />;
}

// Thumbnail para imágenes (genera signed URL y muestra preview)
function FileThumbnail({ file, onOpen }) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const isImage = file.mime_type?.startsWith('image/');

    useEffect(() => {
        if (!isImage) return;
        let cancelled = false;
        setLoading(true);
        getSecureUrl('lab_works', file.storage_path, 300).then(url => {
            if (!cancelled) {
                setPreviewUrl(url);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [file.storage_path, isImage]);

    return (
        <div
            className="relative group cursor-pointer rounded-2xl overflow-hidden border border-[#DFD2C4] bg-[#FDFBF7] hover:border-[#5B6651] transition-all"
            style={{ aspectRatio: '1' }}
            onClick={onOpen}
            title={file.original_name}
        >
            {isImage ? (
                loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-[#CBAAA2]" />
                    </div>
                ) : previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={file.original_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Image size={24} className="text-[#DFD2C4]" />
                    </div>
                )
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                    <FileTypeIcon mimeType={file.mime_type} size={28} />
                    <p className="text-[9px] font-bold text-[#9A8F84] text-center truncate w-full px-1">
                        {file.original_name?.split('.').pop()?.toUpperCase()}
                    </p>
                </div>
            )}
            {/* Overlay al hover */}
            <div className="absolute inset-0 bg-[#312923]/0 group-hover:bg-[#312923]/30 transition-all flex items-center justify-center">
                <Download size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Badge de seguridad */}
            <div className="absolute top-1 right-1 p-0.5 bg-emerald-500 rounded-full">
                <Lock size={8} className="text-white" />
            </div>
        </div>
    );
}

export default function JobDetailModal({ job, onClose, onUpdateStatus }) {
    const [labFiles, setLabFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    if (!job) return null;

    const currentIdx = STATUS_FLOW.indexOf(job.status);
    const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

    // Cargar archivos de lab_work_files al abrir el modal
    useEffect(() => {
        if (!job?.id) return;
        setLoadingFiles(true);
        supabase
            .from('lab_work_files')
            .select('id, original_name, storage_path, file_size, mime_type, upload_source, created_at')
            .eq('lab_work_id', job.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(20)
            .then(({ data, error }) => {
                if (!error && data) setLabFiles(data);
                setLoadingFiles(false);
            });
    }, [job?.id]);

    // Abrir archivo con signed URL (expiración 1h)
    const handleOpenFile = async (file) => {
        const url = await getSecureUrl('lab_works', file.storage_path, 3600);
        if (url) window.open(url, '_blank');
        else alert('No se pudo generar el acceso seguro. Intenta nuevamente.');
    };

    // Fallback: archivo legacy en job.file_url (1 solo archivo, bucket anterior)
    const hasLegacyFile = job.file_url && labFiles.length === 0;

    return (
        <div className="fixed inset-0 bg-[#312923]/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95 duration-150">

                {/* Header sticky */}
                <div className="sticky top-0 bg-white border-b border-[#DFD2C4] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
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

                    {/* ── GALERÍA DE ARCHIVOS MÚLTIPLES ── */}
                    <Section
                        icon={<Files size={15} />}
                        title={`Archivos Adjuntos${labFiles.length > 0 ? ` (${labFiles.length})` : ''}`}
                    >
                        {loadingFiles ? (
                            <div className="flex items-center gap-2 text-[#9A8F84]">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs font-bold">Cargando archivos...</span>
                            </div>
                        ) : labFiles.length > 0 ? (
                            <div className="space-y-3">
                                {/* Grid de thumbnails para imágenes */}
                                {labFiles.some(f => f.mime_type?.startsWith('image/')) && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {labFiles
                                            .filter(f => f.mime_type?.startsWith('image/'))
                                            .map(f => (
                                                <FileThumbnail key={f.id} file={f} onOpen={() => handleOpenFile(f)} />
                                            ))
                                        }
                                    </div>
                                )}
                                {/* Lista para archivos no-imagen */}
                                {labFiles
                                    .filter(f => !f.mime_type?.startsWith('image/'))
                                    .map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => handleOpenFile(f)}
                                            className="w-full flex items-center gap-3 p-3 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl hover:border-[#5B6651] transition-all text-left"
                                        >
                                            <div className="p-2 bg-white rounded-xl border border-[#DFD2C4] shrink-0">
                                                <FileTypeIcon mimeType={f.mime_type} size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-[#312923] truncate">{f.original_name}</p>
                                                <p className="text-[9px] text-[#9A8F84] font-bold uppercase tracking-widest">
                                                    {formatBytes(f.file_size)} · {f.upload_source === 'lab' ? 'Subido por Lab' : 'Subido por Clínica'}
                                                </p>
                                            </div>
                                            <Download size={14} className="text-[#9A8F84] shrink-0" />
                                        </button>
                                    ))
                                }
                                <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                    <Lock size={9} /> Acceso seguro · URLs firmadas · Ley 19.628
                                </p>
                            </div>
                        ) : hasLegacyFile ? (
                            // Fallback legacy: un solo archivo en job.file_url
                            <button
                                onClick={async () => {
                                    let url = await getSecureUrl('lab_works', job.file_url);
                                    if (!url) url = await getSecureUrl('patient-images', job.file_url);
                                    if (url) window.open(url, '_blank');
                                    else alert('No se pudo generar el acceso seguro al archivo.');
                                }}
                                className="inline-flex items-center gap-2 text-sm text-[#5B6651] font-bold hover:underline"
                            >
                                <FileText size={14} />
                                {job.file_name || 'Descargar archivo seguro'}
                            </button>
                        ) : (
                            <p className="text-xs text-[#9A8F84] italic">Sin archivos adjuntos</p>
                        )}
                    </Section>

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
