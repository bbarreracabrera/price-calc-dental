import React, { useState } from 'react';
import { Stethoscope, Plus, X, Printer, AlertTriangle, Pill, CheckCircle2 } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants';

export default function PrescriptionView({
    themeMode, t, patientRecords, getPatient, savePatientData, setPatientRecords,
    rxPatient, setRxPatient, medInput, setMedInput, prescription, setPrescription,
    notify, generatePDF, adminEmail
}) {
   // Radar a prueba de balas para buscar cualquier alerta en la Anamnesis
    const medicalAlerts = (() => {
        if (!rxPatient?.anamnesis) return '';
        const alerts = [];
        
        // 1. Si tienes casillas de verificación (ej: Alergias = true, Diabetes = true)
        if (rxPatient.anamnesis.conditions) {
            const activas = Object.entries(rxPatient.anamnesis.conditions)
                .filter(([_, value]) => value === true)
                .map(([key]) => key.toUpperCase());
            if (activas.length > 0) alerts.push(`Condiciones: ${activas.join(', ')}`);
        }
        
        // 2. Si escribiste algo en los cuadros de texto de Antecedentes Recientes/Remotos
        if (rxPatient.anamnesis.recent) alerts.push(`Nota: ${rxPatient.anamnesis.recent}`);
        if (rxPatient.anamnesis.remote) alerts.push(`Historial: ${rxPatient.anamnesis.remote}`);
        
        return alerts.join(' | ');
    })();

    // Sugerencias de dosis rápidas
    const [showSuggestions, setShowSuggestions] = useState(false);
    const commonDosages = [
        "1 comprimido cada 8 horas por 7 días.",
        "1 comprimido cada 12 horas por 5 días.",
        "Tomar 1 hora antes del procedimiento.",
        "En caso de dolor, máximo 1 cada 8 hrs."
    ];

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Stethoscope size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Documentos Clínicos</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Emisión de Recetas</h2>
                </div>
                <button 
                    onClick={() => { setPrescription([]); setRxPatient(null); setMedInput({name:'', dosage:''}); }}
                    className="px-5 py-3 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] hover:text-[#312923] transition-all shadow-sm"
                >
                    Limpiar Recetario
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- PANEL IZQUIERDO: CONFIGURACIÓN --- */}
                <Card className="lg:col-span-7 space-y-6 rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                    
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">1. Paciente a recetar</label>
                        <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." adminEmail={adminEmail} onSelect={(p) => {
                            if (p.id === 'new') {
                                const newId = "pac_" + Date.now().toString();
                                const nombreReal = p.name;
                                const newPatient = getPatient(newId);
                                newPatient.id = newId;
                                newPatient.name = nombreReal;
                                if (!newPatient.personal) newPatient.personal = {};
                                newPatient.personal.legalName = nombreReal;
                                
                                savePatientData(newId, newPatient);
                                setRxPatient(newPatient);
                                notify("Paciente Creado Exitosamente");
                            } else {
                                setPatientRecords(prev => ({...prev, [p.id]: p}));
                                setRxPatient(p);
                            }
                        }} />
                    </div>

                    {rxPatient && (
                        <div className="animate-in slide-in-from-top-2 pt-4">
                            
                            {/* Tarjeta del Paciente Seleccionado */}
                            <div className="bg-[#FDFBF7] border border-[#DFD2C4]/50 p-5 rounded-2xl flex items-center justify-between mb-6 shadow-inner">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#5B6651]/10 text-[#5B6651] flex items-center justify-center font-black text-xl border border-[#5B6651]/20">
                                        {rxPatient.personal.legalName[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#312923] text-lg leading-none mb-1">{rxPatient.personal.legalName}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84]">RUT: {rxPatient.personal.rut || 'No registrado'}</p>
                                    </div>
                                </div>
                                <div className="text-emerald-500 bg-emerald-50 p-2 rounded-full"><CheckCircle2 size={20}/></div>
                            </div>

                            {/* Alertas Médicas Destacadas */}
                            {medicalAlerts && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 animate-in zoom-in-95 shadow-sm">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20}/>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Alerta Médica Activa</h4>
                                        <p className="text-sm font-bold text-red-900">{medicalAlerts}</p>
                                    </div>
                                </div>
                            )}

                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block border-t border-[#DFD2C4]/50 pt-6">2. Prescripción Médica</label>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <Pill className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3968B]" size={18}/>
                                    <input 
                                        className="w-full p-4 pl-12 rounded-2xl bg-white border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                                        placeholder="Nombre del fármaco (ej: Amoxicilina 500mg)"
                                        value={medInput.name} 
                                        onChange={e=>setMedInput({...medInput, name:e.target.value})}
                                    />
                                </div>
                                
                                <div className="relative">
                                    <input 
                                        className="w-full p-4 rounded-2xl bg-white border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                                        placeholder="Indicaciones y posología..."
                                        value={medInput.dosage} 
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(()=>setShowSuggestions(false), 200)}
                                        onChange={e=>setMedInput({...medInput, dosage:e.target.value})}
                                    />
                                    
                                    {showSuggestions && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-[#DFD2C4] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {commonDosages.map((dosis, idx) => (
                                                <button 
                                                    key={idx} 
                                                    className="w-full text-left px-4 py-3 text-xs font-bold text-[#6B615A] hover:bg-[#FDFBF7] hover:text-[#5B6651] border-b border-[#DFD2C4]/30 last:border-0 transition-colors"
                                                    onMouseDown={() => setMedInput({...medInput, dosage: dosis})}
                                                >
                                                    {dosis}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-[#1a1512] shadow-lg shadow-[#312923]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    onClick={()=>{
                                        if(medInput.name) {
                                            setPrescription([...prescription, medInput]); 
                                            setMedInput({name:'', dosage:''});
                                        }
                                    }}
                                >
                                    <Plus size={16}/> Agregar a la Receta
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* --- PANEL DERECHO: VISTA PREVIA --- */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-sm flex flex-col h-full min-h-[500px]">
                        <div className="flex justify-between items-center mb-6 border-b border-[#DFD2C4]/50 pb-4">
                            <h3 className="font-black text-xl text-[#312923]">Vista Previa</h3>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">{getLocalDate()}</span>
                        </div>
                        
                        <div className="flex-1 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 mb-6">
                            {prescription.length === 0 ? (
                                <div className="text-center py-10 opacity-50 flex flex-col items-center">
                                    <Stethoscope size={32} className="text-[#A3968B] mb-3"/>
                                    <p className="text-xs font-bold uppercase tracking-widest">Receta en blanco</p>
                                </div>
                            ) : (
                                prescription.map((p,i)=>(
                                    <div key={i} className="p-4 bg-white rounded-2xl border border-[#DFD2C4]/50 shadow-sm relative group">
                                        <div className="flex items-start gap-3 pr-6">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#5B6651] mt-1.5 shrink-0"></div>
                                            <div>
                                                <p className="font-black text-[#312923] text-sm leading-tight mb-1">{p.name}</p>
                                                <p className="text-xs text-[#6B615A] font-medium leading-relaxed">{p.dosage}</p>
                                            </div>
                                        </div>
                                        <button 
                                            className="absolute top-4 right-4 text-[#DFD2C4] hover:text-red-500 transition-colors" 
                                            onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}
                                        >
                                            <X size={16}/>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 border-t border-[#DFD2C4]/60 mt-auto">
                            <button 
                                disabled={prescription.length===0 || !rxPatient}
                                onClick={()=>generatePDF('rx', rxPatient)}
                                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    prescription.length === 0 || !rxPatient
                                    ? 'bg-[#DFD2C4]/30 text-[#9A8F84] cursor-not-allowed' 
                                    : 'bg-[#5B6651] text-white hover:bg-[#4a5442] shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5'
                                }`}
                            >
                                <Printer size={18}/> IMPRIMIR RECETA PDF
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}