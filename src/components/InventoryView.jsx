import React from 'react';
import { Search, Plus, AlertTriangle, Box, Minus, Edit3 } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { supabase } from '../supabase';

export default function InventoryView({ 
    themeMode, t, inventory, setInventory, filteredInventory, 
    inventorySearch, setInventorySearch, setNewItem, setModal, saveToSupabase 
}) {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Inventario</h2>
                <Button theme={themeMode} onClick={()=>{setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); setModal('addItem');}}>
                    <Plus/> Nuevo Item
                </Button>
            </div>
            <div className="relative">
                <InputField theme={themeMode} icon={Search} placeholder="Buscar insumo..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} />
            </div>
            <div className="space-y-2">
                {filteredInventory.map(item => { 
                    const isLow = (item.stock || 0) <= (item.min || 5); 
                    return (
                        <div key={item.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isLow ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${isLow ? 'bg-red-500 text-white' : 'bg-white/10'}`}>
                                    {isLow ? <AlertTriangle size={20}/> : <Box size={20}/>}
                                </div>
                                <div>
                                    <h4 className="font-bold">{item.name}</h4>
                                    <p className="text-xs opacity-50">Mínimo: {item.min} {item.unit}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                                    <button onClick={async()=>{ 
                                        const n = Math.max(0, (item.stock||0)-1); const u = {...item, stock:n}; 
                                        setInventory(inventory.map(i=>i.id===u.id?u:i)); 
                                        await saveToSupabase('inventory', u.id, u); 
                                    }} className="p-2 hover:bg-white/10 rounded"><Minus size={14}/></button>
                                    <span className={`w-8 text-center font-bold ${isLow?'text-red-500':''}`}>{item.stock}</span>
                                    <button onClick={async()=>{ 
                                        const n = (item.stock||0)+1; const u = {...item, stock:n}; 
                                        setInventory(inventory.map(i=>i.id===u.id?u:i)); 
                                        await saveToSupabase('inventory', u.id, u); 
                                    }} className="p-2 hover:bg-white/10 rounded"><Plus size={14}/></button>
                                </div>
                                <button onClick={()=>{setNewItem(item); setModal('addItem');}} className="p-2 text-white/50 hover:text-cyan-400">
                                    <Edit3 size={18}/>
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}