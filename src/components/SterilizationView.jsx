import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wind, Sparkles, Plus, ArrowRight, Trash2, AlertTriangle, CheckCircle2, List, ClipboardList, Save, X, Edit3, Link2, PackageX } from 'lucide-react';
import { useDialog } from './DialogProvider';
import { supabase } from '../supabase';

export default function SterilizationView({ 
    themeMode, t, sterilizationItems, setSterilizationItems, saveToSupabase, notify, session, config
}) {
    const { confirm } = useDialog();
    const [newKitName, setNewKitName] = useState('');
    const [newKitItemId, setNewKitItemId] = useState('');
    const [newKitQty, setNewKitQty] = useState(1);
    const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' o 'inventory'
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // El inventario se necesita en AMBAS pestañas: en "Inventario" para listarlo,
    // y en "Ciclos" para poder vincular un kit nuevo a un item real. Por eso se
    // carga al montar el componente, no solo al entrar a la pestaña de inventario.
    useEffect(() => {
        fetchInventory();
    }, []);

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
        const isNew = !item.id;
        const itemData = {
            ...item,
            id: item.id || `inv_${Date.now()}`,
            clinic_email: session?.user?.email
        };

        let error;
        if (!isNew) {
            const { error: updateError } = await supabase
                .from('sterilization_inventory')
                .update(itemData)
                .eq('id', itemData.id);
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
            // Reflejar las cantidades del item como tarjetas en el tablero de Ciclos,
            // sin importar si se editaron a mano o llegaron por otra vía.
            await syncKitsFromItem(itemData);
            fetchInventory();
        }
    };

    const handleDeleteInventoryItem = async (id) => {
        if (!await confirm('¿Estás seguro de que quieres eliminar este item del inventario?')) return;

        // Quitar del tablero de Ciclos cualquier tarjeta vinculada a este item
        // antes de borrarlo, para no dejar tarjetas huérfanas.
        for (const status of ['dirty', 'sterilizing', 'sterile']) {
            const kitId = `ster_item_${id}_${status}`;
            if (sterilizationItems.some(k => k.id === kitId)) {
                await supabase.from('sterilization').delete().eq('id', kitId);
            }
        }
        setSterilizationItems(prev => prev.filter(k => k.linked_item_id !== id));

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

    // --- SINCRONIZACIÓN INVENTARIO ↔ CICLOS ---
    // Mueve `qty` unidades de un balde a otro dentro de un item de inventario
    // (ej: de disponible a sucio, de sucio a esterilizando, etc). Los valores
    // quedan clampeados en 0 para nunca ir a negativo por descuadres previos.
    const adjustInventoryBuckets = async (itemId, deltas) => {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return null;

        const updated = { ...item };
        Object.entries(deltas).forEach(([field, delta]) => {
            updated[field] = Math.max(0, (Number(item[field]) || 0) + delta);
        });

        const { error } = await supabase
            .from('sterilization_inventory')
            .update({
                available_quantity: updated.available_quantity,
                dirty_quantity: updated.dirty_quantity,
                in_sterilization_quantity: updated.in_sterilization_quantity,
            })
            .eq('id', itemId);

        if (error) {
            console.error('Error sincronizando inventario:', error);
            notify('El kit se movió, pero no se pudo sincronizar el inventario.', 'error');
            return null;
        }

        setInventory(prev => prev.map(i => i.id === itemId ? updated : i));
        return updated;
    };

    // Mapea cada transición del kanban a los deltas que le corresponden en el
    // inventario vinculado. dirty -> sterilizing -> sterile -> dirty (reutilizado).
    const BUCKET_TRANSITIONS = {
        'dirty->sterilizing':   { dirty_quantity: 'from', in_sterilization_quantity: 'to' },
        'sterilizing->sterile': { in_sterilization_quantity: 'from', available_quantity: 'to' },
        'sterile->dirty':       { available_quantity: 'from', dirty_quantity: 'to' },
    };

    // Baldes de cantidad de un item, mapeados al estado del tablero que representan.
    const bucketByStatus = {
        dirty: 'dirty_quantity',
        sterilizing: 'in_sterilization_quantity',
        sterile: 'available_quantity',
    };

    // --- FUENTE ÚNICA DE VERDAD: tarjeta del tablero = cantidad del item ---
    // Cada item de inventario puede tener hasta 3 tarjetas "virtuales" en el
    // tablero de Ciclos (una por cada balde con cantidad > 0), con id
    // determinístico `ster_item_{itemId}_{status}`. Esta función se llama
    // SIEMPRE que cambian las cantidades de un item — ya sea por una edición
    // manual en Inventario, o por un movimiento en el tablero — y reconcilia
    // las 3 tarjetas posibles: las crea/actualiza si hay cantidad, y las
    // borra si llegan a 0. Así nunca hay un número en Inventario sin su
    // tarjeta correspondiente en Ciclos, ni viceversa.
    const syncKitsFromItem = async (item) => {
        const days = config?.sterilizationDays || 30;
        const now = new Date().toISOString();
        let nextItems = [...sterilizationItems];

        for (const [status, field] of Object.entries(bucketByStatus)) {
            const kitId = `ster_item_${item.id}_${status}`;
            const qty = Number(item[field]) || 0;

            if (qty > 0) {
                const kit = {
                    id: kitId,
                    name: item.item_name,
                    status,
                    quantity: qty,
                    linked_item_id: item.id,
                    linked_item_name: item.item_name,
                    last_updated: now,
                    expiry_date: status === 'sterile' ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null,
                    admin_email: session?.user?.email,
                };
                nextItems = [...nextItems.filter(k => k.id !== kitId), kit];
                await saveToSupabase('sterilization', kitId, kit);
            } else if (nextItems.some(k => k.id === kitId)) {
                nextItems = nextItems.filter(k => k.id !== kitId);
                await supabase.from('sterilization').delete().eq('id', kitId);
            }
        }

        setSterilizationItems(nextItems);
    };

    const syncInventoryOnMove = async (kit, fromStatus, toStatus) => {
        if (!kit.linked_item_id || !kit.quantity) return null;
        const key = `${fromStatus}->${toStatus}`;
        const mapping = BUCKET_TRANSITIONS[key];
        if (!mapping) return null;

        const deltas = {};
        Object.entries(mapping).forEach(([field, dir]) => {
            deltas[field] = dir === 'from' ? -kit.quantity : kit.quantity;
        });
        return await adjustInventoryBuckets(kit.linked_item_id, deltas);
    };

    // --- FUNCIONES DE LÓGICA DE KITS ---
    const handleAddKit = async (e) => {
        e.preventDefault();

        const days = config?.sterilizationDays || 30;
        const newId = `ster_${Date.now()}`;

        // Caso A: kit vinculado a un item real del inventario -> nace SUCIO y
        // descuenta de "Disponible", sumando a "Sucio" de ese item. La tarjeta
        // se genera sola vía syncKitsFromItem, como cualquier otro cambio de cantidad.
        if (newKitItemId) {
            const item = inventory.find(i => i.id === newKitItemId);
            if (!item) return notify("Selecciona un item válido del inventario", "error");

            const qty = Number(newKitQty) || 1;
            if (qty <= 0) return notify("La cantidad debe ser mayor a 0", "error");
            if (qty > (item.available_quantity || 0)) {
                return notify(`Solo hay ${item.available_quantity || 0} unidades disponibles de "${item.item_name}"`, "error");
            }

            const updated = await adjustInventoryBuckets(item.id, {
                available_quantity: -qty,
                dirty_quantity: qty,
            });
            if (!updated) return; // no seguir si la sincronización falló

            await syncKitsFromItem(updated);
            setNewKitName('');
            setNewKitItemId('');
            setNewKitQty(1);
            notify(`${qty} unidad(es) de "${item.item_name}" pasaron a Sucio`);
            return;
        }

        // Caso B: kit "suelto" sin vincular a inventario (comportamiento original,
        // se mantiene por si quieres seguir registrando cajas sin trazabilidad de stock).
        if (!newKitName.trim()) return notify("Ingresa un nombre para el kit o vincula un item del inventario");

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
        // Kit vinculado a inventario: el movimiento se resuelve moviendo cantidades
        // entre baldes del item, y las tarjetas del tablero se recalculan solas
        // a partir de esas cantidades — no se edita el kit directamente.
        if (kit.linked_item_id) {
            const updatedItem = await syncInventoryOnMove(kit, kit.status, newStatus);
            if (!updatedItem) return;
            await syncKitsFromItem(updatedItem);

            if (newStatus === 'sterile') notify(`Esterilizado. Válido por ${config?.sterilizationDays || 30} días`);
            else if (newStatus === 'dirty') notify(`Enviado a área sucia 🔴`);
            else notify(`Ciclo de autoclave iniciado ♨️`);
            return;
        }

        // Kit suelto (no vinculado a inventario): comportamiento original, sin cambios.
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
        // Tarjeta vinculada a inventario: "eliminar" significa retirar esas
        // unidades del conteo (pérdida, rotura, etc.) — no tiene sentido devolverlas
        // a otro balde, porque la tarjeta ES la representación de ese balde.
        if (kit.linked_item_id) {
            if (!await confirm(`¿Retirar del inventario las ${kit.quantity} unidad(es) de "${kit.linked_item_name}" (estado: ${kit.status})? Úsalo para pérdidas o roturas, no para mover material entre estados.`)) return;

            const field = bucketByStatus[kit.status];
            if (field) {
                const updated = await adjustInventoryBuckets(kit.linked_item_id, { [field]: -kit.quantity });
                if (updated) await syncKitsFromItem(updated);
            }
            notify("Unidades retiradas del inventario");
            return;
        }

        // Kit suelto: comportamiento original.
        if (await confirm(`¿Eliminar permanentemente el kit "${kit.name}"?`)) {
            setSterilizationItems(sterilizationItems.filter(i => i.id !== kit.id));
            await supabase.from('sterilization').delete().eq('id', kit.id);
            notify("Kit eliminado");
        }
    };

    // --- SEPARACIÓN EN COLUMNAS (KANBAN) ---
    const dirtyItems = sterilizationItems.filter(i => i.status === 'dirty');
    const sterilizingItems = sterilizationItems.filter(i => i.status === 'sterilizing');
    const sterileItems = sterilizationItems.filter(i => i.status === 'sterile');

    // Items del inventario con stock disponible para armar un kit nuevo
    const availableForKit = inventory.filter(i => (i.available_quantity || 0) > 0);

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

                {kit.linked_item_id && (
                    <div className="mb-3">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Link2 size={10}/> {kit.quantity}× {kit.linked_item_name || 'Item vinculado'}
                        </span>
                    </div>
                )}

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
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#312923] tracking-tighter">Central de Esterilización</h2>
                </div>
                
                <div className="flex flex-col items-end gap-3">
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
                        <form onSubmit={handleAddKit} className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#DFD2C4] shadow-sm">
                            <select
                                value={newKitItemId}
                                onChange={(e) => { setNewKitItemId(e.target.value); if (e.target.value) setNewKitName(''); }}
                                className="p-2.5 pl-3 outline-none font-bold text-xs text-[#312923] bg-[#FDFBF7] rounded-xl border border-[#DFD2C4]/60 max-w-[180px]"
                                title="Vincular a un item del inventario"
                            >
                                <option value="">Sin vincular (nombre libre)</option>
                                {availableForKit.map(item => (
                                    <option key={item.id} value={item.id}>{item.item_name} ({item.available_quantity} disp.)</option>
                                ))}
                            </select>
                            {newKitItemId ? (
                                <input
                                    type="number"
                                    min="1"
                                    className="p-2 pl-3 outline-none font-bold text-sm text-[#312923] bg-transparent w-16 border border-[#DFD2C4]/60 rounded-xl"
                                    value={newKitQty}
                                    onChange={(e) => setNewKitQty(e.target.value)}
                                    title="Cantidad"
                                />
                            ) : (
                                <input 
                                    type="text" 
                                    placeholder="Ej: Caja Quirúrgica 1..." 
                                    className="p-2 pl-3 outline-none font-bold text-sm text-[#312923] bg-transparent w-40 md:w-56"
                                    value={newKitName}
                                    onChange={(e) => setNewKitName(e.target.value)}
                                />
                            )}
                            <button type="submit" className="p-2.5 bg-[#312923] text-white rounded-xl hover:bg-[#1a1512] transition-colors shadow-md">
                                <Plus size={16}/>
                            </button>
                        </form>
                    )}
                    {activeTab === 'inventory' && (
                        <button 
                            onClick={() => { setEditingItem({ item_name: '', category: 'Instrumental', total_quantity: 0, available_quantity: 0, dirty_quantity: 0, in_sterilization_quantity: 0 }); setShowNewItemModal(true); }}
                            className="flex items-center gap-2 px-4 py-3 bg-[#5B6651] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4a5442] transition-all shadow-md"
                        >
                            <Plus size={14}/> Nuevo Item
                        </button>
                    )}
                </div>
            </div>

            {/* --- CONTENIDO SEGÚN PESTAÑA --- */}
            {activeTab === 'kanban' ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
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
                                        <div className="grid grid-cols-4 gap-1.5">
                                            <div className="bg-[#FDFBF7] p-2 rounded-xl border border-[#DFD2C4]/40 text-center">
                                                <p className="text-[7px] font-black text-[#9A8F84] uppercase">Total</p>
                                                <p className="text-sm font-black text-[#312923]">{item.total_quantity}</p>
                                            </div>
                                            <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center">
                                                <p className="text-[7px] font-black text-red-500 uppercase">Sucio</p>
                                                <p className="text-sm font-black text-red-600">{item.dirty_quantity ?? 0}</p>
                                            </div>
                                            <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 text-center">
                                                <p className="text-[7px] font-black text-amber-600 uppercase">Esteril.</p>
                                                <p className="text-sm font-black text-amber-700">{item.in_sterilization_quantity}</p>
                                            </div>
                                            <div className="bg-green-50 p-2 rounded-xl border border-green-100 text-center">
                                                <p className="text-[7px] font-black text-green-600 uppercase">Disp.</p>
                                                <p className="text-sm font-black text-green-700">{item.available_quantity}</p>
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
                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5 text-center">Total</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.total_quantity} 
                                        onChange={e => setEditingItem({...editingItem, total_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-[#312923] text-center outline-none focus:border-[#5B6651]/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-red-500 block mb-1.5 text-center">Sucio</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.dirty_quantity ?? 0} 
                                        onChange={e => setEditingItem({...editingItem, dirty_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-red-600 text-center outline-none focus:border-red-400/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 block mb-1.5 text-center">Esteril.</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.in_sterilization_quantity} 
                                        onChange={e => setEditingItem({...editingItem, in_sterilization_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-amber-700 text-center outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-green-600 block mb-1.5 text-center">Disp.</label>
                                    <input 
                                        type="number" 
                                        value={editingItem.available_quantity} 
                                        onChange={e => setEditingItem({...editingItem, available_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-2 py-3 text-sm font-black text-green-700 text-center outline-none focus:border-green-500/50"
                                    />
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-[#9A8F84] flex items-center gap-1.5 ml-1">
                                <PackageX size={11}/> Ideal: Total = Sucio + Esteril. + Disp.
                            </p>
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
