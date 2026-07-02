import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertTriangle, Box, Minus, Edit3, PackageOpen, Barcode, Archive, PlayCircle, Clock, AlertCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '../supabase';
import { useDialog } from './DialogProvider';

export default function InventoryView({
    themeMode, t, inventory, setInventory, 
    inventorySearch, setInventorySearch, setNewItem, setModal, saveToSupabase,
    session, team, notify, config
}) {
    const { prompt } = useDialog();
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'lowStock', 'nearExpiry'

    const getFilteredInventory = useMemo(() => {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        return inventory.filter(item => {
            const matchName = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
            const matchBarcode = item.batches?.some(b => b.barcode && b.barcode.includes(inventorySearch));
            const passesSearch = inventorySearch ? (matchName || matchBarcode) : true;

            if (!passesSearch) return false;

            if (activeFilter === 'lowStock') {
                const totalStock = item.batches ? item.batches.reduce((sum, b) => sum + b.qty, 0) : (item.stock || 0);
                return totalStock <= (item.min || 5);
            } else if (activeFilter === 'nearExpiry') {
                const batches = item.batches || [];
                return batches.some(batch => {
                    const expiryDate = batch.expiry ? new Date(batch.expiry) : null;
                    return expiryDate && expiryDate > today && expiryDate <= nextMonth;
                });
            }
            return true;
        });
    }, [inventory, inventorySearch, activeFilter]);

    const displayInventory = getFilteredInventory;

    const handleOpenBatch = async (item, batchIndex) => {
        let updatedItem = { ...item };
        let batches = [...(updatedItem.batches || [])];
        let sourceBatch = { ...batches[batchIndex] };

        if (sourceBatch.qty > 0) {
            sourceBatch.qty -= 1;
            
            let useBatchIndex = batches.findIndex(b => b.barcode === sourceBatch.barcode && b.expiry === sourceBatch.expiry && b.status === 'en_uso');

            if (useBatchIndex >= 0) {
                batches[useBatchIndex] = { ...batches[useBatchIndex], qty: batches[useBatchIndex].qty + 1 };
            } else {
                batches.push({ ...sourceBatch, id: 'b_' + Date.now(), qty: 1, status: 'en_uso' });
            }

            if (sourceBatch.qty === 0) batches.splice(batchIndex, 1);
            else batches[batchIndex] = sourceBatch;

            updatedItem.batches = batches;
            updatedItem.stock = batches.reduce((sum, b) => sum + b.qty, 0);
            updatedItem.last_modified_by = session?.user?.email || 'Desconocido';

            setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
            await saveToSupabase('inventory', updatedItem.id, updatedItem);
            notify('Unidad movida a Box / En Uso', 'success');
        }
    };

    const handleConsume = async (item, batchIndex) => {
        let updatedItem = { ...item };
        let batches = [...(updatedItem.batches || [])];
        
        if (batchIndex === null) { // Para insumos sin lotes
            updatedItem.stock = Math.max(0, (updatedItem.stock || 0) - 1);
            updatedItem.last_modified_by = session?.user?.email || 'Desconocido';
            setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
            await saveToSupabase('inventory', updatedItem.id, updatedItem);
            notify('Unidad descontada', 'success');
            return;
        }

        let targetBatch = { ...batches[batchIndex] };

        if (targetBatch.qty > 0) {
            targetBatch.qty -= 1;
            
            if (targetBatch.qty === 0) batches.splice(batchIndex, 1);
            else batches[batchIndex] = targetBatch;

            updatedItem.batches = batches;
            updatedItem.stock = batches.reduce((sum, b) => sum + b.qty, 0);
            updatedItem.last_modified_by = session?.user?.email || 'Desconocido';

            setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
            await saveToSupabase('inventory', updatedItem.id, updatedItem);
            notify('Unidad descontada del lote', 'success');
        }
    };

    const handleQuickOrder = async (item) => {
        let phone = config?.phone_comercial || '';

        if (!phone || phone.trim() === '') {
            const userPhone = await prompt(
                "Para coordinar el despacho por WhatsApp, ingresa tu número de contacto:",
                '',
                { placeholder: '+56912345678' }
            );
            
            if (!userPhone || userPhone.trim() === '') {
                notify("Necesitamos un teléfono para procesar la orden.", 'info');
                return;
            }
            phone = userPhone;
        }

        const orderAmount = (item.min || 5) * 2;
        const orderDetail = {
            item_name: item.name,
            quantity: orderAmount,
            unit: item.unit || 'u',
            clinic_email: session?.user?.email,
            phone_contact: phone,
            request_date: new Date().toISOString()
        };

        try {
            const { error } = await supabase.from('supply_orders').insert([{
                admin_email: session?.user?.email,
                order_details: orderDetail,
                total_amount: 0,
                status: 'pending'
            }]);

            if (error) throw error;
            notify(`Orden enviada. Te contactaremos al ${phone}`, 'success');
        } catch (error) {
            console.error("Error:", error);
            notify("Error al enviar la orden.", 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Box size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Logística y Materiales</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Inventario Clínico</h2>
                </div>
                <button 
                    onClick={()=>{setNewItem({name:'', stock:0, min:5, unit:'u', id:null, batches: []}); setModal('addItem');}}
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                >
                    <Plus size={16}/> Registrar Insumo / Compra
                </button>
            </div>

            <div className="relative shrink-0 group">
                <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3968B] group-focus-within:text-[#5B6651] transition-colors" size={20}/>
                <input 
                    type="text" 
                    placeholder="Escribe el nombre o escanea un código de barras..." 
                    value={inventorySearch} 
                    onChange={e=>setInventorySearch(e.target.value)} 
                    className="w-full p-4 pl-14 rounded-2xl bg-white border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                    autoFocus
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 py-1 rounded-md border border-[#DFD2C4]/50">Listo para escanear</span>
            </div>

            <div className="flex gap-2 mt-4 shrink-0">
                <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-[#312923] text-white' : 'bg-[#FDFBF7] text-[#9A8F84] border border-[#DFD2C4]/50 hover:bg-[#DFD2C4]/30'}`}
                >
                    Todos
                </button>
                <button 
                    onClick={() => setActiveFilter('lowStock')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'lowStock' ? 'bg-red-500 text-white' : 'bg-[#FDFBF7] text-[#9A8F84] border border-[#DFD2C4]/50 hover:bg-[#DFD2C4]/30'}`}
                >
                    Stock Bajo
                </button>
                <button 
                    onClick={() => setActiveFilter('nearExpiry')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'nearExpiry' ? 'bg-amber-500 text-white' : 'bg-[#FDFBF7] text-[#9A8F84] border border-[#DFD2C4]/50 hover:bg-[#DFD2C4]/30'}`}
                >
                    Próximo a Vencer
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {inventory.length === 0 ? (
                    <div className="p-12 border border-dashed border-[#DFD2C4] bg-[#FDFBF7]/50 rounded-[2rem] text-center flex flex-col items-center gap-5 mt-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#DFD2C4]/50 text-[#CBAAA2]">
                            <PackageOpen size={32} strokeWidth={1.5}/>
                        </div>
                        <div>
                            <h3 className="font-black text-[#312923] text-2xl tracking-tight">Tu inventario está vacío</h3>
                            <p className="text-sm text-[#9A8F84] mt-2 font-bold max-w-md mx-auto leading-relaxed">
                                Comienza a registrar tus resinas, anestesias y guantes. Usa un lector de códigos de barras para mayor velocidad.
                            </p>
                        </div>
                    </div>
                ) : displayInventory.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-lg font-bold text-[#A3968B]">No se encontraron insumos.</p>
                        <p className="text-xs font-medium text-[#9A8F84] mt-2">Intenta con otra palabra clave o vuelve a escanear.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {displayInventory.map(item => { 
                            const totalStock = item.batches ? item.batches.reduce((sum, b) => sum + b.qty, 0) : (item.stock || 0);
                            const isLow = totalStock <= (item.min || 5); 
                            const batches = item.batches || [];
                            const today = new Date();
                            const nextMonth = new Date();
                            nextMonth.setDate(today.getDate() + 30);

                            return (
                                <div key={item.id} className={`group flex flex-col p-5 rounded-[2rem] border transition-all gap-4 ${isLow ? 'bg-red-50/50 border-red-200 shadow-sm' : 'bg-white border-[#DFD2C4]/50 hover:border-[#A3968B] shadow-sm'}`}>
                                    
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-colors ${isLow ? 'bg-red-500 text-white animate-pulse' : 'bg-[#FDFBF7] border border-[#DFD2C4]/50 text-[#A3968B] group-hover:bg-[#CBAAA2] group-hover:text-white'}`}>
                                                {isLow ? <AlertTriangle size={24}/> : <Box size={24}/>}
                                            </div>
                                            <div>
                                                <h4 className={`font-black text-xl leading-tight ${isLow ? 'text-red-700' : 'text-[#312923]'}`}>{item.name}</h4>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isLow ? 'bg-red-100 text-red-600 border-red-200' : 'bg-[#FDFBF7] text-[#9A8F84] border-[#DFD2C4]/50'}`}>
                                                            Total: {totalStock} {item.unit}
                                                        </span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isLow ? 'text-red-400' : 'text-[#A3968B]/70'}`}>
                                                            Min: {item.min}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* BOTÓN DE REPOSICIÓN B2B (Solo aparece si el stock es bajo) */}
                                                    {isLow && (
                                                        <button 
                                                            onClick={() => handleQuickOrder(item)}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-[#d8f0d8] text-[#3d5a3d] border border-[#9fdca4] hover:bg-[#c1e8c1] rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                                        >
                                                            <ShoppingCart size={12} />
                                                            Reabastecer con Supply
                                                        </button>
                                                    )}
                                                    {totalStock > 0 && !batches.length && (
                                                        <button 
                                                            onClick={() => handleConsume(item, null)}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-[#CBAAA2] text-white border border-[#CBAAA2] hover:bg-[#b8958d] rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                                            title="Descontar 1 unidad"
                                                        >
                                                            <Minus size={12} /> Usar 1
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={()=>{setNewItem(item); setModal('editItem');}} className="p-2 rounded-lg text-[#CBAAA2] hover:text-[#b8958d] hover:bg-[#FDFBF7]"><Edit3 size={16}/></button>
                                    </div>

                                    {batches.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-4 border-t border-[#DFD2C4]/30 pt-4">
                                            {batches.map((batch, idx) => {
                                                const expiryDate = batch.expiry ? new Date(batch.expiry) : null;
                                                const isExpired = expiryDate && expiryDate <= today;
                                                const isNearExpiry = expiryDate && expiryDate > today && expiryDate <= nextMonth;

                                                return (
                                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                                                    isExpired ? 'bg-red-50 border-red-300 shadow-sm' : 
                                                                                    isNearExpiry ? 'bg-amber-50 border-amber-300' : 
                                                                                    batch.status === 'en_uso' ? 'bg-[#5B6651]/10 border-[#5B6651]/40 ring-2 ring-[#5B6651]/50' : 'bg-[#FDFBF7] border-[#DFD2C4]/60'
                                                                                }`}>
                                                                                    
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg shadow-sm ${
                                                                isExpired ? 'bg-red-500 text-white animate-pulse' : 
                                                                isNearExpiry ? 'bg-amber-500 text-white' :
                                                                batch.status === 'en_uso' ? 'bg-[#5B6651] text-white' : 'bg-[#DFD2C4]/20 text-[#A3968B]'
                                                            }`}>
                                                                {isExpired ? <AlertCircle size={16}/> : isNearExpiry ? <Clock size={16}/> : batch.status === 'en_uso' ? <PlayCircle size={16}/> : <Archive size={16}/>}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`text-xs font-black uppercase tracking-wider ${isExpired ? 'text-red-700' : isNearExpiry ? 'text-amber-800' : batch.status === 'en_uso' ? 'text-[#312923]' : 'text-[#6B615A]'}`}>
                                                                        {batch.status === 'en_uso' ? 'En Uso (Box)' : 'En Bodega'} 
                                                                    </p>
                                                                    <span className={`text-[10px] font-black ${isExpired ? 'text-red-600' : isNearExpiry ? 'text-amber-600' : batch.status === 'en_uso' ? 'text-[#5B6651]' : 'text-[#A3968B]'}`}>x{batch.qty}</span>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    {batch.barcode && <span className="text-[9px] font-bold text-[#A3968B] uppercase tracking-widest bg-white px-1.5 py-0.5 rounded border border-[#DFD2C4]/50">Cod: {batch.barcode}</span>}
                                                                    {batch.expiry && (
                                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${isExpired ? 'bg-red-100 text-red-600 border-red-200' : isNearExpiry ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white text-[#A3968B] border-[#DFD2C4]/50'}`}>
                                                                            Vence: {new Date(batch.expiry).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {batch.status === 'bodega' && !isExpired && (
                                                                <button 
                                                                    onClick={() => handleOpenBatch(item, idx)}
                                                                    className="px-3 py-1.5 bg-white border border-[#DFD2C4] text-[#312923] hover:border-[#5B6651] hover:text-[#5B6651] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                                    title="Mover una unidad a Box / En Uso"
                                                                >
                                                                    Abrir 1
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleConsume(item, idx)}
                                                                className="p-1.5 bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg shadow-sm transition-all"
                                                                title="Consumir / Desechar"
                                                            >
                                                                <Minus size={16}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
