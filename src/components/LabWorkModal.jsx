import React, { useState } from 'react';
import { X, FlaskConical, Save, DollarSign, UploadCloud, Paperclip, Loader2, Info, Trash2, FileText, Image, File } from 'lucide-react';
import { getLocalDate } from '../constants'; 

// Icono según tipo MIME
function FileIcon({ mimeType, size = 16 }) {
    if (mimeType?.startsWith('image/')) return <Image size={size} className="text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText size={size} className="text-red-500" />;
    return <File size={size} className="text-[#9A8F84]" />;
}

// Formatea bytes a KB/MB
function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LabWorkModal({ 
    themeMode, newLabWork, setNewLabWork, patientRecords, setModal, clinicOwner, 
    labWorks, setLabWorks, supabase, notify,
    catalog = [], 
    financialRecords = [], 
    setFinancialRecords,
    session,
    laboratories = [] 
}) {
    // Estados Financieros
    const [labCost, setLabCost] = useState("");
    const [autoExpense, setAutoExpense] = useState(true); 
    const [patientPrice, setPatientPrice] = useState("");
    const [autoIncome, setAutoIncome] = useState(false); 

    // ── MÚLTIPLES ARCHIVOS ──────────────────────────────────────
    const [uploadedFiles, setUploadedFiles] = useState([]); // [{ path, name, size, mimeType }]
    const [uploading, setUploading] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);

    // Campos clínicos
    const [shade, setShade] = useState("");
    const [notes, setNotes] = useState("");

    const inputClass = "w-full p-3.5 rounded-xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors appearance-none shadow-sm";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    // ── UPLOAD DE UN ARCHIVO ────────────────────────────────────
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadingIndex(i);
            setUploading(true);
            try {
                // 1. Validar seguridad (Magic Bytes + Extensiones Lab)
                const { validateFileSecurity } = await import('../utils/securityFixes');
                await validateFileSecurity(file, 'lab');

                const fileExt = file.name.split('.').pop().toLowerCase();
                const safeName = `lab_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `lab_files/${clinicOwner}/${safeName}`;

                // 2. Subir al bucket privado
                const { error: uploadError } = await supabase.storage
                    .from('lab-work-files') 
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 3. Guardar PATH (nunca URL pública) — Ley 19.628
                setUploadedFiles(prev => [...prev, {
                    path: filePath,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                }]);
                notify(`"${file.name}" adjuntado de forma segura`);
            } catch (error) {
                notify(`Error en "${file.name}": ${error.message}`);
            }
        }
        setUploading(false);
        setUploadingIndex(null);
        // Limpiar input para permitir re-selección del mismo archivo
        e.target.value = '';
    };

    // ── ELIMINAR ARCHIVO DE LA LISTA (antes de guardar) ─────────
    const handleRemoveFile = async (index) => {
        const fileToRemove = uploadedFiles[index];
        try {
            await supabase.storage.from('lab-work-files').remove([fileToRemove.path]);
        } catch (_) { /* Si falla el delete en storage, igual quitamos de la UI */ }
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // ── GUARDAR ORDEN ───────────────────────────────────────────
    const handleSave = async () => {
        if (!newLabWork.patientId || !newLabWork.workType || !newLabWork.expectedDate) {
            notify("Completa paciente, tipo de trabajo y fecha de entrega.");
            return;
        }

        const labId = newLabWork.id || `lab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let nuevosRegistrosFinancieros = [...financialRecords];
        const autor = session?.user?.email || 'Desconocido';
        
        const selectedLab = laboratories.find(l => l.name === newLabWork.labName);
        const emailDelLaboratorio = selectedLab ? selectedLab.email : null;

        // Compatibilidad legacy: primer archivo en columnas top-level de lab_works
        const firstFile = uploadedFiles[0] || null;

        // Schema híbrido: columnas críticas top-level + resto en data JSONB
        const fullLabData = {
            id: labId,
            lab_email: emailDelLaboratorio,
            admin_email: clinicOwner,
            status: 'recibido',
            // Legacy: mantener file_url / file_name para compatibilidad con JobDetailModal
            file_url: firstFile?.path || null,
            file_name: firstFile?.name || null,
            data: {
                patientId: newLabWork.patientId,
                patientName: newLabWork.patientName,
                workType: newLabWork.workType,
                tooth: newLabWork.tooth,
                labName: newLabWork.labName,
                sendDate: newLabWork.sendDate,
                expectedDate: newLabWork.expectedDate,
                created_by: autor,
                shade,
                notes,
                status: 'recibido',
                file_count: uploadedFiles.length,
            },
        };

        // 1. Guardar en lab_works
        const { error: labError } = await supabase.from('lab_works').insert([fullLabData]);
        if (labError) { notify("Error al guardar en la nube. Intenta de nuevo."); return; }

        // 2. Registrar cada archivo en lab_work_files (tabla de auditoría y multi-archivo)
        if (uploadedFiles.length > 0) {
            const fileRecords = uploadedFiles.map(f => ({
                id: `lwf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                lab_work_id: labId,
                original_name: f.name,
                storage_path: f.path,
                file_size: f.size,
                mime_type: f.mimeType || 'application/octet-stream',
                created_by: autor,
                upload_source: 'clinic',
            }));
            const { error: filesError } = await supabase.from('lab_work_files').insert(fileRecords);
            if (filesError) console.error('Error registrando archivos:', filesError);
        }

        // 3. Transacción Financiera: EGRESO
        if (autoExpense && Number(labCost) > 0 && typeof setFinancialRecords === 'function') {
            const expenseData = {
                id: `exp_${Date.now()}_1`,
                type: 'expense',
                amount: Number(labCost), 
                date: getLocalDate(),
                patientName: newLabWork.patientName || "Laboratorio",
                description: `Costo Lab (${newLabWork.labName || 'Gral'}): ${newLabWork.workType}`,
                created_by: autor 
            };
            const { error: finError1 } = await supabase.from('financials').insert([{ id: expenseData.id, data: expenseData, admin_email: clinicOwner }]);
            if (!finError1) nuevosRegistrosFinancieros.push(expenseData);
        }

        // 4. Transacción Financiera: INGRESO
        if (autoIncome && Number(patientPrice) > 0 && typeof setFinancialRecords === 'function') {
            const incomeData = {
                id: `inc_${Date.now()}_2`,
                type: 'income',
                patientId: newLabWork.patientId,
                patientName: newLabWork.patientName,
                treatment: newLabWork.workType,
                total: Number(patientPrice),
                paid: 0, 
                payments: [],
                date: getLocalDate(),
                created_by: autor 
            };
            const { error: finError2 } = await supabase.from('financials').insert([{ id: incomeData.id, data: incomeData, admin_email: clinicOwner }]);
            if (!finError2) nuevosRegistrosFinancieros.push(incomeData);
        }

        setFinancialRecords(nuevosRegistrosFinancieros);
        const mergedJob = { ...fullLabData, ...(fullLabData.data || {}), id: fullLabData.id, lab_email: fullLabData.lab_email, admin_email: fullLabData.admin_email, status: fullLabData.status };
        setLabWorks([...labWorks, mergedJob]);
        setModal(null);
        notify(`Orden enviada con ${uploadedFiles.length} archivo(s) adjunto(s).`);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#312923]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white border border-[#DFD2C4]/50 rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DFD2C4]/50 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight flex items-center gap-2">
                            <FlaskConical className="text-[#CBAAA2]"/> Nueva Orden Técnica
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Sincronización con Laboratorio & Finanzas</p>
                    </div>
                    <button onClick={()=>setModal(null)} className="p-2 text-[#9A8F84] hover:bg-[#FDFBF7] hover:text-[#312923] rounded-xl transition-all">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Fila 1: Logística de Envío */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>1. Paciente</label>
                            <select className={inputClass} value={newLabWork.patientId} onChange={(e) => { const p = Object.values(patientRecords).find(pat => pat.id === e.target.value); if (p) setNewLabWork({...newLabWork, patientId: p.id, patientName: p.personal?.legalName || p.name}); }}>
                                <option value="">Selecciona Paciente...</option>
                                {Object.values(patientRecords).map(p => <option key={p.id} value={p.id}>{p.personal?.legalName || p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Laboratorio de Destino</label>
                            <select className={inputClass} value={newLabWork.labName || ""} onChange={e => setNewLabWork({...newLabWork, labName: e.target.value})}>
                                <option value="">Seleccionar del Directorio...</option>
                                {laboratories.map((lab, idx) => <option key={idx} value={lab.name}>{lab.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {/* Fila 2: El Trabajo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>2. Tipo de Prótesis/Aparato</label>
                            <input type="text" placeholder="Ej: Corona Zirconio Oclusal" className={inputClass} value={newLabWork.workType} onChange={e=>setNewLabWork({...newLabWork, workType:e.target.value})}/>
                        </div>
                        <div>
                            <label className={labelClass}>Vincular con Mi Catálogo</label>
                            <select className={inputClass} onChange={(e) => { const item = catalog.find(c => c.id === e.target.value); if(item) { setNewLabWork({...newLabWork, workType: item.name || item.data?.name}); setPatientPrice(item.price || item.precio || item.data?.price || ""); } }}>
                                <option value="">Cargar Arancel...</option>
                                {catalog.map(c => <option key={c.id} value={c.id}>{c.name || c.data?.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Especificaciones Técnicas */}
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={14} className="text-blue-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Requerimientos Clínicos</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <label className={labelClass}>Pieza N°</label>
                                <input type="text" placeholder="16" className={`${inputClass} !bg-white`} value={newLabWork.tooth || ''} onChange={e=>setNewLabWork({...newLabWork, tooth:e.target.value})}/>
                            </div>
                            <div className="col-span-1 md:col-span-3">
                                <label className={labelClass}>Color / Shade</label>
                                <input type="text" placeholder="Ej: A2 / A3.5 / Bleach" className={`${inputClass} !bg-white`} value={shade} onChange={e=>setShade(e.target.value)}/>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Instrucciones para el Técnico</label>
                            <textarea placeholder="Ej: Dejar póntico en forma de bala, glaseado alto, caracterizar cuello..." className={`${inputClass} !bg-white resize-none h-24`} value={notes} onChange={e=>setNotes(e.target.value)}/>
                        </div>
                    </div>

                    {/* ── ZONA DE ARCHIVOS MÚLTIPLES ── */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className={labelClass}>Archivos Adjuntos ({uploadedFiles.length})</label>
                            <span className="text-[9px] text-[#9A8F84] font-bold uppercase tracking-widest">STL · DICOM · ZIP · PDF · Imágenes</span>
                        </div>

                        {/* Zona de drop / click para subir */}
                        <div className="relative bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem] p-5 text-center transition-all hover:border-[#5B6651]/50">
                            <input
                                type="file"
                                accept=".dcm,.stl,.pli,.zip,.pdf,.jpg,.jpeg,.png,.webp"
                                multiple
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                title="Clic para adjuntar archivos"
                            />
                            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                {uploading ? (
                                    <>
                                        <Loader2 className="animate-spin text-[#CBAAA2]" size={28} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Subiendo archivo {uploadingIndex != null ? uploadingIndex + 1 : ''}...</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={28} className="text-[#CBAAA2]"/>
                                        <p className="text-sm font-black text-[#312923]">Clic para adjuntar archivos</p>
                                        <p className="text-[10px] text-[#9A8F84] font-bold">Puedes seleccionar múltiples archivos a la vez</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Galería de archivos subidos */}
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                {uploadedFiles.map((f, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div className="p-2 bg-white rounded-xl border border-emerald-100 shrink-0">
                                            <FileIcon mimeType={f.mimeType} size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-[#312923] truncate">{f.name}</p>
                                            <p className="text-[9px] text-[#9A8F84] font-bold uppercase tracking-widest">{formatBytes(f.size)} · Almacenado de forma segura</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(idx)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            title="Eliminar archivo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4 border-b border-[#DFD2C4]/50 pb-5">
                        <div>
                            <label className={labelClass}>Fecha de Envío</label>
                            <input type="date" className={inputClass} value={newLabWork.sendDate} onChange={e=>setNewLabWork({...newLabWork, sendDate:e.target.value})}/>
                        </div>
                        <div>
                            <label className={labelClass}>Llegada Esperada</label>
                            <input type="date" className={inputClass} value={newLabWork.expectedDate} onChange={e=>setNewLabWork({...newLabWork, expectedDate:e.target.value})}/>
                        </div>
                    </div>
                   
                    {/* Zona Financiera */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-3xl">
                            <label className="text-[10px] font-black uppercase tracking-widest text-red-800/60 ml-1 mb-2 block">Costo Lab (Egreso)</label>
                            <div className="relative mb-4">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-800/40" size={16}/>
                                <input type="number" placeholder="0" className={`w-full p-3 pl-9 rounded-xl bg-white border border-red-100 outline-none font-bold text-red-900 focus:border-red-300 text-sm`} value={labCost} onChange={e=>setLabCost(e.target.value)} />
                            </div>
                            <div className={`flex items-center gap-2 cursor-pointer transition-opacity ${autoExpense && Number(labCost) > 0 ? 'opacity-100' : 'opacity-50'}`} onClick={() => setAutoExpense(!autoExpense)}>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${autoExpense ? 'bg-red-500 border-red-500' : 'bg-white border-red-200'}`}>
                                    {autoExpense && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                                </div>
                                <p className="text-[10px] font-black uppercase text-red-900">Registrar como Gasto</p>
                            </div>
                        </div>

                        <div className="p-4 bg-[#5B6651]/5 border border-[#5B6651]/20 rounded-3xl">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]/60 ml-1 mb-2 block">Venta Paciente (Ingreso)</label>
                            <div className="relative mb-4">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6651]/40" size={16}/>
                                <input type="number" placeholder="0" className={`w-full p-3 pl-9 rounded-xl bg-white border border-[#5B6651]/20 outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm`} value={patientPrice} onChange={e=>setPatientPrice(e.target.value)} />
                            </div>
                            <div className={`flex items-center gap-2 cursor-pointer transition-opacity ${autoIncome && Number(patientPrice) > 0 ? 'opacity-100' : 'opacity-50'}`} onClick={() => setAutoIncome(!autoIncome)}>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${autoIncome ? 'bg-[#5B6651] border-[#5B6651]' : 'bg-white border-[#DFD2C4]'}`}>
                                    {autoIncome && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                                </div>
                                <p className="text-[10px] font-black uppercase text-[#312923]">Generar Deuda al Paciente</p>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full mt-2 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-black shadow-xl shadow-[#312923]/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handleSave}
                        disabled={uploading}
                    >
                        <Save size={16}/>
                        ENVIAR ORDEN TÉCNICA
                        {uploadedFiles.length > 0 && <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-[9px]">{uploadedFiles.length} archivo(s)</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
