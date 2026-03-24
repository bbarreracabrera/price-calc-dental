import React from 'react';
import { X, FlaskConical } from 'lucide-react';
import { getLocalDate } from '../constants'; // Importamos esto aquí

export default function LabWorkModal({ 
    themeMode, newLabWork, setNewLabWork, patientRecords, setModal, clinicOwner, labWorks, setLabWorks, supabase, notify 
}) {
    const isLight = themeMode === 'light';
    const inputClass = `w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${isLight ? 'bg-gray-50 border-gray-200 focus:border-cyan-500 text-black' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`;
    const labelClass = "text-[10px] font-black uppercase tracking-widest opacity-50";

    const handleSave = async () => {
        if(newLabWork.patientId && newLabWork.workType && newLabWork.expectedDate){
            const id = newLabWork.id || Date.now().toString();
            const data = { ...newLabWork, id, admin_email: clinicOwner };
            
            // Usamos supabase directamente aquí
            const { error } = await supabase.from('lab_works').insert([data]);
            
            if (error) {
                console.error("Error guardando en Supabase:", error);
                alert("Hubo un error al guardar en la nube.");
            } else {
                setLabWorks([...labWorks, data]);
                setModal(null);
                // Reseteamos el formulario
                setNewLabWork({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
                if(typeof notify === 'function') notify("✅ Trabajo enviado y guardado en la nube");
            }
        } else {
            alert("Por favor selecciona un paciente, el tipo de trabajo y la fecha de entrega.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md space-y-4 relative p-6 rounded-3xl border shadow-2xl ${isLight ? 'bg-white border-gray-200 text-black' : 'bg-[#1a1a1a] border-white/10 text-white'}`}>
                <button onClick={()=>setModal(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"><X size={20}/></button>
                <h3 className="text-xl font-bold flex items-center gap-2"><FlaskConical size={24} className="text-cyan-500"/> Enviar a Laboratorio</h3>
                
                {/* Paciente */}
                <div className="space-y-1">
                    <label className={labelClass}>Paciente</label>
                    <select 
                        className={inputClass}
                        value={newLabWork.patientId}
                        onChange={(e) => {
                            const p = Object.values(patientRecords).find(pat => pat.id === e.target.value);
                            if (p) setNewLabWork({...newLabWork, patientId: p.id, patientName: p.personal?.legalName || p.name});
                        }}
                    >
                        <option value="" className={isLight ? 'text-black' : 'bg-gray-900 text-white'}>Selecciona un paciente...</option>
                        {Object.values(patientRecords).map(p => (
                            <option key={p.id} value={p.id} className={isLight ? 'text-black' : 'bg-gray-900 text-white'}>
                                {p.personal?.legalName || p.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Tipo de Trabajo */}
                <div className="space-y-1">
                    <label className={labelClass}>Tipo de Trabajo</label>
                    <input type="text" placeholder="Ej: Corona de Porcelana, Placa..." className={inputClass} value={newLabWork.workType} onChange={e=>setNewLabWork({...newLabWork, workType:e.target.value})}/>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {/* Diente */}
                    <div className="space-y-1">
                        <label className={labelClass}>Diente (Opcional)</label>
                        <input type="text" placeholder="N°" className={inputClass} value={newLabWork.tooth} onChange={e=>setNewLabWork({...newLabWork, tooth:e.target.value})}/>
                    </div>
                    {/* Laboratorio */}
                    <div className="space-y-1">
                        <label className={labelClass}>Laboratorio</label>
                        <input type="text" placeholder="Nombre Lab" className={inputClass} value={newLabWork.labName} onChange={e=>setNewLabWork({...newLabWork, labName:e.target.value})}/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Fecha Envío */}
                    <div className="space-y-1">
                        <label className={labelClass}>Fecha de Envío</label>
                        <input type="date" className={inputClass} value={newLabWork.sendDate} onChange={e=>setNewLabWork({...newLabWork, sendDate:e.target.value})}/>
                    </div>
                    {/* Entrega Esperada */}
                    <div className="space-y-1">
                        <label className={labelClass}>Entrega Esperada</label>
                        <input type="date" className={inputClass} value={newLabWork.expectedDate} onChange={e=>setNewLabWork({...newLabWork, expectedDate:e.target.value})}/>
                    </div>
                </div>

                <button className="w-full mt-4 p-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold tracking-widest uppercase transition-colors shadow-lg shadow-cyan-500/30" onClick={handleSave}>GUARDAR Y ENVIAR</button>
            </div>
        </div>
    );
}