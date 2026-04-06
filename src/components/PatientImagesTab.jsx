import React from 'react';
import { Upload, Trash2, Loader, Image as ImageIcon, FileText, Camera, FolderOpen } from 'lucide-react';
import { PrivateImage } from './SystemModals';
import { supabase } from '../supabase';

export default function PatientImagesTab({
    getPatient, selectedPatientId, savePatientData,
    activeFolder, setActiveFolder, handleImageUpload, uploading, setSelectedImg, notify
}) {
    const patient = getPatient(selectedPatientId);
    
    const folderTabs = [
        { id: 'Radiografías', icon: ImageIcon },
        { id: 'Fotos Clínicas', icon: Camera },
        { id: 'Documentos', icon: FileText },
        { id: 'Otros', icon: FolderOpen }
    ];

    const currentImages = patient.images?.filter(img => (img.folder || 'Otros') === activeFolder) || [];

    // Array de dientes para el selector rápido
    const adultTeeth = [
        18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28, 
        48,47,46,45,44,43,42,41, 38,37,36,35,34,33,32,31
    ];

    // Función para etiquetar una imagen con un número de diente
    const handleToothChange = async (imgId, newTooth) => {
        const updatedImages = patient.images.map(img => 
            img.id === imgId ? { ...img, tooth: newTooth } : img
        );
        await savePatientData(selectedPatientId, { ...patient, images: updatedImages });
        if (newTooth) {
            notify(`Etiquetada como Pieza ${newTooth} 🦷`);
        } else {
            notify('Etiqueta removida (General) 📸');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col max-w-6xl mx-auto pb-10">
            
            {/* --- ENCABEZADO --- */}
            <div className="border-b border-[#DFD2C4]/50 pb-4">
                <h2 className="text-2xl font-black text-[#312923] tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-[#9A8F84]/10 text-[#9A8F84] rounded-xl">
                        <ImageIcon size={22} />
                    </div>
                    Galería Clínica
                </h2>
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2 ml-1">
                    Archivos, Fotos y Radiografías
                </p>
            </div>

            {/* --- 1. PESTAÑAS DE CARPETAS --- */}
            <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
                {folderTabs.map(folder => {
                    const isActive = activeFolder === folder.id;
                    const fileCount = patient.images?.filter(img => (img.folder || 'Otros') === folder.id).length || 0;
                    return (
                        <button 
                            key={folder.id}
                            onClick={() => setActiveFolder(folder.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${
                                isActive 
                                ? 'bg-[#5B6651] text-white border-[#5B6651] shadow-md shadow-[#5B6651]/20 scale-[1.02]' 
                                : 'bg-[#FDFBF7] text-[#9A8F84] border-[#DFD2C4]/60 hover:bg-white hover:border-[#5B6651]/30 hover:text-[#5B6651]'
                            }`}
                        >
                            <folder.icon size={16} className={isActive ? 'text-[#DFD2C4]' : 'opacity-60'}/>
                            {folder.id}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-white/20' : 'bg-[#DFD2C4]/30'}`}>
                                {fileCount}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                
                {/* --- 2. ZONA DE SUBIDA --- */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="relative group w-full h-48 lg:h-full min-h-[200px] border-2 border-dashed border-[#DFD2C4] hover:border-[#5B6651] bg-[#FDFBF7] hover:bg-[#5B6651]/5 rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden">
                        
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" 
                         accept="image/*,application/pdf" 
                         onChange={(e) => {
                             const file = e.target.files[0];
                             if (file) {
                                 handleImageUpload(file);
                             }
                             e.target.value = ''; 
                         }} 
                         disabled={uploading}
                         title="Haz clic o arrastra un archivo aquí"
                        />
                        
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader className="animate-spin text-[#5B6651]" size={32}/> 
                                <span className="text-[10px] font-black text-[#5B6651] uppercase tracking-widest">Subiendo...</span>
                            </div>
                        ) : (
                            <div className="text-center flex flex-col items-center p-6">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all border border-[#DFD2C4]/50">
                                    <Upload className="text-[#9A8F84] group-hover:text-[#5B6651] transition-colors" size={24}/>
                                </div>
                                <span className="text-sm font-black text-[#312923] mb-1">
                                    Subir a {activeFolder}
                                </span>
                                <span className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">
                                    Click o arrastrar archivo
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 3. CUADRÍCULA DE FOTOS --- */}
                <div className="lg:col-span-3 bg-white border border-[#DFD2C4]/40 rounded-[2rem] p-6 shadow-sm overflow-y-auto custom-scrollbar h-[500px] lg:h-full">
                    {currentImages.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center opacity-40">
                            <FolderOpen size={48} className="mb-4 text-[#9A8F84]"/>
                            <p className="text-sm font-black text-[#312923] uppercase tracking-widest">Carpeta Vacía</p>
                            <p className="text-xs font-bold text-[#9A8F84] mt-2">No hay archivos en {activeFolder}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {currentImages.map(img => (
                                <div key={img.id} className="relative group rounded-3xl overflow-hidden aspect-square border border-[#DFD2C4]/60 bg-[#FDFBF7] shadow-sm hover:shadow-md transition-shadow">
                                    
                                    {/* ETIQUETA DE DIENTE PERMANENTE (Si existe) */}
                                    {img.tooth && (
                                        <div className="absolute top-3 left-3 bg-[#5B6651] text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-md z-10 flex items-center gap-1">
                                            🦷 Pieza {img.tooth}
                                        </div>
                                    )}

                                    <div className="w-full h-full object-cover cursor-pointer">
                                        <PrivateImage img={img} onClick={setSelectedImg} />
                                    </div>
                                    
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#312923]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col justify-end">
                                        <p className="text-[10px] font-bold text-white truncate mb-2 pointer-events-none">
                                            {img.name || 'Archivo Adjunto'}
                                        </p>
                                        
                                        {/* NUEVO: SELECTOR DE DIENTE */}
                                        <select 
                                            value={img.tooth || ''}
                                            onChange={(e) => handleToothChange(img.id, e.target.value)}
                                            className="w-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-white/30 transition-colors backdrop-blur-sm appearance-none"
                                        >
                                            <option value="" className="text-black">General (Sin pieza)</option>
                                            <optgroup label="Seleccionar Pieza Dental" className="text-black">
                                                {adultTeeth.map(t => (
                                                    <option key={t} value={t}>Pieza {t}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                    
                                    <button 
                                        onClick={async () => { 
                                            if(window.confirm("¿Seguro que deseas eliminar este archivo de la ficha del paciente?")) {
                                                const f = patient.images.filter(i => i.id !== img.id); 
                                                await savePatientData(selectedPatientId, {...patient, images: f}); 
                                                
                                                const filePath = img.path || img.url;
                                                if (filePath && !filePath.startsWith('http')) {
                                                    await supabase.storage.from('patient-images').remove([filePath]);
                                                }
                                                notify("Archivo eliminado correctamente"); 
                                            }
                                        }} 
                                        className="absolute top-3 right-3 p-2.5 bg-white hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200 shadow-md rounded-xl text-[#9A8F84] opacity-0 group-hover:opacity-100 transition-all z-20"
                                        title="Eliminar archivo"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}