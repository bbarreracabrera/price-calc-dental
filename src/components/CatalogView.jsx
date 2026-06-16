import React, { useState, useRef } from 'react';
import { Library, Plus, Edit3, Trash2, Search, Tag, Upload, Download, FileSpreadsheet, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Card } from './UIComponents';
import { DEFAULT_CATALOG } from '../constants';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx';

export default function CatalogView({ 
    themeMode, t, catalog, setCatalog, clinicOwner, session, 
    setNewCatalogItem, setModal, saveToSupabase, notify 
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [importPreview, setImportPreview] = useState(null); // { items, errors }
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    // --- LÓGICA DE IMPORTACIÓN INTELIGENTE ---
    const CATEGORY_MAP = {
        'examen': 'Examen', 'diagnóstico': 'Examen', 'diagnostico': 'Examen',
        'preventivo': 'Preventivo', 'limpieza': 'Preventivo', 'profilaxis': 'Preventivo', 'sellante': 'Preventivo',
        'cirugía': 'Cirugía', 'cirugia': 'Cirugía', 'extracción': 'Cirugía', 'extraccion': 'Cirugía',
        'endodoncia': 'Endodoncia', 'tratamiento de conducto': 'Endodoncia', 'pulpotomía': 'Endodoncia',
        'implante': 'Implantología', 'implantología': 'Implantología', 'implantologia': 'Implantología',
        'corona': 'Rehabilitación', 'prótesis': 'Rehabilitación', 'protesis': 'Rehabilitación', 'rehabilitación': 'Rehabilitación',
        'periodoncia': 'Periodoncia', 'raspado': 'Periodoncia', 'curetaje': 'Periodoncia',
        'ortodoncia': 'Ortodoncia', 'brackets': 'Ortodoncia', 'alineadores': 'Ortodoncia',
        'niño': 'Odontopediatría', 'pediátrico': 'Odontopediatría', 'odontopediatría': 'Odontopediatría',
    };

    const detectCategory = (name) => {
        const lower = name.toLowerCase();
        for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
            if (lower.includes(key)) return cat;
        }
        return 'Otros';
    };

    const findCol = (headers, candidates) => {
        for (const c of candidates) {
            const idx = headers.findIndex(h => h?.toString().toLowerCase().includes(c.toLowerCase()));
            if (idx >= 0) return idx;
        }
        return -1;
    };

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (rows.length < 2) { notify('El archivo no tiene datos.'); return; }

                const headers = rows[0].map(h => h?.toString() || '');
                const nameIdx  = findCol(headers, ['nombre', 'name', 'prestación', 'prestacion', 'tratamiento', 'descripción', 'descripcion', 'procedimiento']);
                const priceIdx = findCol(headers, ['precio', 'price', 'valor', 'value', 'monto', 'costo', 'tarifa']);
                const catIdx   = findCol(headers, ['categoría', 'categoria', 'category', 'tipo', 'especialidad']);

                if (nameIdx < 0 || priceIdx < 0) {
                    notify('No se encontraron columnas de Nombre o Precio. Revisa el archivo.');
                    return;
                }

                const items = [];
                const errors = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const name = row[nameIdx]?.toString().trim();
                    const rawPrice = row[priceIdx]?.toString().replace(/[$.,\s]/g, '').replace(/,/g, '');
                    const price = parseInt(rawPrice);

                    if (!name) continue;
                    if (isNaN(price) || price <= 0) {
                        errors.push(`Fila ${i + 1}: Precio inválido para "${name}"`);
                        continue;
                    }

                    const category = catIdx >= 0 ? (row[catIdx]?.toString().trim() || detectCategory(name)) : detectCategory(name);
                    items.push({ name, price, category: CATEGORY_MAP[category?.toLowerCase()] || category || 'Otros' });
                }

                setImportPreview({ items, errors, fileName: file.name });
            } catch (err) {
                notify('Error al leer el archivo. Asegúrate de que sea Excel o CSV.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const confirmImport = async () => {
        if (!importPreview?.items?.length) return;
        setImporting(true);
        const newItems = [];
        for (const item of importPreview.items) {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const fullItem = { ...item, id, admin_email: clinicOwner || session?.user?.email };
            newItems.push(fullItem);
            await saveToSupabase('catalog', id, fullItem);
        }
        setCatalog(prev => [...prev, ...newItems]);
        setImportPreview(null);
        setImporting(false);
        notify(`✅ ${newItems.length} tratamientos importados exitosamente.`);
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['Nombre del Tratamiento', 'Precio (CLP)', 'Categoría'],
            ['Examen Clínico Completo', 25000, 'Examen'],
            ['Profilaxis Dental', 35000, 'Preventivo'],
            ['Extracción Simple', 45000, 'Cirugía'],
            ['Endodoncia Unirradicular', 150000, 'Endodoncia'],
            ['Corona Zirconio', 350000, 'Rehabilitación'],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aranceles');
        XLSX.writeFile(wb, 'plantilla-aranceles-shiningcloud.xlsx');
    };

    const CATEGORIES = ['Todos', 'Examen', 'Preventivo', 'Cirugía', 'Endodoncia', 'Implantología', 'Rehabilitación', 'Periodoncia', 'Ortodoncia', 'Odontopediatría', 'Otros'];

    // Filtramos el catálogo según lo que escribas y la pestaña que elijas
    const filteredCatalog = catalog.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const itemCat = item.category || 'Otros';
        const matchesCategory = activeCategory === 'Todos' || itemCat === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Library size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Gestión Comercial</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Arancel de Prestaciones</h2>
                    <p className="text-xs font-bold text-[#9A8F84] mt-1">{catalog.length} tratamiento{catalog.length !== 1 ? 's' : ''} registrado{catalog.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Botón Descargar Plantilla */}
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-3 bg-[#FDFBF7] border border-[#DFD2C4] text-[#6B615A] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#DFD2C4]/30 transition-all"
                        title="Descargar plantilla Excel para importar aranceles"
                    >
                        <Download size={14}/> Plantilla Excel
                    </button>
                    {/* Botón Importar desde Excel */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-3 bg-[#5B6651]/10 border border-[#5B6651]/30 text-[#5B6651] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#5B6651]/20 transition-all"
                    >
                        <FileSpreadsheet size={14}/> Importar Excel
                    </button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
                    {/* Botón Nuevo Tratamiento */}
                    <button 
                        onClick={() => { setNewCatalogItem({name:'', price:'', category:'Examen', id:null}); setModal('catalogItem'); }}
                        className="flex items-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                    >
                        <Plus size={16}/> Nuevo Tratamiento
                    </button>
                </div>
            </div>

            {/* --- MODAL DE PREVISUALIZACIÓN DE IMPORTACIÓN --- */}
            {importPreview && (
                <div className="fixed inset-0 z-50 bg-[#312923]/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-[#DFD2C4]/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <FileSpreadsheet size={18} className="text-[#5B6651]" />
                                    <h3 className="text-xl font-black text-[#312923]">Vista Previa de Importación</h3>
                                </div>
                                <p className="text-xs font-bold text-[#9A8F84]">{importPreview.fileName} · {importPreview.items.length} tratamientos detectados</p>
                            </div>
                            <button onClick={() => setImportPreview(null)} className="p-2 rounded-xl text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] transition-all"><X size={18}/></button>
                        </div>
                        {/* Errores */}
                        {importPreview.errors.length > 0 && (
                            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle size={14} className="text-amber-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">{importPreview.errors.length} filas omitidas</span>
                                </div>
                                {importPreview.errors.slice(0, 3).map((e, i) => <p key={i} className="text-[10px] font-bold text-amber-600">{e}</p>)}
                            </div>
                        )}
                        {/* Lista de items */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                            {importPreview.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-[#FDFBF7] rounded-xl border border-[#DFD2C4]/50">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={14} className="text-[#5B6651] shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-[#312923]">{item.name}</p>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-white px-2 py-0.5 rounded-md border border-[#DFD2C4]/40">{item.category}</span>
                                        </div>
                                    </div>
                                    <span className="font-black text-[#5B6651] text-base">${Number(item.price).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        {/* Acciones */}
                        <div className="p-6 border-t border-[#DFD2C4]/50 flex gap-3">
                            <button onClick={() => setImportPreview(null)} className="flex-1 py-3 border border-[#DFD2C4] rounded-2xl font-black text-sm text-[#312923] hover:bg-[#FDFBF7] transition-colors">Cancelar</button>
                            <button
                                onClick={confirmImport}
                                disabled={importing}
                                className="flex-1 py-3 bg-[#5B6651] text-white font-black text-sm rounded-2xl hover:bg-[#4a5442] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {importing ? 'Importando...' : <><Upload size={16}/> Confirmar Importación ({importPreview.items.length} ítems)</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTROLES DE BÚSQUEDA Y FILTROS --- */}
            {catalog.length > 0 && (
                <div className="space-y-4 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3968B]" size={20}/>
                        <input 
                            type="text" 
                            placeholder="Buscar tratamiento por nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-4 pl-14 rounded-2xl bg-white border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm border ${
                                    activeCategory === cat 
                                    ? 'bg-[#5B6651] text-white border-[#5B6651]' 
                                    : 'bg-[#FDFBF7] text-[#9A8F84] border-[#DFD2C4]/60 hover:border-[#A3968B] hover:text-[#312923]'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- LISTA DE TRATAMIENTOS --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {catalog.length === 0 ? (
                    <div className="p-12 border border-dashed border-[#DFD2C4] bg-[#FDFBF7]/50 rounded-[2rem] text-center flex flex-col items-center gap-5 mt-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#DFD2C4]/50 text-[#CBAAA2]">
                            <Library size={32} strokeWidth={1.5}/>
                        </div>
                        <div>
                            <h3 className="font-black text-[#312923] text-2xl tracking-tight">Tu arancel está vacío</h3>
                            <p className="text-sm text-[#9A8F84] mt-2 font-bold max-w-md mx-auto leading-relaxed">
                                No pierdas tiempo escribiendo desde cero. Carga un arancel base referencial y luego ajusta los precios a la realidad de tu clínica.
                            </p>
                        </div>
                        <button 
                            onClick={async () => {
                                notify("Cargando arancel referencial...");
                                const newItems = [];
                                for (const item of DEFAULT_CATALOG) {
                                    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                    const fullItem = { ...item, category: item.category || 'Otros', id, admin_email: clinicOwner || session?.user?.email };
                                    newItems.push(fullItem);
                                    await saveToSupabase('catalog', id, fullItem);
                                }
                                setCatalog(newItems);
                                notify("¡Arancel base cargado con éxito!");
                            }}
                            className="mt-4 flex items-center gap-2 px-6 py-3.5 bg-[#5B6651] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#4a5442] transition-all shadow-md"
                        >
                            <Plus size={16} /> Cargar Arancel Referencial (51 Ítems)
                        </button>
                    </div>
                ) : filteredCatalog.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-lg font-bold text-[#A3968B]">No se encontraron tratamientos.</p>
                        <p className="text-xs font-medium text-[#9A8F84] mt-2">Intenta con otra palabra clave o cambia de categoría.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {filteredCatalog.sort((a,b)=>a.name.localeCompare(b.name)).map(item => (
                            <div key={item.id} className="group flex justify-between items-center p-5 bg-white rounded-2xl border border-[#DFD2C4]/50 hover:border-[#A3968B] hover:shadow-md transition-all">
                                <div className="flex-1 pr-4">
                                    <h4 className="font-black text-[#312923] text-sm md:text-base leading-tight group-hover:text-[#5B6651] transition-colors">{item.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Tag size={12} className="text-[#CBAAA2]"/>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 py-0.5 rounded-md border border-[#DFD2C4]/40">
                                            {item.category || 'Otros'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] block mb-0.5">Valor</span>
                                        <span className="font-black text-[#5B6651] text-lg tracking-tighter">${Number(item.price).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 border-l border-[#DFD2C4]/50 pl-4">
                                        <button 
                                            onClick={() => { setNewCatalogItem({ ...item, category: item.category || 'Otros' }); setModal('catalogItem'); }} 
                                            className="p-2.5 rounded-xl text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] transition-all"
                                            title="Editar"
                                        >
                                            <Edit3 size={18}/>
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const { error } = await supabase
                                                    .from('catalog')
                                                    .update({ deleted_at: new Date().toISOString() })
                                                    .eq('id', item.id)
                                                    .eq('admin_email', clinicOwner || session?.user?.email);
                                                if (error) {
                                                    notify("Error al eliminar el tratamiento");
                                                    console.error('Error eliminando de catalog:', error.message);
                                                    return;
                                                }
                                                setCatalog(catalog.filter(c => c.id !== item.id));
                                                notify("Tratamiento eliminado");
                                            }}
                                            className="p-2.5 rounded-xl text-[#9A8F84] hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}