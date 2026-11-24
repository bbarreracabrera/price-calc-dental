import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, RotateCcw, Move, Contrast, MousePointer2, FileImage } from 'lucide-react';

/**
 * DicomViewerModal
 * Visor DICOM con cornerstone (carga diferida: import() dinamico en el primer uso).
 * Props: { file?: File|Blob, signedUrl?: string, storagePath?: string (path en bucket patient-images),
 *          fileName?: string, onClose: () => void }
 */

const CLAMP = (v, min, max) => Math.min(max, Math.max(min, v));

// --- Singletons de modulo: cornerstone se importa una sola vez e init corre una sola vez ---
let cornerstoneCache = null;

async function getCornerstone() {
    if (!cornerstoneCache) {
        const [core, loader] = await Promise.all([
            import('@cornerstonejs/core'),
            import('@cornerstonejs/dicom-image-loader'),
        ]);
        // init una sola vez global (flag en window para sobrevivir a HMR)
        if (!window.__dicomLoaderInitialized) {
            loader.init({ maxWebWorkers: 2 });
            window.__dicomLoaderInitialized = true;
        }
        cornerstoneCache = { core, loader };
    }
    return cornerstoneCache;
}

export default function DicomViewerModal({ file, signedUrl, storagePath, fileName, onClose }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [errorMsg, setErrorMsg] = useState('');
    const [hud, setHud] = useState({ zoom: 100, ww: 0, wc: 0 });
    const [mode, setMode] = useState('wl'); // 'wl' (brillo/contraste) | 'pan' (desplazar)

    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const viewportRef = useRef(null);
    const dragRef = useRef(null); // estado del arrastre activo
    const initialVoiRef = useRef(null);

    // --- Efecto principal: fetch + decodificacion + render ---
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                setStatus('loading');
                setErrorMsg('');

                // 1) Obtener el archivo (File directo, blob desde signedUrl, o path de storage resuelto a URL firmada)
                let fileObj = file;
                let url = signedUrl;
                if (!fileObj && !url && storagePath) {
                    const { getSecureUrl } = await import('../utils/securityFixes');
                    url = await getSecureUrl('patient-images', storagePath);
                    if (!url) throw new Error('No se pudo generar la URL firmada del archivo.');
                }
                if (!fileObj && url) {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`No se pudo descargar el archivo (${res.status})`);
                    fileObj = await res.blob();
                }
                if (!fileObj) throw new Error('No hay archivo ni URL firmada disponible.');
                if (!fileObj.name) {
                    const safeName = (fileName || 'imagen.dcm').split('?')[0];
                    fileObj = new File([fileObj], safeName, { type: 'application/dicom' });
                }

                // 2) Import dinamico de cornerstone (primer uso solamente)
                const { core, loader } = await getCornerstone();
                if (cancelled) return;

                // 3) Render
                const engineId = 'dicomViewerModalEngine';
                const viewportId = 'dicomViewerModalViewport';
                engineRef.current = new core.RenderingEngine(engineId);
                engineRef.current.enableElement({
                    viewportId,
                    element: containerRef.current,
                    type: core.ViewportType.STACK,
                });
                if (cancelled) return;

                const viewport = engineRef.current.getViewport(viewportId);
                viewportRef.current = viewport;

                const imageId = loader.wadouri.fileManager.add(fileObj);
                await viewport.setStack([imageId]);
                if (cancelled) return;

                // VOI por defecto: el que cornerstone calculo del metadata
                const props = viewport.getProperties();
                if (props?.voiRange) {
                    initialVoiRef.current = { ...props.voiRange };
                    setHud((h) => ({
                        ...h,
                        ww: Math.round(props.voiRange.upper - props.voiRange.lower),
                        wc: Math.round((props.voiRange.upper + props.voiRange.lower) / 2),
                    }));
                }
                setHud((h) => ({ ...h, zoom: Math.round(viewport.getZoom() * 100) }));
                setStatus('ready');
            } catch (err) {
                console.error('[DicomViewerModal]', err);
                if (!cancelled) {
                    setErrorMsg(
                        err?.message === 'No hay archivo ni URL firmada disponible.' || err?.message?.includes('descargar')
                            ? err.message
                            : 'No se pudo abrir el archivo DICOM. Puede estar corrupto o usar una transferencia no soportada.'
                    );
                    setStatus('error');
                }
            }
        };

        run();

        return () => {
            cancelled = true;
            try {
                engineRef.current?.destroy?.();
            } catch { /* noop */ }
            engineRef.current = null;
            viewportRef.current = null;
            dragRef.current = null;
        };
    }, [file, signedUrl, storagePath, fileName]);

    // --- Rueda: zoom ---
    useEffect(() => {
        const el = containerRef.current;
        if (!el || status !== 'ready') return;
        const onWheel = (e) => {
            e.preventDefault();
            const vp = viewportRef.current;
            if (!vp) return;
            const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
            const z = CLAMP(vp.getZoom() * factor, 0.05, 20);
            vp.setZoom(z);
            setHud((h) => ({ ...h, zoom: Math.round(z * 100) }));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [status]);

    // --- Arrastre: W/L o Pan (pointer events, mouse + touch) ---
    const onPointerDown = useCallback((e) => {
        const vp = viewportRef.current;
        if (!vp) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const props = vp.getProperties();
        const voi = props?.voiRange || initialVoiRef.current || { lower: 0, upper: 0 };
        dragRef.current = {
            x: e.clientX,
            y: e.clientY,
            mode,
            voiStart: voi,
            panStart: vp.getPan ? vp.getPan() : [0, 0],
        };
    }, [mode]);

    const onPointerMove = useCallback((e) => {
        const d = dragRef.current;
        const vp = viewportRef.current;
        if (!d || !vp) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;

        if (d.mode === 'wl') {
            // Ancho: dx ; Centro: dy invertido (estilo convencional de visores medicos)
            const startW = d.voiStart.upper - d.voiStart.lower;
            const startC = (d.voiStart.upper + d.voiStart.lower) / 2;
            const ww = CLAMP(startW + dx * 2, 1, 20000);
            const wc = startC - dy * 2;
            vp.setProperties({ voiRange: { lower: wc - ww / 2, upper: wc + ww / 2 } });
            setHud((h) => ({ ...h, ww: Math.round(ww), wc: Math.round(wc) }));
        } else {
            vp.setPan([d.panStart[0] + dx, d.panStart[1] + dy]);
        }
    }, []);

    const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

    // --- Reset: camara + VOI inicial ---
    const handleReset = useCallback(() => {
        const vp = viewportRef.current;
        if (!vp) return;
        vp.resetCamera();
        if (initialVoiRef.current) {
            vp.setProperties({ voiRange: { ...initialVoiRef.current } });
            const { lower, upper } = initialVoiRef.current;
            setHud((h) => ({ ...h, ww: Math.round(upper - lower), wc: Math.round((upper + lower) / 2) }));
        }
        setHud((h) => ({ ...h, zoom: Math.round(vp.getZoom() * 100) }));
    }, []);

    // Esc para cerrar
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6 animate-in fade-in duration-150" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <div className="w-full max-w-6xl h-full max-h-[92vh] bg-[#FBFAF8] border border-[#D9D2C7] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#D9D2C7] bg-white/60 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#46523C] text-white flex items-center justify-center shrink-0">
                            <FileImage size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-widest text-[#241F1B] truncate">Visor DICOM</p>
                            <p className="text-[11px] font-bold text-[#5E554E] truncate">{fileName || 'Imagen radiológica'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl border border-[#D9D2C7] text-[#5E554E] hover:text-[#241F1B] hover:bg-[#FBFAF8] transition-colors" aria-label="Cerrar visor">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Sidebar de controles */}
                    <div className="w-full md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-[#D9D2C7] p-4 flex md:flex-col gap-3 overflow-y-auto">
                        <div className="flex md:flex-col gap-2 flex-1">
                            <button onClick={() => setMode('wl')} className={`flex-1 md:flex-none py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${mode === 'wl' ? 'bg-[#241F1B] text-white border-[#241F1B]' : 'bg-transparent text-[#5E554E] border-[#D9D2C7] hover:bg-white'}`}>
                                <Contrast size={14} /> Brillo / Contraste
                            </button>
                            <button onClick={() => setMode('pan')} className={`flex-1 md:flex-none py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${mode === 'pan' ? 'bg-[#241F1B] text-white border-[#241F1B]' : 'bg-transparent text-[#5E554E] border-[#D9D2C7] hover:bg-white'}`}>
                                <Move size={14} /> Desplazar
                            </button>
                            <button onClick={handleReset} className="flex-1 md:flex-none py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest border border-[#D9D2C7] text-[#5E554E] hover:bg-white transition-all flex items-center justify-center gap-2">
                                <RotateCcw size={14} /> Reset
                            </button>
                        </div>

                        {/* Lecturas HUD */}
                        {status === 'ready' && (
                            <div className="flex md:block gap-2 md:gap-0 md:mt-4 md:space-y-2 text-[11px] font-bold text-[#5E554E] uppercase tracking-tight">
                                <div className="md:flex md:justify-between md:gap-4 border md:border-0 border-[#D9D2C7] rounded-xl md:rounded-none px-3 py-2 md:p-0">
                                    <span className="text-[#5E554E]/60">Zoom</span><span className="text-[#241F1B]">{hud.zoom}%</span>
                                </div>
                                <div className="md:flex md:justify-between md:gap-4 border md:border-0 border-[#D9D2C7] rounded-xl md:rounded-none px-3 py-2 md:p-0">
                                    <span className="text-[#5E554E]/60">Ancho (WW)</span><span className="text-[#241F1B]">{hud.ww}</span>
                                </div>
                                <div className="md:flex md:justify-between md:gap-4 border md:border-0 border-[#D9D2C7] rounded-xl md:rounded-none px-3 py-2 md:p-0">
                                    <span className="text-[#5E554E]/60">Centro (WC)</span><span className="text-[#241F1B]">{hud.wc}</span>
                                </div>
                            </div>
                        )}

                        <p className="hidden md:block mt-auto text-[10px] leading-relaxed text-[#5E554E]/70 font-medium">
                            {mode === 'wl'
                                ? 'Arrastra sobre la imagen: horizontal ajusta el brillo (ancho), vertical el contraste (centro). Rueda para zoom.'
                                : 'Arrastra para mover la imagen. Rueda para zoom.'}
                        </p>
                    </div>

                    {/* Área de imagen */}
                    <div className="flex-1 relative bg-[#241F1B] min-h-[300px] md:min-h-0">
                        <div
                            ref={containerRef}
                            className={`absolute inset-0 ${status === 'ready' ? (mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair') : ''}`}
                            onPointerDown={status === 'ready' ? onPointerDown : undefined}
                            onPointerMove={status === 'ready' ? onPointerMove : undefined}
                            onPointerUp={status === 'ready' ? onPointerUp : undefined}
                            onPointerCancel={status === 'ready' ? onPointerUp : undefined}
                            style={{ touchAction: 'none' }}
                        />

                        {status === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                                <Loader2 size={32} className="animate-spin text-white/80" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-white/70">Cargando imagen DICOM...</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-8">
                                <AlertCircle size={32} className="text-red-400" />
                                <p className="text-sm font-black text-white uppercase tracking-widest">Error al abrir el archivo</p>
                                <p className="text-[12px] text-white/60 max-w-xs font-medium">{errorMsg}</p>
                            </div>
                        )}

                        {status === 'ready' && (
                            <div className="absolute bottom-3 right-4 pointer-events-none select-none">
                                <MousePointer2 size={12} className="inline mr-1 text-white/40" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    {mode === 'wl' ? 'Arrastra: W/L · Rueda: Zoom' : 'Arrastra: Pan · Rueda: Zoom'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
