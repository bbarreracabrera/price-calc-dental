// src/components/DSDStudio.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X, RotateCw, Sun, Contrast, Download, Save,
    Grid3x3, Minus, Plus, Move, Zap, Palette, Settings, Presentation,
    PenTool, Square, Type, Eraser, Ruler, Check,
    AlertCircle, RefreshCw, Upload, Loader, Target, HelpCircle,
    ChevronRight, ChevronLeft, CheckCircle, Circle
} from 'lucide-react';
import {
    calculateToothBoxes, calculateSmileCurve, generateProportionReport
} from '../utils/dsdProportions';
import { getAllSmileStyles, getSmileStyle } from '../utils/smileStyles';
import DSDPresentationMode from './DSDPresentationMode';
import DSDAssistant from './DSDAssistant';

const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'];
const BRUSH_SIZES = [1, 2, 4, 6, 8, 12];

// Altura promedio del incisivo central superior, usada para calibrar
// automáticamente sin bloquear la UI con un prompt(). Ajustable después
// por el usuario desde el panel del Paso 2.
const ALTURA_INCISIVO_PROMEDIO_MM = 10.4;

const STEPS = [
    { id: 'analysis', label: 'Análisis Facial', icon: Target },
    { id: 'proportions', label: 'Proporciones', icon: Ruler },
    { id: 'style', label: 'Estilo', icon: Palette },
    { id: 'refine', label: 'Ajuste Fino', icon: PenTool },
    { id: 'present', label: 'Presentación', icon: Presentation },
];

export default function DSDStudio({
    imageUrl,
    onClose,
    onSave,
    onDownload,
    patientName,
    projectImages = [],
    onSwitchImage,
    currentImageId,
    supabase
}) {
    // --- REFERENCIAS ---
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // --- ESTADOS DE PASO ---
    const [currentStep, setCurrentStep] = useState(0);
    const [stepCompleted, setStepCompleted] = useState([false, false, false, false, false]);

    // --- ESTADOS DE IMAGEN ---
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // --- CALIBRACIÓN Y REFERENCIAS ---
    const [pixelPerMM, setPixelPerMM] = useState(null);
    const [referencePoints, setReferencePoints] = useState(null);

    // --- OVERLAYS ---
    const [overlays, setOverlays] = useState({
        midline: false,
        interpupillary: false,
        commissural: false,
        smileCurve: false,
        teethBoxes: false,
        proportionGrid: false,
        toothShapes: false,
    });
    const [overlayOpacity, setOverlayOpacity] = useState(0.5);
    const [overlayPositions, setOverlayPositions] = useState({
        midline: 0.5,
        interpupillary: 0.25,
        commissural: 0.65,
        smileCurveIntensity: 0.5,
    });
    const [draggingOverlay, setDraggingOverlay] = useState(null);

    // --- PROPORCIONES ---
    const [proportionTheory, setProportionTheory] = useState('RED');
    const [referenceWidth, setReferenceWidth] = useState(8);
    const [teethBoxes, setTeethBoxes] = useState([]);

    // --- DIBUJO ---
    const [drawMode, setDrawMode] = useState('pointer');
    const [drawColor, setDrawColor] = useState('#FF0000');
    const [drawSize, setDrawSize] = useState(4);
    const [drawings, setDrawings] = useState([]);
    const [currentDrawing, setCurrentDrawing] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // --- ESTILOS ---
    const [selectedStyleId, setSelectedStyleId] = useState('oval');
    const smileStyles = getAllSmileStyles();
    const currentStyle = getSmileStyle(selectedStyleId);

    // --- PRESENTACIÓN ---
    const [presentationMode, setPresentationMode] = useState(false);
    const [presentationImage, setPresentationImage] = useState(null);

    // --- UI ---
    const [showAssistant, setShowAssistant] = useState(false);
    const [showHelper, setShowHelper] = useState(false);
    const [autoDesignGenerated, setAutoDesignGenerated] = useState(false);

    // --- NOTIFICACIÓN ---
    const notify = (msg, type = 'info') => {
        if (window.notify) window.notify(msg, type);
        else alert(msg);
    };

    // --- CARGA DE IMAGEN ---
    useEffect(() => {
        if (!imageUrl) {
            setImageError(true);
            setImageLoading(false);
            return;
        }

        setImageLoading(true);
        setImageError(false);
        setImageLoaded(false);

        const loadImage = async () => {
            try {
                let urlToLoad = imageUrl;
                if (supabase && imageUrl.includes('supabase.co')) {
                    const { data, error } = await supabase.storage
                        .from('patient-images')
                        .download(imageUrl.split('/').pop());
                    if (error) throw error;
                    const objectURL = URL.createObjectURL(data);
                    urlToLoad = objectURL;
                }

                const response = await fetch(urlToLoad, { credentials: 'include' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);

                const img = new Image();
                img.onload = () => {
                    setImageLoaded(true);
                    setImageLoading(false);
                    imageRef.current = img;
                    drawCanvas();
                    if (urlToLoad.startsWith('blob:')) URL.revokeObjectURL(urlToLoad);
                };
                img.onerror = () => {
                    setImageError(true);
                    setImageLoading(false);
                    notify('Error al cargar la imagen', 'error');
                };
                img.src = objectURL;
            } catch (error) {
                console.error('Error loading image:', error);
                setImageError(true);
                setImageLoading(false);
                notify('No se pudo cargar la imagen. Verifica la URL.', 'error');
            }
        };

        loadImage();
    }, [imageUrl, supabase]);

    // --- REDIBUJAR ---
    useEffect(() => {
        if (imageLoaded) drawCanvas();
    }, [
        imageLoaded,
        brightness, contrast, saturation, rotation, scale, pan,
        overlays, overlayOpacity, overlayPositions,
        proportionTheory, referenceWidth, pixelPerMM,
        drawings, selectedStyleId, teethBoxes
    ]);

    // --- CÁLCULO DE CAJAS DENTALES (separado del dibujo) ---
    // FIX: antes este cálculo vivía dentro de drawOverlays() y llamaba a
    // setTeethBoxes() en cada frame. Como calculateToothBoxes() devuelve un
    // array NUEVO cada vez, React detectaba un cambio de estado en cada
    // dibujo -> disparaba el useEffect de arriba (que depende de teethBoxes)
    // -> volvía a dibujar -> volvía a calcular -> volvía a setTeethBoxes...
    // un ciclo de renders infinito que se activaba justo al generar el
    // diseño automático (cuando overlays.teethBoxes pasa a true). Ahora el
    // cálculo ocurre en su propio efecto, solo cuando sus inputs reales
    // cambian, y el dibujo simplemente lee del estado.
    useEffect(() => {
        if (!overlays.teethBoxes || !imageLoaded || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const style = getSmileStyle(selectedStyleId);
        const boxes = calculateToothBoxes({
            imageWidth: canvas.width,
            imageHeight: canvas.height,
            midlineX: canvas.width * overlayPositions.midline,
            toothStartY: canvas.height * 0.55,
            toothHeight: canvas.height * 0.25,
            proportionTheory,
            referenceWidth,
            pixelPerMM: pixelPerMM || 10,
            pdiRatio: style?.proportions?.pdi || 0.78
        });
        setTeethBoxes(boxes);
    }, [
        overlays.teethBoxes,
        overlayPositions.midline,
        proportionTheory,
        referenceWidth,
        pixelPerMM,
        imageLoaded,
        selectedStyleId
    ]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        canvas.width = img.width;
        canvas.height = img.height;

        // Imagen
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Overlays
        ctx.save();
        ctx.globalAlpha = overlayOpacity;
        drawOverlays(ctx, canvas);
        ctx.restore();

        // Siluetas dentales
        if (overlays.toothShapes && teethBoxes.length > 0) {
            ctx.save();
            drawToothShapes(ctx, canvas);
            ctx.restore();
        }

        // Dibujos
        ctx.save();
        drawings.forEach(drawing => drawShape(ctx, drawing));
        ctx.restore();

        if (currentDrawing && isDrawing) {
            ctx.save();
            drawShape(ctx, currentDrawing);
            ctx.restore();
        }
    }, [imageLoaded, brightness, contrast, saturation, rotation, scale, pan,
        overlays, overlayOpacity, overlayPositions,
        proportionTheory, referenceWidth, pixelPerMM,
        drawings, currentDrawing, isDrawing, selectedStyleId, teethBoxes]);

    const drawOverlays = (ctx, canvas) => {
        const w = canvas.width;
        const h = canvas.height;

        if (overlays.midline) {
            const x = w * overlayPositions.midline;
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Midline', x + 5, 20);
        }

        if (overlays.interpupillary) {
            const y = h * overlayPositions.interpupillary;
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#FF00FF';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Interpupillary', 5, y - 5);
        }

        if (overlays.commissural) {
            const y = h * overlayPositions.commissural;
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Commissural', 5, y - 5);
        }

        if (overlays.smileCurve) {
            const points = calculateSmileCurve(w, h, overlayPositions.smileCurveIntensity, overlayPositions.commissural);
            ctx.strokeStyle = '#FF6B9D';
            ctx.lineWidth = 3;
            ctx.beginPath();
            points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.fillStyle = '#FF6B9D';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Smile Curve', 5, points[0].y + 20);
        }

        if (overlays.teethBoxes) {
            // FIX: ya no se calcula aquí (ver el useEffect dedicado más arriba).
            // Esto solo dibuja las cajas que ya están en el estado `teethBoxes`.
            ctx.strokeStyle = '#00CCFF';
            ctx.lineWidth = 2;
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#00CCFF';
            teethBoxes.forEach(box => {
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.fillText(box.id, box.x + 5, box.y + 15);
                if (box.width && box.height) {
                    const ratio = (box.width / box.height).toFixed(2);
                    ctx.fillText(ratio, box.x + 5, box.y + box.height - 5);
                }
            });
        }

        if (overlays.proportionGrid) {
            const cellW = w / 3;
            const cellH = h / 3;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            for (let i = 1; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(cellW * i, 0);
                ctx.lineTo(cellW * i, h);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, cellH * i);
                ctx.lineTo(w, cellH * i);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }
    };

    const drawToothShapes = (ctx, canvas) => {
        const style = getSmileStyle(selectedStyleId);
        if (!style || !style.toothShapes) return;

        const boxes = teethBoxes;
        if (!boxes || boxes.length === 0) return;

        const shapeColor = style.colorHex || '#00CCFF';
        ctx.strokeStyle = shapeColor;
        ctx.lineWidth = 2;
        ctx.fillStyle = shapeColor + '20';
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#FFF';

        boxes.forEach(box => {
            const toothId = box.id;
            let toothType = 'central';
            if (toothId >= 12 && toothId <= 22) toothType = 'central';
            else if (toothId >= 13 && toothId <= 23) toothType = 'lateral';
            else if (toothId >= 14 && toothId <= 24) toothType = 'canine';
            else if (toothId >= 15 && toothId <= 25) toothType = 'premolar';
            else if (toothId >= 16 && toothId <= 26) toothType = 'molar';

            const shapePoints = style.toothShapes[toothType];
            if (!shapePoints) return;

            const scaledPoints = shapePoints.map(p => ({
                x: box.x + p.x * box.width,
                y: box.y + p.y * box.height
            }));

            ctx.beginPath();
            scaledPoints.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(box.id, box.x + 5, box.y + 15);
        });
    };

    const drawShape = (ctx, drawing) => {
        if (!drawing) return;
        ctx.save();
        ctx.strokeStyle = drawing.color || '#FF0000';
        ctx.fillStyle = drawing.color || '#FF0000';
        ctx.lineWidth = drawing.size || 2;
        ctx.globalAlpha = drawing.opacity || 1;

        switch (drawing.type) {
            case 'pen':
                if (drawing.points && drawing.points.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
                    for (let i = 1; i < drawing.points.length; i++) {
                        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
                    }
                    ctx.stroke();
                }
                break;
            case 'line':
                if (drawing.start && drawing.end) {
                    ctx.beginPath();
                    ctx.moveTo(drawing.start.x, drawing.start.y);
                    ctx.lineTo(drawing.end.x, drawing.end.y);
                    ctx.stroke();
                }
                break;
            case 'rect':
                if (drawing.start && drawing.end) {
                    const x = Math.min(drawing.start.x, drawing.end.x);
                    const y = Math.min(drawing.start.y, drawing.end.y);
                    const w = Math.abs(drawing.end.x - drawing.start.x);
                    const h = Math.abs(drawing.end.y - drawing.start.y);
                    ctx.strokeRect(x, y, w, h);
                }
                break;
            case 'text':
                if (drawing.position && drawing.text) {
                    ctx.font = `${drawing.size * 4}px Arial`;
                    ctx.fillText(drawing.text, drawing.position.x, drawing.position.y);
                }
                break;
            default:
                break;
        }
        ctx.restore();
    };

    // --- MANEJADORES DE MOUSE ---
    const handleCanvasMouseDown = (e) => {
        if (currentStep !== 0 && currentStep !== 1 && currentStep !== 3) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

        if (currentStep === 0) {
            const overlaysToCheck = [
                { id: 'midline', value: overlayPositions.midline, type: 'vertical' },
                { id: 'interpupillary', value: overlayPositions.interpupillary, type: 'horizontal' },
                { id: 'commissural', value: overlayPositions.commissural, type: 'horizontal' },
            ];
            for (const o of overlaysToCheck) {
                if (!overlays[o.id]) continue;
                const pos = o.type === 'vertical' ? overlayPositions[o.id] * canvasRef.current.width : overlayPositions[o.id] * canvasRef.current.height;
                const coord = o.type === 'vertical' ? x : y;
                if (Math.abs(coord - pos) < 15) {
                    setDraggingOverlay(o.id);
                    return;
                }
            }
            return;
        }

        if (currentStep === 3) {
            if (drawMode !== 'pointer') {
                setIsDrawing(true);
                const newDrawing = {
                    type: drawMode,
                    color: drawColor,
                    size: drawSize,
                    points: drawMode === 'pen' ? [{ x, y }] : [],
                    start: drawMode === 'line' || drawMode === 'rect' ? { x, y } : null,
                    end: null,
                    position: drawMode === 'text' ? { x, y } : null,
                    text: '',
                };
                setCurrentDrawing(newDrawing);
            }
        }
    };

    const handleCanvasMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

        if (draggingOverlay) {
            const id = draggingOverlay;
            const isVertical = id === 'midline';
            const newPos = isVertical ? x / canvasRef.current.width : y / canvasRef.current.height;
            setOverlayPositions(prev => ({
                ...prev,
                [id]: Math.max(0, Math.min(1, newPos))
            }));
            return;
        }

        if (isDrawing && currentDrawing && currentStep === 3) {
            const updated = { ...currentDrawing };
            if (drawMode === 'pen') {
                updated.points = [...updated.points, { x, y }];
            } else if (drawMode === 'line' || drawMode === 'rect') {
                updated.end = { x, y };
            }
            setCurrentDrawing(updated);
        }
    };

    const handleCanvasMouseUp = () => {
        if (draggingOverlay) {
            setDraggingOverlay(null);
            return;
        }

        if (isDrawing && currentDrawing && currentStep === 3) {
            let finalDrawing = { ...currentDrawing };
            if (drawMode === 'text') {
                const text = prompt('Texto:', '');
                if (text) {
                    finalDrawing.text = text;
                    setDrawings([...drawings, finalDrawing]);
                }
            } else if (drawMode === 'line' || drawMode === 'rect') {
                if (currentDrawing.start && currentDrawing.end) {
                    setDrawings([...drawings, finalDrawing]);
                }
            } else if (drawMode === 'pen') {
                if (currentDrawing.points && currentDrawing.points.length > 1) {
                    setDrawings([...drawings, finalDrawing]);
                }
            } else if (drawMode === 'eraser') {
                if (drawings.length > 0) {
                    setDrawings(drawings.slice(0, -1));
                }
            }
            setCurrentDrawing(null);
            setIsDrawing(false);
        }
    };

    // --- GENERACIÓN AUTOMÁTICA DE DISEÑO ---
    const generateAutoDesign = () => {
        if (!referencePoints) {
            notify('Primero ejecuta el Asistente para posicionar los puntos de referencia.', 'info');
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const w = canvas.width;
        const h = canvas.height;

        // Extraer puntos del asistente
        const midline = referencePoints.midline || [{ x: w * 0.5, y: 0 }, { x: w * 0.5, y: h }];
        const commissure = referencePoints.commissure || [{ x: w * 0.2, y: h * 0.65 }, { x: w * 0.8, y: h * 0.65 }];
        const toothBounds = referencePoints.tooth_bounds || [{ x: w * 0.25, y: h * 0.55 }, { x: w * 0.75, y: h * 0.55 }];
        const toothHeight = referencePoints.tooth_height || [{ x: w * 0.5, y: h * 0.55 }, { x: w * 0.5, y: h * 0.45 }];

        // Calcular posiciones
        const midlineX = (midline[0].x + midline[1].x) / 2;
        const smileY = (commissure[0].y + commissure[1].y) / 2;
        const toothHeightPx = Math.abs(toothHeight[1].y - toothHeight[0].y);

        // Verificar que la altura sea válida
        if (toothHeightPx < 1) {
            notify('❌ La altura del diente es muy pequeña. Revisa los puntos del asistente.', 'error');
            return;
        }

        // Calibración
        // FIX: antes usaba window.prompt() para pedir la altura real en mm,
        // lo cual bloquea la UI y va en contra de que el flujo sea autónomo.
        // Ahora calibra automáticamente con la altura promedio del incisivo
        // central (10.4mm) y avisa por notificación, sin interrumpir el flujo.
        // El usuario puede seguir ajustando "Ancho de referencia" en el
        // panel del Paso 2 si necesita más precisión.
        let ratio = pixelPerMM;
        if (!ratio) {
            ratio = toothHeightPx / ALTURA_INCISIVO_PROMEDIO_MM;
            setPixelPerMM(ratio);
            notify(`Calibración automática: ${ratio.toFixed(2)} px/mm (basada en 10.4mm promedio, ajustable después)`, 'info');
        }

        // Calcular cajas dentales
        const boxes = calculateToothBoxes({
            imageWidth: w,
            imageHeight: h,
            midlineX: midlineX,
            toothStartY: smileY - toothHeightPx * 1.2,
            toothHeight: toothHeightPx * 0.9,
            proportionTheory,
            referenceWidth,
            pixelPerMM: ratio || 10,
            pdiRatio: currentStyle?.proportions?.pdi || 0.78
        });

        setTeethBoxes(boxes);
        setOverlayPositions({
            midline: midlineX / w,
            interpupillary: 0.25,
            commissural: smileY / h,
            smileCurveIntensity: 0.6
        });

        setOverlays({
            midline: true,
            interpupillary: true,
            commissural: true,
            teethBoxes: true,
            toothShapes: true,
            smileCurve: true,
            proportionGrid: false,
        });

        // FIX CRÍTICO: esto era `setAutoDesignGenerated = true;` — una
        // reasignación de la función setter (declarada con const), lo cual
        // lanza un TypeError en tiempo de ejecución y corta la ejecución
        // ANTES de llegar a setStepCompleted, notify() y setCurrentStep(3).
        // Por eso el flujo se quedaba "colgado" justo al generar el diseño
        // automático: las cajas y overlays sí se aplicaban, pero el paso
        // nunca avanzaba ni se mostraba el mensaje de éxito.
        setAutoDesignGenerated(true);
        setStepCompleted(prev => {
            const newCompleted = [...prev];
            newCompleted[1] = true;
            newCompleted[2] = true;
            return newCompleted;
        });
        notify('✨ ¡Diseño generado automáticamente! Revisa el resultado y ajústalo si lo deseas.', 'success');
        setCurrentStep(3);
    };

    // --- ACCIONES DE PASOS ---
    const goToStep = (step) => {
        // FIX: la condición original era
        // `step === 0 || stepCompleted[step] || step === 0` (duplicada y
        // demasiado estricta: solo dejaba entrar a un paso si ESE paso ya
        // estaba completo). Ahora también permite avanzar si el paso
        // ANTERIOR está completo, que es el comportamiento esperado.
        if (step === 0 || stepCompleted[step - 1] || stepCompleted[step]) {
            setCurrentStep(step);
        } else {
            notify('Completa los pasos anteriores primero.', 'info');
        }
    };

    const completeStep = (stepIndex) => {
        setStepCompleted(prev => {
            const newCompleted = [...prev];
            newCompleted[stepIndex] = true;
            return newCompleted;
        });
        if (stepIndex < STEPS.length - 1) {
            setCurrentStep(stepIndex + 1);
        }
    };

    const handleNextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // --- OTRAS ACCIONES ---
    const resetView = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setRotation(0);
        setScale(1);
        setPan({ x: 0, y: 0 });
        setDrawings([]);
        setOverlayPositions({
            midline: 0.5,
            interpupillary: 0.25,
            commissural: 0.65,
            smileCurveIntensity: 0.5,
        });
    };

    const handleDownload = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            if (onDownload) {
                onDownload(dataUrl);
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `DSD_${Date.now()}.png`;
                link.click();
            }
        } else {
            notify('No hay imagen para descargar', 'error');
        }
    };

    const handleSave = () => {
        if (canvasRef.current && onSave) {
            onSave(canvasRef.current.toDataURL('image/png'));
        } else if (canvasRef.current && !onSave) {
            handleDownload();
        } else {
            notify('No hay imagen para guardar', 'error');
        }
    };

    const handleStyleChange = (styleId) => {
        setSelectedStyleId(styleId);
        const style = getSmileStyle(styleId);
        if (style) {
            const theoryMap = {
                'oval': 'GOLDEN',
                'triangular': 'RED',
                'rectangular': 'CHU',
                'square': 'PDI'
            };
            if (theoryMap[styleId]) setProportionTheory(theoryMap[styleId]);
            const curveMap = {
                'oval': 0.6,
                'triangular': 0.8,
                'rectangular': 0.4,
                'square': 0.5
            };
            if (curveMap[styleId] !== undefined) {
                setOverlayPositions(prev => ({
                    ...prev,
                    smileCurveIntensity: curveMap[styleId]
                }));
            }
            setOverlays(prev => ({ ...prev, toothShapes: true }));
            setStepCompleted(prev => {
                const newCompleted = [...prev];
                newCompleted[2] = true;
                return newCompleted;
            });
        }
    };

    const generateReport = () => {
        const report = generateProportionReport({
            proportionTheory,
            referenceWidth,
            pixelPerMM: pixelPerMM || 10
        });
        alert(JSON.stringify(report, null, 2));
    };

    const handlePresentation = () => {
        if (canvasRef.current) {
            setPresentationImage(canvasRef.current.toDataURL('image/png'));
            setPresentationMode(true);
        } else {
            notify('No hay imagen para presentar', 'error');
        }
    };

    const handleSwitchImage = (imgId) => {
        if (onSwitchImage) {
            onSwitchImage(imgId);
        }
    };

    // --- RENDER DEL PANEL DERECHO POR PASO ---
    const renderStepPanel = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <Target size={16} className="text-purple-400" />
                                Análisis Facial
                            </h3>
                            <p className="text-gray-300 text-xs mt-2">
                                Coloca los puntos de referencia faciales para calibrar el diseño.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => setShowAssistant(true)}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Target size={16} /> Abrir Asistente
                            </button>
                            <p className="text-gray-400 text-[10px] text-center">
                                {referencePoints ? '✅ Puntos establecidos' : '❌ Sin puntos'}
                            </p>
                        </div>

                        {referencePoints && (
                            <div className="space-y-2">
                                <p className="text-gray-300 text-xs font-bold">Overlays disponibles:</p>
                                <div className="grid grid-cols-2 gap-1">
                                    {['midline', 'interpupillary', 'commissural'].map(key => (
                                        <button
                                            key={key}
                                            onClick={() => setOverlays(prev => ({ ...prev, [key]: !prev[key] }))}
                                            className={`px-2 py-1 rounded text-xs font-bold transition ${overlays[key] ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                        >
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-gray-400 text-[9px]">Arrastra las líneas para ajustarlas</p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (referencePoints) {
                                    completeStep(0);
                                } else {
                                    notify('Ejecuta el asistente primero.', 'error');
                                }
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            disabled={!referencePoints}
                        >
                            <Check size={16} /> Completar Paso 1
                        </button>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <Ruler size={16} className="text-purple-400" />
                                Proporciones Dentales
                            </h3>
                            <p className="text-gray-300 text-xs mt-2">
                                Selecciona la teoría de proporciones y ajusta los valores.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-gray-300 text-xs">Teoría de Proporciones</label>
                            <select
                                value={proportionTheory}
                                onChange={(e) => setProportionTheory(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded p-2 text-sm"
                            >
                                <option value="RED">RED Proportion</option>
                                <option value="GOLDEN">Golden Proportion</option>
                                <option value="CHU">Chu Proportion</option>
                                <option value="PDI">PDI</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-300 text-xs">Ancho de referencia (mm): {referenceWidth}</label>
                            <input type="number" min="4" max="12" value={referenceWidth} onChange={(e) => setReferenceWidth(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded p-1" />
                        </div>

                        {pixelPerMM && (
                            <div className="bg-gray-800 rounded-lg p-3">
                                <p className="text-gray-300 text-xs font-bold">Calibración activa</p>
                                <p className="text-emerald-400 text-sm font-bold">{pixelPerMM.toFixed(2)} px/mm</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (referencePoints) {
                                        generateAutoDesign();
                                    } else {
                                        notify('Primero completa el paso 1.', 'error');
                                    }
                                }}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} /> Recalcular
                            </button>
                            <button
                                onClick={generateReport}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-sm"
                            >
                                Ver Reporte
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                if (teethBoxes.length > 0) {
                                    completeStep(1);
                                } else {
                                    notify('Genera o recarga el diseño primero.', 'error');
                                }
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            disabled={teethBoxes.length === 0}
                        >
                            <Check size={16} /> Completar Paso 2
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <Palette size={16} className="text-purple-400" />
                                Estilo de Sonrisa
                            </h3>
                            <p className="text-gray-300 text-xs mt-2">
                                Selecciona el estilo que mejor se adapte al paciente.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                            {smileStyles.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => handleStyleChange(style.id)}
                                    className={`px-2 py-2 rounded text-xs font-bold transition border ${
                                        selectedStyleId === style.id
                                            ? 'bg-purple-600 text-white border-purple-400'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
                                    }`}
                                    style={{ borderColor: selectedStyleId === style.id ? style.colorHex : undefined }}
                                >
                                    <div className="flex items-center gap-1 justify-center">
                                        <span className="text-lg">{style.emoji}</span>
                                        <span>{style.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                            <p className="text-gray-300 text-xs font-bold uppercase">Personalidad: {currentStyle?.personality?.primary || '—'}</p>
                            <p className="text-gray-400 text-[10px] mt-1">{currentStyle?.proposal?.description || ''}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-gray-300 text-xs">Intensidad Curva: {Math.round(overlayPositions.smileCurveIntensity * 100)}%</label>
                            <input type="range" min="0" max="1" step="0.1" value={overlayPositions.smileCurveIntensity} onChange={(e) => setOverlayPositions(prev => ({ ...prev, smileCurveIntensity: Number(e.target.value) }))} className="w-full" />
                        </div>

                        <button
                            onClick={() => {
                                if (selectedStyleId) {
                                    completeStep(2);
                                }
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <Check size={16} /> Completar Paso 3
                        </button>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <PenTool size={16} className="text-purple-400" />
                                Ajuste Fino
                            </h3>
                            <p className="text-gray-300 text-xs mt-2">
                                Realiza ajustes manuales con las herramientas de dibujo.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                            <button
                                onClick={() => setDrawMode('pointer')}
                                className={`p-2 rounded ${drawMode === 'pointer' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                                title="Seleccionar / Mover"
                            >
                                <Move size={16} />
                            </button>
                            <button
                                onClick={() => setDrawMode('pen')}
                                className={`p-2 rounded ${drawMode === 'pen' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                                title="Lápiz"
                            >
                                <PenTool size={16} />
                            </button>
                            <button
                                onClick={() => setDrawMode('line')}
                                className={`p-2 rounded ${drawMode === 'line' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                                title="Línea"
                            >
                                <Minus size={16} />
                            </button>
                            <button
                                onClick={() => setDrawMode('rect')}
                                className={`p-2 rounded ${drawMode === 'rect' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                                title="Rectángulo"
                            >
                                <Square size={16} />
                            </button>
                            <button
                                onClick={() => setDrawMode('text')}
                                className={`p-2 rounded ${drawMode === 'text' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                                title="Texto"
                            >
                                <Type size={16} />
                            </button>
                            <button
                                onClick={() => setDrawMode('eraser')}
                                className={`p-2 rounded ${drawMode === 'eraser' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                                title="Borrador"
                            >
                                <Eraser size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={drawColor}
                                onChange={(e) => setDrawColor(e.target.value)}
                                className="bg-gray-700 text-white rounded p-1 text-sm flex-1"
                            >
                                {COLORS.map(c => (
                                    <option key={c} value={c} style={{ backgroundColor: c, color: '#fff' }}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={drawSize}
                                onChange={(e) => setDrawSize(Number(e.target.value))}
                                className="bg-gray-700 text-white rounded p-1 text-sm"
                            >
                                {BRUSH_SIZES.map(s => (
                                    <option key={s} value={s}>{s}px</option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    setDrawings([]);
                                    notify('Dibujos eliminados');
                                }}
                                className="p-2 bg-red-700 hover:bg-red-800 rounded text-white text-xs"
                            >
                                🗑️
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setOverlays(prev => ({ ...prev, toothShapes: !prev.toothShapes }));
                                }}
                                className={`flex-1 py-2 rounded text-xs font-bold transition ${overlays.toothShapes ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {overlays.toothShapes ? '👁️ Siluetas ON' : '👁️ Siluetas OFF'}
                            </button>
                            <button
                                onClick={() => {
                                    setOverlays(prev => ({ ...prev, teethBoxes: !prev.teethBoxes }));
                                }}
                                className={`flex-1 py-2 rounded text-xs font-bold transition ${overlays.teethBoxes ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {overlays.teethBoxes ? '📐 Cajas ON' : '📐 Cajas OFF'}
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                completeStep(3);
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <Check size={16} /> Finalizar Diseño
                        </button>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <Presentation size={16} className="text-purple-400" />
                                Presentación
                            </h3>
                            <p className="text-gray-300 text-xs mt-2">
                                Tu diseño está listo. Preséntalo al paciente o genera el informe.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={handlePresentation}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Presentation size={16} /> Modo Presentación
                            </button>
                            <button
                                onClick={() => {
                                    if (canvasRef.current) {
                                        const dataUrl = canvasRef.current.toDataURL('image/png');
                                        const link = document.createElement('a');
                                        link.href = dataUrl;
                                        link.download = `DSD_${patientName || 'paciente'}_${Date.now()}.png`;
                                        link.click();
                                        notify('Diseño descargado');
                                    }
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Download size={16} /> Descargar Imagen
                            </button>
                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Guardar en Paciente
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                            <p className="text-gray-400 text-xs">Diseño completado con éxito 🎉</p>
                            <p className="text-gray-500 text-[10px] mt-1">Estilo: {currentStyle?.name} | Teoría: {proportionTheory}</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- RENDER PRINCIPAL ---
    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Palette size={20} /> DSD Studio
                    </h2>
                    <p className="text-sm text-purple-200">{patientName || 'Nuevo Caso'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* --- CANVAS --- */}
                <div className="flex-1 flex flex-col gap-2 bg-black rounded-lg p-2 overflow-hidden">
                    <div
                        ref={containerRef}
                        className="flex-1 flex items-center justify-center overflow-auto bg-black rounded relative"
                    >
                        {imageLoading && (
                            <div className="flex flex-col items-center justify-center text-white">
                                <Loader size={40} className="animate-spin text-purple-400 mb-4" />
                                <p className="text-sm font-bold">Cargando imagen...</p>
                            </div>
                        )}
                        {imageError && (
                            <div className="flex flex-col items-center justify-center text-white">
                                <AlertCircle size={40} className="text-red-400 mb-4" />
                                <p className="text-sm font-bold">No se pudo cargar la imagen</p>
                                <p className="text-xs text-gray-400 mt-2">Verifica la URL o intenta con otra imagen.</p>
                            </div>
                        )}
                        {imageLoaded && (
                            <canvas
                                ref={canvasRef}
                                className="max-w-full max-h-full cursor-crosshair"
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                            />
                        )}
                    </div>

                    {/* Barra inferior de navegación entre pasos */}
                    <div className="bg-gray-800 p-2 rounded flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1">
                            {STEPS.map((step, index) => (
                                <button
                                    key={step.id}
                                    onClick={() => goToStep(index)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                                        currentStep === index
                                            ? 'bg-purple-600 text-white'
                                            : stepCompleted[index]
                                            ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                                    disabled={index > 0 && !stepCompleted[index - 1] && index !== currentStep}
                                >
                                    {stepCompleted[index] ? <Check size={12} /> : <Circle size={12} />}
                                    {step.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetView}
                                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
                                title="Resetear vista"
                            >
                                <RefreshCw size={14} />
                            </button>
                            <span className="text-white text-xs">
                                {Math.round(scale * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- PANEL DERECHO (PASO ACTUAL) --- */}
                <div className="w-80 bg-gray-900 rounded-lg p-4 overflow-y-auto shrink-0">
                    {renderStepPanel()}
                </div>
            </div>

            {/* Assistant Modal */}
            {showAssistant && imageUrl && (
                <DSDAssistant
                    imageUrl={imageUrl}
                    onComplete={(points) => {
                        setReferencePoints(points);
                        setShowAssistant(false);
                        // Auto-calcular calibración
                        // FIX: antes usaba window.prompt() (bloqueante) para pedir
                        // la altura real del incisivo. Ahora calibra sola con el
                        // promedio antropométrico, sin interrumpir el flujo.
                        if (points.tooth_height && points.tooth_height.length === 2) {
                            const canvas = canvasRef.current;
                            if (canvas) {
                                const toothHeightPx = Math.abs(points.tooth_height[1].y - points.tooth_height[0].y);
                                if (toothHeightPx > 0) {
                                    const ratio = toothHeightPx / ALTURA_INCISIVO_PROMEDIO_MM;
                                    setPixelPerMM(ratio);
                                    notify(`Calibración automática: ${ratio.toFixed(2)} px/mm (ajustable en el panel)`, 'info');
                                } else {
                                    notify('⚠️ La altura del diente es 0. Verifica los puntos.', 'error');
                                }
                            }
                        }
                        // Activar overlays
                        setOverlays(prev => ({
                            ...prev,
                            midline: true,
                            interpupillary: true,
                            commissural: true,
                        }));
                        // Generar diseño automáticamente
                        if (points.midline && points.commissure && points.tooth_height) {
                            setTimeout(() => generateAutoDesign(), 500);
                        }
                        notify('✅ Puntos guardados. El diseño se ha generado automáticamente.');
                    }}
                    onClose={() => setShowAssistant(false)}
                    selectedStyleId={selectedStyleId}
                    supabase={supabase}
                />
            )}

            {/* Presentation Mode */}
            {presentationMode && presentationImage && (
                <DSDPresentationMode
                    canvasImage={presentationImage}
                    patientName={patientName}
                    selectedStyle={selectedStyleId}
                    onClose={() => setPresentationMode(false)}
                    onDownload={(styleId) => {
                        const link = document.createElement('a');
                        link.href = presentationImage;
                        link.download = `DSD_${styleId}_${Date.now()}.png`;
                        link.click();
                    }}
                />
            )}
        </div>
    );
}
