import React, { useState, useEffect } from 'react';
import {
    Loader2, Download, Trash2, X, Lock,
    Image as ImageIcon, FileText, ShieldCheck, Sparkles, Cloud,
} from 'lucide-react';
import { getSecureUrl } from '../../utils/securityFixes';

// Bucket privado real de adjuntos de laboratorio (ver LabWorkModal.jsx y el
// comentario de SecureFileLink en UIComponents.jsx). No confundir con la tabla.
const BUCKET = 'lab-work-files';

const extOf = (name) => (name || '').split('.').pop().toLowerCase();

// Clasifica el archivo por MIME o extensión (mismo criterio que PrivateImage en SystemModals)
const kindOf = (mimeType, name) => {
    const ext = extOf(name);
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
    if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
    if (['dcm', 'dicom'].includes(ext)) return 'dicom';
    if (ext === 'stl') return 'stl';
    if (['zip', 'rar'].includes(ext)) return 'zip';
    return 'other';
};

const KIND_META = {
    pdf:   { icon: FileText,    label: 'Documento PDF',      color: 'text-red-400' },
    dicom: { icon: ShieldCheck, label: 'Radiografía DICOM',  color: 'text-blue-400' },
    stl:   { icon: Sparkles,    label: 'Modelo 3D STL',      color: 'text-emerald-400' },
    zip:   { icon: Cloud,       label: 'Archivo Comprimido', color: 'text-amber-400' },
    other: { icon: FileText,    label: 'Archivo adjunto',    color: 'text-stone-400' },
};

// Tile individual: thumbnail con signed URL para imágenes, icono + nombre para el resto
function GalleryTile({ file, onOpen, onDelete, busy }) {
    const kind = kindOf(file.mimeType, file.name);
    // Thumbnail efímero (5 min): URL firmada del bucket privado.
    // loading parte en true en la declaración (sin setState síncrono dentro del effect).
    const [thumb, setThumb] = useState({ url: null, loading: true, error: false });

    useEffect(() => {
        if (kind !== 'image') return undefined;
        let cancelled = false;
        getSecureUrl(BUCKET, file.path, 300).then((url) => {
            if (!cancelled) setThumb({ url, loading: false, error: !url });
        });
        return () => { cancelled = true; };
    }, [file.path, kind]);

    const meta = KIND_META[kind];
    const Icon = meta.icon;

    return (
        <div
            className="relative group rounded-xl overflow-hidden border border-[#D9D2C7] bg-[#FBFAF8] hover:border-[#46523C] transition-all"
            style={{ aspectRatio: '1' }}
        >
            <button
                type="button"
                onClick={() => onOpen(file)}
                title={file.name}
                className="absolute inset-0 w-full h-full text-left cursor-pointer"
            >
                {kind === 'image' ? (
                    thumb.loading ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-[#5E554E]" />
                        </span>
                    ) : thumb.url ? (
                        <img src={thumb.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon size={22} className="text-[#D9D2C7]" />
                        </span>
                    )
                ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                        <Icon size={26} className={meta.color} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#241F1B]">{meta.label}</span>
                        <span className="text-[9px] font-bold uppercase text-[#5E554E] opacity-60">.{extOf(file.name)}</span>
                    </span>
                )}
            </button>

            {/* Nombre del archivo */}
            <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-[#241F1B]/70 backdrop-blur-sm text-[9px] font-bold text-white truncate pointer-events-none">
                {file.name}
            </span>

            {/* Badge de seguridad */}
            <span className="absolute top-1 right-1 p-0.5 bg-emerald-500 rounded-full pointer-events-none">
                <Lock size={8} className="text-white" />
            </span>

            {/* Acciones al hover */}
            <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(file); }}
                    title="Ver / Descargar"
                    className="p-1 bg-white/90 rounded-lg text-[#241F1B] hover:bg-white transition-colors"
                >
                    <Download size={12} />
                </button>
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                        title="Eliminar"
                        disabled={busy}
                        className="p-1 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Galería de archivos de un trabajo de laboratorio.
 * - files: [{ id?, path, name, size?, mimeType? }] (id presente = fila persistida en lab_work_files)
 * - onDelete(file): borra fila + objeto storage (la RLS limita a quien subió o admin)
 * - onOpen(file): abre archivo no-imagen (el padre decide: window.open, visor, etc.)
 * - lightbox: si true, las imágenes abren en lightbox interno; si false, van a onOpen
 */
export default function LabFileGallery({
    files = [],
    loading = false,
    emptyText = 'Sin archivos',
    onDelete,
    onOpen,
    lightbox = false,
    notify,
}) {
    const [preview, setPreview] = useState(null); // { url, name }
    const [busyPath, setBusyPath] = useState(null);

    const showErr = (msg) => (notify ? notify(msg) : console.error(msg));

    const handleOpen = async (file) => {
        if (lightbox && kindOf(file.mimeType, file.name) === 'image') {
            const url = await getSecureUrl(BUCKET, file.path, 3600);
            if (url) setPreview({ url, name: file.name });
            else showErr('No se pudo generar el acceso seguro a la imagen.');
            return;
        }
        onOpen?.(file);
    };

    const handleDelete = async (file) => {
        if (!onDelete) return;
        setBusyPath(file.path);
        try { await onDelete(file); } finally { setBusyPath(null); }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-[#5E554E] py-2">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs font-bold">Cargando archivos...</span>
            </div>
        );
    }

    if (!files.length) {
        return <p className="text-xs text-[#5E554E] italic py-1">{emptyText}</p>;
    }

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {files.map((file) => (
                    <GalleryTile
                        key={file.id || file.path}
                        file={file}
                        onOpen={handleOpen}
                        onDelete={onDelete ? handleDelete : null}
                        busy={busyPath === file.path}
                    />
                ))}
            </div>

            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-2">
                <Lock size={9} /> Acceso seguro · URLs firmadas · Ley 19.628
            </p>

            {/* Lightbox simple de imágenes (mismo patrón de modal del resto de la app) */}
            {preview && (
                <div
                    className="fixed inset-0 z-[110] bg-[#241F1B]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setPreview(null)}
                >
                    <button
                        type="button"
                        onClick={() => setPreview(null)}
                        title="Cerrar"
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={22} />
                    </button>
                    <div className="max-w-full max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={preview.url}
                            alt={preview.name}
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                        />
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#D9D2C7] truncate max-w-full">
                            {preview.name}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
