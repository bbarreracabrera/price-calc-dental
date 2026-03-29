import React, { useState } from 'react';
import { Card, Button } from './UIComponents';
import { Tooth } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER, TEETH_UPPER_PED, TEETH_LOWER_PED } from '../constants';
import { 
    Search, PenTool, LayoutGrid, MousePointer2, ArrowUp, ArrowDown, 
    ArrowLeft, ArrowRight, ArrowLeftRight, X, Check, Circle 
} from 'lucide-react';

export default function OdontogramTab({
    themeMode, odontogramMode, setOdontogramMode, odontogramType, setOdontogramType,
    getPatient, selectedPatientId, setToothModalData, setModal, userRole, catalog,
    setQuoteItems, notify, setActiveTab, sessionData, setSessionData,
    savePatientData 
}) {
    const patient = getPatient(selectedPatientId);
    
    // Estado para la herramienta seleccionada
    const [activeTool, setActiveTool] = useState('pointer');

    const tools = [
        { id: 'pointer', label: 'Ver Detalle', icon: MousePointer2, color: 'text-[#5B6651]' },
        { id: 'caries', label: 'Caries', dot: 'bg-red-500', isFace: true },
        { id: 'filled', label: 'Resina', dot: 'bg-blue-400', isFace: true },
        { id: 'crown', label: 'Corona', icon: Circle, color: 'text-amber-400' },
        { id: 'missing', label: 'Ausente', icon: X, color: 'text-red-400' },
        { id: 'sano', label: 'Sano / Limpiar', icon: Check, color: 'text-emerald-400' },
        { id: 'extrusion', label: 'Extrusión', icon: ArrowUp, color: 'text-cyan-500' },
        { id: 'intrusion', label: 'Intrusión', icon: ArrowDown, color: 'text-cyan-500' },
        { id: 'mesioversion', label: 'Mesioversión', icon: ArrowLeft, color: 'text-purple-500' },
        { id: 'distoversion', label: 'Distoversión', icon: ArrowRight, color: 'text-purple-500' },
        { id: 'diastema', label: 'Diastema', icon: ArrowLeftRight, color: 'text-[#9A8F84]' },
    ];

    const handleToothClick = (n, clickedFace = 'o') => {
        const toothData = patient.clinical.teeth[n] || {};

        if (activeTool === 'pointer') {
            setToothModalData({ 
                id: n, 
                mode: odontogramMode, 
                ...toothData, 
                faces: toothData.faces || { v: null, l: null, m: null, d: null, o: null }, 
                treatment: toothData.treatment || { name: '', status: 'planned' } 
            });
            setModal('tooth');
            return;
        }

        if (savePatientData) {
            let updatedTooth = { ...toothData };
            
            // Convertimos el status actual a un Array para permitir múltiples estados (ej. ['extrusion', 'diastema'])
            let currentStatus = [];
            if (Array.isArray(updatedTooth.status)) {
                currentStatus = [...updatedTooth.status];
            } else if (updatedTooth.status) {
                currentStatus = [updatedTooth.status];
            }

            // --- LÓGICA DE SUPERPOSICIÓN DE ESTADOS CLÍNICOS ---
            if (activeTool === 'sano') {
                // Sano limpia absolutamente todo
                updatedTooth.status = [];
                updatedTooth.faces = { v: null, l: null, m: null, d: null, o: null };
            } 
            else if (['missing', 'crown'].includes(activeTool)) {
                // Ausente o Corona son absolutos: reemplazan todo
                updatedTooth.status = [activeTool]; 
                updatedTooth.faces = { v: null, l: null, m: null, d: null, o: null }; 
            } 
            else if (['extrusion', 'intrusion', 'mesioversion', 'distoversion', 'diastema'].includes(activeTool)) {
                // Estas son modificaciones posicionales. Se añaden al Array sin borrar caras ni otros estados.
                // Si el diente estaba 'missing', lo revive, porque no puedes mover un diente que no existe.
                if (currentStatus.includes('missing')) {
                    currentStatus = currentStatus.filter(s => s !== 'missing');
                }
                
                // Si la herramienta ya estaba aplicada, la quita (efecto Toggle)
                if (currentStatus.includes(activeTool)) {
                    currentStatus = currentStatus.filter(s => s !== activeTool);
                } else {
                    currentStatus.push(activeTool);
                }
                updatedTooth.status = currentStatus;
            } 
            else if (['caries', 'filled'].includes(activeTool)) {
                // Pinta la cara exacta
                updatedTooth.faces = { ...(updatedTooth.faces || {}), [clickedFace]: activeTool };
                
                // Si estaba ausente, revivimos el diente (si le pones resina, el diente existe)
                // Pero NO borramos extrusiones o diastemas
                if (currentStatus.includes('missing')) {
                    currentStatus = currentStatus.filter(s => s !== 'missing');
                    updatedTooth.status = currentStatus;
                }
            }

            const updatedPatient = {
                ...patient,
                clinical: {
                    ...patient.clinical,
                    teeth: { ...patient.clinical.teeth, [n]: updatedTooth }
                }
            };
            savePatientData(selectedPatientId, updatedPatient);
        } else {
            notify("Error: Función de guardado no conectada en el Workspace.");
        }
    };

    // Solución CSS para ocultar Scrollbars en el Contenedor
    const hideScrollStyles = {
        msOverflowStyle: 'none',  
        scrollbarWidth: 'none',  
        WebkitScrollbarDisplay: 'none'
    };

    return (
        <div className="flex flex-col gap-5 animate-in fade-in pb-10">
            
            {/* --- CONTROLES SUPERIORES BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4] shadow-sm w-full md:w-auto">
                    <button onClick={() => setOdontogramMode('hallazgos')} className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${odontogramMode === 'hallazgos' ? 'bg-[#5B6651] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#5B6651]'}`}>
                        <Search size={14}/> Diagnóstico
                    </button>
                    <button onClick={() => setOdontogramMode('tratamientos')} className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${odontogramMode === 'tratamientos' ? 'bg-[#CBAAA2] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#CBAAA2]'}`}>
                        <PenTool size={14}/> Plan
                    </button>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-[#DFD2C4]/60 shadow-sm w-full md:w-auto">
                    {['adulto', 'pediatrico', 'mixto'].map((type) => (
                        <button key={type} onClick={() => setOdontogramType(type)} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${odontogramType === type ? 'bg-[#FDFBF7] text-[#312923] border border-[#DFD2C4] shadow-sm' : 'text-[#9A8F84] hover:text-[#312923]'}`}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- TOOLBAR SUPERIOR HORIZONTAL --- */}
            <div className="w-full bg-white p-3 rounded-[1.5rem] border border-[#DFD2C4]/60 shadow-sm flex flex-wrap items-center justify-center gap-2 relative z-10">
                <span className="text-[9px] font-black text-[#9A8F84] uppercase tracking-widest mr-2 hidden xl:block">Acción Rápida:</span>
                
                {tools.map(tool => (
                    <button 
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                            activeTool === tool.id 
                            ? 'bg-[#5B6651] text-white shadow-md transform scale-105' 
                            : 'bg-[#FDFBF7] text-[#6B615A] hover:bg-white border border-[#DFD2C4]/50 hover:border-[#DFD2C4] hover:shadow-sm'
                        }`}
                    >
                        <div className="flex justify-center shrink-0">
                            {tool.icon && <tool.icon size={14} className={activeTool === tool.id ? 'text-white' : tool.color} />}
                            {tool.dot && <div className={`w-2.5 h-2.5 rounded-full ${tool.dot} ${activeTool === tool.id ? 'border border-white/50' : ''}`}></div>}
                        </div>
                        <span className="text-[10px] font-bold">
                            {tool.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* --- LIENZO DEL ODONTOGRAMA --- */}
            <Card 
                className="w-full flex flex-col items-center gap-8 py-10 bg-white border-[#DFD2C4]/40 shadow-sm overflow-x-auto relative"
                style={{ ...hideScrollStyles, boxShadow: 'inset 0 10px 30px -5px rgba(91,102,81,0.03)' }}
            >
                <div className="flex flex-col items-center gap-6 w-max px-4" style={hideScrollStyles}>
                    
                    {/* Superior Adulto */}
                    {(odontogramType === 'adulto' || odontogramType === 'mixto') && (
                        <div className="flex gap-1 md:gap-2 flex-nowrap justify-center w-max mx-auto">
                            {TEETH_UPPER.map(n => (
                                <div key={n} className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform">
                                    <Tooth number={n} mode={odontogramMode} status={patient.clinical.teeth[n]?.status} data={{...patient.clinical.teeth[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Superior Pediátrico */}
                    {(odontogramType === 'pediatrico' || odontogramType === 'mixto') && (
                        <div className="flex gap-2 flex-nowrap justify-center bg-[#CBAAA2]/5 p-4 rounded-[2rem] border border-[#CBAAA2]/20 w-max mx-auto">
                            {TEETH_UPPER_PED.map(n => (
                                <div key={n} className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform">
                                    <Tooth number={n} mode={odontogramMode} status={patient.clinical.teeth[n]?.status} data={{...patient.clinical.teeth[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#DFD2C4] to-transparent my-2"></div>

                    {/* Inferior Pediátrico */}
                    {(odontogramType === 'pediatrico' || odontogramType === 'mixto') && (
                        <div className="flex gap-2 flex-nowrap justify-center bg-[#CBAAA2]/5 p-4 rounded-[2rem] border border-[#CBAAA2]/20 w-max mx-auto">
                            {TEETH_LOWER_PED.map(n => (
                                <div key={n} className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform">
                                    <Tooth number={n} mode={odontogramMode} status={patient.clinical.teeth[n]?.status} data={{...patient.clinical.teeth[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Inferior Adulto */}
                    {(odontogramType === 'adulto' || odontogramType === 'mixto') && (
                        <div className="flex gap-1 md:gap-2 flex-nowrap justify-center w-max mx-auto">
                            {TEETH_LOWER.map(n => (
                                <div key={n} className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform">
                                    <Tooth number={n} mode={odontogramMode} status={patient.clinical.teeth[n]?.status} data={{...patient.clinical.teeth[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
            
            {/* --- LISTA DE RESUMEN Y ACCIÓN --- */}
            <div className="w-full mt-2 space-y-4">
                <div className="flex justify-between items-end border-b border-[#DFD2C4] pb-4">
                    <div>
                        <h3 className="text-xl font-black text-[#312923] tracking-tight">Registro de Hallazgos</h3>
                        <p className="text-[10px] font-bold text-[#9A8F84] mt-1 uppercase tracking-widest">Resumen detallado de la pieza dental</p>
                    </div>
                    {(userRole === 'admin' || userRole === 'dentist') && (
                        <button 
                            onClick={() => {
                                const teeth = patient.clinical?.teeth || {};
                                const newQuoteItems = [];
                                [...TEETH_UPPER, ...TEETH_LOWER, ...TEETH_UPPER_PED, ...TEETH_LOWER_PED].forEach(n => {
                                    const tData = teeth[n];
                                    if (tData?.treatment?.name && tData.treatment.status !== 'completed') {
                                        const catalogItem = catalog.find(c => c.name === tData.treatment.name);
                                        newQuoteItems.push({ id: Date.now() + Math.random(), name: tData.treatment.name, tooth: n.toString(), price: catalogItem ? Number(catalogItem.price) : 0 });
                                    }
                                });
                                if (newQuoteItems.length > 0) { setQuoteItems(newQuoteItems); notify(`Se importaron ${newQuoteItems.length} tratamientos.`); }
                                setActiveTab('quote'); setSessionData({...sessionData, patientName: patient.personal?.legalName || patient.name, patientId: selectedPatientId});
                            }} 
                            className="flex items-center gap-2 px-6 py-3 bg-[#5B6651] text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5 transition-all"
                        >
                            <LayoutGrid size={16}/> Generar Presupuesto
                        </button>
                    )}
                </div>
                
                {/* Lista de Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {[...TEETH_UPPER, ...TEETH_LOWER, ...TEETH_UPPER_PED, ...TEETH_LOWER_PED].map(n => {
                        const toothData = patient.clinical.teeth[n];
                        if (!toothData) return null;
                        
                        // Parsear estado para mostrar nombres amigables en la lista
                        const renderStatuses = () => {
                            let sArray = Array.isArray(toothData.status) ? toothData.status : [toothData.status];
                            sArray = sArray.filter(Boolean); // Quita nulos
                            if (sArray.length === 0) return 'Pieza Activa';
                            
                            const names = {
                                missing: 'Ausente', crown: 'Corona', extrusion: 'Extrusión',
                                intrusion: 'Intrusión', mesioversion: 'Mesioversión',
                                distoversion: 'Distoversión', diastema: 'Diastema'
                            };
                            return sArray.map(s => names[s] || s).join(' + ');
                        };

                        const hasContent = toothData.status || (toothData.faces && Object.values(toothData.faces).some(v => v)) || (toothData.notes?.trim()) || toothData.treatment?.name;
                        
                        if (hasContent) {
                            return (
                                <div key={n} onClick={() => { setToothModalData({ id: n, mode: odontogramMode, ...toothData, faces: toothData.faces || { v: null, l: null, m: null, d: null, o: null }, treatment: toothData.treatment || { name: '', status: 'planned' } }); setModal('tooth'); }} 
                                     className="group flex gap-4 p-4 bg-white rounded-2xl border border-[#DFD2C4]/60 hover:border-[#5B6651] transition-all cursor-pointer shadow-sm hover:shadow-md">
                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${n > 50 ? 'bg-[#CBAAA2]/20 text-[#CBAAA2]' : 'bg-[#5B6651]/10 text-[#5B6651] group-hover:bg-[#5B6651] group-hover:text-white'}`}>
                                        {n}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm font-bold text-[#312923]">
                                            {renderStatuses()}
                                            {toothData.faces && Object.values(toothData.faces).some(v=>v) && (
                                               <span className="text-[#CBAAA2] ml-2 text-xs">
                                                  (Caras: {Object.entries(toothData.faces).filter(([k,v]) => v).map(([k]) => k.toUpperCase()).join(', ')})
                                               </span>
                                            )}
                                        </p>
                                        {toothData.treatment?.name && <p className="text-xs font-medium text-[#6B615A] border-l-2 border-[#DFD2C4] pl-2">{toothData.treatment.name}</p>}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}