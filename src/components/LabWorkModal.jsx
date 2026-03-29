import React from 'react';
import { X, FlaskConical, Save } from 'lucide-react';
import { getLocalDate } from '../constants'; 

export default function LabWorkModal({ 
    themeMode, newLabWork, setNewLabWork, patientRecords, setModal, clinicOwner, labWorks, setLabWorks, supabase, notify 
}) {
    const inputClass = "w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors appearance-none";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    const handleSave = async () => {
        if(newLabWork.patientId && newLabWork.workType && newLabWork.expectedDate){
            const id = newLabWork.id || Date.now().toString();
            const data = { ...newLabWork, id, admin_email: clinicOwner };
            
            const { error } = await supabase.from('lab_works').insert([data]);
            
            if (error) {
                console.error("Error guardando en Supabase:", error);
                alert("Hubo un error al guardar en la nube.");
            } else {
                setLabWorks([...labWorks, data]);
                setModal(null);
                setNewLabWork({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
                if(typeof notify === 'function') notify("✅ Trabajo enviado y guardado en la nube");
            }
        } else {
            alert("Por favor selecciona un paciente, el tipo de trabajo y la fecha de entrega.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#312923]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white border border-[#DFD2C4]/50 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DFD2C4]/50">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight flex items-center gap-2">
                            <FlaskConical className="text-[#CBAAA2]"/> Enviar a Laboratorio
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Nuevo Registro de Envío</p>
                    </div>
                    <button onClick={()=>setModal(null)} className="p-2 text-[#9A8F84] hover:bg-[#FDFBF7] hover:text-[#312923] rounded-xl transition-all">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="space-y-5">
                    {/* Paciente */}
                    <div>
                        <label className={labelClass}>1. Paciente</label>
                        <select 
                            className={`${inputClass} cursor-pointer`}
                            value={newLabWork.patientId}
                            onChange={(e) => {
                                const p = Object.values(patientRecords).find(pat => pat.id === e.target.value);
                                if (p) setNewLabWork({...newLabWork, patientId: p.id, patientName: p.personal?.legalName || p.name});
                            }}
                        >
                            <option value="">Selecciona un paciente de tu lista...</option>
                            {Object.values(patientRecords).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.personal?.legalName || p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Tipo de Trabajo */}
                    <div>
                        <label className={labelClass}>2. Trabajo Solicitado</label>
                        <input type="text" placeholder="Ej: Corona de Porcelana, Placa Miorelajante..." className={inputClass} value={newLabWork.workType} onChange={e=>setNewLabWork({...newLabWork, workType:e.target.value})}/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Diente */}
                        <div>
                            <label className={labelClass}>N° Diente (Opcional)</label>
                            <input type="text" placeholder="Ej: 18, 24..." className={inputClass} value={newLabWork.tooth} onChange={e=>setNewLabWork({...newLabWork, tooth:e.target.value})}/>
                        </div>
                        {/* Laboratorio */}
                        <div>
                            <label className={labelClass}>Nombre Lab</label>
                            <input type="text" placeholder="Ej: Lab. Dentalis" className={inputClass} value={newLabWork.labName} onChange={e=>setNewLabWork({...newLabWork, labName:e.target.value})}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-[#DFD2C4]/50 pt-5">
                        {/* Fecha Envío */}
                        <div>
                            <label className={labelClass}>Fecha de Envío</label>
                            <input type="date" className={inputClass} value={newLabWork.sendDate} onChange={e=>setNewLabWork({...newLabWork, sendDate:e.target.value})}/>
                        </div>
                        {/* Entrega Esperada */}
                        <div>
                            <label className={labelClass}>Llegada Esperada</label>
                            <input type="date" className={inputClass} value={newLabWork.expectedDate} onChange={e=>setNewLabWork({...newLabWork, expectedDate:e.target.value})}/>
                        </div>
                    </div>

                    <button 
                        className="w-full mt-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#5B6651] hover:bg-[#4a5442] shadow-lg shadow-[#5B6651]/20 active:scale-95 transition-all flex items-center justify-center gap-2" 
                        onClick={handleSave}
                    >
                        <Save size={16}/> REGISTRAR Y ENVIAR
                    </button>
                </div>
            </div>
        </div>
    );
}