import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { getAllSmileStyles, generateStylePresentation } from '../utils/smileStyles';

/**
 * DSD Presentation Mode
 * Vista limpia y profesional para presentar diseños al paciente
 * Fondo negro, sin distracciones, solo el diseño y la propuesta
 */
export default function DSDPresentationMode({ 
    canvasImage, 
    patientName, 
    selectedStyle,
    onClose, 
    onDownload 
}) {
    const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
    const styles = getAllSmileStyles();
    const currentStyle = styles[currentStyleIndex];
    const presentation = generateStylePresentation(currentStyle.id);
    
    useEffect(() => {
        // Si hay un estilo seleccionado, mostrar ese primero
        if (selectedStyle) {
            const index = styles.findIndex(s => s.id === selectedStyle);
            if (index >= 0) setCurrentStyleIndex(index);
        }
    }, [selectedStyle]);
    
    const handlePrevStyle = () => {
        setCurrentStyleIndex((prev) => (prev - 1 + styles.length) % styles.length);
    };
    
    const handleNextStyle = () => {
        setCurrentStyleIndex((prev) => (prev + 1) % styles.length);
    };
    
    const handleDownloadPresentation = () => {
        if (onDownload) {
            onDownload(currentStyle.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
            {/* Header Minimalista */}
            <div className="flex items-center justify-between px-6 py-4 bg-black border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: currentStyle.colorHex }}
                    />
                    <h2 className="text-white font-black text-lg uppercase tracking-widest">
                        {currentStyle.name}
                    </h2>
                    <span className="text-white/40 text-sm">— {currentStyle.description}</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-8 p-8 overflow-hidden">
                {/* Canvas Area - 60% */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl overflow-hidden border border-white/10">
                        {canvasImage ? (
                            <img 
                                src={canvasImage} 
                                alt="DSD Design"
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <div className="text-white/40 text-center">
                                <p className="text-sm">Cargando diseño...</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrevStyle}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition text-white border border-white/10"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-white/40 text-sm">
                            {currentStyleIndex + 1} de {styles.length} estilos
                        </div>
                        <button
                            onClick={handleNextStyle}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition text-white border border-white/10"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Info Panel - 40% */}
                <div className="w-96 flex flex-col gap-6 overflow-y-auto">
                    {/* Propuesta Principal */}
                    <div className="space-y-3">
                        <h3 className="text-white font-black text-2xl leading-tight">
                            {presentation.title}
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                            {presentation.description}
                        </p>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Personalidad */}
                    <div className="space-y-3">
                        <h4 className="text-white/40 text-xs font-black uppercase tracking-widest">
                            Personalidad Asociada
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: currentStyle.colorHex }}
                                />
                                <span className="text-white font-bold text-sm">
                                    {presentation.personality.primary}
                                </span>
                                <span className="text-white/40 text-sm">
                                    ({presentation.personality.secondary})
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {presentation.personality.traits.map((trait, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 text-[10px] font-medium"
                                    >
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Beneficios */}
                    <div className="space-y-3">
                        <h4 className="text-white/40 text-xs font-black uppercase tracking-widest">
                            Beneficios de Este Diseño
                        </h4>
                        <div className="space-y-2">
                            {presentation.benefits.map((benefit, i) => (
                                <p key={i} className="text-white/70 text-sm">
                                    {benefit}
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Proporciones */}
                    <div className="space-y-2">
                        <h4 className="text-white/40 text-xs font-black uppercase tracking-widest">
                            Teoría de Proporciones
                        </h4>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
                            <p className="text-white font-bold text-sm">
                                {presentation.proportions.theory}
                            </p>
                            <p className="text-white/60 text-xs">
                                {presentation.proportions.description}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Ideal Para */}
                    <div className="space-y-2">
                        <h4 className="text-white/40 text-xs font-black uppercase tracking-widest">
                            Ideal Para
                        </h4>
                        <p className="text-white/70 text-sm italic">
                            "{presentation.idealFor}"
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto pt-4 space-y-2">
                        <button
                            onClick={handleDownloadPresentation}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
                        >
                            <Download size={18} />
                            Descargar Propuesta
                        </button>
                        <button
                            onClick={() => {
                                // Copiar al portapapeles o compartir
                                navigator.clipboard.writeText(
                                    `${presentation.title}\n${presentation.description}`
                                );
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition border border-white/10"
                        >
                            <Share2 size={18} />
                            Compartir
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="px-8 py-4 bg-black border-t border-white/10 flex items-center justify-between text-white/40 text-xs">
                <span>Paciente: {patientName || 'Sin nombre'}</span>
                <span>DSD Digital Studio © 2026</span>
                <span>Presiona ESC para salir</span>
            </div>
        </div>
    );
}
