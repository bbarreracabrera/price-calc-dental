import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react';
import { supabase } from '../../supabase';

const CATEGORIES = [
    { id: 'coronas',            label: 'Coronas y Carillas' },
    { id: 'puentes',            label: 'Puentes' },
    { id: 'protesis_removible', label: 'Prótesis Removible' },
    { id: 'protesis_fija',      label: 'Prótesis Fija' },
    { id: 'protesis_inmediata', label: 'Prótesis Inmediata' },
    { id: 'ortodoncia',         label: 'Ortodoncia' },
    { id: 'implantes',          label: 'Implantes' },
    { id: 'otros',              label: 'Otros' },
];

export default function MyPricingTab({ pricing, refreshPricing, notify, session }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const filteredPricing = pricing.filter(item => {
        const d = item.data || {};
        const matchesSearch = !searchTerm ||
            d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleSave = async (formData) => {
        try {
            const isEdit = !!editingItem;
            const id = isEdit
                ? editingItem.id
                : `price_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            const record = {
                id,
                lab_email: session.user.email,
                data: {
                    name: formData.name.trim(),
                    category: formData.category,
                    price: parseInt(formData.price) || 0,
                    estimated_days: parseInt(formData.estimated_days) || 0,
                    description: formData.description?.trim() || '',
                },
                updated_at: new Date().toISOString(),
            };

            if (isEdit) {
                const { error } = await supabase
                    .from('lab_pricing')
                    .update({ data: record.data, updated_at: record.updated_at })
                    .eq('id', id);
                if (error) throw error;
                notify('Servicio actualizado');
            } else {
                const { error } = await supabase.from('lab_pricing').insert([record]);
                if (error) throw error;
                notify('Servicio agregado al arancel');
            }

            setShowModal(false);
            setEditingItem(null);
            refreshPricing();
        } catch (e) {
            console.error(e);
            notify('Error al guardar servicio: ' + e.message);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`¿Eliminar "${item.data?.name}" del arancel?`)) return;
        try {
            const { error } = await supabase
                .from('lab_pricing')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', item.id);
            if (error) throw error;
            notify('Servicio eliminado');
            refreshPricing();
        } catch (e) {
            notify('Error al eliminar: ' + e.message);
        }
    };

    const openAdd = () => { setEditingItem(null); setShowModal(true); };
    const openEdit = (item) => { setEditingItem(item); setShowModal(true); };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8F84]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar servicio..."
                        className="w-full pl-9 pr-3 py-2.5 border border-[#DFD2C4] rounded-xl bg-[#FDFBF7] text-[#312923] font-medium text-sm focus:outline-none focus:border-[#5B6651]"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 border border-[#DFD2C4] rounded-xl bg-[#FDFBF7] text-[#312923] font-medium text-sm focus:outline-none focus:border-[#5B6651]"
                >
                    <option value="all">Todas las categorías</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#312923] text-white rounded-xl font-bold text-sm hover:bg-[#1a1512] transition-colors"
                >
                    <Plus size={16} /> Agregar servicio
                </button>
            </div>

            {/* Empty state */}
            {pricing.length === 0 && (
                <div className="bg-white border border-[#DFD2C4] rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                        <Plus size={32} />
                    </div>
                    <h3 className="font-black text-[#312923] text-lg mb-2">Tu arancel está vacío</h3>
                    <p className="text-sm text-[#9A8F84] mb-6 max-w-md mx-auto leading-relaxed">
                        Agrega los servicios que ofrece tu laboratorio con sus precios.
                        Las clínicas conectadas verán esta información al asignarte trabajos.
                    </p>
                    <button
                        onClick={openAdd}
                        className="px-6 py-2.5 bg-[#5B6651] text-white rounded-xl font-bold text-sm hover:bg-[#4a5542] transition-colors"
                    >
                        Agregar primer servicio
                    </button>
                </div>
            )}

            {/* Servicios agrupados por categoría */}
            {pricing.length > 0 && (
                <div className="space-y-6">
                    {CATEGORIES.map(cat => {
                        const items = filteredPricing.filter(p => p.data?.category === cat.id);
                        if (items.length === 0) return null;
                        return (
                            <div key={cat.id}>
                                <h3 className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-black mb-3 ml-1">
                                    {cat.label} <span className="text-[#DFD2C4]">({items.length})</span>
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {items.map(item => (
                                        <ServiceCard
                                            key={item.id}
                                            item={item}
                                            onEdit={() => openEdit(item)}
                                            onDelete={() => handleDelete(item)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal agregar/editar */}
            {showModal && (
                <PricingModal
                    item={editingItem}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditingItem(null); }}
                />
            )}
        </div>
    );
}

function ServiceCard({ item, onEdit, onDelete }) {
    const d = item.data || {};
    const formatPrice = (n) => new Intl.NumberFormat('es-CL').format(n || 0);

    return (
        <div className="bg-white border border-[#DFD2C4] rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="font-bold text-[#312923] flex-1 leading-tight">{d.name}</h4>
                <div className="flex gap-0.5 shrink-0">
                    <button onClick={onEdit} className="p-1.5 text-[#9A8F84] hover:text-[#312923] rounded-lg hover:bg-[#FDFBF7] transition-colors" title="Editar">
                        <Edit2 size={13} />
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-[#9A8F84] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
            <p className="text-2xl font-black text-[#5B6651]">
                ${formatPrice(d.price)}
                <span className="text-xs font-normal text-[#9A8F84] ml-1">CLP</span>
            </p>
            {d.estimated_days > 0 && (
                <p className="text-xs text-[#9A8F84] mt-1.5">~{d.estimated_days} días de elaboración</p>
            )}
            {d.description && (
                <p className="text-xs text-[#A3968B] mt-2 leading-relaxed line-clamp-2">{d.description}</p>
            )}
        </div>
    );
}

function PricingModal({ item, onSave, onClose }) {
    const [form, setForm] = useState({
        name:           item?.data?.name           || '',
        category:       item?.data?.category       || 'coronas',
        price:          item?.data?.price          || '',
        estimated_days: item?.data?.estimated_days || '',
        description:    item?.data?.description    || '',
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = () => {
        if (!form.name.trim())                       { alert('El nombre es obligatorio'); return; }
        if (!form.price || parseInt(form.price) <= 0) { alert('Ingresa un precio válido'); return; }
        onSave(form);
    };

    const inputClass = "w-full px-3 py-2.5 border border-[#DFD2C4] rounded-xl bg-[#FDFBF7] text-[#312923] font-medium text-sm focus:outline-none focus:border-[#5B6651] transition-colors";

    return (
        <div className="fixed inset-0 bg-[#312923]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-black text-[#312923]">
                        {item ? 'Editar servicio' : 'Nuevo servicio'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-[#9A8F84] hover:text-[#312923] rounded-lg hover:bg-[#FDFBF7] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    <Field label="Nombre del servicio">
                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Corona de Disilicato de Litio" className={inputClass} />
                    </Field>
                    <Field label="Categoría">
                        <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Precio (CLP)">
                            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="80000" className={inputClass} />
                        </Field>
                        <Field label="Días elaboración">
                            <input type="number" value={form.estimated_days} onChange={e => set('estimated_days', e.target.value)} placeholder="7" className={inputClass} />
                        </Field>
                    </div>
                    <Field label="Descripción (opcional)">
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Detalles adicionales del servicio..." className={`${inputClass} resize-none`} />
                    </Field>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-[#DFD2C4] text-[#312923] font-bold rounded-xl hover:bg-[#FDFBF7] transition-colors text-sm">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-[#312923] text-white font-bold rounded-xl hover:bg-[#1a1512] transition-colors text-sm flex items-center justify-center gap-2">
                        <Save size={14} /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1.5">{label}</label>
            {children}
        </div>
    );
}
