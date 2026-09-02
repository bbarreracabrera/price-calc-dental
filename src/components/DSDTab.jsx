// src/components/DSDTab.jsx
import React, { useState } from 'react';
import {
    Palette, Upload, ImageIcon, Loader, FolderOpen,
    X, Plus, Tag, Check, AlertCircle
} from 'lucide-react';
import { PrivateImage } from './SystemModals';
import DSDStudio from './DSDStudio';

const STORAGE_BUCKET = 'patient-images';

const DEFAULT_LABELS = [
    'Frontal Sonrisa',
    'Frontal Labios Reposo',
    'Perfil',
    'Oclusal Superior',
    'Oclusal Inferior',
    '12 O\'Clock',
    'Otros'
];

export default function DSDTab({
    p,
    getPatient,
    selectedPatientId,
    savePatientData,
    notify,
    supabase,
    config,
    handleImageUpload,
    activeFolder,
    setActiveFolder
}) {
    // --- Estado del proyecto ---
    const [projectImages, setProjectImages] = useState([]);
    const [currentImageId, setCurrentImageId] = useState(null);
    const [dsdModalOpen, setDsdModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [labels, setLabels] = useState(DEFAULT_LABELS);
    const [newLabel, setNewLabel] = useState('');
    const [showLabelEditor, setShowLabelEditor] = useState(false);

    // --- Obtener imágenes de la carpeta activa ---
    const folderImages = p.images?.filter(img => (img.folder || 'Otros') === activeFolder) || [];

    // --- Funciones ---
    const handleAddToProject = (img) => {
        if (!img || !img.url) {
            notify('La imagen no tiene URL válida', 'error');
            return;
        }
        if (projectImages.some(pi => pi.id === img.id)) {
            notify('Esta imagen ya está en el proyecto', 'info');
            return;
        }
        const defaultLabel = labels[0] || 'Sin etiquetar';
        const newImage = { ...img, label: defaultLabel };
        setProjectImages([...projectImages, newImage]);
        if (!currentImageId) {
            setCurrentImageId(newImage.id);
        }
        notify('Imagen agregada al proyecto DSD');
    };

    const handleRemoveFromProject = (imgId) => {
        setProjectImages(projectImages.filter(img => img.id !== imgId));
        if (currentImageId === imgId) {
            const next = projectImages.find(img => img.id !== imgId);
            setCurrentImageId(next ? next.id : null);
        }
    };

    const handleSelectImage = (imgId) => {
        const img = projectImages.find(i => i.id === imgId);
        if (img) {
            setCurrentImageId(imgId);
            setDsdModalOpen(true);
        }
    };

    const handleLabelChange = (imgId, newLabel) => {
        setProjectImages(projectImages.map(img =>
            img.id === imgId ? { ...img, label: newLabel } : img
        ));
    };

    const handleAddLabel = () => {
        if (newLabel.trim() && !labels.includes(newLabel.trim())) {
            setLabels([...labels, newLabel.trim()]);
            setNewLabel('');
        }
    };

    const handleRemoveLabel = (label) => {
        setLabels(labels.filter(l => l !== label));
        setProjectImages(projectImages.map(img =>
            img.label === label ? { ...img, label: labels[0] || 'Sin etiquetar' } : img
        ));
    };

    const handleUpload = (file) => {
        if (!file) return;
        handleImageUpload(file);
        notify('Imagen subida. Agrégala al proyecto desde la galería.', 'info');
    };

    const openDSD = () => {
        if (!currentImageId) {
            notify('Selecciona una imagen del proyecto', 'error');
            return;
        }
        setDsdModalOpen(true);
    };

    const currentImage = projectImages.find(img => img.id === currentImageId);

    // --- Guardar diseño desde el DSDStudio ---
    const handleSaveDesign = async (dataUrl) => {
        if (!dataUrl) {
            notify('No hay diseño para guardar', 'error');
            return;
        }

        if (!supabase) {
            notify('Supabase no está disponible', 'error');
            return;
        }

        setUploading(true);
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const fileName = `DSD_${Date.now()}.png`;
            const filePath = `${selectedPatientId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, blob, {
                    contentType: 'image/png',
                    upsert: false,
                    cacheControl: '3600',
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            if (!urlData || !urlData.publicUrl) {
                throw new Error('No se pudo obtener la URL pública de la imagen');
            }

            const newImage = {
                id: `img_${Date.now()}`,
                url: urlData.publicUrl,
                name: fileName,
                date: new Date().toISOString(),
                folder: 'Diseños Sonrisa',
                is_dsd: true,
                is_sync: false
            };

            const updatedImages = [newImage, ...(p.images || [])];
            await savePatientData(selectedPatientId, { ...p, images: updatedImages });

            setActiveFolder('Diseños Sonrisa');
            notify('✅ Diseño guardado exitosamente en la galería del paciente.');
            setDsdModalOpen(false);
            setSelectedImage(null);

        } catch (error) {
            console.error('Error al guardar diseño:', error);
            notify('Error al guardar el diseño: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (dataUrl) => {
        if (!dataUrl) {
            notify('No hay diseño para descargar', 'error');
            return;
        }
        try {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `DSD_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify('Diseño descargado localmente');
        } catch (error) {
            notify('Error al descargar: ' + error.message, 'error');
        }
    };

    // --- Estado para la imagen seleccionada en el modal ---
    const [selectedImage, setSelectedImage] = useState(null);

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Encabezado */}
            <div className="flex justify-between items-center border-b border-[#DFD2C4]/50 pb-4">
                <div>
                    <h3 className="text-xl font-black text-[#312923] flex items-center gap-2">
                        <Palette className="text-purple-600" size={24} />
                        Diseño de Sonrisa (DSD)
                    </h3>
                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-1">
                        Proyecto: {projectImages.length} imágenes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openDSD}
                        disabled={!currentImageId}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                            currentImageId
                                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Palette size={14} className="inline mr-1" /> Abrir Editor
                    </button>
                    <button
                        onClick={() => setShowLabelEditor(!showLabelEditor)}
                        className="px-3 py-2 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl text-[10px] font-black text-[#9A8F84] hover:text-[#5B6651] transition"
                    >
                        <Tag size={14} className="inline mr-1" /> Etiquetas
                    </button>
                </div>
            </div>

            {/* Editor de etiquetas */}
            {showLabelEditor && (
                <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Nueva etiqueta..."
                            className="flex-1 p-2 rounded-xl border border-[#DFD2C4] bg-white text-sm font-bold outline-none focus:border-[#5B6651]"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                        />
                        <button
                            onClick={handleAddLabel}
                            className="p-2 bg-[#5B6651] text-white rounded-xl hover:bg-[#4a5442] transition"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {labels.map(label => (
                            <span key={label} className="flex items-center gap-1 bg-white border border-[#DFD2C4] rounded-full px-3 py-1 text-[10px] font-bold text-[#5B6651]">
                                {label}
                                <button onClick={() => handleRemoveLabel(label)} className="text-[#9A8F84] hover:text-red-500 transition">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Galería del paciente */}
            <div className="border-b border-[#DFD2C4]/30 pb-4">
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mb-3">Galería del paciente</p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {folderImages.map(img => {
                        const inProject = projectImages.some(pi => pi.id === img.id);
                        return (
                            <div key={img.id} className="relative group">
                                <div className="aspect-square bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#DFD2C4]/30">
                                    <PrivateImage img={img} className="w-full h-full object-cover" />
                                </div>
                                <button
                                    onClick={() => inProject ? handleRemoveFromProject(img.id) : handleAddToProject(img)}
                                    className={`absolute top-1 right-1 p-1.5 rounded-lg transition ${
                                        inProject
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-black/50 text-white hover:bg-purple-600'
                                    }`}
                                    title={inProject ? 'Quitar del proyecto' : 'Agregar al proyecto'}
                                >
                                    {inProject ? <Check size={12} /> : <Plus size={12} />}
                                </button>
                            </div>
                        );
                    })}
                    <div className="relative aspect-square border-2 border-dashed border-[#DFD2C4] hover:border-purple-400 bg-[#FDFBF7] hover:bg-purple-50/30 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleUpload(e.target.files[0]);
                                    e.target.value = '';
                                }
                            }}
                            accept="image/*"
                        />
                        <Upload size={20} className="text-[#9A8F84] group-hover:text-purple-600" />
                        <p className="text-[8px] font-bold text-[#9A8F84] mt-1">Subir</p>
                    </div>
                </div>
            </div>

            {/* Storyboard del proyecto */}
            {projectImages.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Palette size={14} className="text-purple-600" /> Proyecto DSD ({projectImages.length})
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {projectImages.map(img => (
                            <div
                                key={img.id}
                                onClick={() => handleSelectImage(img.id)}
                                className={`group relative w-32 rounded-2xl border-2 overflow-hidden cursor-pointer transition ${
                                    currentImageId === img.id ? 'border-purple-600 shadow-lg shadow-purple-200' : 'border-[#DFD2C4] hover:border-purple-400'
                                }`}
                            >
                                <div className="aspect-square bg-[#0a0a0a]">
                                    <PrivateImage img={img} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                    <select
                                        value={img.label || ''}
                                        onChange={(e) => handleLabelChange(img.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-transparent text-white text-[9px] font-bold border-none outline-none appearance-none cursor-pointer"
                                    >
                                        {labels.map(label => (
                                            <option key={label} value={label} className="text-black">{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveFromProject(img.id); }}
                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-lg text-white hover:bg-red-500 transition"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal DSDStudio */}
            {dsdModalOpen && currentImage && (
                <DSDStudio
                    imageUrl={currentImage.url}
                    patientName={p.personal?.legalName || p.name || 'Paciente'}
                    onClose={() => {
                        setDsdModalOpen(false);
                        setSelectedImage(null);
                    }}
                    onSave={handleSaveDesign}
                    onDownload={handleDownload}
                    projectImages={projectImages}
                    onSwitchImage={(imgId) => {
                        const img = projectImages.find(i => i.id === imgId);
                        if (img) {
                            setCurrentImageId(imgId);
                            setDsdModalOpen(false);
                            setTimeout(() => setDsdModalOpen(true), 100);
                        }
                    }}
                    currentImageId={currentImageId}
                    supabase={supabase}
                />
            )}
        </div>
    );
}