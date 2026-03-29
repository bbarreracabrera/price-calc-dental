import React from 'react';
import { X, Save } from 'lucide-react';

export default function CatalogModal({ 
    themeMode, newCatalogItem, setNewCatalogItem, 
    catalog, setCatalog, setModal, clinicOwner, notify, saveToSupabase 
}) {
    return (
        <div className="fixed inset-0 z-[100] bg-[#312923]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-[#DFD2C4]/50 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DFD2C4]/50">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight">
                            {newCatalogItem.id ? 'Editar Valor' : 'Nuevo Tratamiento'}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Configuración de Arancel</p>
                    </div>
                    <button onClick={() => setModal(null)} className="p-2 text-[#9A8F84] hover:bg-[#FDFBF7] hover:text-[#312923] rounded-xl transition-all">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">Nombre del Tratamiento</label>
                        <input 
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors" 
                            placeholder="Ej: Endodoncia Birradicular" 
                            value={newCatalogItem.name} 
                            onChange={e=>setNewCatalogItem({...newCatalogItem, name:e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">Categoría de Especialidad</label>
                        <select 
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors appearance-none cursor-pointer"
                            value={newCatalogItem.category || 'Otros'}
                            onChange={e => setNewCatalogItem({...newCatalogItem, category: e.target.value})}
                        >
                            <option value="Examen">Examen / Diagnóstico</option>
                            <option value="Preventivo">Preventivo</option>
                            <option value="Cirugía">Cirugía</option>
                            <option value="Endodoncia">Endodoncia</option>
                            <option value="Implantología">Implantología</option>
                            <option value="Rehabilitación">Rehabilitación</option>
                            <option value="Periodoncia">Periodoncia</option>
                            <option value="Ortodoncia">Ortodoncia</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2 mb-2 block">Precio Fijo Clínico</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#A3968B]">$</span>
                            <input 
                                type="number" 
                                className="w-full p-4 pl-8 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-black text-xl text-[#5B6651] focus:border-[#5B6651] transition-colors" 
                                placeholder="00.000" 
                                value={newCatalogItem.price} 
                                onChange={e=>setNewCatalogItem({...newCatalogItem, price:e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <button 
                        className="w-full mt-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-[#1a1512] shadow-lg shadow-[#312923]/20 active:scale-95 transition-all flex items-center justify-center gap-2" 
                        onClick={async()=>{
                            if(newCatalogItem.name && newCatalogItem.price){
                                const id = newCatalogItem.id || Date.now().toString();
                                // Nos aseguramos de guardar la categoría en Supabase
                                const itemData = { ...newCatalogItem, category: newCatalogItem.category || 'Otros', price: Number(newCatalogItem.price), id, admin_email: clinicOwner };
                                if (newCatalogItem.id) { setCatalog(catalog.map(c => c.id === id ? itemData : c)); } 
                                else { setCatalog([...catalog, itemData]); }
                                await saveToSupabase('catalog', id, itemData);
                                setModal(null); setNewCatalogItem({name:'', price:'', category:'Examen', id:null}); notify("Guardado en Arancel");
                            }
                        }}
                    >
                        <Save size={16}/> GUARDAR EN ARANCEL
                    </button>
                </div>
            </div>
        </div>
    );
}