import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, RotateCcw, Box, Grid3x3, MousePointer2 } from 'lucide-react';

/**
 * StlViewerModal
 * Visor de modelos STL 3D con three.js (carga diferida: import() dinamico en el primer uso).
 * Props: { file?: File|Blob, signedUrl?: string, storagePath?: string (path en bucket patient-images),
 *          fileName?: string, onClose: () => void }
 */

// --- Singleton de modulo: three + loaders se importan una sola vez ---
let threeCache = null;

async function getThree() {
    if (!threeCache) {
        const [THREE, { STLLoader }, { OrbitControls }] = await Promise.all([
            import('three'),
            import('three/examples/jsm/loaders/STLLoader.js'),
            import('three/examples/jsm/controls/OrbitControls.js'),
        ]);
        threeCache = { THREE, STLLoader, OrbitControls };
    }
    return threeCache;
}

export default function StlViewerModal({ file, signedUrl, storagePath, fileName, onClose }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [errorMsg, setErrorMsg] = useState('');
    const [hud, setHud] = useState({ triangles: 0, wireframe: false });

    const containerRef = useRef(null);
    const sceneRef = useRef(null); // { renderer, scene, camera, controls, mesh, animationId, resizeObserver }

    // --- Wireframe toggle ---
    const toggleWireframe = useCallback(() => {
        const s = sceneRef.current;
        if (!s?.mesh) return;
        const next = !s.mesh.material.wireframe;
        s.mesh.material.wireframe = next;
        setHud((h) => ({ ...h, wireframe: next }));
    }, []);

    // --- Reset: camara al encuadre inicial ---
    const handleReset = useCallback(() => {
        const s = sceneRef.current;
        if (!s) return;
        s.camera.position.copy(s.homePosition);
        s.camera.up.copy(s.homeUp);
        s.controls.target.copy(s.homeTarget);
        s.controls.update();
    }, []);

    // --- Efecto principal: fetch + parse + render 3D ---
    useEffect(() => {
        let cancelled = false;
        let cleanupFn = null;

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

                // 2) Import dinamico de three (primer uso solamente)
                const { THREE, STLLoader, OrbitControls } = await getThree();
                if (cancelled) return;

                // 3) Parsear STL (ArrayBuffer, soporta binario y ASCII)
                const buffer = await fileObj.arrayBuffer();
                const loader = new STLLoader();
                let geometry;
                try {
                    geometry = loader.parse(buffer);
                } catch (e) {
                    throw new Error('El archivo no es un STL valido o esta corrupto.');
                }
                if (!geometry || !geometry.attributes || !geometry.attributes.position || geometry.attributes.position.count === 0) {
                    throw new Error('El STL no contiene geometria (0 triangulos).');
                }
                if (cancelled) { geometry.dispose(); return; }

                const triangles = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;

                // 4) Escena
                const container = containerRef.current;
                const width = container.clientWidth || 800;
                const height = container.clientHeight || 600;

                const scene = new THREE.Scene();
                scene.background = new THREE.Color(0x0a0a0a);

                const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.setSize(width, height);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                container.appendChild(renderer.domElement);

                // Auto-centrado: bounding box -> centro y escala de camara
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                const center = new THREE.Vector3();
                bbox.getCenter(center);
                const size = new THREE.Vector3();
                bbox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const dist = maxDim * 2.2;

                const homeTarget = center.clone();
                const homePosition = new THREE.Vector3(center.x + dist * 0.7, center.y + dist * 0.6, center.z + dist * 0.9);
                const homeUp = new THREE.Vector3(0, 1, 0); // eje Y del modelo hacia arriba (util en dental)
                camera.position.copy(homePosition);
                camera.up.copy(homeUp);
                camera.near = dist / 100;
                camera.far = dist * 100;
                camera.updateProjectionMatrix();

                // Luz: ambiente suave + direccional principal + relleno
                const ambient = new THREE.AmbientLight(0xffffff, 0.55);
                const key = new THREE.DirectionalLight(0xffffff, 1.4);
                key.position.set(1, 1.5, 1).multiplyScalar(maxDim * 3);
                const fill = new THREE.DirectionalLight(0xffffff, 0.5);
                fill.position.set(-1, -0.5, -1).multiplyScalar(maxDim * 3);
                scene.add(ambient, key, fill);

                // Malla: material gris dental
                const material = new THREE.MeshStandardMaterial({
                    color: 0xB8B2A8,
                    metalness: 0.1,
                    roughness: 0.55,
                    wireframe: false,
                });
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);

                // Grid sutil opcional bajo el modelo
                const grid = new THREE.GridHelper(
                    maxDim * 4,
                    20,
                    new THREE.Color(0x5E554E),
                    new THREE.Color(0x2a2a2a)
                );
                grid.position.set(center.x, bbox.min.y - maxDim * 0.02, center.z);
                scene.add(grid);

                // Controles orbitales: rotar arrastre izq, pan clic derecho, zoom rueda
                const controls = new OrbitControls(camera, renderer.domElement);
                controls.target.copy(homeTarget);
                controls.enableDamping = true;
                controls.dampingFactor = 0.08;
                controls.screenSpacePanning = true;
                controls.minDistance = maxDim * 0.2;
                controls.maxDistance = maxDim * 10;
                controls.update();

                // ResizeObserver para el canvas
                const resizeObserver = new ResizeObserver(() => {
                    if (!container.clientWidth || !container.clientHeight) return;
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                });
                resizeObserver.observe(container);

                // Loop de render
                let animationId = 0;
                const animate = () => {
                    animationId = requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                };
                animate();

                sceneRef.current = {
                    renderer, scene, camera, controls, mesh, grid,
                    animationId, resizeObserver, geometry, material,
                    homePosition, homeTarget, homeUp,
                };

                if (cancelled) { cleanupFn?.(); return; }
                setHud({ triangles, wireframe: false });
                setStatus('ready');

                // Cleanup: dispose completo al cerrar
                cleanupFn = () => {
                    cancelAnimationFrame(animationId);
                    resizeObserver.disconnect();
                    controls.dispose();
                    geometry.dispose();
                    material.dispose();
                    scene.remove(mesh, grid, ambient, key, fill);
                    grid.dispose();
                    renderer.dispose();
                    if (renderer.domElement && renderer.domElement.parentNode === container) {
                        container.removeChild(renderer.domElement);
                    }
                    sceneRef.current = null;
                };
            } catch (err) {
                if (!cancelled) {
                    console.error('STL viewer error:', err);
                    setErrorMsg(err?.message || 'Error desconocido al cargar el modelo STL.');
                    setStatus('error');
                }
            }
        };

        run();

        return () => {
            cancelled = true;
            cleanupFn?.();
        };
    }, [file, signedUrl, storagePath]);

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
                            <Box size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-widest text-[#241F1B] truncate">Visor 3D STL</p>
                            <p className="text-[11px] font-bold text-[#5E554E] truncate">{fileName || 'Modelo 3D'}</p>
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
                            <button onClick={toggleWireframe} disabled={status !== 'ready'} className={`flex-1 md:flex-none py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${hud.wireframe ? 'bg-[#241F1B] text-white border-[#241F1B]' : 'bg-transparent text-[#5E554E] border-[#D9D2C7] hover:bg-white'}`}>
                                <Grid3x3 size={14} /> Wireframe
                            </button>
                            <button onClick={handleReset} disabled={status !== 'ready'} className="flex-1 md:flex-none py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest border border-[#D9D2C7] text-[#5E554E] hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                <RotateCcw size={14} /> Reset
                            </button>
                            <button onClick={onClose} className="flex-1 md:flex-none py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest border border-[#D9D2C7] text-[#5E554E] hover:bg-white transition-all flex items-center justify-center gap-2">
                                <X size={14} /> Cerrar
                            </button>
                        </div>

                        {/* Lecturas HUD */}
                        {status === 'ready' && (
                            <div className="flex md:block gap-2 md:gap-0 md:mt-4 md:space-y-2 text-[11px] font-bold text-[#5E554E] uppercase tracking-tight">
                                <div className="md:flex md:justify-between md:gap-4 border md:border-0 border-[#D9D2C7] rounded-xl md:rounded-none px-3 py-2 md:p-0">
                                    <span className="text-[#5E554E]/60">Triangulos</span><span className="text-[#241F1B]">{hud.triangles.toLocaleString('es-CL')}</span>
                                </div>
                                <div className="md:flex md:justify-between md:gap-4 border md:border-0 border-[#D9D2C7] rounded-xl md:rounded-none px-3 py-2 md:p-0">
                                    <span className="text-[#5E554E]/60">Modo</span><span className="text-[#241F1B]">{hud.wireframe ? 'Wireframe' : 'Solido'}</span>
                                </div>
                            </div>
                        )}

                        <p className="hidden md:block mt-auto text-[10px] leading-relaxed text-[#5E554E]/70 font-medium">
                            Arrastra con el clic izquierdo para rotar, clic derecho para desplazar, rueda para zoom.
                        </p>
                    </div>

                    {/* Area 3D */}
                    <div className="flex-1 relative bg-[#0a0a0a] min-h-[300px] md:min-h-0">
                        <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }} />

                        {status === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                                <Loader2 size={32} className="animate-spin text-white/80" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-white/70">Cargando modelo 3D...</p>
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
                                    Arrastra: Rotar · Clic der.: Pan · Rueda: Zoom
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
