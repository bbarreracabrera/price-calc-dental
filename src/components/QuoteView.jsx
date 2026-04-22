import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Plus, Trash2, Printer, CheckCircle, Layers, X, User, Phone } from 'lucide-react';
import { Card } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate, formatRUT } from '../constants';

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
    const currentPhase = newQuoteItem.phase || 'Fase Correctiva (Operatoria/Endo/Cirugía)';

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownHighlight, setDropdownHighlight] = useState(0);
    const [activeCategory, setActiveCategory] = useState(null);
    const dropdownRef = useRef(null);

    const [newPatModal, setNewPatModal] = useState({ open: false, name: '', rut: '', phone: '' });

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const catalogCategories = [...new Set(catalog.filter(c => c.category).map(c => c.category))];

    const query = newQuoteItem.name || '';

    const filteredCatalog = (() => {
        let base = catalog;
        if (activeCategory) base = base.filter(c => c.category === activeCategory);
        if (query.trim()) base = base.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
        if (!activeCategory && !query.trim()) return [];
        return base.slice(0, 7);
    })();

    const groupedFiltered = filteredCatalog.reduce((acc, item) => {
        const cat = item.category || 'Procedimientos';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const showChips = !activeCategory && !query.trim();

    const handleSelectCatalogItem = (item) => {
        setNewQuoteItem({ ...newQuoteItem, name: item.name, price: item.price, phase: currentPhase });
        setDropdownOpen(false);
        setDropdownHighlight(0);
        setActiveCategory(null);
    };

    const handleDropdownKeyDown = (e) => {
        if (!dropdownOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setDropdownHighlight(i => Math.min(i + 1, filteredCatalog.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setDropdownHighlight(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filteredCatalog[dropdownHighlight]) {
            e.preventDefault();
            handleSelectCatalogItem(filteredCatalog[dropdownHighlight]);
        } else if (e.key === 'Escape') {
            setDropdownOpen(false);
            setActiveCategory(null);
        }
    };

    const handleCreateNewPatient = () => {
        const name = newPatModal.name.trim();
        if (!name) return;
        const newId = "pac_" + Date.now().toString();
        const newPatient = getPatient(newId);
        newPatient.id = newId;
        newPatient.name = name;
        if (!newPatient.personal) newPatient.personal = {};
        newPatient.personal.legalName = name;
        if (newPatModal.rut) newPatient.personal.rut = newPatModal.rut;
        if (newPatModal.phone) newPatient.personal.phone = newPatModal.phone;
        savePatientData(newId, newPatient);
        setSessionData({ ...sessionData, patientName: name, patientId: newId });
        notify("Paciente Creado");
        setNewPatModal({ open: false, name: '', rut: '', phone: '' });
    };

    const groupedItems = CLINICAL_PHASES.reduce((acc, phase) => {
        const itemsInPhase = quoteItems.filter(item => item.phase === phase);
        if (itemsInPhase.length > 0) acc[phase] = itemsInPhase;
        return acc;
    }, {});
    const unphasedItems = quoteItems.filter(item => !item.phase || !CLINICAL_PHASES.includes(item.phase));
    if (unphasedItems.length > 0) groupedItems['Sin Fase Asignada'] = unphasedItems;

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">

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

                {/* PANEL IZQUIERDO */}
                <Card className="lg:col-span-7 space-y-6 rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">1. Seleccionar Paciente</label>
                        <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
                            if (p.id === 'new') {
                                setNewPatModal({ open: true, name: p.name || '', rut: '', phone: '' });
                            } else {
                                setSessionData({...sessionData, patientName: p.personal?.legalName || p.name, patientId: p.id});
                            }
                        }} />
                    </div>

                    {sessionData.patientId && (
                        <div className="animate-in fade-in space-y-5 pt-6 border-t border-[#DFD2C4]/40">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 block">2. Planificar Procedimiento</label>

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
                                <div className="md:col-span-3 relative" ref={dropdownRef}>
                                    <input
                                        className="w-full outline-none font-bold text-sm p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-[#312923] focus:border-[#5B6651] transition-all"
                                        placeholder="Busca en tu arancel..."
                                        value={newQuoteItem.name}
                                        autoComplete="off"
                                        onFocus={() => setDropdownOpen(true)}
                                        onChange={e => {
                                            setNewQuoteItem({...newQuoteItem, name: e.target.value, phase: currentPhase});
                                            setDropdownHighlight(0);
                                            setDropdownOpen(true);
                                        }}
                                        onKeyDown={handleDropdownKeyDown}
                                    />

                                    {dropdownOpen && (
                                        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-[#DFD2C4] rounded-2xl shadow-xl overflow-hidden">
                                            {/* Indicador de categoría activa */}
                                            {activeCategory && (
                                                <div className="px-4 py-2.5 flex items-center justify-between bg-[#5B6651]/10 border-b border-[#5B6651]/20">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Filtrando por: {activeCategory}</span>
                                                    <button
                                                        type="button"
                                                        onMouseDown={e => { e.preventDefault(); setActiveCategory(null); setDropdownHighlight(0); }}
                                                        className="text-[#5B6651] hover:text-[#312923] transition-colors ml-2"
                                                    >
                                                        <X size={14}/>
                                                    </button>
                                                </div>
                                            )}

                                            {showChips ? (
                                                catalogCategories.length > 0 ? (
                                                    <div className="p-3 flex flex-wrap gap-2">
                                                        {catalogCategories.map(cat => (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onMouseDown={e => { e.preventDefault(); setActiveCategory(cat); setDropdownHighlight(0); }}
                                                                className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FDFBF7] border border-[#DFD2C4] text-[#9A8F84] hover:bg-[#5B6651]/10 hover:border-[#5B6651] hover:text-[#5B6651] transition-all"
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center text-xs font-bold text-[#9A8F84]">Escribe para buscar en tu arancel</div>
                                                )
                                            ) : filteredCatalog.length === 0 ? (
                                                <div className="p-4 text-center text-xs font-bold text-[#9A8F84]">Sin resultados{query.trim() ? ` para "${query}"` : ''}</div>
                                            ) : (
                                                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                                    {Object.entries(groupedFiltered).map(([cat, items]) => (
                                                        <div key={cat}>
                                                            {!activeCategory && (
                                                                <div className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] border-b border-[#DFD2C4]/40 sticky top-0">{cat}</div>
                                                            )}
                                                            {items.map(item => {
                                                                const globalIdx = filteredCatalog.indexOf(item);
                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        onMouseDown={e => { e.preventDefault(); handleSelectCatalogItem(item); }}
                                                                        className={`w-full text-left px-4 py-3 flex justify-between items-center transition-colors ${globalIdx === dropdownHighlight ? 'bg-[#5B6651]/10' : 'hover:bg-[#FDFBF7]'}`}
                                                                    >
                                                                        <span className="font-bold text-sm text-[#312923]">{item.name}</span>
                                                                        <span className="text-xs font-black text-[#5B6651] ml-3 shrink-0">${item.price?.toLocaleString()}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                                    phase: currentPhase,
                                                    status: 'pending'
                                                }
                                            ]);
                                            setNewQuoteItem({name:'', price:'', tooth:'', phase: currentPhase});
                                            setActiveCategory(null);
                                        }
                                    }}
                                    className="px-6 py-3.5 bg-[#312923] text-white rounded-2xl hover:bg-[#1a1512] transition-all flex items-center justify-center gap-2 shadow-md text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                                >
                                    <Plus size={16}/> Agregar al plan
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* PANEL DERECHO */}
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
                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-[#DFD2C4]/50 flex-1"></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#5B6651] bg-[#5B6651]/10 px-3 py-1 rounded-full border border-[#5B6651]/20">
                                                {phaseName}
                                            </span>
                                            <div className="h-px bg-[#DFD2C4]/50 flex-1"></div>
                                        </div>
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
                                        const detalle = `Plan de Tratamiento: ${quoteItems.length} procedimientos planificados`;

                                        await saveToSupabase('financials', id, {
                                            id, total: total, paid: 0, payments: [], patientName: sessionData.patientName,
                                            date: getLocalDate(), type: 'income', description: detalle,
                                            patientId: sessionData.patientId
                                        });

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
                                        setTimeout(() => setActiveTab('history'), 2000);
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

            {/* Modal: Nuevo Paciente */}
            {newPatModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-[#DFD2C4]/60 p-8 w-full max-w-sm animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-[#312923]">Nuevo Paciente</h3>
                            <button onClick={() => setNewPatModal({ open: false, name: '', rut: '', phone: '' })} className="text-[#9A8F84] hover:text-[#312923] transition-colors">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Nombre Completo *</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]"/>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]"
                                        placeholder="Ej. Juan Pérez"
                                        value={newPatModal.name}
                                        onChange={e => setNewPatModal({ ...newPatModal, name: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Enter') handleCreateNewPatient(); }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">RUT (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]"
                                    placeholder="12.345.678-9"
                                    value={newPatModal.rut}
                                    onChange={e => setNewPatModal({ ...newPatModal, rut: formatRUT(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Teléfono (Opcional)</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]"/>
                                    <input
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]"
                                        placeholder="+56 9..."
                                        value={newPatModal.phone}
                                        onChange={e => setNewPatModal({ ...newPatModal, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            disabled={!newPatModal.name.trim()}
                            onClick={handleCreateNewPatient}
                            className={`mt-6 w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                                !newPatModal.name.trim()
                                ? 'bg-[#DFD2C4]/30 text-[#9A8F84] cursor-not-allowed'
                                : 'bg-[#312923] text-white hover:bg-[#1a1512]'
                            }`}
                        >
                            Crear Paciente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
