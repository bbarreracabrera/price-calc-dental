import React from 'react';
import { Upload, Trash2, Loader } from 'lucide-react';
import { PrivateImage } from './SystemModals';
import { supabase } from '../supabase';

export default function PatientImagesTab({
    themeMode, t, getPatient, selectedPatientId, savePatientData,
    activeFolder, setActiveFolder, handleImageUpload, uploading, setSelectedImg, notify
}) {
    const patient = getPatient(selectedPatientId);
    const folderTabs = ['Radiografías', 'Fotos Clínicas', 'Documentos', 'Otros'];

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            {/* 1. PESTAÑAS DE CARPETAS */}
            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                {folderTabs.map(folder => (
                    <button 
                        key={folder}
                        onClick={() => setActiveFolder(folder)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${t.border} ${activeFolder === folder ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' : 'opacity-50 hover:opacity-100'}`}
                    >
                        {folder === 'Radiografías' ? '🦴 ' : folder === 'Fotos Clínicas' ? '📸 ' : folder === 'Documentos' ? '📄 ' : '📁 '}
                        {folder}
                    </button>
                ))}
            </div>

            {/* 2. ZONA DE SUBIDA */}
            <div className={`flex items-center justify-center border-2 border-dashed ${t.border} rounded-3xl p-8 relative group hover:opacity-70 transition-colors cursor-pointer ${t.cardBg}`}>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*,application/pdf" onChange={handleImageUpload} disabled={uploading}/>
                {uploading ? (
                    <Loader className="animate-spin text-cyan-400" size={30}/> 
                ) : (
                    <div className="text-center">
                        <Upload className="mx-auto mb-2 opacity-30"/>
                        <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                            Subir archivo a <span className="text-cyan-500">{activeFolder}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* 3. CUADRÍCULA DE FOTOS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {patient.images?.filter(img => (img.folder || 'Otros') === activeFolder).length === 0 ? (
                        <div className="col-span-full py-10 text-center opacity-30 text-sm font-bold">
                            No hay archivos en la carpeta {activeFolder}
                        </div>
                    ) : (
                        patient.images?.filter(img => (img.folder || 'Otros') === activeFolder).map(img => (
                            <div key={img.id} className={`relative group rounded-2xl overflow-hidden aspect-square border ${t.border} bg-black/5 dark:bg-white/5`}>
                                
                                <PrivateImage img={img} onClick={setSelectedImg} />
                                
                                <button onClick={async()=>{ 
                                    if(window.confirm("¿Seguro que deseas eliminar este archivo?")) {
                                        const f = patient.images.filter(i => i.id !== img.id); 
                                        await savePatientData(selectedPatientId, {...patient, images:f}); 
                                        
                                        const filePath = img.path || img.url;
                                        if (filePath && !filePath.startsWith('http')) {
                                            await supabase.storage.from('patient-images').remove([filePath]);
                                        }
                                        notify("Eliminado"); 
                                    }
                                }} className="absolute top-2 right-2 p-2 bg-red-500 shadow-lg rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}