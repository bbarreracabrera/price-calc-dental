import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Plus, Trash2, Printer, CheckCircle, Check, Layers, X, User, Phone } from 'lucide-react';
import { Card } from './UIComponents';
import { PatientSelect } from './SystemModals';
import { getLocalDate, formatRUT } from '../constants';
import { useDialog } from './DialogProvider';

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
    saveToSupabase, notify, generatePDF, setActiveTab, adminEmail
}) {
    // Sincronizar el buscador con sessionData al montar o cambiar
    const [patientSearch, setPatientSearch] = useState(sessionData.patientName || '');
    
    useEffect(() => {
        if (sessionData.patientName) {
            setPatientSearch(sessionData.patientName);
        }
    }, [sessionData.patientId, sessionData.patientName]);

    const { confirm } = useDialog();
    const currentPhase = newQuoteItem.phase || 'Fase Correctiva (Operatoria/Endo/Cirugía)';

    const handleClearPlan = async () => {
        const ok = await confirm('¿Eliminar todo el plan de tratamiento? Esta acción no se puede deshacer.');
        if (ok) {
            setQuoteItems([]);
            notify('Plan limpiado');
        }
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownHighlight, setDropdownHighlight] = useState(0);
    const [activeCategory, setActiveCategory] = useState(null);
    const dropdownRef = useRef(null);

    const [newPatModal, setNewPatModal] = useState({ open: false, name: '', rut: '', phone: '' });
    const [savedSuccess, setSavedSuccess] = useState(false);

    // --- EFECTO DE AUTO-SELECCIÓN ---
    // Cuando el componente se monta, si sessionData tiene un patientId pero QuoteView no lo está reflejando,
    // nos aseguramos de que el estado local sea coherente.
    useEffect(() => {
        if (sessionData.patientId && patientRecords[sessionData.patientId]) {
            const p = patientRecords[sessionData.patientId];
            if (sessionData.patientName !== (p.personal?.legalName || p.name)) {
                setSessionData(prev => ({
                    ...prev,
                    patientName: p.personal?.legalName || p.name
                }));
            }
        }
    }, [sessionData.patientId, patientRecords]);

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
                    onClick={handleClearPlan}
                    className="px-5 py-3 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] hover:text-[#312923] transition-all shadow-sm"
                >
                    Limpiar Plan
                </button>
            </div>

            {!sessionData.patientId && quoteItems.length > 0 && (
                <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 animate-in fade-in">
                    <span className="text-lg shrink-0">⚠️</span>
                    <p className="text-sm font-bold">Selecciona un paciente antes de guardar el plan de tratamiento.</p>
                </div>
            )}

            {savedSuccess && (
                <div className="bg-[#5B6651]/10 border border-[#5B6651]/30 rounded-2xl p-4 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <Check size={20} className="text-[#5B6651]" />
                        <p className="text-sm font-bold text-[#312923]">Plan guardado correctamente</p>
                    </div>
                    <button
                        onClick={() => { setSavedSuccess(false); setActiveTab('history'); }}
                        className="px-4 py-2 bg-[#5B6651] text-white text-xs font-bold rounded-xl hover:bg-[#4a5442] transition-colors"
                    >
                        Ver en Caja →
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* PANEL IZQUIERDO */}
                <Card className="lg:col-span-7 space-y-6 rounded-[2.5rem] border border-[#DFD2C4]/60 bg-white p-8 shadow-sm">

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">1. Seleccionar Paciente</label>
                        <PatientSelect 
                            theme={themeMode} 
                            patients={patientRecords} 
                            placeholder="Buscar o Crear Paciente..." 
                            adminEmail={adminEmail} 
                            selectedId={sessionData.patientId}
                            initialValue={patientSearch}
                            onSelect={(p) => {
                                if (p.id === 'new') {
                                    setNewPatModal({ open: true, name: p.name || '', rut: '', phone: '' });
                                } else {
                                    setSessionData({...sessionData, patientName: p.personal?.legalName || p.name, patientId: p.id});
                                    setPatientSearch(p.personal?.legalName || p.name);
                                }
                            }} 
                        />
                    </div>

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
                                                                        onMouseEnter={() => setDropdownHighlight(globalIdx)}
                                                                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${dropdownHighlight === globalIdx ? 'bg-[#5B6651]/10' : 'hover:bg-[#FDFBF7]'}`}
                                                                    >
                                                                        <span className="text-sm font-bold text-[#312923]">{item.name}</span>
                                                                        <span className="text-xs font-black text-[#5B6651]">${Number(item.price).toLocaleString()}</span>
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
                                <div className="md:col-span-1">
                                    <input
                                        type="number"
                                        className="w-full outline-none font-black text-sm p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-[#5B6651] focus:border-[#5B6651] transition-all"
                                        placeholder="$"
                                        value={newQuoteItem.price}
                                        onChange={e => setNewQuoteItem({...newQuoteItem, price: e.target.value})}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (!newQuoteItem.name || !newQuoteItem.price) {
                                            notify('Completa el nombre y precio', 'error');
                                            return;
                                        }
                                        setQuoteItems([...quoteItems, { ...newQuoteItem, id: Date.now(), phase: currentPhase }]);
                                        setNewQuoteItem({ name: '', price: '', tooth: '', phase: currentPhase });
                                    }}
                                    className="md:col-span-1 bg-[#312923] text-white rounded-2xl p-4 hover:bg-[#5B6651] transition-all shadow-lg flex items-center justify-center"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                    </div>
                </Card>

                {/* PANEL DERECHO: VISTA PREVIA DEL PLAN */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <Card className="rounded-[2.5rem] border border-[#DFD2C4]/60 bg-[#FDFBF7] p-8 shadow-inner flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-[#312923] tracking-tight">Vista Previa</h3>
                            <div className="bg-white px-4 py-2 rounded-xl border border-[#DFD2C4] shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] mb-0.5 text-center">Inversión Total</p>
                                <p className="text-xl font-black text-[#5B6651] leading-none">
                                    ${quoteItems.reduce((acc, item) => acc + Number(item.price || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {quoteItems.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-[#9A8F84] opacity-40">
                                <Calculator size={48} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Plan Vacío</p>
                            </div>
                        ) : (
                            <div className="space-y-8 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                {Object.entries(groupedItems).map(([phase, items]) => (
                                    <div key={phase} className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CBAAA2] border-b border-[#CBAAA2]/30 pb-1">{phase}</h4>
                                        <div className="space-y-2">
                                            {items.map(item => (
                                                <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#DFD2C4]/40 group hover:border-[#CBAAA2] transition-all">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <p className="text-sm font-bold text-[#312923] truncate">{item.name}</p>
                                                        {item.tooth && <span className="text-[9px] font-black text-[#9A8F84] uppercase">Pieza: {item.tooth}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-black text-[#5B6651]">${Number(item.price).toLocaleString()}</span>
                                                        <button
                                                            onClick={() => setQuoteItems(quoteItems.filter(i => i.id !== item.id))}
                                                            className="p-2 text-[#DFD2C4] hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {quoteItems.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => generatePDF('quote', {
                                    items: quoteItems,
                                    patientName: sessionData.patientName || 'Paciente',
                                    total: quoteItems.reduce((acc, item) => acc + Number(item.price || 0), 0)
                                })}
                                className="flex items-center justify-center gap-2 py-4 bg-white border border-[#DFD2C4] text-[#312923] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#FDFBF7] transition-all shadow-sm"
                            >
                                <Printer size={18} /> Imprimir
                            </button>
                            <button
                                onClick={async () => {
                                    if (!sessionData.patientId) { notify('Selecciona un paciente', 'error'); return; }
                                    const p = getPatient(sessionData.patientId);
                                    const newQuote = {
                                        id: Date.now(),
                                        date: getLocalDate(),
                                        items: quoteItems,
                                        total: quoteItems.reduce((acc, item) => acc + Number(item.price || 0), 0),
                                        status: 'en_proceso'
                                    };
                                    const updatedPatient = {
                                        ...p,
                                        clinical: {
                                            ...p.clinical,
                                            quotes: [newQuote, ...(p.clinical?.quotes || [])]
                                        }
                                    };
                                    await savePatientData(sessionData.patientId, updatedPatient);
                                    setSavedSuccess(true);
                                    notify('Plan guardado en la ficha del paciente');
                                }}
                                className="flex items-center justify-center gap-2 py-4 bg-[#5B6651] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#4a5442] transition-all shadow-lg shadow-[#5B6651]/20"
                            >
                                <CheckCircle size={18} /> Guardar Plan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nuevo Paciente */}
            {newPatModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-[#DFD2C4]/60 animate-in fade-in zoom-in-95">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#5B6651]/10 text-[#5B6651] rounded-2xl"><User size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black text-[#312923]">Nuevo Paciente</h3>
                                    <p className="text-xs font-bold text-[#9A8F84] uppercase tracking-widest">Creación Rápida</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-sm font-bold outline-none focus:border-[#5B6651] transition-all"
                                        value={newPatModal.name}
                                        onChange={e => setNewPatModal({...newPatModal, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">RUT (Opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-sm font-bold outline-none focus:border-[#5B6651] transition-all"
                                            value={newPatModal.rut}
                                            onChange={e => setNewPatModal({...newPatModal, rut: formatRUT(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Teléfono</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] text-sm font-bold outline-none focus:border-[#5B6651] transition-all"
                                            value={newPatModal.phone}
                                            onChange={e => setNewPatModal({...newPatModal, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setNewPatModal({ open: false, name: '', rut: '', phone: '' })}
                                    className="flex-1 py-4 text-[#9A8F84] font-black text-[11px] uppercase tracking-widest hover:bg-[#FDFBF7] rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateNewPatient}
                                    className="flex-1 py-4 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#5B6651] transition-all shadow-lg"
                                >
                                    Crear Paciente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
