import React, { useState } from 'react';
import { Card, Button } from './UIComponents';
import { Tooth } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER, TEETH_UPPER_PED, TEETH_LOWER_PED, getLocalDate } from '../constants';
import { 
    Search, PenTool, LayoutGrid, MousePointer2, ArrowUp, ArrowDown, 
    ArrowLeft, ArrowRight, ArrowLeftRight, X, Check, Circle, 
    Minus, Scissors, Layers, Shield, History, Camera, RotateCcw
} from 'lucide-react';

export default function OdontogramTab({
    themeMode, odontogramMode, setOdontogramMode, odontogramType, setOdontogramType,
    getPatient, selectedPatientId, setToothModalData, setModal, userRole, catalog,
    setQuoteItems, notify, setActiveTab, sessionData, setSessionData,
    savePatientData 
}) {
    const patient = getPatient(selectedPatientId);
    
    // --- ESTADOS DE LA MÁQUINA DEL TIEMPO ---
    const [activeTool, setActiveTool] = useState('pointer');
    const [viewingSnapshotId, setViewingSnapshotId] = useState(null); // null = Modo en vivo, string = Viendo el pasado

    // --- CARGAR DATOS ---
    // Si estamos viendo el pasado, mostramos los dientes de esa foto. Si no, mostramos los actuales.
    const currentTeeth = patient.clinical?.teeth || {};
    const historicalSnapshots = patient.clinical?.odontogramHistory || [];
    
    const viewingSnapshot = viewingSnapshotId 
        ? historicalSnapshots.find(s => s.id === viewingSnapshotId) 
        : null;
        
    const activeTeethData = viewingSnapshot ? viewingSnapshot.teeth : currentTeeth;

    // --- HERRAMIENTAS ---
    const tools = [
        { id: 'pointer', label: 'Ver Detalle', icon: MousePointer2, color: 'text-[#5B6651]' },
        { id: 'caries', label: 'Caries', dot: 'bg-red-500', isFace: true },
        { id: 'filled', label: 'Resina', dot: 'bg-blue-400', isFace: true },
        { id: 'sealant', label: 'Sellante', icon: Shield, color: 'text-emerald-500', isFace: true },
        { id: 'veneer', label: 'Carilla', icon: Layers, color: 'text-yellow-400', isFace: true },
        { id: 'endo', label: 'Endodoncia', icon: Minus, color: 'text-red-600' },
        { id: 'crown', label: 'Corona', icon: Circle, color: 'text-amber-400' },
        { id: 'implant', label: 'Implante', icon: ArrowDown, color: 'text-gray-500' },
        { id: 'extract', label: 'Ind. Extracción', icon: Scissors, color: 'text-red-500' },
        { id: 'missing', label: 'Ausente', icon: X, color: 'text-[#9A8F84]' },
        { id: 'sano', label: 'Sano / Limpiar', icon: Check, color: 'text-emerald-400' },
        { id: 'extrusion', label: 'Extrusión', icon: ArrowUp, color: 'text-cyan-500' },
        { id: 'intrusion', label: 'Intrusión', icon: ArrowDown, color: 'text-cyan-500' },
        { id: 'mesioversion', label: 'Mesioversión', icon: ArrowLeft, color: 'text-purple-500' },
        { id: 'distoversion', label: 'Distoversión', icon: ArrowRight, color: 'text-purple-500' },
        { id: 'diastema', label: 'Diastema', icon: ArrowLeftRight, color: 'text-[#9A8F84]' },
    ];

    // --- CLICK EN DIENTE ---
    const handleToothClick = (n, clickedFace = 'o') => {
        // Si estamos viajando en el tiempo, NO permitimos modificar nada. Es modo solo lectura.
        if (viewingSnapshotId) {
            notify("Estás viendo un registro histórico (Solo Lectura). Vuelve al modo en vivo para editar.", "error");
            return;
        }

        const toothData = currentTeeth[n] || {};

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
            let currentStatus = Array.isArray(updatedTooth.status) ? [...updatedTooth.status] : (updatedTooth.status ? [updatedTooth.status] : []);

            if (activeTool === 'sano') {
                updatedTooth.status = [];
                updatedTooth.faces = { v: null, l: null, m: null, d: null, o: null };
            } 
            else if (['missing', 'crown', 'endo', 'implant', 'extract'].includes(activeTool)) {
                if (activeTool === 'missing') {
                    updatedTooth.status = ['missing']; 
                    updatedTooth.faces = { v: null, l: null, m: null, d: null, o: null }; 
                } else {
                    if (currentStatus.includes('missing')) currentStatus = currentStatus.filter(s => s !== 'missing');
                    if (currentStatus.includes(activeTool)) currentStatus = currentStatus.filter(s => s !== activeTool);
                    else currentStatus.push(activeTool);
                    updatedTooth.status = currentStatus;
                }
            } 
            else if (['extrusion', 'intrusion', 'mesioversion', 'distoversion', 'diastema'].includes(activeTool)) {
                if (currentStatus.includes('missing')) currentStatus = currentStatus.filter(s => s !== 'missing');
                if (currentStatus.includes(activeTool)) currentStatus = currentStatus.filter(s => s !== activeTool);
                else currentStatus.push(activeTool);
                updatedTooth.status = currentStatus;
            } 
            else if (['caries', 'filled', 'sealant', 'veneer'].includes(activeTool)) {
                updatedTooth.faces = { ...(updatedTooth.faces || {}), [clickedFace]: activeTool };
                if (currentStatus.includes('missing')) {
                    currentStatus = currentStatus.filter(s => s !== 'missing');
                    updatedTooth.status = currentStatus;
                }
            }

            savePatientData(selectedPatientId, {
                ...patient,
                clinical: { ...patient.clinical, teeth: { ...currentTeeth, [n]: updatedTooth } }
            });
        }
    };

    // --- MAGIA: GUARDAR FOTO DEL TIEMPO ---
    const handleTakeSnapshot = () => {
        if (!window.confirm("¿Deseas guardar una copia inmutable del Odontograma actual en el historial del paciente?")) return;
        
        const timestamp = new Date().toISOString();
        const dateStr = getLocalDate() + ' ' + new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
        
        const newSnapshot = {
            id: `od_snap_${Date.now()}`,
            date: dateStr,
            timestamp: timestamp,
            teeth: JSON.parse(JSON.stringify(currentTeeth)), // Copia profunda (Desconectada de referencias)
            type: odontogramType
        };

        savePatientData(selectedPatientId, {
            ...patient,
            clinical: {
                ...patient.clinical,
                odontogramHistory: [newSnapshot, ...historicalSnapshots]
            }
        });
        
        notify("📸 Estado del odontograma guardado en el historial clínico.");
    };

    // --- MAGIA: RESTAURAR EL PASADO AL PRESENTE ---
    const handleRestoreSnapshot = (snapshot) => {
        if (!window.confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de sobreescribir el odontograma actual con el estado del ${snapshot.date}? Perderás los cambios no guardados de hoy.`)) return;
        
        savePatientData(selectedPatientId, {
            ...patient,
            clinical: {
                ...patient.clinical,
                teeth: JSON.parse(JSON.stringify(snapshot.teeth))
            }
        });
        
        setViewingSnapshotId(null); // Volvemos al presente
        notify(`Odontograma restaurado al estado del ${snapshot.date}`);
    };


    const hideScrollStyles = { msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitScrollbarDisplay: 'none' };

    return (
        <div className="flex flex-col gap-5 animate-in fade-in pb-10 relative">
            
            {/* CONTROLES SUPERIORES */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4] shadow-sm w-full md:w-auto">
                    <button onClick={() => {setOdontogramMode('hallazgos'); setViewingSnapshotId(null);}} className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${odontogramMode === 'hallazgos' ? 'bg-[#5B6651] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#5B6651]'}`}>
                        <Search size={14}/> Diagnóstico
                    </button>
                    <button onClick={() => {setOdontogramMode('tratamientos'); setViewingSnapshotId(null);}} className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${odontogramMode === 'tratamientos' ? 'bg-[#CBAAA2] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#CBAAA2]'}`}>
                        <PenTool size={14}/> Plan
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-[#DFD2C4]/60 shadow-sm w-full md:w-auto">
                        {['adulto', 'pediatrico', 'mixto'].map((type) => (
                            <button key={type} disabled={!!viewingSnapshotId} onClick={() => setOdontogramType(type)} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${odontogramType === type ? 'bg-[#FDFBF7] text-[#312923] border border-[#DFD2C4] shadow-sm' : 'text-[#9A8F84] hover:text-[#312923]'} ${viewingSnapshotId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ALERTA DE MODO HISTÓRICO (SÓLO SI ESTAMOS VIENDO EL PASADO) */}
            {viewingSnapshotId && (
                <div className="w-full bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top">
                    <div className="flex items-center gap-3 text-amber-700">
                        <History className="animate-spin-slow" size={20}/>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest leading-none">Modo Máquina del Tiempo (Solo Lectura)</p>
                            <p className="text-sm font-bold mt-1">Estás viendo el odontograma de: {viewingSnapshot?.date}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setViewingSnapshotId(null)} 
                        className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-amber-600 transition-all"
                    >
                        Volver al Presente
                    </button>
                </div>
            )}

            {/* TOOLBAR SUPERIOR HORIZONTAL (Deshabilitado en modo historia) */}
            <div className={`w-full bg-white p-3 rounded-[1.5rem] border border-[#DFD2C4]/60 shadow-sm flex flex-wrap items-center justify-center gap-2 relative z-10 transition-opacity ${viewingSnapshotId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <span className="text-[9px] font-black text-[#9A8F84] uppercase tracking-widest mr-2 hidden xl:block">Herramientas:</span>
                
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
                        <span className="text-[10px] font-bold">{tool.label}</span>
                    </button>
                ))}
            </div>

            {/* LIENZO DEL ODONTOGRAMA */}
            <Card 
                className="w-full flex flex-col items-center gap-8 py-10 bg-white border-[#DFD2C4]/40 shadow-sm overflow-x-auto relative"
                style={{ ...hideScrollStyles, boxShadow: 'inset 0 10px 30px -5px rgba(91,102,81,0.03)' }}
            >
                <div className="flex flex-col items-center gap-8 w-max px-4 pt-4" style={hideScrollStyles}>
                    
                    {/* Superior Adulto */}
                    {(odontogramType === 'adulto' || odontogramType === 'mixto') && (
                        <div className="flex gap-1 md:gap-2 flex-nowrap justify-center w-max mx-auto">
                            {TEETH_UPPER.map(n => (
                                <div key={n} className={`flex flex-col items-center group transition-transform relative pt-4 pb-4 ${!viewingSnapshotId ? 'cursor-pointer hover:scale-105' : ''}`}>
                                    <span className="absolute top-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">V</span>
                                    <Tooth number={n} mode={odontogramMode} status={activeTeethData[n]?.status} data={{...activeTeethData[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                    <span className="absolute bottom-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">P</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Superior Pediátrico */}
                    {(odontogramType === 'pediatrico' || odontogramType === 'mixto') && (
                        <div className="flex gap-2 flex-nowrap justify-center bg-[#CBAAA2]/5 p-6 rounded-[2.5rem] border border-[#CBAAA2]/20 w-max mx-auto">
                            {TEETH_UPPER_PED.map(n => (
                                <div key={n} className={`flex flex-col items-center group transition-transform relative pt-4 pb-4 ${!viewingSnapshotId ? 'cursor-pointer hover:scale-105' : ''}`}>
                                    <span className="absolute top-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">V</span>
                                    <Tooth number={n} mode={odontogramMode} status={activeTeethData[n]?.status} data={{...activeTeethData[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                    <span className="absolute bottom-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">P</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#DFD2C4] to-transparent my-2"></div>

                    {/* Inferior Pediátrico */}
                    {(odontogramType === 'pediatrico' || odontogramType === 'mixto') && (
                        <div className="flex gap-2 flex-nowrap justify-center bg-[#CBAAA2]/5 p-6 rounded-[2.5rem] border border-[#CBAAA2]/20 w-max mx-auto">
                            {TEETH_LOWER_PED.map(n => (
                                <div key={n} className={`flex flex-col items-center group transition-transform relative pt-4 pb-4 ${!viewingSnapshotId ? 'cursor-pointer hover:scale-105' : ''}`}>
                                    <span className="absolute top-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">L</span>
                                    <Tooth number={n} mode={odontogramMode} status={activeTeethData[n]?.status} data={{...activeTeethData[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                    <span className="absolute bottom-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">V</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Inferior Adulto */}
                    {(odontogramType === 'adulto' || odontogramType === 'mixto') && (
                        <div className="flex gap-1 md:gap-2 flex-nowrap justify-center w-max mx-auto">
                            {TEETH_LOWER.map(n => (
                                <div key={n} className={`flex flex-col items-center group transition-transform relative pt-4 pb-4 ${!viewingSnapshotId ? 'cursor-pointer hover:scale-105' : ''}`}>
                                    <span className="absolute top-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">L</span>
                                    <Tooth number={n} mode={odontogramMode} status={activeTeethData[n]?.status} data={{...activeTeethData[n], onFaceClick: (face) => handleToothClick(n, face)}} onClick={() => handleToothClick(n, 'o')} theme={themeMode} />
                                    <span className="absolute bottom-0 text-[8px] font-black text-[#9A8F84] opacity-40 group-hover:opacity-100 transition-opacity">V</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* --- PANEL DE HISTORIAL EVOLUTIVO (LA MÁQUINA DEL TIEMPO) --- */}
            <div className="w-full bg-[#FDFBF7] p-5 rounded-[2rem] border border-[#DFD2C4]/60 shadow-inner flex flex-col md:flex-row gap-6">
                
                <div className="flex flex-col items-start gap-3 w-full md:w-1/3">
                    <div>
                        <h3 className="text-sm font-black text-[#312923] flex items-center gap-2">
                            <History size={16} className="text-[#CBAAA2]" />
                            Historial del Odontograma
                        </h3>
                        <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-1">Línea de tiempo clínica</p>
                    </div>
                    
                    <button 
                        onClick={handleTakeSnapshot}
                        disabled={!!viewingSnapshotId}
                        className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewingSnapshotId ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#CBAAA2] text-white hover:bg-[#b09088] shadow-md shadow-[#CBAAA2]/20 hover:-translate-y-0.5'}`}
                    >
                        <Camera size={16}/> Guardar Foto Actual
                    </button>
                </div>

                <div className="flex-1 flex gap-3 overflow-x-auto custom-scrollbar pb-2 items-center">
                    {historicalSnapshots.length === 0 ? (
                        <p className="text-xs font-bold text-[#9A8F84] italic mx-auto opacity-60">No hay registros históricos guardados aún.</p>
                    ) : (
                        historicalSnapshots.map(snap => (
                            <div 
                                key={snap.id} 
                                onClick={() => setViewingSnapshotId(snap.id === viewingSnapshotId ? null : snap.id)}
                                className={`shrink-0 w-48 p-4 rounded-2xl border cursor-pointer transition-all ${
                                    viewingSnapshotId === snap.id 
                                    ? 'bg-amber-50 border-amber-300 shadow-md transform scale-105' 
                                    : 'bg-white border-[#DFD2C4]/50 hover:border-[#CBAAA2] hover:shadow-sm'
                                }`}
                            >
                                <p className="text-[11px] font-black text-[#312923] mb-1 leading-tight">{snap.date}</p>
                                <p className="text-[9px] font-bold text-[#9A8F84] uppercase tracking-widest">Odontograma: {snap.type}</p>
                                
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* LISTA DE RESUMEN Y ACCIÓN */}
            <div className="w-full mt-2 space-y-4">
                <div className="flex justify-between items-end border-b border-[#DFD2C4] pb-4">
                    <div>
                        <h3 className="text-xl font-black text-[#312923] tracking-tight">Registro de Hallazgos {viewingSnapshotId ? '(Histórico)' : ''}</h3>
                        <p className="text-[10px] font-bold text-[#9A8F84] mt-1 uppercase tracking-widest">Resumen detallado de la pieza dental</p>
                    </div>
                    {/* El botón de cotizar desaparece si estamos viendo el pasado */}
                    {(userRole === 'admin' || userRole === 'dentist') && !viewingSnapshotId && (
                        <button 
                            onClick={() => {
                                const teeth = currentTeeth || {};
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
                        const toothData = activeTeethData[n]; // Usamos activeTeethData para que muestre la info del pasado si corresponde
                        if (!toothData) return null;
                        
                        const renderStatuses = () => {
                            let sArray = Array.isArray(toothData.status) ? [...toothData.status] : [toothData.status];
                            sArray = sArray.filter(Boolean); 
                            
                            if (toothData.faces) {
                                const faceValues = Object.values(toothData.faces);
                                if (faceValues.includes('caries') && !sArray.includes('caries')) sArray.push('caries');
                                if (faceValues.includes('filled') && !sArray.includes('filled')) sArray.push('filled');
                                if (faceValues.includes('sealant') && !sArray.includes('sealant')) sArray.push('sealant');
                                if (faceValues.includes('veneer') && !sArray.includes('veneer')) sArray.push('veneer');
                            }

                            if (sArray.length === 0) return 'Hallazgo Registrado';
                            
                            const names = {
                                missing: 'Ausente', crown: 'Corona', extrusion: 'Extrusión',
                                intrusion: 'Intrusión', mesioversion: 'Mesioversión',
                                distoversion: 'Distoversión', diastema: 'Diastema',
                                caries: 'Caries', filled: 'Resina', endo: 'Endodoncia',
                                implant: 'Implante', extract: 'Ext. Indicada',
                                sealant: 'Sellante', veneer: 'Carilla'
                            };
                            return sArray.map(s => names[s] || s).join(' + ');
                        };

                        const hasContent = toothData.status?.length > 0 || (toothData.faces && Object.values(toothData.faces).some(v => v)) || (toothData.notes?.trim()) || toothData.treatment?.name;
                        
                        if (hasContent) {
                            return (
                                <div key={n} onClick={() => { if(!viewingSnapshotId) { setToothModalData({ id: n, mode: odontogramMode, ...toothData, faces: toothData.faces || { v: null, l: null, m: null, d: null, o: null }, treatment: toothData.treatment || { name: '', status: 'planned' } }); setModal('tooth'); } }} 
                                     className={`group flex gap-4 p-4 bg-white rounded-2xl border border-[#DFD2C4]/60 transition-all shadow-sm ${!viewingSnapshotId ? 'cursor-pointer hover:border-[#5B6651] hover:shadow-md' : 'opacity-80'}`}>
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