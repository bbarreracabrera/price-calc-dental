import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Card, InputField, Button } from './UIComponents';

export default function AddItemModal({ 
    themeMode, newItem, setNewItem, setModal, inventory, setInventory, saveToSupabase, supabase, notify,
    session // <-- NUEVO CABLE
}) {
    const handleSave = async () => { 
        if(newItem.name){ 
            const id = newItem.id || Date.now().toString(); 
            const autor = session?.user?.email || 'Desconocido'; // <-- HUELLA DIGITAL

            const itemData = { ...newItem, id, last_modified_by: autor }; 
            let updatedInventory; 
            if (newItem.id) { updatedInventory = inventory.map(i => i.id === id ? itemData : i); } 
            else { updatedInventory = [...inventory, itemData]; } 
            
            setInventory(updatedInventory); 
            
            if(typeof saveToSupabase === 'function') await saveToSupabase('inventory', id, itemData); 
            
            setModal(null); 
            setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); 
            if(typeof notify === 'function') notify("Guardado"); 
        } else {
            alert("El nombre es obligatorio");
        }
    };

    const handleDelete = async () => { 
        const filtered = inventory.filter(i=>i.id!==newItem.id); 
        setInventory(filtered); 
        await supabase.from('inventory').delete().eq('id', newItem.id); 
        setModal(null); 
        if(typeof notify === 'function') notify("Eliminado"); 
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card theme={themeMode} className="w-full max-w-sm space-y-4 shadow-2xl border border-white/10">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">{newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                    <button onClick={()=>{setModal(null); if(newItem.id) setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); }} className="opacity-50 hover:opacity-100 transition-opacity"><X/></button>
                </div>
                <InputField theme={themeMode} placeholder="Nombre (ej: Anestesia)" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/>
                <div className="flex gap-2">
                    <InputField theme={themeMode} label="Stock" type="number" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:Number(e.target.value)})}/>
                    <InputField theme={themeMode} label="Mínimo" type="number" value={newItem.min} onChange={e=>setNewItem({...newItem, min:Number(e.target.value)})}/>
                </div>
                <div className="flex gap-2">
                    <Button theme={themeMode} className="flex-1" onClick={handleSave}>GUARDAR</Button>
                    
                    {newItem.id && (
                        <button onClick={handleDelete} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl"><Trash2 size={20}/></button>
                    )}
                </div>
            </Card>
        </div>
    );
}