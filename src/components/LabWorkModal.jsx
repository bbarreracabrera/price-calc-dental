import React, { useState } from 'react';
import { X, FlaskConical, Save, DollarSign, FileSignature, Wallet, UploadCloud, Paperclip, Loader2 } from 'lucide-react';
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

    // Estados para Subida de Archivos 3D
    const [uploading, setUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");

    const inputClass = "w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors appearance-none";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    // --- MOTOR DE SUBIDA DE ARCHIVOS PESADOS ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const safeName = `lab_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `lab_files/${clinicOwner}/${safeName}`;

            // ¡CORREGIDO: Usamos patient-images con guion medio!
            const { error: uploadError } = await supabase.storage
                .from('patient-images') 
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // ¡CORREGIDO: Usamos patient-images con guion medio!
            const { data } = supabase.storage.from('patient-images').getPublicUrl(filePath);
            setFileUrl(data.publicUrl);
            setFileName(file.name);
            notify("✅ Archivo adjuntado correctamente.");
        } catch (error) {
            alert("Error al subir archivo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if(newLabWork.patientId && newLabWork.workType && newLabWork.expectedDate){
            const labId = newLabWork.id || `lab_${Date.now()}`;
            let nuevosRegistrosFinancieros = [...financialRecords];
            
            const autor = session?.user?.email || 'Desconocido';
            
            // --- MAGIA: BUSCAMOS EL CORREO DEL LABORATORIO ---
            const selectedLab = laboratories.find(l => l.name === newLabWork.labName);
            const emailDelLaboratorio = selectedLab ? selectedLab.email : null;
            
            // 1. Guardamos el Trabajo de Laboratorio
            const labData = { 
                ...newLabWork, 
                id: labId, 
                admin_email: clinicOwner,
                created_by: autor,
                file_url: fileUrl,    
                file_name: fileName,
                lab_email: emailDelLaboratorio 
            };
            
            const { error: labError } = await supabase.from('lab_works').insert([labData]);
            
            if (labError) return alert("Hubo un error al guardar en la nube: " + labError.message);

            // 2. MAGIA FINANCIERA 1: EGRESO 
            if (autoExpense && Number(labCost) > 0 && typeof setFinancialRecords === 'function') {
                const expenseData = {
                    id: `exp_${Date.now()}_1`,
                    type: 'expense',
                    amount: Number(labCost), 
                    date: getLocalDate(),
                    patientName: newLabWork.patientName || "Laboratorio",
                    description: `Costo Lab (${newLabWork.labName || 'General'}): ${newLabWork.workType}`,
                    created_by: autor 
                };

                const { error: finError1 } = await supabase.from('financials').insert([{ id: expenseData.id, data: expenseData, admin_email: clinicOwner }]);
                if (!finError1) nuevosRegistrosFinancieros.push(expenseData);
            }

            // 3. MAGIA FINANCIERA 2: INGRESO
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

            // 4. Limpieza final y notificaciones
            setFinancialRecords(nuevosRegistrosFinancieros);
            setLabWorks([...labWorks, labData]);
            setModal(null);
            
            if(autoExpense && Number(labCost) > 0) notify("📉 Costo de laboratorio registrado.");
            if(autoIncome && Number(patientPrice) > 0) notify("💰 Arancel cargado como deuda al paciente.");
            notify("✅ Orden enviada a laboratorio exitosamente.");
            
        } else {
            alert("Por favor selecciona un paciente, el tipo de trabajo y la fecha de entrega.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#312923]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white border border-[#DFD2C4]/50 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DFD2C4]/50 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight flex items-center gap-2">
                            <FlaskConical className="text-[#CBAAA2]"/> Orden de Laboratorio
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Archivos 3D, Finanzas y Seguimiento</p>
                    </div>
                    <button onClick={()=>setModal(null)} className="p-2 text-[#9A8F84] hover:bg-[#FDFBF7] hover:text-[#312923] rounded-xl transition-all">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Fila 1: Paciente y Laboratorio Destino */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>1. Paciente</label>
                            <select 
                                className={`${inputClass} cursor-pointer text-sm`}
                                value={newLabWork.patientId}
                                onChange={(e) => {
                                    const p = Object.values(patientRecords).find(pat => pat.id === e.target.value);
                                    if (p) setNewLabWork({...newLabWork, patientId: p.id, patientName: p.personal?.legalName || p.name});
                                }}
                            >
                                <option value="">Selecciona...</option>
                                {Object.values(patientRecords).map(p => (
                                    <option key={p.id} value={p.id}>{p.personal?.legalName || p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Laboratorio Destino</label>
                            {laboratories.length > 0 ? (
                                <select 
                                    className={`${inputClass} cursor-pointer text-sm`}
                                    value={newLabWork.labName || ""}
                                    onChange={e => setNewLabWork({...newLabWork, labName: e.target.value})}
                                >
                                    <option value="">Selecciona Lab...</option>
                                    {laboratories.map((lab, idx) => (
                                        <option key={idx} value={lab.name}>{lab.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    type="text" 
                                    placeholder="Ej: Lab Cerámico Sur" 
                                    className={inputClass} 
                                    value={newLabWork.labName || ""} 
                                    onChange={e => setNewLabWork({...newLabWork, labName: e.target.value})}
                                />
                            )}
                        </div>
                    </div>
                    
                    {/* Fila 2: Tipo de Trabajo y Arancel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>2. Trabajo Solicitado</label>
                            <input type="text" placeholder="Ej: Corona de Porcelana, Placa..." className={inputClass} value={newLabWork.workType} onChange={e=>setNewLabWork({...newLabWork, workType:e.target.value})}/>
                        </div>
                        <div>
                            <label className={labelClass}>Vincular Arancel (Opcional)</label>
                            <select 
                                className={`${inputClass} cursor-pointer text-sm`}
                                onChange={(e) => {
                                    const item = catalog.find(c => c.id === e.target.value);
                                    if(item) {
                                        setNewLabWork({...newLabWork, workType: item.name || item.data?.name});
                                        setPatientPrice(item.price || item.precio || item.data?.price || "");
                                    }
                                }}
                            >
                                <option value="">Buscar en Catálogo...</option>
                                {catalog.map(c => (
                                    <option key={c.id} value={c.id}>{c.name || c.data?.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* --- ZONA DE ARCHIVOS 3D / DICOM --- */}
                    <div className="bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem] p-6 text-center transition-all hover:border-[#5B6651]/50 relative">
                        <input 
                            type="file" 
                            accept=".dcm,.stl,.pli,.zip,.pdf,.jpg,.png" 
                            onChange={handleFileUpload} 
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            title="Haz clic para adjuntar archivo"
                        />
                        
                        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                            {uploading ? (
                                <div className="text-[#CBAAA2] flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="text-xs font-black uppercase tracking-widest">Subiendo al servidor...</p>
                                </div>
                            ) : fileUrl ? (
                                <div className="text-[#5B6651] flex flex-col items-center gap-2">
                                    <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100">
                                        <Paperclip size={28} />
                                    </div>
                                    <p className="text-sm font-black text-[#312923]">{fileName}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Archivo Adjunto Exitosamente</p>
                                    <p className="text-[9px] text-[#9A8F84] uppercase tracking-widest mt-1">(Clic aquí para reemplazar)</p>
                                </div>
                            ) : (
                                <div className="text-[#9A8F84] flex flex-col items-center gap-2">
                                    <div className="p-4 bg-white rounded-full shadow-sm border border-[#DFD2C4]/50">
                                        <UploadCloud size={28} className="text-[#CBAAA2]"/>
                                    </div>
                                    <p className="text-sm font-black text-[#312923] mt-2">Adjuntar Archivo de Escáner o Rx</p>
                                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">Formatos soportados: STL, PLI, DICOM, ZIP</p>
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

                    {/* --- ZONA FINANCIERA DOBLE --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Panel Izquierdo: Costo Lab (Egreso) */}
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl space-y-3">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-red-800/60 ml-1 mb-2 block">Costo Laboratorio</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-800/40" size={16}/>
                                    <input type="number" placeholder="0" className={`w-full p-3 pl-9 rounded-xl bg-white border border-red-100 outline-none font-bold text-red-900 focus:border-red-300 text-sm`} value={labCost} onChange={e=>setLabCost(e.target.value)} />
                                </div>
                            </div>
                            <div className={`flex items-start gap-2 cursor-pointer transition-opacity ${autoExpense && Number(labCost) > 0 ? 'opacity-100' : 'opacity-50'}`} onClick={() => setAutoExpense(!autoExpense)}>
                                <div className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center border transition-colors shrink-0 ${autoExpense ? 'bg-red-500 border-red-500' : 'bg-white border-red-200'}`}>
                                    {autoExpense && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-red-900 leading-none">Registrar Egreso</p>
                                    <p className="text-[8px] text-red-800/60 uppercase tracking-widest font-black mt-1 leading-tight">Resta utilidad neta</p>
                                </div>
                            </div>
                        </div>

                        {/* Panel Derecho: Arancel Paciente (Ingreso) */}
                        <div className="p-4 bg-[#5B6651]/5 border border-[#5B6651]/20 rounded-2xl space-y-3">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]/60 ml-1 mb-2 block">Cobro a Paciente</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6651]/40" size={16}/>
                                    <input type="number" placeholder="0" className={`w-full p-3 pl-9 rounded-xl bg-white border border-[#5B6651]/20 outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm`} value={patientPrice} onChange={e=>setPatientPrice(e.target.value)} />
                                </div>
                            </div>
                            <div className={`flex items-start gap-2 cursor-pointer transition-opacity ${autoIncome && Number(patientPrice) > 0 ? 'opacity-100' : 'opacity-50'}`} onClick={() => setAutoIncome(!autoIncome)}>
                                <div className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center border transition-colors shrink-0 ${autoIncome ? 'bg-[#5B6651] border-[#5B6651]' : 'bg-white border-[#DFD2C4]'}`}>
                                    {autoIncome && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#312923] leading-none">Generar Deuda</p>
                                    <p className="text-[8px] text-[#9A8F84] uppercase tracking-widest font-black mt-1 leading-tight">Suma a cuentas x cobrar</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <button 
                        className="w-full mt-2 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-[#1a1512] shadow-xl shadow-[#312923]/20 active:scale-95 transition-all flex items-center justify-center gap-2" 
                        onClick={handleSave}
                        disabled={uploading}
                    >
                        <Save size={16}/> CONFIRMAR TRABAJO Y FINANZAS
                    </button>
                </div>
            </div>
        </div>
    );
}