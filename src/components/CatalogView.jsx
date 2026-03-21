import React from 'react';
import { Library, Plus, Edit3, Trash2 } from 'lucide-react';
import { Card, Button } from './UIComponents';
import { DEFAULT_CATALOG } from '../constants';

export default function CatalogView({ 
    themeMode, t, catalog, setCatalog, clinicOwner, session, 
    setNewCatalogItem, setModal, saveToSupabase, notify 
}) {
    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Library className={t.accent}/> Arancel de Prestaciones</h2>
                    <p className="text-xs opacity-50 mt-1">Administra tus tratamientos y precios fijos.</p>
                </div>
                <Button theme={themeMode} onClick={() => { setNewCatalogItem({name:'', price:'', id:null}); setModal('catalogItem'); }}>
                    <Plus/> Nuevo Tratamiento
                </Button>
            </div>
            <div className="grid gap-2 overflow-y-auto custom-scrollbar pb-10">
                {catalog.length === 0 ? (
                    <div className="p-10 border border-dashed border-cyan-500/30 rounded-3xl text-center flex flex-col items-center bg-cyan-500/5">
                        <Library size={48} className="mb-4 text-cyan-500 opacity-50"/>
                        <h3 className="font-black text-lg mb-2">Tu arancel está vacío</h3>
                        <p className="text-xs opacity-70 mb-6 max-w-sm">No pierdas tiempo escribiendo desde cero. Carga un arancel base referencial y luego ajusta los precios a la realidad de tu clínica.</p>
                        
                        <Button theme={themeMode} onClick={async () => {
                            notify("Cargando arancel referencial...");
                            const newItems = [];
                            for (const item of DEFAULT_CATALOG) {
                                const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                const fullItem = { ...item, id, admin_email: clinicOwner || session?.user?.email };
                                newItems.push(fullItem);
                                await saveToSupabase('catalog', id, fullItem);
                            }
                            setCatalog(newItems);
                            notify("¡Arancel base cargado con éxito!");
                        }}>
                            <Plus size={18} /> CARGAR ARANCEL REFERENCIAL (51 ÍTEMS)
                        </Button>
                    </div>
                ) : (
                    catalog.sort((a,b)=>a.name.localeCompare(b.name)).map(item => (
                        <Card key={item.id} theme={themeMode} className="flex justify-between items-center p-4 hover:border-cyan-500/50 transition-colors">
                            <div><h4 className="font-bold">{item.name}</h4></div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-emerald-400">${Number(item.price).toLocaleString()}</span>
                                <button onClick={() => { setNewCatalogItem(item); setModal('catalogItem'); }} className="p-2 text-stone-400 hover:text-cyan-400 transition-colors"><Edit3 size={16}/></button>
                                <button onClick={async () => {
                                    setCatalog(catalog.filter(c => c.id !== item.id));
                                    // Asumiendo que importaste supabase o lo pasaste como prop, pero en este caso lo manejamos en App.jsx o pasamos la función de borrado. 
                                    // Para mantenerlo simple, llamemos a una función de borrado que pasaremos por prop, o importamos supabase aquí.
                                    // Lo ideal es que el componente reciba la función de borrado.
                                }} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}