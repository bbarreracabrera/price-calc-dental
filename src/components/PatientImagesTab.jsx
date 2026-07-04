import React, { useState, useEffect, useRef } from 'react';
import { 
    Upload, Trash2, Loader, Image as ImageIcon, FileText, Camera, 
    FolderOpen, Sun, Contrast, RotateCw, ZoomIn, ZoomOut, Ruler, X, Settings2, RefreshCcw,
    Zap, HardDrive, Share2, Clock, ChevronLeft, ChevronRight, GitBranch, CalendarDays,
    ArrowLeftRight, CheckCircle2, AlertCircle, CheckCircle
} from 'lucide-react';
import { PrivateImage } from './SystemModals';
import { supabase } from '../supabase';
import { useDialog } from './DialogProvider';
import { DENTAL_SENSORS, calculateSensorRatio } from '../utils/sensorData';

export default function PatientImagesTab({
    getPatient, selectedPatientId, savePatientData,
    activeFolder, setActiveFolder, handleImageUpload, uploading, notify,
    config, saveToSupabase
}) {
    const { confirm, prompt } = useDialog();
    const patient = getPatient(selectedPatientId);
    
    // --- ESTADOS DEL VISOR RADIOLÓGICO ---
    const [viewerImg, setViewerImg] = useState(null);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [invert, setInvert] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    
    // --- ESTADOS DE LA REGLA ENDO ---
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measurePoints, setMeasurePoints] = useState([]);
    const [calibrationRatio, setCalibrationRatio] = useState(null); 
    const [isSyncing, setIsSyncing] = useState(false);
    const [autoCalibrationStatus, setAutoCalibrationStatus] = useState('pending'); // 'pending' | 'active' | 'manual'
    const imageContainerRef = useRef(null);

    // --- ESTADOS DE LA LÍNEA DE TIEMPO ---
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'
    const [compareMode, setCompareMode] = useState(false);
    const [compareImages, setCompareImages] = useState([null, null]); // [before, after]
    const [compareStep, setCompareStep] = useState(0); // 0=seleccionar antes, 1=seleccionar después
    const [selectedTimelineMonth, setSelectedTimelineMonth] = useState(null);
    const timelineRef = useRef(null);

    // Sincronizar el ratio si cambia la configuración global
    useEffect(() => {
        // Primero intentar calibración automática por sensor
        if (config?.sensorModel && viewerImg) {
            const sensor = DENTAL_SENSORS.find(s => s.id === config.sensorModel);
            if (sensor && viewerImg.width && viewerImg.height) {
                const autoRatio = calculateSensorRatio(sensor, viewerImg.width, viewerImg.height);
                if (autoRatio) {
                    setCalibrationRatio(autoRatio);
                    setAutoCalibrationStatus('active');
                    return;
                }
            }
        }
        // Si no hay sensor configurado, usar la calibración manual guardada
        if (config?.radiologyRatio) {
            setCalibrationRatio(config.radiologyRatio);
            setAutoCalibrationStatus('manual');
        } else {
            setCalibrationRatio(null);
            setAutoCalibrationStatus('pending');
        }
    }, [config, viewerImg]);

    const folderTabs = [
        { id: 'Radiografías', icon: ImageIcon },
        { id: 'Fotos Clínicas', icon: Camera },
        { id: 'Documentos', icon: FileText },
        { id: 'Otros', icon: FolderOpen }
    ];

    const currentImages = patient.images?.filter(img => (img.folder || 'Otros') === activeFolder) || [];
    const adultTeeth = [
        18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28, 
        48,47,46,45,44,43,42,41, 38,37,36,35,34,33,32,31
    ];

    // --- LÓGICA DE LÍNEA DE TIEMPO ---
    // Agrupa las imágenes de la carpeta activa por mes/año
    const getTimelineGroups = () => {
        const sorted = [...currentImages].sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || 0);
            const dateB = new Date(b.date || b.created_at || 0);
            return dateB - dateA; // más reciente primero
        });

        const groups = {};
        sorted.forEach(img => {
            const date = new Date(img.date || img.created_at || Date.now());
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = { key, label, images: [], date };
            groups[key].images.push(img);
        });

        return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
    };

    const timelineGroups = getTimelineGroups();

    // --- MODO COMPARACIÓN ---
    const handleCompareSelect = (img) => {
        if (!compareMode) return;
        const newCompare = [...compareImages];
        newCompare[compareStep] = img;
        setCompareImages(newCompare);
        if (compareStep === 0) {
            setCompareStep(1);
            notify('Ahora selecciona la imagen "Después" para comparar');
        } else {
            setCompareStep(0);
            notify('¡Comparación lista! Abre el visor para ver las dos imágenes.');
        }
    };

    const isSelectedForCompare = (img) => compareImages.some(c => c?.id === img.id);
    const getCompareLabel = (img) => {
        if (compareImages[0]?.id === img.id) return 'ANTES';
        if (compareImages[1]?.id === img.id) return 'DESPUÉS';
        return null;
    };

    const resetCompare = () => {
        setCompareMode(false);
        setCompareImages([null, null]);
        setCompareStep(0);
    };

    // --- SIMULACIÓN DE SINCRONIZACIÓN RADIOGRÁFICA ---
    const handleSyncRadiology = async () => {
        setIsSyncing(true);
        notify("Buscando nuevas capturas en el software radiográfico...", "info");
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const mockNewImage = {
            id: `rad_sync_${Date.now()}`,
            url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
            name: `RX_SINC_${new Date().toLocaleDateString().replace(/\//g, '')}.jpg`,
            date: new Date().toISOString(),
            folder: 'Radiografías',
            tooth: null,
            is_sync: true
        };

        const updatedImages = [mockNewImage, ...(patient.images || [])];
        await savePatientData(selectedPatientId, { ...patient, images: updatedImages });
        
        setIsSyncing(false);
        setActiveFolder('Radiografías');
        notify("¡Nueva radiografía detectada y vinculada automáticamente! 🦷✨", "success");
    };

    // --- LÓGICA DE ETIQUETADO ---
    const handleToothChange = async (imgId, newTooth) => {
        const updatedImages = patient.images.map(img => 
            img.id === imgId ? { ...img, tooth: newTooth } : img
        );
        await savePatientData(selectedPatientId, { ...patient, images: updatedImages });
        if (newTooth) notify(`Etiquetada como Pieza ${newTooth} 🦷`);
        else notify('Etiqueta removida 📸');
    };

    // --- LÓGICA DEL VISOR ---
    const resetViewer = () => {
        setBrightness(100); setContrast(100); setInvert(false); 
        setRotation(0); setScale(1); setIsMeasuring(false); 
        setMeasurePoints([]);
    };

    const handleImageClick = (e) => {
        if (!isMeasuring) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        if (measurePoints.length === 0 || measurePoints.length === 2) {
            setMeasurePoints([{ x, y }]);
        } else {
            setMeasurePoints([...measurePoints, { x, y }]);
        }
    };

    const calculateDistance = () => {
        if (measurePoints.length < 2) return "0 mm";
        const dx = measurePoints[1].x - measurePoints[0].x;
        const dy = measurePoints[1].y - measurePoints[0].y;
        const distancePx = Math.sqrt(dx * dx + dy * dy);
        
        if (calibrationRatio) return (distancePx / calibrationRatio).toFixed(1) + ' mm';
        return "Sin Calibrar";
    };

    const getCalibrationStatusLabel = () => {
        if (autoCalibrationStatus === 'active') {
            const sensor = DENTAL_SENSORS.find(s => s.id === config?.sensorModel);
            return `Calibrado Automáticamente (${sensor?.name || 'Sensor'})`;
        }
        if (autoCalibrationStatus === 'manual') {
            return 'Calibración Manual';
        }
        return 'Sin Calibración';
    };

    const handleCalibration = async () => {
        if (measurePoints.length < 2) {
            notify("Primero traza una línea sobre una referencia conocida (ej. una lima o corona).");
            return;
        }
        const knownLength = await prompt("Calibración de la Clínica: ¿Cuántos mm reales mide la línea trazada?", '', { placeholder: 'Ej: 21' });
        if (knownLength && !isNaN(knownLength)) {
            const dx = measurePoints[1].x - measurePoints[0].x;
            const dy = measurePoints[1].y - measurePoints[0].y;
            const distancePx = Math.sqrt(dx * dx + dy * dy);
            const newRatio = distancePx / Number(knownLength);
            
            setCalibrationRatio(newRatio);
            
            if (saveToSupabase && config) {
                const newConfig = { ...config, radiologyRatio: newRatio };
                await saveToSupabase('clinic_config', config.admin_email || config.id, newConfig);
                notify("📏 Calibración guardada para todas las futuras radiografías.");
            }
        }
    };

    // Componente auxiliar para cargar dimensiones de imagen
    const ImageDimensionLoader = ({ img, onLoad }) => {
        useEffect(() => {
            const imgEl = new Image();
            imgEl.onload = () => onLoad({ ...img, width: imgEl.width, height: imgEl.height });
            imgEl.src = img.url;
        }, [img, onLoad]);
        return null;
    };

    // Actualizar las dimensiones de la imagen del visor cuando se carga
    const handleViewerImageLoad = (imgWithDimensions) => {
        setViewerImg(imgWithDimensions);
    };

    const handleDeleteImage = async (imgId) => {
        if (!await confirm("¿Seguro que deseas eliminar esta imagen permanentemente?")) return;
        const updatedImages = patient.images.filter(img => img.id !== imgId);
        await savePatientData(selectedPatientId, { ...patient, images: updatedImages });
        notify("Imagen eliminada");
    };

    // --- COMPONENTE TARJETA DE IMAGEN (reutilizable) ---
    const ImageCard = ({ img, showCompareOverlay = false }) => {
        const compareLabel = getCompareLabel(img);
        const isSelected = isSelectedForCompare(img);
        return (
            <div 
                key={img.id} 
                className={`group relative bg-white rounded-3xl border overflow-hidden shadow-sm transition-all
                    ${compareMode ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]' : ''}
                    ${isSelected ? 'border-emerald-500 shadow-emerald-200 shadow-lg ring-2 ring-emerald-400' : 'border-[#DFD2C4]/60 hover:shadow-xl'}
                `}
                onClick={() => compareMode ? handleCompareSelect(img) : setViewerImg(img)}
            >
                <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative">
                    <PrivateImage img={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Badge de sincronización */}
                    {img.is_sync && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <RefreshCcw size={10}/> Sincronizado
                        </div>
                    )}

                    {/* Overlay de comparación */}
                    {compareMode && isSelected && compareLabel && (
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]`}>
                            <span className={`px-4 py-2 rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-xl
                                ${compareLabel === 'ANTES' ? 'bg-blue-600' : 'bg-emerald-600'}
                            `}>
                                <CheckCircle2 size={14} className="inline mr-1 mb-0.5"/> {compareLabel}
                            </span>
                        </div>
                    )}
                    {compareMode && !isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <span className="text-white font-black text-[10px] uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-lg">
                                {compareStep === 0 ? 'Seleccionar como ANTES' : 'Seleccionar como DESPUÉS'}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                        <select 
                            value={img.tooth || ''} 
                            onChange={(e) => { e.stopPropagation(); handleToothChange(img.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-black bg-[#FDFBF7] border border-[#DFD2C4]/40 rounded-lg px-2 py-1 outline-none text-[#5B6651]"
                        >
                            <option value="">Pieza...</option>
                            {adultTeeth.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} 
                            className="p-2 text-[#DFD2C4] hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <p className="text-[9px] font-bold text-[#9A8F84] mt-2 truncate px-1">{img.name || 'Sin nombre'}</p>
                    {img.date && (
                        <p className="text-[8px] text-[#9A8F84]/60 mt-0.5 px-1">
                            {new Date(img.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col max-w-6xl mx-auto pb-10">
            {/* Loader invisible para obtener dimensiones de imagen */}
            {viewerImg && <ImageDimensionLoader img={viewerImg} onLoad={handleViewerImageLoad} />}
            
            {/* --- VISOR RADIOLÓGICO MODAL --- */}
            {viewerImg && viewerImg.width && !compareImages[0] && !compareImages[1] && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col md:flex-row animate-in fade-in duration-200">
                    <div className="w-full md:w-72 bg-[#1a1a1a] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col gap-6 shadow-2xl z-10 shrink-0 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-black tracking-widest uppercase text-[10px] flex items-center gap-2">
                                <Settings2 size={14} className="text-emerald-500"/> Centro Radiológico
                            </h3>
                            <button onClick={() => { setViewerImg(null); resetViewer(); }} className="text-white/50 hover:text-red-500 transition-colors p-2 bg-white/5 rounded-xl"><X size={18}/></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="text-white/70 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 mb-3"><Sun size={12}/> Brillo ({brightness}%)</label>
                                <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(e.target.value)} className="w-full accent-emerald-500" />
                            </div>
                            <div>
                                <label className="text-white/70 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 mb-3"><Contrast size={12}/> Contraste ({contrast}%)</label>
                                <input type="range" min="0" max="300" value={contrast} onChange={(e) => setContrast(e.target.value)} className="w-full accent-emerald-500" />
                            </div>
                            <button onClick={() => setInvert(!invert)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${invert ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}>
                                Invertir (Negativo)
                            </button>
                        </div>
                        <div className="h-px w-full bg-white/10"></div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setRotation(r => r - 90)} className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/10 flex justify-center"><RotateCw size={16} className="-scale-x-100"/></button>
                            <button onClick={() => setRotation(r => r + 90)} className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/10 flex justify-center"><RotateCw size={16}/></button>
                            <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/10 flex justify-center"><ZoomIn size={16}/></button>
                            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/10 flex justify-center"><ZoomOut size={16}/></button>
                        </div>
                        <div className="h-px w-full bg-white/10"></div>
                        <div className="space-y-3">
                            <button onClick={() => { setIsMeasuring(!isMeasuring); setMeasurePoints([]); }} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${isMeasuring ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}>
                                <Ruler size={16}/> {isMeasuring ? 'Cerrar Regla' : 'Medir en mm'}
                            </button>
                            {!isMeasuring && autoCalibrationStatus === 'active' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        <CheckCircle size={12} className="text-emerald-400"/>
                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Calibración Automática Activa</p>
                                    </div>
                                    <p className="text-[8px] text-emerald-600/80">{DENTAL_SENSORS.find(s => s.id === config?.sensorModel)?.name}</p>
                                </div>
                            )}
                            {isMeasuring && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center animate-in zoom-in-95">
                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                        {autoCalibrationStatus === 'active' ? (
                                            <CheckCircle size={12} className="text-emerald-400"/>
                                        ) : autoCalibrationStatus === 'manual' ? (
                                            <CheckCircle2 size={12} className="text-amber-400"/>
                                        ) : (
                                            <AlertCircle size={12} className="text-red-400"/>
                                        )}
                                        <p className="text-[8px] font-bold text-amber-500/80 uppercase tracking-widest">{getCalibrationStatusLabel()}</p>
                                    </div>
                                    <p className="text-3xl font-black text-amber-400">{calculateDistance()}</p>
                                    <button onClick={handleCalibration} className="mt-4 flex items-center justify-center gap-1 w-full text-[8px] font-black text-white/40 hover:text-white uppercase tracking-tighter border-t border-white/5 pt-3 transition-colors">
                                        <RefreshCcw size={10}/> {autoCalibrationStatus === 'active' ? 'Usar Calibración Manual' : 'Recalibrar Sensor'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={resetViewer} className="mt-auto py-3 bg-white/5 hover:bg-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors">
                            Restaurar Original
                        </button>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
                        <div ref={imageContainerRef} className={`relative transition-transform duration-200 ${isMeasuring ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`} style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }} onClick={handleImageClick}>
                            <div style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(100%)' : ''}` }} className="transition-all duration-300">
                                <PrivateImage img={viewerImg} className="max-w-full max-h-[85vh] object-contain shadow-2xl" />
                            </div>
                            {isMeasuring && measurePoints.length > 0 && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                    {measurePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4 / scale} fill="#f59e0b" className="animate-pulse" />)}
                                    {measurePoints.length === 2 && (
                                        <line x1={measurePoints[0].x} y1={measurePoints[0].y} x2={measurePoints[1].x} y2={measurePoints[1].y} stroke="#f59e0b" strokeWidth={2 / scale} strokeDasharray={`${4/scale},${4/scale}`} />
                                    )}
                                </svg>
                            )}
                        </div>
                        {isMeasuring && (
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em]">
                                Haz clic en el inicio y fin del conducto
                             </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL COMPARADOR ANTES / DESPUÉS --- */}
            {compareImages[0] && compareImages[1] && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <ArrowLeftRight size={18} className="text-emerald-400"/>
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Comparador Clínico</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white/40 text-[10px] uppercase tracking-widest">
                                {compareImages[0].date ? new Date(compareImages[0].date).toLocaleDateString('es-CL') : 'Sin fecha'} 
                                {' → '}
                                {compareImages[1].date ? new Date(compareImages[1].date).toLocaleDateString('es-CL') : 'Sin fecha'}
                            </span>
                            <button onClick={resetCompare} className="text-white/50 hover:text-red-500 transition-colors p-2 bg-white/5 rounded-xl">
                                <X size={18}/>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-0.5 bg-black/50 overflow-hidden">
                        {/* Panel ANTES */}
                        <div className="relative flex flex-col bg-[#0a0a0a]">
                            <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                ANTES
                            </div>
                            <div className="absolute top-4 right-4 z-10 text-white/40 text-[9px] font-bold">
                                {compareImages[0].date ? new Date(compareImages[0].date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                                <PrivateImage img={compareImages[0]} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-white/40 text-[9px] truncate">{compareImages[0].name || 'Sin nombre'}</p>
                            </div>
                        </div>
                        {/* Panel DESPUÉS */}
                        <div className="relative flex flex-col bg-[#0a0a0a]">
                            <div className="absolute top-4 left-4 z-10 bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                DESPUÉS
                            </div>
                            <div className="absolute top-4 right-4 z-10 text-white/40 text-[9px] font-bold">
                                {compareImages[1].date ? new Date(compareImages[1].date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                                <PrivateImage img={compareImages[1]} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-white/40 text-[9px] truncate">{compareImages[1].name || 'Sin nombre'}</p>
                            </div>
                        </div>
                    </div>
                    {/* Línea divisoria central */}
                    <div className="absolute inset-y-[60px] left-1/2 w-0.5 bg-white/20 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-2 pointer-events-none">
                        <ArrowLeftRight size={16} className="text-white/60"/>
                    </div>
                </div>
            )}

            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-[#DFD2C4]/50 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-[#312923] tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-[#9A8F84]/10 text-[#9A8F84] rounded-xl"><ImageIcon size={22} /></div>
                        Galería Clínica
                    </h2>
                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2 ml-1">Historial Radiográfico y Fotográfico</p>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Toggle Vista Grilla / Línea de Tiempo */}
                    <div className="flex bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-2xl p-1 gap-1">
                        <button
                            onClick={() => { setViewMode('grid'); resetCompare(); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-[#5B6651] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#5B6651]'}`}
                        >
                            <ImageIcon size={14}/> Grilla
                        </button>
                        <button
                            onClick={() => { setViewMode('timeline'); resetCompare(); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-[#5B6651] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#5B6651]'}`}
                        >
                            <Clock size={14}/> Línea de Tiempo
                        </button>
                    </div>

                    {/* Botón Comparar */}
                    <button
                        onClick={() => { compareMode ? resetCompare() : setCompareMode(true); setViewMode('grid'); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border
                            ${compareMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-[#FDFBF7] text-[#9A8F84] border-[#DFD2C4]/60 hover:bg-white hover:text-[#5B6651]'}`}
                    >
                        <ArrowLeftRight size={16}/>
                        {compareMode ? (
                            compareStep === 0 ? 'Selecciona ANTES' : 'Selecciona DESPUÉS'
                        ) : 'Comparar'}
                    </button>

                    <button 
                        onClick={handleSyncRadiology}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${isSyncing ? 'bg-[#DFD2C4] text-[#9A8F84]' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                    >
                        {isSyncing ? <Loader size={16} className="animate-spin"/> : <RefreshCcw size={16}/>}
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar RX'}
                    </button>
                </div>
            </div>

            {/* Banner de instrucción de comparación */}
            {compareMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center gap-3 animate-in slide-in-from-top-2">
                    <ArrowLeftRight size={18} className="text-blue-600 shrink-0"/>
                    <div>
                        <p className="text-blue-800 font-black text-[11px] uppercase tracking-widest">
                            {compareStep === 0 ? 'Paso 1: Selecciona la imagen "ANTES"' : 'Paso 2: Selecciona la imagen "DESPUÉS"'}
                        </p>
                        <p className="text-blue-600 text-[10px] mt-0.5">Haz clic en las imágenes para seleccionarlas. Se abrirá el comparador automáticamente.</p>
                    </div>
                    <button onClick={resetCompare} className="ml-auto text-blue-400 hover:text-blue-700 transition-colors">
                        <X size={16}/>
                    </button>
                </div>
            )}

            {/* --- TABS DE CARPETAS --- */}
            <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
                {folderTabs.map(folder => {
                    const isActive = activeFolder === folder.id;
                    const fileCount = patient.images?.filter(img => (img.folder || 'Otros') === folder.id).length || 0;
                    return (
                        <button 
                            key={folder.id} onClick={() => setActiveFolder(folder.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${isActive ? 'bg-[#5B6651] text-white border-[#5B6651] shadow-md' : 'bg-[#FDFBF7] text-[#9A8F84] border-[#DFD2C4]/60 hover:bg-white hover:text-[#5B6651]'}`}
                        >
                            <folder.icon size={16} className={isActive ? 'text-[#DFD2C4]' : 'opacity-60'}/>
                            {folder.id}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-white/20' : 'bg-[#DFD2C4]/30'}`}>{fileCount}</span>
                        </button>
                    )
                })}
            </div>

            {/* ===== VISTA GRILLA ===== */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                    {/* --- ÁREA DE CARGA --- */}
                    <div className="lg:col-span-1">
                        <div className="relative group w-full h-48 lg:h-64 border-2 border-dashed border-[#DFD2C4] hover:border-[#5B6651] bg-[#FDFBF7] hover:bg-[#5B6651]/5 rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer">
                            <input 
                                type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" accept="image/*,application/pdf" 
                                onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); e.target.value = ''; }} 
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader size={32} className="animate-spin text-[#5B6651]" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Subiendo...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-[#DFD2C4]/40 group-hover:scale-110 transition-transform">
                                        <Upload size={24} className="text-[#9A8F84] group-hover:text-[#5B6651]" />
                                    </div>
                                    <p className="text-[11px] font-black text-[#312923] uppercase tracking-widest mt-4">Subir Archivo</p>
                                    <p className="text-[9px] font-bold text-[#9A8F84] mt-1">Arrastra o haz clic</p>
                                </>
                            )}
                        </div>
                        
                        {/* Atajo de Sincronización Automática (Tip) */}
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={14} className="text-emerald-600"/>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Tip de Flujo</p>
                            </div>
                            <p className="text-[10px] font-medium text-emerald-700 leading-relaxed">
                                Puedes configurar una <b>Carpeta Compartida</b> para que las radiografías de tu software externo aparezcan aquí automáticamente.
                            </p>
                        </div>
                    </div>

                    {/* --- GRILLA DE IMÁGENES --- */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentImages.length === 0 ? (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-[#9A8F84] bg-[#FDFBF7]/50 rounded-[2rem] border border-[#DFD2C4]/40">
                                <ImageIcon size={48} className="opacity-10 mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest opacity-40">No hay archivos en esta carpeta</p>
                            </div>
                        ) : (
                            currentImages.map(img => <ImageCard key={img.id} img={img} />)
                        )}
                    </div>
                </div>
            )}

            {/* ===== VISTA LÍNEA DE TIEMPO ===== */}
            {viewMode === 'timeline' && (
                <div className="flex-1 flex flex-col gap-0" ref={timelineRef}>
                    {currentImages.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-[#9A8F84] bg-[#FDFBF7]/50 rounded-[2rem] border border-[#DFD2C4]/40">
                            <Clock size={48} className="opacity-10 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-40">No hay archivos para mostrar en la línea de tiempo</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Línea vertical de tiempo */}
                            <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#5B6651] via-[#DFD2C4] to-transparent z-0"></div>

                            <div className="space-y-10">
                                {timelineGroups.map((group, groupIdx) => (
                                    <div key={group.key} className="relative">
                                        {/* Nodo del mes en la línea de tiempo */}
                                        <div className="flex items-center gap-5 mb-5">
                                            <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#5B6651] text-white flex flex-col items-center justify-center shadow-lg shadow-[#5B6651]/20 shrink-0">
                                                <CalendarDays size={16} className="text-[#DFD2C4] mb-0.5"/>
                                                <span className="text-[8px] font-black uppercase tracking-widest leading-none text-center px-1">
                                                    {group.label.split(' ')[0].substring(0, 3)}
                                                </span>
                                                <span className="text-[9px] font-black text-white/80">
                                                    {group.label.split(' ').slice(-1)[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-[#312923] font-black text-base capitalize">{group.label}</h3>
                                                <p className="text-[#9A8F84] text-[10px] font-bold uppercase tracking-widest">
                                                    {group.images.length} {group.images.length === 1 ? 'archivo' : 'archivos'}
                                                    {groupIdx === 0 && <span className="ml-2 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Más reciente</span>}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Grilla de imágenes del mes */}
                                        <div className="ml-[74px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {group.images.map(img => (
                                                <ImageCard key={img.id} img={img} />
                                            ))}
                                        </div>

                                        {/* Separador entre grupos (excepto el último) */}
                                        {groupIdx < timelineGroups.length - 1 && (
                                            <div className="ml-[74px] mt-8 flex items-center gap-4">
                                                <div className="flex-1 h-px bg-[#DFD2C4]/40"></div>
                                                <span className="text-[9px] font-bold text-[#9A8F84]/50 uppercase tracking-widest whitespace-nowrap">
                                                    {(() => {
                                                        const curr = new Date(group.date);
                                                        const next = new Date(timelineGroups[groupIdx + 1].date);
                                                        const diffMonths = (curr.getFullYear() - next.getFullYear()) * 12 + (curr.getMonth() - next.getMonth());
                                                        return diffMonths > 0 ? `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} antes` : '';
                                                    })()}
                                                </span>
                                                <div className="flex-1 h-px bg-[#DFD2C4]/40"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Fin de la línea de tiempo */}
                            <div className="flex items-center gap-4 mt-10 ml-0">
                                <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#DFD2C4]/30 border-2 border-dashed border-[#DFD2C4] flex items-center justify-center shrink-0">
                                    <GitBranch size={18} className="text-[#9A8F84]/50"/>
                                </div>
                                <div>
                                    <p className="text-[#9A8F84]/60 text-[10px] font-bold uppercase tracking-widest">Inicio del historial</p>
                                    <p className="text-[#9A8F84]/40 text-[9px]">
                                        {currentImages.length > 0 && (() => {
                                            const oldest = [...currentImages].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))[0];
                                            return oldest.date ? `Primera imagen: ${new Date(oldest.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}` : '';
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
