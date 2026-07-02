import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wind, Sparkles, Plus, ArrowRight, Trash2, AlertTriangle, CheckCircle2, List, ClipboardList, Save, X, Edit3 } from 'lucide-react';
import { useDialog } from './DialogProvider';
import { supabase } from '../supabase';

export default function SterilizationView({ 
    themeMode, t, sterilizationItems, setSterilizationItems, saveToSupabase, notify, session, config
}) {
    const { confirm } = useDialog();
    const [newKitName, setNewKitName] = useState('');
    const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' o 'inventory'
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        if (activeTab === 'inventory') {
            fetchInventory();
        }
    }, [activeTab]);

    const fetchInventory = async () => {
        setLoadingInventory(true);
        const { data, error } = await supabase
            .from('sterilization_inventory')
            .select('*')
            .eq('clinic_email', session?.user?.email)
            .order('item_name', { ascending: true });

        if (error) {
            console.error('Error fetching sterilization inventory:', error);
            notify('Error al cargar inventario de esterilización.', 'error');
        } else {
            setInventory(data);
        }
        setLoadingInventory(false);
    };

    const handleSaveInventoryItem = async (item) => {
        const itemData = {
            ...item,
            clinic_email: session?.user?.email
        };

        let error;
        if (item.id) {
            const { error: updateError } = await supabase
                .from('sterilization_inventory')
                .update(itemData)
                .eq('id', item.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('sterilization_inventory')
                .insert([itemData]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving inventory item:', error);
            notify('Error al guardar item en el inventario.', 'error');
        } else {
            notify('Item guardado exitosamente.', 'success');
            setShowNewItemModal(false);
            setEditingItem(null);
            fetchInventory();
        }
    };

    const handleDeleteInventoryItem = async (id) => {
        if (!await confirm('¿Estás seguro de que quieres eliminar este item del inventario?')) return;
        
        const { error } = await supabase
            .from('sterilization_inventory')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting inventory item:', error);
            notify('Error al eliminar item del inventario.', 'error');
        } else {
            notify('Item eliminado exitosamente.', 'success');
            fetchInventory();
        }
    };

    // --- FUNCIONES DE LÓGICA DE KITS ---
    const handleAddKit = async (e) => {
        e.preventDefault();
        if (!newKitName.trim()) return notify("Ingresa un nombre para el kit");

        const newId = `ster_${Date.now()}`;
        const days = config?.sterilizationDays || 30;
        
        const newKit = {
            id: newId,
            name: newKitName,
            status: 'sterile',
            last_updated: new Date().toISOString(),
            expiry_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            admin_email: session?.user?.email
        };

        setSterilizationItems([...sterilizationItems, newKit]);
        await saveToSupabase('sterilization', newId, newKit);
        setNewKitName('');
        notify(`Kit "${newKit.name}" registrado con éxito`);
    };

    const handleMove = async (kit, newStatus) => {
        const updatedKit = { ...kit, status: newStatus, last_updated: new Date().toISOString() };
        
        if (newStatus === 'sterile') {
            const days = config?.sterilizationDays || 30;
            updatedKit.expiry_date = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            notify(`Kit esterilizado. Válido por ${days} días`);
        } else if (newStatus === 'dirty') {
            notify(`Kit enviado a área sucia 🔴`);
        } else {
            notify(`Ciclo de autoclave iniciado ♨️`);
        }

        setSterilizationItems(sterilizationItems.map(i => i.id === kit.id ? updatedKit : i));
        await saveToSupabase('sterilization', kit.id, updatedKit);
    };

    const handleDeleteKit = async (kit) => {
        if (await confirm(`¿Eliminar permanentemente el kit "${kit.name}"?`)) {
            setSterilizationItems(sterilizationItems.filter(i => i.id !== kit.id));
            notify("Kit eliminado");
        }
    };

    // --- SEPARACIÓN EN COLUMNAS (KANBAN) ---
    const dirtyItems = sterilizationItems.filter(i => i.status === 'dirty');
    const sterilizingItems = sterilizationItems.filter(i => i.status === 'sterilizing');
    const sterileItems = sterilizationItems.filter(i => i.status === 'sterile');

    // --- COMPONENTE DE TARJETA ---
    const KitCard = ({ kit, icon: Icon, colorClass, nextStatus, nextLabel, nextColor }) => {
        const dateObj = new Date(kit.last_updated);
        const timeStr = `${dateObj.toLocaleDateString('es-CL')} ${dateObj.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}`;
        
        let isExpired = false;
        let expiryStr = '';
        if (kit.status === 'sterile' && kit.expiry_date) {
            const expDate = new Date(kit.expiry_date);
            isExpired = expDate < new Date();
            expiryStr = expDate.toLocaleDateString('es-CL');
        }

        return (
            <div className={`p-4 rounded-2xl bg-white border shadow-sm transition-all hover:shadow-md ${isExpired ? 'border-red-300 bg-red-50' : 'border-[#DFD2C4]/60'}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${colorClass}`}><Icon size={18}/></div>
                        <div>
                            <h4 className={`font-black text-sm ${isExpired ? 'text-red-700' : 'text-[#312923]'}`}>{kit.name}</h4>
                            <p className="text-[9px] font-bold text-[#9A8F84] mt-0.5">{timeStr}</p>
                        </div>
                    </div>
                </div>

                {kit.status === 'sterile' && (
                    <div className="mb-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                            {isExpired ? '⚠️ CADUCADO' : `VENCE: ${expiryStr}`}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#DFD2C4]/40">
                    <button onClick={() => handleDeleteKit(kit)} className="text-[#DFD2C4] hover:text-red-500 transition-colors p-1">
                        <Trash2 size={14}/>
                    </button>
                    <button 
                        onClick={() => handleMove(kit, nextStatus)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${nextColor}`}
                    >
                        {nextLabel} <ArrowRight size={12}/>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={14} className="text-[#5B6651]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Bioseguridad</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Central de Esterilización</h2>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#FDFBF7] p-1 rounded-2xl border border-[#DFD2C4]">
                        <button 
                            onClick={() => setActiveTab('kanban')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'kanban' ? 'bg-[#312923] text-white shadow-md' : 'text-[#9A8F84] hover:bg-[#DFD2C4]/20'}`}
                        >
                            <ClipboardList size={14}/> Ciclos
                        </button>
                        <button 
                            onClick={() => setActiveTab('inventory')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-[#312923] text-white shadow-md' : 'text-[#9A8F84] hover:bg-[#DFD2C4]/20'}`}
                        >
                            <List size={14}/> Inventario
                        </button>
                    </div>
                    {activeTab === 'kanban' && (
                        <form onSubmit={handleAddKit} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#DFD2C4] shadow-sm">
                            <input 
                                type="text" 
                                placeholder="Ej: Caja Quirúrgica 1..." 
                                className="p-2 pl-3 outline-none font-bold text-sm text-[#312923] bg-transparent w-40 md:w-56"
                                value={newKitName}
                                onChange={(e) => setNewKitName(e.target.value)}
                            />
                            <button type="submit" className="p-2.5 bg-[#312923] text-white rounded-xl hover:bg-[#1a1512] transition-colors shadow-md">
                                <Plus size={16}/>
                            </button>
                        </form>
                    )}
                    {activeTab === 'inventory' && (
                        <button 
                            onClick={() => { setEditingItem({ item_name: '', category: 'Instrumental', total_quantity: 0, available_quantity: 0, in_sterilization_quantity: 0 }); setShowNewItemModal(true); }}
                            className="flex items-center gap-2 px-4 py-3 bg-[#5B6651] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4a5442] transition-all shadow-md"
                        >
                            <Plus size={14}/> Nuevo Item
                        </button>
                    )}
                </div>
            </div>

            {/* --- CONTENIDO SEGÚN PESTAÑA --- */}
            {activeTab === 'kanban' ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {/* COLUMNA 1: ÁREA SUCIA */}
                    <div className="flex flex-col bg-[#FDFBF7]/50 rounded-[2rem] border border-[#DFD2C4]/50 p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-black text-red-800 text-lg flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500"/> Área Sucia
                            </h3>
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black">{dirtyItems.length}</span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {dirtyItems.length === 0 && <p className="text-xs font-bold text-[#A3968B] text-center mt-10">No hay material sucio.</p>}
                            {dirtyItems.map(kit => (
                                <KitCard 
                                    key={kit.id} kit={kit} 
                                    icon={AlertTriangle} colorClass="bg-red-100 text-red-600"
                                    nextStatus="sterilizing" nextLabel="A la Máquina" nextColor="bg-amber-500 text-white hover:bg-amber-600"
                                />
                            ))}
                        </div>
                    </div>

                    {/* COLUMNA 2: AUTOCLAVE */}
                    <div className="flex flex-col bg-[#FDFBF7]/50 rounded-[2rem] border border-[#DFD2C4]/50 p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-black text-amber-800 text-lg flex items-center gap-2">
                                <Wind size={18} className="text-amber-500"/> En Autoclave
                            </h3>
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black">{sterilizingItems.length}</span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {sterilizingItems.length === 0 && <p className="text-xs font-bold text-[#A3968B] text-center mt-10">Máquina vacía.</p>}
                            {sterilizingItems.map(kit => (
                                <KitCard 
                                    key={kit.id} kit={kit} 
                                    icon={Wind} colorClass="bg-amber-100 text-amber-600"
                                    nextStatus="sterile" nextLabel="Finalizar" nextColor="bg-[#5B6651] text-white hover:bg-[#4a5342]"
                                />
                            ))}
                        </div>
                    </div>

                    {/* COLUMNA 3: ESTÉRIL (DISPONIBLE) */}
                    <div className="flex flex-col bg-[#5B6651]/5 rounded-[2rem] border border-[#5B6651]/20 p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-black text-[#5B6651] text-lg flex items-center gap-2">
                                <Sparkles size={18}/> Material Estéril
                            </h3>
                            <span className="w-6 h-6 rounded-full bg-[#5B6651]/20 text-[#5B6651] flex items-center justify-center text-[10px] font-black">{sterileItems.length}</span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {sterileItems.length === 0 && <p className="text-xs font-bold text-[#A3968B] text-center mt-10">No hay material disponible.</p>}
                            {sterileItems.map(kit => (
                                <KitCard 
                                    key={kit.id} kit={kit} 
                                    icon={CheckCircle2} colorClass="bg-white text-[#5B6651] shadow-sm"
                                    nextStatus="dirty" nextLabel="Usado" nextColor="bg-white border border-[#DFD2C4] text-[#312923] hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-[#FDFBF7]/50 rounded-[2rem] border border-[#DFD2C4]/50 p-6 overflow-y-auto custom-scrollbar">
                    {loadingInventory ? (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-sm font-bold text-[#9A8F84]">Cargando inventario...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inventory.length === 0 ? (
                                <div className="col-span-full text-center py-20">
                                    <p className="text-sm font-bold text-[#9A8F84]">No hay items registrados en el inventario de esterilización.</p>
                                </div>
                            ) : (
                                inventory.map(item => (
                                    <div key={item.id} className="bg-white p-5 rounded-[1.5rem] border border-[#DFD2C4]/60 shadow-sm flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-[#312923]">{item.item_name}</h4>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#CBAAA2]">{item.category}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingItem(item); setShowNewItemModal(true); }} className="p-2 text-[#5B6651] hover:bg-[#F5EFE8] rounded-xl transition-colors"><Edit3 size={14}/></button>
                                                <button onClick={() => handleDeleteInventoryItem(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-[#FDFBF7] p-2 rounded-xl border border-[#DFD2C4]/40 text-center">
                                                <p className="text-[8px] font-black text-[#9A8F84] uppercase">Total</p>
                                                <p className="text-sm font-black text-[#312923]">{item.total_quantity}</p>
                                            </div>
                                            <div className="bg-green-50 p-2 rounded-xl border border-green-100 text-center">
                                                <p className="text-[8px] font-black text-green-600 uppercase">Disp.</p>
                                                <p className="text-sm font-black text-green-700">{item.available_quantity}</p>
                                            </div>
                                            <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 text-center">
                                                <p className="text-[8px] font-black text-amber-600 uppercase">Esteril.</p>
                                                <p className="text-sm font-black text-amber-700">{item.in_sterilization_quantity}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- MODAL DE ITEM DE INVENTARIO --- */}
            {showNewItemModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-[#DFD2C4]/60">
                        <div className="p-6 border-b border-[#DFD2C4]/50 flex justify-between items-center">
                            <h3 className="text-lg font-black text-[#312923] flex items-center gap-2">
                                <List size={18} className="text-[#CBAAA2]" />
                                {editingItem?.id ? 'Editar Item' : 'Nuevo Item de Inventario'}
                            </h3>
                            <button onClick={() => { setShowNewItemModal(false); setEditingItem(null); }} className="p-2 rounded-xl hover:bg-[#F5EFE8] text-[#9A8F84] transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5 ml-2">Nombre del Item</label>
                                <input 
                                    type="text" 
                                    value={editingItem.item_name} 
                                    onChange={e => setEditingItem({...editingItem, item_name: e.target.value})}
                                    className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-4 py-3 text-sm font-medium text-[#312923] outline-none focus:border-[#5B6651]/50 transition-colors"
                                    placeholder="Ej: Kit de Exodoncia"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5 ml-2">Categoría</label>
                                <select 
                                    value={editingItem.category} 
                                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                                    className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-4 py-3 text-sm font-medium text-[#312923] outline-none focus:border-[#5B6651]/50 transition-colors"
                                >
                                    <option value="Instrumental">Instrumental</option>
                                    <option value="Kits">Kits</option>
                                    <option value="Materiales">Materiales</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5 ml-2 text-center">Total</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.total_quantity} 
                                        onChange={e => setEditingItem({...editingItem, total_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-[#312923] text-center outline-none focus:border-[#5B6651]/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5 ml-2 text-center">Disp.</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.available_quantity} 
                                        onChange={e => setEditingItem({...editingItem, available_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-green-700 text-center outline-none focus:border-green-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5 ml-2 text-center">Esteril.</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.in_sterilization_quantity} 
                                        onChange={e => setEditingItem({...editingItem, in_sterilization_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-amber-700 text-center outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-[#FDFBF7] border-t border-[#DFD2C4]/50 flex justify-end gap-3 rounded-b-[2rem]">
                            <button onClick={() => { setShowNewItemModal(false); setEditingItem(null); }} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-[#9A8F84] hover:bg-[#F5EFE8] transition-colors">Cancelar</button>
                            <button onClick={() => handleSaveInventoryItem(editingItem)} className="px-6 py-3 bg-[#312923] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#1a1512] transition-all shadow-md flex items-center gap-2">
                                <Save size={14}/> Guardar Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
