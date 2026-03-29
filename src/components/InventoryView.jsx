import React from 'react';
import { Search, Plus, AlertTriangle, Box, Minus, Edit3, PackageOpen } from 'lucide-react';

export default function InventoryView({ 
    themeMode, t, inventory, setInventory, filteredInventory, 
    inventorySearch, setInventorySearch, setNewItem, setModal, saveToSupabase 
}) {
    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            
            {/* --- ENCABEZADO BOUTIQUE --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Box size={14} className="text-[#A3968B]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Logística y Materiales</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Inventario Clínico</h2>
                </div>
                <button 
                    onClick={()=>{setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); setModal('addItem');}}
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5"
                >
                    <Plus size={16}/> Nuevo Insumo
                </button>
            </div>

            {/* --- BARRA DE BÚSQUEDA --- */}
            <div className="relative shrink-0">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3968B]" size={20}/>
                <input 
                    type="text" 
                    placeholder="Buscar insumo por nombre..." 
                    value={inventorySearch} 
                    onChange={e=>setInventorySearch(e.target.value)} 
                    className="w-full p-4 pl-14 rounded-2xl bg-white border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                />
            </div>

            {/* --- LISTA DE INVENTARIO --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {inventory.length === 0 ? (
                    <div className="p-12 border border-dashed border-[#DFD2C4] bg-[#FDFBF7]/50 rounded-[2rem] text-center flex flex-col items-center gap-5 mt-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#DFD2C4]/50 text-[#CBAAA2]">
                            <PackageOpen size={32} strokeWidth={1.5}/>
                        </div>
                        <div>
                            <h3 className="font-black text-[#312923] text-2xl tracking-tight">Tu inventario está vacío</h3>
                            <p className="text-sm text-[#9A8F84] mt-2 font-bold max-w-md mx-auto leading-relaxed">
                                Comienza a registrar tus resinas, anestesias, guantes y otros insumos para llevar un control exacto de tu stock.
                            </p>
                        </div>
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-lg font-bold text-[#A3968B]">No se encontraron insumos.</p>
                        <p className="text-xs font-medium text-[#9A8F84] mt-2">Intenta con otra palabra clave.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredInventory.map(item => { 
                            const isLow = (item.stock || 0) <= (item.min || 5); 
                            return (
                                <div key={item.id} className={`group flex flex-col sm:flex-row justify-between sm:items-center p-5 rounded-2xl border transition-all gap-4 ${isLow ? 'bg-red-50 border-red-200 shadow-sm hover:shadow-md' : 'bg-white border-[#DFD2C4]/50 hover:border-[#A3968B] hover:shadow-md'}`}>
                                    
                                    {/* INFO DEL INSUMO */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors ${isLow ? 'bg-red-500 text-white animate-pulse' : 'bg-[#FDFBF7] border border-[#DFD2C4]/50 text-[#A3968B] group-hover:bg-[#CBAAA2] group-hover:text-white'}`}>
                                            {isLow ? <AlertTriangle size={24}/> : <Box size={24}/>}
                                        </div>
                                        <div>
                                            <h4 className={`font-black text-lg leading-tight ${isLow ? 'text-red-700' : 'text-[#312923]'}`}>{item.name}</h4>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isLow ? 'text-red-500' : 'text-[#9A8F84]'}`}>
                                                Stock Mínimo Seguro: {item.min} {item.unit}
                                            </p>
                                        </div>
                                    </div>

                                    {/* CONTROLES Y EDICIÓN */}
                                    <div className={`flex items-center gap-4 sm:border-l pl-0 sm:pl-4 pt-4 sm:pt-0 border-t sm:border-t-0 ${isLow ? 'border-red-200/50' : 'border-[#DFD2C4]/50'}`}>
                                        
                                        {/* Sumar y Restar Stock */}
                                        <div className={`flex items-center rounded-xl p-1 shadow-inner border ${isLow ? 'bg-white border-red-200' : 'bg-[#FDFBF7] border-[#DFD2C4]/60'}`}>
                                            <button 
                                                onClick={async()=>{ 
                                                    const n = Math.max(0, (item.stock||0)-1); const u = {...item, stock:n}; 
                                                    setInventory(inventory.map(i=>i.id===u.id?u:i)); 
                                                    await saveToSupabase('inventory', u.id, u); 
                                                }} 
                                                className={`p-2 rounded-lg transition-all ${isLow ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-[#9A8F84] hover:bg-white hover:text-[#312923] hover:shadow-sm'}`}
                                            >
                                                <Minus size={16}/>
                                            </button>
                                            
                                            <span className={`w-10 text-center font-black text-xl tracking-tighter ${isLow ? 'text-red-600' : 'text-[#5B6651]'}`}>
                                                {item.stock}
                                            </span>
                                            
                                            <button 
                                                onClick={async()=>{ 
                                                    const n = (item.stock||0)+1; const u = {...item, stock:n}; 
                                                    setInventory(inventory.map(i=>i.id===u.id?u:i)); 
                                                    await saveToSupabase('inventory', u.id, u); 
                                                }} 
                                                className={`p-2 rounded-lg transition-all ${isLow ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-[#9A8F84] hover:bg-white hover:text-[#312923] hover:shadow-sm'}`}
                                            >
                                                <Plus size={16}/>
                                            </button>
                                        </div>

                                        {/* Botón Editar */}
                                        <button 
                                            onClick={()=>{setNewItem(item); setModal('addItem');}} 
                                            className={`p-2.5 rounded-xl transition-all ${isLow ? 'text-red-400 hover:text-red-700 hover:bg-red-100' : 'text-[#DFD2C4] hover:text-[#312923] hover:bg-[#FDFBF7]'}`}
                                            title="Editar Insumo"
                                        >
                                            <Edit3 size={18}/>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}