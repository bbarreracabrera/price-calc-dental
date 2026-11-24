import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Palette, Mail, ArrowRight, Loader2, Files, UploadCloud } from 'lucide-react';
import { supabase } from '../../supabase';
import LabFileGallery from './LabFileGallery';
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

export default function JobDetailModal({ job, onClose, onUpdateStatus, notify, session }) {
    const [labFiles, setLabFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [uploadingLabFile, setUploadingLabFile] = useState(false);

    // Cargar archivos de lab_work_files al abrir el modal (y tras subir/eliminar)
    const loadFiles = React.useCallback(async () => {
        if (!job?.id) return;
        setLoadingFiles(true);
        const { data, error } = await supabase
            .from('lab_work_files')
            .select('id, original_name, storage_path, file_size, mime_type, upload_source, created_by, created_at')
            .eq('lab_work_id', job.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(20);
        if (!error && data) setLabFiles(data);
        setLoadingFiles(false);
    }, [job?.id]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    if (!job) return null;

    const currentIdx = STATUS_FLOW.indexOf(job.status);
    const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

    // Abrir archivo con signed URL (expiración 1h)
    const handleOpenFile = async (file) => {
        const url = await getSecureUrl('lab_works', file.storage_path, 3600);
        if (url) window.open(url, '_blank');
        else alert('No se pudo generar el acceso seguro. Intenta nuevamente.');
    };

    // Fallback: archivo legacy en job.file_url (1 solo archivo, bucket anterior)
    const hasLegacyFile = job.file_url && labFiles.length === 0;

    // ── SUBIR ARCHIVO (solo si el trabajo pertenece a este laboratorio) ──
    const canUpload = session?.user?.email && job.lab_email && session.user.email === job.lab_email;

    const handleLabUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // permitir re-selección del mismo archivo
        if (!file) return;
        try {
            // Validación de seguridad existente (magic bytes + extensiones de lab, máx 50MB)
            const { validateFileSecurity } = await import('../../utils/securityFixes');
            await validateFileSecurity(file, 'lab');

            setUploadingLabFile(true);
            const fileExt = file.name.split('.').pop().toLowerCase();
            const safeName = `lab_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `lab_files/${job.admin_email}/${safeName}`;

            // Mismo bucket privado que la clínica (ver LabWorkModal.jsx)
            const { error: uploadError } = await supabase.storage.from('lab-work-files').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { error: insertError } = await supabase.from('lab_work_files').insert([{
                lab_work_id: job.id,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                content_type: file.type || 'application/octet-stream',
                upload_source: 'lab',
                created_by: session.user.email,
            }]);
            if (insertError) throw insertError;

            notify?.(`"${file.name}" adjuntado de forma segura`);
            await loadFiles();
        } catch (error) {
            notify?.(`Error en "${file.name}": ${error.message}`);
        } finally {
            setUploadingLabFile(false);
        }
    };

    // ── ELIMINAR ARCHIVO: fila lab_work_files + objeto storage ──
    // La RLS de lab_work_files ya limita el borrado a quien subió el archivo o al admin.
    const handleDeleteFile = async (file) => {
        try {
            const { error: dbError } = await supabase
                .from('lab_work_files')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', file.id);
            if (dbError) throw dbError;

            const { error: storageError } = await supabase.storage.from('lab-work-files').remove([file.storage_path]);
            if (storageError) {
                // Fila marcada como eliminada pero el objeto sigue en storage
                console.error('No se pudo borrar el objeto del storage:', storageError);
                notify?.('Archivo ocultado, pero no se pudo borrar del almacenamiento.');
            } else {
                notify?.('Archivo eliminado.');
            }
            setLabFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (error) {
            notify?.(`Error al eliminar: ${error.message}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#241F1B]/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95 duration-150">

                {/* Header sticky */}
                <div className="sticky top-0 bg-white border-b border-[#D9D2C7] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div>
                        <p className="text-[11px] uppercase tracking-widest text-[#5E554E] font-black">Detalle del trabajo</p>
                        <h2 className="text-lg font-black text-[#241F1B] leading-tight">{job.workType || 'Sin tipo'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#5E554E] hover:text-[#241F1B] hover:bg-[#FBFAF8] rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Estado + avanzar */}
                    <div className="bg-[#FBFAF8] border border-[#D9D2C7] rounded-2xl p-4">
                        <p className="text-[11px] uppercase tracking-widest text-[#5E554E] font-black mb-1">Estado actual</p>
                        <p className="text-xl font-black text-[#46523C]">
                            {STATUS_LABELS[job.status] || job.status}
                        </p>
                        <div className="flex items-center gap-1 mt-3">
                            {STATUS_FLOW.map((s, i) => (
                                <React.Fragment key={s}>
                                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIdx ? 'bg-[#46523C]' : 'bg-[#D9D2C7]'}`} />
                                    {i < STATUS_FLOW.length - 1 && <div className="w-1" />}
                                </React.Fragment>
                            ))}
                        </div>
                        {nextStatus && (
                            <button
                                onClick={() => onUpdateStatus(job.id, nextStatus)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#241F1B] text-white rounded-xl text-sm font-black hover:bg-[#1a1512] transition-colors"
                            >
                                Avanzar a "{STATUS_LABELS[nextStatus]}" <ArrowRight size={14} />
                            </button>
                        )}
                    </div>

                    {/* Paciente */}
                    <Section icon={<User size={15} />} title="Paciente">
                        <p className="text-sm font-bold text-[#241F1B]">{job.patientName || 'Sin nombre'}</p>
                        {job.tooth && <p className="text-xs text-[#5E554E] mt-0.5">Diente: {job.tooth}</p>}
                    </Section>

                    {/* Fechas */}
                    <Section icon={<Calendar size={15} />} title="Fechas">
                        <p className="text-sm text-[#241F1B]">Envío: <span className="font-bold">{formatDate(job.sendDate)}</span></p>
                        <p className="text-sm text-[#241F1B] mt-1">Entrega esperada: <span className="font-bold">{formatDate(job.expectedDate)}</span></p>
                    </Section>

                    {/* Detalles técnicos */}
                    {(job.shade || job.notes) && (
                        <Section icon={<Palette size={15} />} title="Detalles técnicos">
                            {job.shade && (
                                <p className="text-sm text-[#241F1B]">
                                    <span className="font-bold">Color:</span> {job.shade}
                                </p>
                            )}
                            {job.notes && (
                                <p className="text-sm text-[#5E554E] mt-2 whitespace-pre-wrap leading-relaxed italic">
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
                        <LabFileGallery
                            files={labFiles.map(f => ({
                                id: f.id,
                                path: f.storage_path,
                                name: f.original_name,
                                size: f.file_size,
                                mimeType: f.mime_type,
                            }))}
                            loading={loadingFiles}
                            emptyText="Sin archivos"
                            onDelete={canUpload ? handleDeleteFile : null}
                            onOpen={handleOpenFile}
                            lightbox
                            notify={notify}
                        />
                        {canUpload && (
                            <div className="mt-3">
                                <input
                                    type="file"
                                    accept=".dcm,.stl,.pli,.zip,.pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={handleLabUpload}
                                    disabled={uploadingLabFile}
                                    className="hidden"
                                    id="lab-detail-upload"
                                />
                                <label
                                    htmlFor="lab-detail-upload"
                                    className={`inline-flex items-center gap-2 px-4 py-2 bg-[#241F1B] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#1a1512] transition-colors cursor-pointer ${uploadingLabFile ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {uploadingLabFile ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                    {uploadingLabFile ? 'Subiendo...' : 'Subir archivo'}
                                </label>
                            </div>
                        )}
                        {hasLegacyFile && (
                            <button
                                onClick={async () => {
                                    let url = await getSecureUrl('lab-work-files', job.file_url);
                                    if (!url) url = await getSecureUrl('patient-images', job.file_url);
                                    if (url) window.open(url, '_blank');
                                    else notify?.('No se pudo generar el acceso seguro al archivo.');
                                }}
                                className="inline-flex items-center gap-2 text-sm text-[#46523C] font-bold hover:underline mt-2"
                            >
                                <FileText size={14} />
                                {job.file_name || 'Descargar archivo seguro'}
                            </button>
                        )}
                    </Section>

                    {/* Clínica */}
                    <Section icon={<Mail size={15} />} title="Clínica que asignó">
                        <p className="text-sm text-[#241F1B] font-bold">{job.admin_email}</p>
                        <a
                            href={`mailto:${job.admin_email}`}
                            className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#46523C] font-bold hover:underline"
                        >
                            <Mail size={12} /> Contactar por email
                        </a>
                    </Section>

                    <p className="text-[11px] text-[#D9D2C7] font-mono text-right">
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
                <span className="text-[#8A7F74]">{icon}</span>
                <p className="text-[11px] uppercase tracking-widest text-[#5E554E] font-black">{title}</p>
            </div>
            <div className="pl-6">{children}</div>
        </div>
    );
}
