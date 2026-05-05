import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Card } from './UIComponents';
import { useDialog } from './DialogProvider';

export default function LoadPackModal({ 
    themeMode, setModal, protocols, setProtocols, sessionData, setSessionData, supabase, notify
}) {
    const { confirm } = useDialog();
    const isLight = themeMode === 'light';

    return (
        <div className="fixed inset-0 z-[100] bg-black/90backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card theme={themeMode} className="w-full max-w-sm h-96 flex flex-col shadow-2xl border border-white/10 relative">
                <button onClick={()=>setModal(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"><X size={20}/></button>
                <h3 className="font-bold mb-4 text-xl">Protocolos Guardados</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {protocols.length === 0 && <p className="text-xs opacity-50 text-center mt-10">No hay packs creados.</p>}
                    {protocols.map(pr=>(
                        <div key={pr.id} className="p-4 bg-white/5 rounded-xl border border-transparent hover:border-cyan-500/50 flex justify-between items-center group transition-all">
                            <div className="cursor-pointer flex-1" onClick={()=>{setSessionData({...sessionData, treatmentName:pr.name, baseCost:pr.totalCost}); setModal(null); if(typeof notify === 'function') notify("Pack Cargado");}}>
                                <p className="font-bold text-sm">{pr.name}</p>
                                <p className="text-cyan-400 text-xs font-black">${pr.totalCost.toLocaleString('es-CL')}</p>
                            </div>
                            <button onClick={async (e)=>{
                                e.stopPropagation(); 
                                if(await confirm(`¿Seguro que quieres eliminar el protocolo "${pr.name}"?`)){
                                    setProtocols(protocols.filter(p=>p.id !== pr.id)); 
                                    await supabase.from('packs').delete().eq('id', pr.id); 
                                    if(typeof notify === 'function') notify("Pack Eliminado");
                                }
                            }} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={()=>setModal(null)} className={`mt-4 text-xs font-bold p-3 rounded-xl transition-colors ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Cerrar</button>
            </Card>
        </div>
    );
}