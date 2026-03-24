import React from 'react';
import { X } from 'lucide-react';
// Asumimos que Card, InputField y Button los tienes exportados o los recreamos aquí. 
// Para hacerlo fácil, vamos a usar HTML puro y las clases de Tailwind que ya tenías para no romper nada:

export default function CatalogModal({ 
    themeMode, newCatalogItem, setNewCatalogItem, 
    catalog, setCatalog, setModal, clinicOwner, notify, saveToSupabase 
}) {
    // Simulamos los estilos del tema
    const isDark = themeMode === 'dark' || themeMode === 'blue';
    
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`w-full max-w-sm space-y-4 p-6 rounded-3xl border shadow-xl ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">{newCatalogItem.id ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h3>
                    <button onClick={() => setModal(null)} className="opacity-50 hover:opacity-100 transition-opacity"><X/></button>
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 block">Nombre</label>
                    <input className={`w-full p-3 rounded-2xl outline-none font-bold text-sm ${isDark ? 'bg-white/5 focus:border-cyan-400' : 'bg-gray-100 focus:border-cyan-500'}`} placeholder="Ej: Endodoncia Birradicular" value={newCatalogItem.name} onChange={e=>setNewCatalogItem({...newCatalogItem, name:e.target.value})}/>
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 block">Precio Fijo</label>
                    <input type="number" className={`w-full p-3 rounded-2xl outline-none font-bold text-sm ${isDark ? 'bg-white/5 focus:border-cyan-400' : 'bg-gray-100 focus:border-cyan-500'}`} placeholder="$" value={newCatalogItem.price} onChange={e=>setNewCatalogItem({...newCatalogItem, price:e.target.value})}/>
                </div>
                
                <button className="w-full p-3 mt-2 rounded-2xl font-bold text-sm text-white bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg active:scale-95 transition-all" onClick={async()=>{
                    if(newCatalogItem.name && newCatalogItem.price){
                        const id = newCatalogItem.id || Date.now().toString();
                        const itemData = { ...newCatalogItem, price: Number(newCatalogItem.price), id, admin_email: clinicOwner };
                        if (newCatalogItem.id) { setCatalog(catalog.map(c => c.id === id ? itemData : c)); } 
                        else { setCatalog([...catalog, itemData]); }
                        await saveToSupabase('catalog', id, itemData);
                        setModal(null); setNewCatalogItem({name:'', price:'', id:null}); notify("Guardado en Arancel");
                    }
                }}>GUARDAR EN ARANCEL</button>
            </div>
        </div>
    );
}