import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Printer, CheckCircle, Layers } from 'lucide-react';
import { Card } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate } from '../constants';

// --- DEFINICIÓN DE FASES CLÍNICAS (Estándar de Oro) ---
const CLINICAL_PHASES = [
    'Fase de Urgencia',
    'Fase Etiológica (Higiene/Prevención)',
    'Fase Correctiva (Operatoria/Endo/Cirugía)',
    'Fase Rehabilitadora (Prótesis/Implantes)',
    'Fase de Mantención'
];

export default function QuoteView({
    themeMode, t, quoteItems, setQuoteItems, newQuoteItem, setNewQuoteItem,
    catalog, patientRecords, sessionData, setSessionData, getPatient, savePatientData,
    saveToSupabase, notify, generatePDF, setActiveTab
}) {

    // Aseguramos que siempre haya una fase por defecto al abrir el cotizador
    const currentPhase = newQuoteItem.phase || 'Fase Correctiva (Operatoria/Endo/Cirugía)';

    // --- LÓGICA DE AGRUPACIÓN POR FASES ---
    const groupedItems = CLINICAL_PHASES.reduce((acc, phase) => {
        const itemsInPhase = quoteItems.filter(item => item.phase === phase);
        if (itemsInPhase.length > 0) acc[phase] = itemsInPhase;
        return acc;
    }, {});

    // Por si hay ítems antiguos sin fase guardados en caché
    const unphasedItems = quoteItems.filter(item => !item.phase || !CLINICAL_PHASES.includes(item.phase));
    if (unphasedItems.length > 0) groupedItems['Sin Fase Asignada'] = unphasedItems;

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Planificación Integral</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Plan de Tratamiento</h2>
                </div>
                <button 
                    onClick={() => setQuoteItems([])}
                    className="px-5 py-3 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] hover:text-[#312923] transition-all shadow-sm"
                >
                    Limpiar Plan
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- PANEL IZQUIERDO: AGREGAR ÍTEMS --- */}
                <Card className="lg:col-span-7 space-y-6 rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">
                    
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">1. Seleccionar Paciente</label>
                        <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
                            if (p.id === 'new') {
                                let nombreReal = p.name;
                                if (!nombreReal || nombreReal.trim() === "") { nombreReal = window.prompt("Confirma el nombre:"); if (!nombreReal) return; }
                                const newId = "pac_" + Date.now().toString();
                                const newPatient = getPatient(newId);
                                newPatient.id = newId; newPatient.name = nombreReal;
                                if (!newPatient.personal) newPatient.personal = {};
                                newPatient.personal.legalName = nombreReal;
                                savePatientData(newId, newPatient);
                                setSessionData({...sessionData, patientName: nombreReal, patientId: newId});
                                notify("Paciente Creado");
                            } else {
                                setSessionData({...sessionData, patientName: p.personal?.legalName || p.name, patientId: p.id});
                            }
                        }} />
                    </div>
                    
                    {sessionData.patientId && (
                        <div className="animate-in fade-in space-y-5 pt-6 border-t border-[#DFD2C4]/40">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 block">2. Planificar Procedimiento</label>
                            
                            {/* NUEVO: Selector de Fase Clínica */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3968B]"><Layers size={18}/></div>
                                <select 
                                    className="w-full outline-none font-black text-sm py-4 pl-12 pr-4 rounded-2xl border border-[#DFD2C4] bg-[#CBAAA2]/10 text-[#5B6651] focus:border-[#5B6651] transition-all cursor-pointer appearance-none"
                                    value={currentPhase}
                                    onChange={e => setNewQuoteItem({...newQuoteItem, phase: e.target.value})}
                                >
                                    {CLINICAL_PHASES.map(phase => (
                                        <option key={phase} value={phase}>{phase}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A3968B]">▼</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="md:col-span-3 relative">
                                    <input 
                                        list="arancel-options"
                                        className="w-full outline-none font-bold text-sm p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-[#312923] focus:border-[#5B6651] transition-all"
                                        placeholder="Busca en tu arancel..."
                                        value={newQuoteItem.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const found = catalog.find(c => c.name === val);
                                            if (found) { setNewQuoteItem({...newQuoteItem, name: val, price: found.price, phase: currentPhase}); } 
                                            else { setNewQuoteItem({...newQuoteItem, name: val, phase: currentPhase}); }
                                        }}
                                    />
                                    <datalist id="arancel-options">
                                        {catalog.map(c => <option key={c.id} value={c.name} />)}
                                    </datalist>
                                </div>
                                <div className="md:col-span-2">
                                    <input 
                                        className="w-full outline-none font-bold text-sm p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-[#312923] focus:border-[#5B6651] transition-all" 
                                        placeholder="Pieza (Opcional)" 
                                        value={newQuoteItem.tooth || ''} 
                                        onChange={e=>setNewQuoteItem({...newQuoteItem, tooth:e.target.value, phase: currentPhase})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#A3968B]">$</span>
                                    <input 
                                        type="number" 
                                        className="w-full outline-none font-black text-lg pl-8 p-3.5 rounded-2xl border border-[#DFD2C4] bg-white text-[#5B6651] focus:border-[#5B6651] transition-all shadow-inner" 
                                        placeholder="Valor" 
                                        value={newQuoteItem.price || ''} 
                                        onChange={e=>setNewQuoteItem({...newQuoteItem, price:e.target.value, phase: currentPhase})}
                                    />
                                </div>
                                <button 
                                    onClick={()=>{
                                        if(newQuoteItem.name && newQuoteItem.price) {
                                            setQuoteItems([
                                                ...quoteItems, 
                                                { 
                                                    id: Date.now(), 
                                                    name: newQuoteItem.name, 
                                                    tooth: newQuoteItem.tooth, 
                                                    price: Number(newQuoteItem.price), 
                                                    phase: currentPhase, // INYECTAMOS LA FASE AQUÍ
                                                    status: 'pending' 
                                                }
                                            ]);
                                            setNewQuoteItem({name:'', price:'', tooth:'', phase: currentPhase});
                                        }
                                    }}
                                    className="px-8 py-3.5 bg-[#312923] text-white rounded-2xl hover:bg-[#1a1512] transition-all flex items-center justify-center shadow-md"
                                >
                                    <Plus size={20}/>
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* --- PANEL DERECHO: RESUMEN Y ACCIONES --- */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-sm flex flex-col h-full min-h-[500px]">
                        <h3 className="font-black text-xl text-[#312923] mb-6 border-b border-[#DFD2C4]/50 pb-4">Detalle por Fases</h3>
                        
                        <div className="flex-1 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-6">
                            {quoteItems.length === 0 ? (
                                <div className="text-center py-16 opacity-40">
                                    <Layers className="mx-auto mb-3 text-[#9A8F84]" size={32} />
                                    <p className="text-xs font-bold text-[#9A8F84] uppercase tracking-widest">Plan de Tratamiento Vacío</p>
                                </div>
                            ) : (
                                Object.entries(groupedItems).map(([phaseName, items]) => (
                                    <div key={phaseName} className="space-y-3 animate-in fade-in">
                                        {/* Cabecera de la Fase */}
                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-[#DFD2C4]/50 flex-1"></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#5B6651] bg-[#5B6651]/10 px-3 py-1 rounded-full border border-[#5B6651]/20">
                                                {phaseName}
                                            </span>
                                            <div className="h-px bg-[#DFD2C4]/50 flex-1"></div>
                                        </div>
                                        
                                        {/* Ítems de la Fase */}
                                        {items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#DFD2C4]/40 shadow-sm group">
                                                <div className="flex-1 pr-2">
                                                    <span className="font-bold text-sm text-[#312923] block leading-tight">{item.name}</span>
                                                    {item.tooth && <span className="inline-block mt-1 text-[9px] bg-[#CBAAA2]/10 text-[#CBAAA2] px-2 py-0.5 rounded-full font-black border border-[#CBAAA2]/20">Pieza {item.tooth}</span>}
                                                </div>
                                                <div className="flex items-center gap-3 border-l border-[#DFD2C4]/40 pl-3">
                                                    <span className="font-black text-[#5B6651] whitespace-nowrap">${item.price.toLocaleString()}</span>
                                                    <button onClick={()=>setQuoteItems(quoteItems.filter(i=>i.id !== item.id))} className="text-[#DFD2C4] hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 border-t border-[#DFD2C4]/60 mt-auto">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-[10px] font-black opacity-60 uppercase tracking-widest text-[#9A8F84]">Costo Total Planificado</span>
                                <h3 className="text-4xl font-black text-[#312923] tracking-tighter">${quoteItems.reduce((acc, item) => acc + item.price, 0).toLocaleString()}</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    disabled={quoteItems.length===0} 
                                    onClick={async ()=>{ 
                                        const total = quoteItems.reduce((acc, item) => acc + item.price, 0);
                                        const id = Date.now().toString(); 
                                        // Generamos un detalle agrupado para finanzas si se requiere, o lo dejamos simple
                                        const detalle = `Plan de Tratamiento: ${quoteItems.length} procedimientos planificados`;
                                        
                                        // 1. MANDAR LA DEUDA A CAJA (FINANZAS)
                                        await saveToSupabase('financials', id, {
                                            id, total: total, paid: 0, payments: [], patientName: sessionData.patientName, 
                                            date: getLocalDate(), type: 'income', description: detalle,
                                            patientId: sessionData.patientId
                                        }); 
                                        
                                        // 2. GUARDAR EL PRESUPUESTO EN LA FICHA DEL PACIENTE (CLÍNICO)
                                        // La magia ocurre aquí: la propiedad 'phase' ya está dentro de quoteItems
                                        const p = getPatient(sessionData.patientId);
                                        const newClinicalQuote = {
                                            id: id,
                                            date: getLocalDate(),
                                            total: total,
                                            status: 'en_proceso',
                                            items: quoteItems 
                                        };
                                        
                                        const updatedQuotesList = [newClinicalQuote, ...(p.clinical?.quotes || [])];
                                        
                                        savePatientData(sessionData.patientId, {
                                            ...p,
                                            clinical: {
                                                ...p.clinical,
                                                quotes: updatedQuotesList
                                            }
                                        });
                                        
                                        notify("Plan de Tratamiento guardado y enviado a Caja"); 
                                        setQuoteItems([]);
                                        setActiveTab('history'); 
                                    }}
                                    className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        quoteItems.length === 0 
                                        ? 'bg-[#DFD2C4]/30 text-[#9A8F84] cursor-not-allowed' 
                                        : 'bg-[#5B6651] text-white hover:bg-[#4a5442] shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5'
                                    }`}
                                >
                                    <CheckCircle size={18}/> GUARDAR PLAN Y COBRAR
                                </button>
                                
                                <button 
                                    disabled={quoteItems.length===0} 
                                    onClick={()=>generatePDF('quote', quoteItems)}
                                    className={`py-4 rounded-2xl border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        quoteItems.length === 0 
                                        ? 'border-[#DFD2C4]/50 text-[#9A8F84] cursor-not-allowed bg-white/50' 
                                        : 'border-[#DFD2C4] bg-white text-[#312923] hover:bg-[#FDFBF7]'
                                    }`}
                                >
                                    <Printer size={18}/> IMPRIMIR PLAN PDF
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}