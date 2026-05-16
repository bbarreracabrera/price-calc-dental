import React, { useState, useEffect } from 'react';
import { X, Trash2, Barcode, CalendarDays, PackagePlus, Edit3, AlertTriangle, Save, Camera, StopCircle } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useDialog } from './DialogProvider';

export default function AddItemModal({ 
    themeMode, newItem, setNewItem, setModal, inventory, setInventory, saveToSupabase, supabase, notify,
    session 
}) {
    const { confirm } = useDialog();
    const [batchInput, setBatchInput] = useState({ qty: '', barcode: '', expiry: '' });
    const [showScanner, setShowScanner] = useState(false);

    const inputClass = "w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block";

    // --- LÓGICA DEL ESCÁNER POR CÁMARA (NIVEL ENTERPRISE) ---
    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            // Configuramos el escáner para ser implacable con códigos de barras de cajas
            scanner = new Html5QrcodeScanner("reader", { 
                fps: 15, // Más cuadros por segundo para evitar borrosidad por movimiento
                qrbox: { width: 300, height: 150 }, // Rectángulo apaisado, ideal para barras
                aspectRatio: 1.777778,
                videoConstraints: {
                    facingMode: "environment", // Usar cámara trasera si es móvil
                    focusMode: "continuous" // Vital para cajas brillantes
                },
                // ¡AQUÍ ESTÁ LA MAGIA! Forzamos que lea los formatos comerciales
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            }, false); // El "false" apaga los logs innecesarios en consola

            scanner.render((decodedText) => {
                // Alerta de éxito (bip visual)
                
                setBatchInput(prev => ({ ...prev, barcode: decodedText }));
                setShowScanner(false); 
                scanner.clear();
                if(typeof notify === 'function') notify("Código escaneado: " + decodedText);
            }, (error) => {
                // Errores silenciosos de lectura (normal mientras busca)
            });
        }
        return () => { if(scanner) scanner.clear(); };
    }, [showScanner]);

    // --- LÓGICA DE GUARDADO ---
    const handleSave = async () => { 
        if(newItem.name){ 
            const id = newItem.id || `inv_${Date.now()}`; 
            const autor = session?.user?.email || 'Desconocido';

            let currentBatches = newItem.batches ? [...newItem.batches] : [];
            const addQty = Number(batchInput.qty);

            if (addQty > 0) {
                const newBatch = {
                    id: `b_${Date.now()}`,
                    qty: addQty,
                    barcode: batchInput.barcode.trim(),
                    expiry: batchInput.expiry,
                    status: 'bodega'
                };
                currentBatches.push(newBatch);
            }

            let newTotalStock = currentBatches.length > 0 
                ? currentBatches.reduce((sum, b) => sum + Number(b.qty), 0)
                : Number(newItem.stock || 0);

            const itemData = { 
                ...newItem, 
                id, 
                batches: currentBatches,
                stock: newTotalStock,
                last_modified_by: autor 
            }; 
            
            let updatedInventory; 
            if (newItem.id) { updatedInventory = inventory.map(i => i.id === id ? itemData : i); } 
            else { updatedInventory = [...inventory, itemData]; } 
            
            setInventory(updatedInventory); 
            
            if(typeof saveToSupabase === 'function') await saveToSupabase('inventory', id, itemData); 
            
            setModal(null); 
            setNewItem({name:'', stock:0, min:5, unit:'u', id:null, batches: []}); 
            if(typeof notify === 'function') notify("Registro guardado con éxito");
        } else {
            if (typeof notify === 'function') notify("El nombre del insumo es obligatorio.");
        }
    };

    // --- LÓGICA DE ELIMINACIÓN ---
    const handleDelete = async () => { 
        if(await confirm(`¿Estás seguro de eliminar "${newItem.name}" por completo de tu inventario?`)){
            const filtered = inventory.filter(i=>i.id!==newItem.id); 
            setInventory(filtered); 
            await supabase.from('inventory').update({ deleted_at: new Date().toISOString() }).eq('id', newItem.id);
            setModal(null); 
            if(typeof notify === 'function') notify("Insumo eliminado");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#312923]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white border border-[#DFD2C4]/50 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DFD2C4]/50 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight flex items-center gap-2">
                            {newItem.id ? <Edit3 className="text-[#A3968B]"/> : <PackagePlus className="text-[#5B6651]"/>}
                            {newItem.id ? 'Editar Insumo' : 'Nueva Compra'}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Gestión de Stock por Lotes</p>
                    </div>
                    <button aria-label="Cerrar modal" onClick={()=>{setModal(null); setShowScanner(false); setNewItem({name:'', stock:0, min:5, unit:'u', id:null, batches:[]});}} className="p-2 text-[#9A8F84] hover:bg-[#FDFBF7] hover:text-[#312923] rounded-xl transition-all">
                        <X size={20}/>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* --- INFO GENERAL --- */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="itemName" className={labelClass}>Nombre del Insumo</label>
                            <input id="itemName" className={inputClass} placeholder="Ej: Resina Filtek Z350 XT A2" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})} autoFocus={!newItem.id}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="itemMin" className={labelClass}>Mínimo de Alerta</label>
                                <div className="relative">
                                    <AlertTriangle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50" />
                                    <input id="itemMin" type="number" className={`${inputClass} pl-11`} placeholder="5" value={newItem.min} onChange={e=>setNewItem({...newItem, min:Number(e.target.value)})}/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="itemUnit" className={labelClass}>Unidad</label>
                                <select id="itemUnit" className={`${inputClass} cursor-pointer appearance-none`} value={newItem.unit || 'u'} onChange={e=>setNewItem({...newItem, unit:e.target.value})}>
                                    <option value="u">Unidades (u)</option>
                                    <option value="cajas">Cajas</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="gr">Gramos (gr)</option>
                                </select>
                            </div>
                        </div>
                        
                        {(!newItem.batches || newItem.batches.length === 0) && (
                            <div>
                                <label htmlFor="itemStock" className={labelClass}>Stock Total (Sin Lote)</label>
                                <input id="itemStock" type="number" className={inputClass} placeholder="0" value={newItem.stock || 0} onChange={e=>setNewItem({...newItem, stock:Number(e.target.value)})}/>
                            </div>
                        )}
                    </div>

                    {/* --- MÓDULO DE ESCANEO / COMPRA --- */}
                    <div className="p-5 bg-[#5B6651]/5 border border-[#5B6651]/20 rounded-3xl space-y-4">
                        <h4 className="text-xs font-black text-[#5B6651] uppercase tracking-widest flex items-center gap-2">
                            <Barcode size={16}/> Nuevo Lote (Escáner o Cámara)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label htmlFor="batchQty" className="text-[9px] font-black uppercase tracking-widest text-[#5B6651]/60 block mb-1">Cantidad</label>
                                <input id="batchQty" type="number" placeholder="+0" className="w-full p-3 rounded-xl bg-white border border-[#5B6651]/20 outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm" value={batchInput.qty} onChange={e=>setBatchInput({...batchInput, qty:e.target.value})} />
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="batchExpiry" className="text-[9px] font-black uppercase tracking-widest text-[#5B6651]/60 block mb-1">Vencimiento</label>
                                <div className="relative">
                                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6651]/40" />
                                    <input id="batchExpiry" type="date" className="w-full p-3 pl-9 rounded-xl bg-white border border-[#5B6651]/20 outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm" value={batchInput.expiry} onChange={e=>setBatchInput({...batchInput, expiry:e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="col-span-2">
                                <label htmlFor="batchBarcode" className="text-[9px] font-black uppercase tracking-widest text-[#5B6651]/60 block mb-1">Código de Barras</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6651]/40" />
                                        <input 
                                            id="batchBarcode" 
                                            type="text" 
                                            placeholder="Usa el lector físico o la cámara..." 
                                            className="w-full p-3 pl-9 rounded-xl bg-white border border-[#5B6651]/20 outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm" 
                                            value={batchInput.barcode} 
                                            onChange={e=>setBatchInput({...batchInput, barcode:e.target.value})} 
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={showScanner ? "Detener escáner" : "Escanear código de barras"}
                                        onClick={() => setShowScanner(!showScanner)}
                                        className={`p-3 rounded-xl transition-all shadow-sm ${showScanner ? 'bg-red-500 text-white' : 'bg-white text-[#5B6651] border border-[#5B6651]/20 hover:bg-[#5B6651] hover:text-white'}`}
                                        title="Activar Cámara del Teléfono/PC"
                                    >
                                        {showScanner ? <StopCircle size={20}/> : <Camera size={20}/>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- ÁREA DEL VISOR DE CÁMARA MEJORADO --- */}
                        {showScanner && (
                            <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#5B6651] bg-black">
                                <div id="reader" className="w-full h-auto"></div>
                                <p className="p-3 text-center text-[10px] text-white font-bold bg-[#312923] flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Enfocando... Acércalo a 15cm
                                </p>
                            </div>
                        )}
                    </div>

                    {/* --- BOTONES DE ACCIÓN --- */}
                    <div className="flex gap-3 pt-2 shrink-0">
                        <button 
                            className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-[#1a1512] shadow-xl shadow-[#312923]/20 active:scale-95 transition-all flex items-center justify-center gap-2" 
                            onClick={handleSave}
                        >
                            <Save size={16}/> GUARDAR REGISTRO
                        </button>
                        
                        {newItem.id && (
                            <button
                                aria-label="Eliminar insumo"
                                onClick={handleDelete}
                                className="px-6 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-2xl"
                                title="Eliminar producto por completo"
                            >
                                <Trash2 size={20}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}