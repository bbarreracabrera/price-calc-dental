import React, { useState } from 'react';
import { X, FlaskConical, Save, DollarSign, UploadCloud, Paperclip, Loader2, Info } from 'lucide-react';
import { getLocalDate } from '../constants'; 

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

    // Estados para Subida de Archivos
    const [uploading, setUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");

    // --- NUEVOS CAMPOS CLÍNICOS DETALLADOS ---
    const [shade, setShade] = useState("");
    const [notes, setNotes] = useState("");

    const inputClass = "w-full p-3.5 rounded-xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors appearance-none shadow-sm";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const safeName = `lab_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `lab_files/${clinicOwner}/${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from('patient-images') 
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('patient-images').getPublicUrl(filePath);
            setFileUrl(data.publicUrl);
            setFileName(file.name);
            notify("Archivo adjuntado correctamente.");
        } catch (error) {
            notify("Error al subir archivo. Verifica tu conexión e intenta de nuevo.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if(newLabWork.patientId && newLabWork.workType && newLabWork.expectedDate){
            const labId = newLabWork.id || `lab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            let nuevosRegistrosFinancieros = [...financialRecords];
            const autor = session?.user?.email || 'Desconocido';
            
            const selectedLab = laboratories.find(l => l.name === newLabWork.labName);
            const emailDelLaboratorio = selectedLab ? selectedLab.email : null;

            // Schema híbrido: columnas críticas top-level + resto en data JSONB
            const fullLabData = {
                id: labId,
                lab_email: emailDelLaboratorio,
                admin_email: clinicOwner,
                status: 'recibido',
                data: {
                    patientId: newLabWork.patientId,
                    patientName: newLabWork.patientName,
                    workType: newLabWork.workType,
                    tooth: newLabWork.tooth,
                    labName: newLabWork.labName,
                    sendDate: newLabWork.sendDate,
                    expectedDate: newLabWork.expectedDate,
                    file_url: fileUrl,
                    file_name: fileName,
                    created_by: autor,
                    shade,
                    notes,
                    status: 'recibido',
                },
            };

            // Guardamos en la tabla lab_works
            const { error: labError } = await supabase.from('lab_works').insert([fullLabData]);
            if (labError) { notify("Error al guardar en la nube. Intenta de nuevo."); return; }

            // 2. Transacción Financiera: EGRESO (Costo para la clínica)
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

            // 3. Transacción Financiera: INGRESO (Cobro al paciente)
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
            // Merge para que LabView pueda leer campos desde top-level
            const mergedJob = { ...fullLabData, ...(fullLabData.data || {}), id: fullLabData.id, lab_email: fullLabData.lab_email, admin_email: fullLabData.admin_email, status: fullLabData.status };
            setLabWorks([...labWorks, mergedJob]);
            setModal(null);
            notify("Orden y finanzas procesadas.");
            
        } else {
            notify("Completa paciente, tipo de trabajo y fecha de entrega.");
        }
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

                    {/* --- NUEVO BLOQUE: ESPECIFICACIONES TÉCNICAS (AZUL) --- */}
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

                    {/* --- ZONA DE ARCHIVOS ADJUNTOS --- */}
                    <div className="bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem] p-6 text-center transition-all hover:border-[#5B6651]/50 relative">
                        <input type="file" accept=".dcm,.stl,.pli,.zip,.pdf,.jpg,.png" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" title="Haz clic para adjuntar archivo" />
                        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                            {uploading ? (
                                <div className="text-[#CBAAA2] flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin" size={28} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Subiendo Archivo...</p>
                                </div>
                            ) : fileUrl ? (
                                <div className="text-[#5B6651] flex flex-col items-center gap-2">
                                    <div className="p-3 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600"><Paperclip size={24} /></div>
                                    <p className="text-xs font-black text-[#312923]">{fileName}</p>
                                    <p className="text-[9px] text-[#9A8F84] uppercase tracking-widest">(Clic para reemplazar archivo)</p>
                                </div>
                            ) : (
                                <div className="text-[#9A8F84] flex flex-col items-center gap-2">
                                    <UploadCloud size={32} className="text-[#CBAAA2]"/>
                                    <p className="text-sm font-black text-[#312923]">Adjuntar Escáner 3D / Rx</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">STL, DICOM, ZIP, IMÁGENES</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Fila Fechas */}
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

                    {/* --- ZONA FINANCIERA INTELIGENTE --- */}
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

                    <button className="w-full mt-2 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-black shadow-xl shadow-[#312923]/20 active:scale-95 transition-all flex items-center justify-center gap-2" onClick={handleSave} disabled={uploading}>
                        <Save size={16}/> ENVIAR ORDEN TÉCNICA
                    </button>
                </div>
            </div>
        </div>
    );
}