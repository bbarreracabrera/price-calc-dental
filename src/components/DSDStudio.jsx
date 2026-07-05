import React, { useState, useRef, useEffect } from 'react';
import {
    X, Crop, RotateCw, Sun, Contrast, Eye, EyeOff, Download, Save,
    Maximize2, Grid3x3, Minus, Plus, Move, Zap, Palette
} from 'lucide-react';

/**
 * DSD Studio - Digital Smile Design Editor
 * Herramienta profesional para diseño de sonrisa con edición de fotos
 * y overlays interactivos de análisis estético
 */
export default function DSDStudio({ imageUrl, onClose, onSave, patientName }) {
    // --- ESTADOS DE EDICIÓN DE FOTO ---
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [cropMode, setCropMode] = useState(false);
    const [cropBox, setCropBox] = useState(null);
    
    // --- ESTADOS DE OVERLAYS ---
    const [activeOverlays, setActiveOverlays] = useState({
        midline: true,
        interpupillary: false,
        commissural: false,
        smileCurve: false,
        teethBoxes: false,
        proportionGrid: false,
    });
    
    const [overlayOpacity, setOverlayOpacity] = useState(0.5);
    const [midlinePosition, setMidlinePosition] = useState(0.5); // 0-1 (izq a der)
    const [smileCurveIntensity, setSmileCurveIntensity] = useState(0.5); // 0-1 (plana a curva)
    
    // --- REFERENCIAS ---
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    // Cargar imagen
    useEffect(() => {
        if (!imageUrl) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            setImageLoaded(true);
            drawCanvas(img);
        };
        img.src = imageUrl;
        imageRef.current = img;
    }, [imageUrl]);

    // Redibujar canvas cuando cambian los controles
    useEffect(() => {
        if (imageLoaded && imageRef.current) {
            drawCanvas(imageRef.current);
        }
    }, [brightness, contrast, saturation, rotation, scale, activeOverlays, overlayOpacity, midlinePosition, smileCurveIntensity]);

    const drawCanvas = (img) => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Ajustar tamaño del canvas
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Aplicar transformaciones
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Aplicar filtros CSS-like
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        
        // Dibujar imagen
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        
        // Dibujar overlays
        drawOverlays(ctx, canvas);
    };

    const drawOverlays = (ctx, canvas) => {
        ctx.save();
        ctx.globalAlpha = overlayOpacity;
        
        const w = canvas.width;
        const h = canvas.height;
        
        // --- LÍNEA MEDIA VERTICAL (Midline) ---
        if (activeOverlays.midline) {
            const midlineX = w * midlinePosition;
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(midlineX, 0);
            ctx.lineTo(midlineX, h);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Etiqueta
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Midline', midlineX + 5, 20);
        }
        
        // --- LÍNEA INTERPUPILAR (Horizontal reference) ---
        if (activeOverlays.interpupillary) {
            const interpupillaryY = h * 0.25; // Aproximadamente 1/4 desde arriba
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, interpupillaryY);
            ctx.lineTo(w, interpupillaryY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#FF00FF';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Interpupillary Line', 5, interpupillaryY - 5);
        }
        
        // --- LÍNEA COMISURAL (Smile line) ---
        if (activeOverlays.commissural) {
            const commissuralY = h * 0.65;
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, commissuralY);
            ctx.lineTo(w, commissuralY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Commissural Line', 5, commissuralY - 5);
        }
        
        // --- CURVA DE SONRISA (Smile Arc) ---
        if (activeOverlays.smileCurve) {
            const curveY = h * 0.65;
            const curveAmplitude = h * 0.15 * smileCurveIntensity;
            
            ctx.strokeStyle = '#FF6B9D';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            for (let x = 0; x < w; x += 5) {
                const normalizedX = x / w; // 0 a 1
                const curveX = normalizedX * Math.PI; // 0 a PI para seno
                const yOffset = Math.sin(curveX) * curveAmplitude;
                const y = curveY - yOffset;
                
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            ctx.fillStyle = '#FF6B9D';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Smile Curve', 5, curveY + 20);
        }
        
        // --- CAJAS DENTALES (Tooth boxes) ---
        if (activeOverlays.teethBoxes) {
            drawTeethBoxes(ctx, w, h);
        }
        
        // --- REJILLA DE PROPORCIONES (Proportion grid) ---
        if (activeOverlays.proportionGrid) {
            drawProportionGrid(ctx, w, h);
        }
        
        ctx.restore();
    };

    const drawTeethBoxes = (ctx, w, h) => {
        const teethY = h * 0.55;
        const teethHeight = h * 0.25;
        const midlineX = w * midlinePosition;
        
        // 6 dientes por lado (simplificado)
        const teethPerSide = 6;
        const toothWidth = (w * 0.35) / teethPerSide;
        
        ctx.strokeStyle = '#00CCFF';
        ctx.lineWidth = 1;
        
        // Dientes izquierdos
        for (let i = 0; i < teethPerSide; i++) {
            const x = midlineX - (i + 1) * toothWidth;
            ctx.strokeRect(x, teethY, toothWidth - 2, teethHeight);
        }
        
        // Dientes derechos
        for (let i = 0; i < teethPerSide; i++) {
            const x = midlineX + i * toothWidth;
            ctx.strokeRect(x, teethY, toothWidth - 2, teethHeight);
        }
    };

    const drawProportionGrid = (ctx, w, h) => {
        // Rejilla de 3x3 para análisis de proporciones
        const cellW = w / 3;
        const cellH = h / 3;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        for (let i = 1; i < 3; i++) {
            // Líneas verticales
            ctx.beginPath();
            ctx.moveTo(cellW * i, 0);
            ctx.lineTo(cellW * i, h);
            ctx.stroke();
            
            // Líneas horizontales
            ctx.beginPath();
            ctx.moveTo(0, cellH * i);
            ctx.lineTo(w, cellH * i);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    };

    const handleReset = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setRotation(0);
        setScale(1);
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        
        const link = document.createElement('a');
        link.href = canvasRef.current.toDataURL('image/png');
        link.download = `DSD-${patientName || 'design'}-${Date.now()}.png`;
        link.click();
    };

    const toggleOverlay = (overlayName) => {
        setActiveOverlays(prev => ({
            ...prev,
            [overlayName]: !prev[overlayName]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">DSD Digital Studio</h2>
                    <p className="text-sm text-blue-200">{patientName || 'Nuevo Caso'}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 flex flex-col gap-2 bg-black rounded-lg p-2 overflow-hidden">
                    <div
                        ref={containerRef}
                        className="flex-1 flex items-center justify-center overflow-auto bg-black rounded"
                    >
                        {imageLoaded && (
                            <canvas
                                ref={canvasRef}
                                className="max-w-full max-h-full cursor-crosshair"
                                style={{
                                    filter: cropMode ? 'brightness(0.5)' : 'none'
                                }}
                            />
                        )}
                    </div>
                    
                    {/* Canvas Controls */}
                    <div className="bg-gray-800 p-3 rounded flex gap-2 flex-wrap">
                        <button
                            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 text-white text-sm"
                        >
                            <Minus size={16} /> Zoom
                        </button>
                        <button
                            onClick={() => setScale(Math.min(2, scale + 0.1))}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 text-white text-sm"
                        >
                            <Plus size={16} /> Zoom
                        </button>
                        <button
                            onClick={() => setRotation((rotation + 90) % 360)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 text-white text-sm"
                        >
                            <RotateCw size={16} /> Rotar
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 text-white text-sm"
                        >
                            <Zap size={16} /> Reset
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 bg-green-700 hover:bg-green-600 rounded flex items-center gap-1 text-white text-sm ml-auto"
                        >
                            <Download size={16} /> Descargar
                        </button>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="w-80 bg-gray-900 rounded-lg p-4 overflow-y-auto space-y-4">
                    {/* Photo Adjustments */}
                    <div className="space-y-3">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <Sun size={16} /> Ajustes de Foto
                        </h3>
                        
                        <div>
                            <label className="text-gray-300 text-xs">Brillo: {brightness}%</label>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={brightness}
                                onChange={(e) => setBrightness(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        
                        <div>
                            <label className="text-gray-300 text-xs">Contraste: {contrast}%</label>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={contrast}
                                onChange={(e) => setContrast(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        
                        <div>
                            <label className="text-gray-300 text-xs">Saturación: {saturation}%</label>
                            <input
                                type="range"
                                min="0"
                                max="150"
                                value={saturation}
                                onChange={(e) => setSaturation(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-700" />

                    {/* Overlays */}
                    <div className="space-y-3">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <Grid3x3 size={16} /> Overlays
                        </h3>
                        
                        <div>
                            <label className="text-gray-300 text-xs">Opacidad: {Math.round(overlayOpacity * 100)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={overlayOpacity}
                                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        
                        {/* Overlay Toggles */}
                        <div className="space-y-2">
                            {[
                                { key: 'midline', label: 'Línea Media', color: 'bg-green-600' },
                                { key: 'interpupillary', label: 'Línea Interpupilar', color: 'bg-pink-600' },
                                { key: 'commissural', label: 'Línea Comisural', color: 'bg-yellow-600' },
                                { key: 'smileCurve', label: 'Curva de Sonrisa', color: 'bg-red-600' },
                                { key: 'teethBoxes', label: 'Cajas Dentales', color: 'bg-cyan-600' },
                                { key: 'proportionGrid', label: 'Rejilla 3x3', color: 'bg-gray-600' },
                            ].map(overlay => (
                                <button
                                    key={overlay.key}
                                    onClick={() => toggleOverlay(overlay.key)}
                                    className={`w-full p-2 rounded text-sm font-medium transition ${
                                        activeOverlays[overlay.key]
                                            ? `${overlay.color} text-white`
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {activeOverlays[overlay.key] ? '✓' : '○'} {overlay.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-gray-700" />

                    {/* Overlay Fine-tuning */}
                    {activeOverlays.midline && (
                        <div className="space-y-2">
                            <label className="text-gray-300 text-xs">Posición Línea Media: {Math.round(midlinePosition * 100)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={midlinePosition}
                                onChange={(e) => setMidlinePosition(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    )}

                    {activeOverlays.smileCurve && (
                        <div className="space-y-2">
                            <label className="text-gray-300 text-xs">Intensidad Curva: {Math.round(smileCurveIntensity * 100)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={smileCurveIntensity}
                                onChange={(e) => setSmileCurveIntensity(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    )}

                    <hr className="border-gray-700" />

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                        <button
                            onClick={() => onSave && onSave(canvasRef.current?.toDataURL('image/png'))}
                            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center justify-center gap-2 transition"
                        >
                            <Save size={18} /> Guardar Diseño
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
