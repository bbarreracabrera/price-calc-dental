import React, { useState } from 'react';
import { Stethoscope, Plus, X, Printer, AlertTriangle, Pill, CheckCircle2, ExternalLink, Info, Shield } from 'lucide-react';
import { Card } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants';

export default function PrescriptionView({
    themeMode, t, patientRecords, getPatient, savePatientData, setPatientRecords,
    rxPatient, setRxPatient, medInput, setMedInput, prescription, setPrescription,
    notify, generatePDF, adminEmail
}) {
    const [showLegalInfo, setShowLegalInfo] = useState(false);

    // Radar a prueba de balas para buscar cualquier alerta en la Anamnesis
    const medicalAlerts = (() => {
        if (!rxPatient?.anamnesis) return '';
        const alerts = [];
        if (rxPatient.anamnesis.conditions) {
            const activas = Object.entries(rxPatient.anamnesis.conditions)
                .filter(([_, value]) => value === true)
                .map(([key]) => key.toUpperCase());
            if (activas.length > 0) alerts.push(`Condiciones: ${activas.join(', ')}`);
        }
        if (rxPatient.anamnesis.recent) alerts.push(`Nota: ${rxPatient.anamnesis.recent}`);
        if (rxPatient.anamnesis.remote) alerts.push(`Historial: ${rxPatient.anamnesis.remote}`);
        return alerts.join(' | ');
    })();

    const [showSuggestions, setShowSuggestions] = useState(false);
    const commonDosages = [
        "1 comprimido cada 8 horas por 7 días.",
        "1 comprimido cada 12 horas por 5 días.",
        "Tomar 1 hora antes del procedimiento.",
        "En caso de dolor, máximo 1 cada 8 hrs.",
        "1 comprimido cada 6 horas por 5 días.",
        "Enjuague bucal 3 veces al día por 7 días.",
    ];

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Stethoscope size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Documentos Clínicos</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Recetario Clínico</h2>
                    <p className="text-xs font-bold text-[#9A8F84] mt-1">Borrador interno para uso del profesional</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowLegalInfo(!showLegalInfo)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#5B6651]/30 bg-[#5B6651]/5 text-[#5B6651] text-[10px] font-black uppercase tracking-widest hover:bg-[#5B6651]/10 transition-all"
                    >
                        <Shield size={13}/> Marco Legal
                    </button>
                    <button
                        onClick={() => window.open('https://recetaelectronica.minsal.cl/', '_blank')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#312923] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1a1512] transition-all shadow-md"
                    >
                        <ExternalLink size={13}/> Receta Electrónica MINSAL
                    </button>
                    <button 
                        onClick={() => { setPrescription([]); setRxPatient(null); setMedInput({name:'', dosage:''}); }}
                        className="px-4 py-2.5 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] hover:text-[#312923] transition-all"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* --- AVISO LEGAL EXPANDIBLE --- */}
            {showLegalInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 animate-in slide-in-from-top-2 shrink-0">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                            <Shield size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-blue-900 text-base mb-1">Marco Legal: Recetas en Chile (Actualizado 2025)</h3>
                            <p className="text-xs font-bold text-blue-700 leading-relaxed">
                                Según el <strong>Decreto Supremo N°11 del MINSAL (publicado mayo 2025)</strong> y la <strong>Ley 21.267</strong>, en Chile existen dos modalidades válidas:
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-2xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#312923]">Este módulo (Borrador PDF)</span>
                            </div>
                            <p className="text-xs font-bold text-[#6B615A] leading-relaxed">
                                Genera un <strong>documento PDF imprimible</strong> para uso interno y registro clínico. 
                                <strong> No es una receta electrónica oficial</strong> para dispensación en farmacias. 
                                Útil como borrador, copia de respaldo o para tratamientos que no requieren receta retenida.
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#312923]">Receta Electrónica Oficial (MINSAL)</span>
                            </div>
                            <p className="text-xs font-bold text-[#6B615A] leading-relaxed">
                                La plataforma <strong>recetaelectronica.minsal.cl</strong> es el sistema oficial, 
                                <strong> gratuito</strong>, que emite recetas válidas para farmacias. Requiere tu 
                                <strong> Clave Única</strong> para firmar. Aceptada en toda farmacia del país.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                        <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                            <strong>Recomendación para tus pacientes:</strong> Usa este módulo para preparar y revisar la prescripción, 
                            y luego emítela oficialmente en el sistema MINSAL con tu Clave Única. Así el paciente puede retirar 
                            sus medicamentos en cualquier farmacia del país.
                        </p>
                    </div>

                    <button
                        onClick={() => window.open('https://recetaelectronica.minsal.cl/', '_blank')}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#5B6651] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#4a5442] transition-all"
                    >
                        <ExternalLink size={14}/> Ir al Sistema Oficial de Receta Electrónica MINSAL
                    </button>
                </div>
            )}

            {/* --- AVISO COMPACTO (siempre visible) --- */}
            {!showLegalInfo && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 shrink-0">
                    <Info size={14} className="text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-800 flex-1">
                        Este módulo genera un <strong>borrador PDF para uso interno</strong>. Para recetas válidas en farmacias, usa el sistema oficial gratuito del MINSAL.
                    </p>
                    <button
                        onClick={() => window.open('https://recetaelectronica.minsal.cl/', '_blank')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#312923] text-white text-[9px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap hover:bg-[#1a1512] transition-all"
                    >
                        <ExternalLink size={11}/> MINSAL
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
                
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
                                        {rxPatient.personal?.legalName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#312923] text-lg leading-none mb-1">{rxPatient.personal?.legalName}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84]">RUT: {rxPatient.personal?.rut || 'No registrado'}</p>
                                    </div>
                                </div>
                                <div className="text-emerald-500 bg-emerald-50 p-2 rounded-full"><CheckCircle2 size={20}/></div>
                            </div>

                            {/* Alertas Médicas */}
                            {medicalAlerts && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 animate-in zoom-in-95 shadow-sm">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20}/>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Alerta Médica Activa</h4>
                                        <p className="text-sm font-bold text-red-900">{medicalAlerts}</p>
                                    </div>
                                </div>
                            )}

                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block border-t border-[#DFD2C4]/50 pt-6">2. Prescripción</label>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <Pill className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3968B]" size={18}/>
                                    <input 
                                        className="w-full p-4 pl-12 rounded-2xl bg-white border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                                        placeholder="Nombre del fármaco (ej: Amoxicilina 500mg)"
                                        value={medInput.name} 
                                        onChange={e=>setMedInput({...medInput, name:e.target.value})}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && medInput.name) {
                                                setPrescription([...prescription, medInput]);
                                                setMedInput({name:'', dosage:''});
                                            }
                                        }}
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
                <div className="lg:col-span-5 space-y-4">
                    <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-sm flex flex-col min-h-[400px]">
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

                        <div className="pt-6 border-t border-[#DFD2C4]/60 mt-auto space-y-3">
                            <button 
                                disabled={prescription.length===0 || !rxPatient}
                                onClick={()=>generatePDF('rx', rxPatient)}
                                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    prescription.length === 0 || !rxPatient
                                    ? 'bg-[#DFD2C4]/30 text-[#9A8F84] cursor-not-allowed' 
                                    : 'bg-[#5B6651] text-white hover:bg-[#4a5442] shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5'
                                }`}
                            >
                                <Printer size={18}/> Imprimir Borrador PDF
                            </button>
                            <button
                                onClick={() => window.open('https://recetaelectronica.minsal.cl/', '_blank')}
                                className="w-full py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white border border-[#5B6651]/30 text-[#5B6651] hover:bg-[#5B6651]/5 transition-all"
                            >
                                <ExternalLink size={14}/> Emitir Receta Oficial MINSAL
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
