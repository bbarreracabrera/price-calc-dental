// src/components/DSDAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
    X, Check, Move, Plus, Target, ArrowRight,
    RotateCw, HelpCircle, Loader, AlertCircle, Minus,
    RectangleHorizontal, MousePointer
} from 'lucide-react';

const STEPS = [
    {
        id: 'midline',
        title: 'Línea Media',
        description: 'Marca el centro de la cara. Haz clic en dos puntos: primero en la frente y luego en el mentón.',
        points: 2,
        color: '#00FF00',
        icon: 'line'
    },
    {
        id: 'commissure',
        title: 'Comisuras Labiales',
        description: 'Marca el borde izquierdo y derecho de los labios (donde se juntan).',
        points: 2,
        color: '#FFFF00',
        icon: 'line'
    },
    {
        id: 'tooth_bounds',
        title: 'Límite de los Dientes',
        description: 'Marca los extremos izquierdo y derecho de la sonrisa (el borde de los dientes visibles).',
        points: 2,
        color: '#00CCFF',
        icon: 'line'
    },
    {
        id: 'tooth_height',
        title: 'Altura del Diente',
        description: 'Marca la altura del incisivo central superior. Punto 1: borde incisal (abajo). Punto 2: encía (arriba).',
        points: 2,
        color: '#FF6B9D',
        icon: 'line'
    }
];

export default function DSDAssistant({
    imageUrl,
    onComplete,
    onClose,
    selectedStyleId = 'oval',
    supabase = null
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [points, setPoints] = useState({});
    const [tempPoints, setTempPoints] = useState([]);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [retryKey, setRetryKey] = useState(0);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const step = STEPS[currentStep];

    // --- Cargar imagen ---
    useEffect(() => {
        if (!imageUrl) {
            setImageError(true);
            setImageLoading(false);
            setErrorMessage('No se proporcionó URL de imagen');
            return;
        }

        setImageLoading(true);
        setImageError(false);
        setImageLoaded(false);
        setErrorMessage('');

        const loadImage = async () => {
            try {
                let urlToLoad = imageUrl;
                console.log('[DSDAssistant] Cargando imagen desde URL:', urlToLoad);

                if (supabase && imageUrl.includes('supabase.co')) {
                    try {
                        const pathParts = imageUrl.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        console.log('[DSDAssistant] Intentando descarga con Supabase, archivo:', fileName);
                        const { data, error } = await supabase.storage
                            .from('patient-images')
                            .download(fileName);
                        if (error) {
                            console.warn('[DSDAssistant] Error descargando con supabase:', error);
                            throw error;
                        }
                        if (data) {
                            const objectURL = URL.createObjectURL(data);
                            urlToLoad = objectURL;
                            console.log('[DSDAssistant] Descarga exitosa, URL de objeto generada');
                        }
                    } catch (e) {
                        console.warn('[DSDAssistant] Falló descarga con supabase, usando URL directa:', e);
                    }
                }

                console.log('[DSDAssistant] Cargando imagen desde:', urlToLoad);
                const response = await fetch(urlToLoad, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);

                const img = new Image();
                img.onload = () => {
                    console.log('[DSDAssistant] Imagen cargada correctamente');
                    setImageLoaded(true);
                    setImageLoading(false);
                    imageRef.current = img;
                    drawCanvas();
                    if (urlToLoad.startsWith('blob:')) URL.revokeObjectURL(urlToLoad);
                };
                img.onerror = (e) => {
                    console.error('[DSDAssistant] Error al cargar la imagen en el objeto Image:', e);
                    setImageError(true);
                    setImageLoading(false);
                    setErrorMessage('Error al decodificar la imagen');
                };
                img.src = objectURL;
            } catch (error) {
                console.error('[DSDAssistant] Error en la carga de la imagen:', error);
                setImageError(true);
                setImageLoading(false);
                setErrorMessage(error.message || 'Error desconocido');
            }
        };

        loadImage();

        return () => {
            if (imageRef.current && imageRef.current.src && imageRef.current.src.startsWith('blob:')) {
                URL.revokeObjectURL(imageRef.current.src);
            }
        };
    }, [imageUrl, supabase, retryKey]);

    // --- Dibujar canvas ---
    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Aplicar zoom y pan
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Dibujar puntos guardados de pasos anteriores
        ctx.save();
        Object.entries(points).forEach(([stepId, stepPoints]) => {
            const stepConfig = STEPS.find(s => s.id === stepId);
            if (!stepConfig) return;
            ctx.fillStyle = stepConfig.color;
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            stepPoints.forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                if (i === 0 && stepPoints.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(stepPoints[0].x, stepPoints[0].y);
                    ctx.lineTo(stepPoints[1].x, stepPoints[1].y);
                    ctx.strokeStyle = stepConfig.color;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    // Mostrar distancia en píxeles
                    const dx = stepPoints[1].x - stepPoints[0].x;
                    const dy = stepPoints[1].y - stepPoints[0].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    ctx.fillStyle = '#FFF';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText(`${Math.round(dist)}px`, (stepPoints[0].x + stepPoints[1].x)/2, (stepPoints[0].y + stepPoints[1].y)/2 - 10);
                }
            });
        });
        ctx.restore();

        // Dibujar puntos temporales del paso actual
        ctx.save();
        ctx.fillStyle = step.color;
        ctx.strokeStyle = '#FFF';
        tempPoints.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            if (i === 0 && tempPoints.length > 1) {
                ctx.beginPath();
                ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
                ctx.lineTo(tempPoints[1].x, tempPoints[1].y);
                ctx.strokeStyle = step.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
                // Mostrar distancia en píxeles
                const dx = tempPoints[1].x - tempPoints[0].x;
                const dy = tempPoints[1].y - tempPoints[0].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`${Math.round(dist)}px`, (tempPoints[0].x + tempPoints[1].x)/2, (tempPoints[0].y + tempPoints[1].y)/2 - 10);
            }
        });
        ctx.restore();

        // Instrucciones en canvas
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        if (ctx.roundRect) {
            ctx.roundRect(10, 10, 340, 80, 12);
        } else {
            ctx.rect(10, 10, 340, 80);
        }
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${step.title} (${tempPoints.length}/${step.points})`, 20, 40);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCC';
        const lines = step.description.split('. ');
        ctx.fillText(lines[0] + '.', 20, 65);
        if (lines[1]) ctx.fillText(lines[1] + '.', 20, 85);
        ctx.restore();
    };

    // --- Redibujar al cambiar ---
    useEffect(() => {
        if (imageLoaded) drawCanvas();
    }, [imageLoaded, points, tempPoints, zoom, pan, currentStep]);

    // --- Manejadores ---
    const handleCanvasClick = (e) => {
        if (!imageLoaded) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Validar que el punto esté dentro del canvas
        if (x < 0 || y < 0 || x > canvasRef.current.width || y > canvasRef.current.height) return;

        if (tempPoints.length < step.points) {
            setTempPoints([...tempPoints, { x, y }]);
            if (tempPoints.length === step.points - 1) {
                // Completado el paso
                setTimeout(() => {
                    const allPoints = { ...points, [step.id]: [...tempPoints, { x, y }] };
                    setPoints(allPoints);
                    if (currentStep < STEPS.length - 1) {
                        setCurrentStep(currentStep + 1);
                        setTempPoints([]);
                    } else {
                        onComplete(allPoints);
                    }
                }, 300);
            }
        }
    };

    const handleResetStep = () => {
        setTempPoints([]);
    };

    const handleSkip = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            setTempPoints([]);
        } else {
            onComplete(points);
        }
    };

    const handleZoomIn = () => setZoom(Math.min(3, zoom + 0.2));
    const handleZoomOut = () => setZoom(Math.max(0.5, zoom - 0.2));

    const handleRetry = () => {
        setRetryKey(prev => prev + 1);
    };

    // --- Render ---
    return (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <Target size={20} />
                    <div>
                        <h2 className="text-lg font-bold">Asistente DSD</h2>
                        <p className="text-sm text-purple-200">Paso {currentStep + 1} de {STEPS.length}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                    <X size={24} />
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative bg-black overflow-hidden" ref={containerRef}>
                {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader size={40} className="animate-spin text-purple-400" />
                        <span className="text-white ml-3 text-sm font-bold">Cargando imagen...</span>
                    </div>
                )}
                {imageError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                        <AlertCircle size={48} className="text-red-400 mb-4" />
                        <p className="text-lg font-bold">Error al cargar la imagen</p>
                        <p className="text-sm text-gray-400 max-w-md">{errorMessage || 'Verifica que la URL sea accesible.'}</p>
                        <button
                            onClick={handleRetry}
                            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold text-sm"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                {imageLoaded && (
                    <div className="w-full h-full flex items-center justify-center">
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-full cursor-crosshair"
                            onClick={handleCanvasClick}
                        />
                    </div>
                )}
                {/* Controles de zoom */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={handleZoomOut} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">
                        <Minus size={20} />
                    </button>
                    <span className="text-white text-xs font-bold px-3 py-2 bg-white/10 rounded-lg">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">
                        <Plus size={20} />
                    </button>
                </div>
                {/* Progress */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="flex gap-1">
                        {STEPS.map((s, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${
                                    i < currentStep ? 'w-8 bg-purple-500' :
                                    i === currentStep ? 'w-8 bg-purple-400 animate-pulse' :
                                    'w-4 bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 p-4 flex justify-between items-center shrink-0 border-t border-gray-800">
                <div className="flex gap-2">
                    <button
                        onClick={handleResetStep}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold"
                    >
                        ↺ Reiniciar paso
                    </button>
                    <button
                        onClick={handleSkip}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold flex items-center gap-2"
                    >
                        Saltar <ArrowRight size={14} />
                    </button>
                </div>
                <div className="text-white/60 text-xs">
                    {tempPoints.length}/{step.points} puntos marcados
                </div>
            </div>
        </div>
    );
}