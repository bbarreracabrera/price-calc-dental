import React, { useState } from 'react';
import { ShieldCheck, Wind, Sparkles, Plus, ArrowRight, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDialog } from './DialogProvider';

export default function SterilizationView({ 
    themeMode, t, sterilizationItems, setSterilizationItems, saveToSupabase, notify, session, config
}) {
    const { confirm } = useDialog();
    const [newKitName, setNewKitName] = useState('');

    // --- FUNCIONES DE LÓGICA ---
    const handleAddKit = async (e) => {
        e.preventDefault();
        if (!newKitName.trim()) return notify("Ingresa un nombre para el kit");

        const newId = `ster_${Date.now()}`;
        
        // MAGIA: Leemos los días configurados por la clínica (por defecto 30 si no hay nada)
        const days = config?.sterilizationDays || 30;
        
        const newKit = {
            id: newId,
            name: newKitName,
            status: 'sterile', // Inician como estériles por defecto
            last_updated: new Date().toISOString(),
            expiry_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            admin_email: session?.user?.email
        };

        setSterilizationItems([...sterilizationItems, newKit]);
        await saveToSupabase('sterilization', newId, newKit);
        setNewKitName('');
        notify(`Kit "${newKit.name}" registrado con éxito 🛡️`);
    };

    const handleMove = async (kit, newStatus) => {
        const updatedKit = { ...kit, status: newStatus, last_updated: new Date().toISOString() };
        
        // Si pasa a estéril, renovamos su caducidad según la configuración de la clínica
        if (newStatus === 'sterile') {
            const days = config?.sterilizationDays || 30;
            updatedKit.expiry_date = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            notify(`Kit esterilizado. Válido por ${days} días ✨`);
        } else if (newStatus === 'dirty') {
            notify(`Kit enviado a área sucia 🔴`);
        } else {
            notify(`Ciclo de autoclave iniciado ♨️`);
        }

        setSterilizationItems(sterilizationItems.map(i => i.id === kit.id ? updatedKit : i));
        await saveToSupabase('sterilization', kit.id, updatedKit);
    };

    const handleDelete = async (kit) => {
        if (await confirm(`¿Eliminar permanentemente el kit "${kit.name}"?`)) {
            setSterilizationItems(sterilizationItems.filter(i => i.id !== kit.id));
            // Borrado lógico para la interfaz.
            // Para base de datos idealmente llamas una función de borrado real, pero aquí lo sacamos del estado.
            notify(`Kit eliminado 🗑️`);
        }
    };

    // --- SEPARACIÓN EN COLUMNAS (KANBAN) ---
    const dirtyItems = sterilizationItems.filter(i => i.status === 'dirty');
    const sterilizingItems = sterilizationItems.filter(i => i.status === 'sterilizing');
    const sterileItems = sterilizationItems.filter(i => i.status === 'sterile');

    // --- COMPONENTE DE TARJETA (DRY) ---
    const KitCard = ({ kit, icon: Icon, colorClass, nextStatus, nextLabel, nextColor }) => {
        const dateObj = new Date(kit.last_updated);
        const timeStr = `${dateObj.toLocaleDateString('es-CL')} ${dateObj.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}`;
        
        // Cálculo de Vencimiento solo para Estériles
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

                {kit.status === 'sterile' && (
                    <div className="mb-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                            {isExpired ? '⚠️ CADUCADO' : `VENCE: ${expiryStr}`}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#DFD2C4]/40">
                    <button onClick={() => handleDelete(kit)} className="text-[#DFD2C4] hover:text-red-500 transition-colors p-1">
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
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Central de Esterilización</h2>
                </div>
                
                <form onSubmit={handleAddKit} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#DFD2C4] shadow-sm">
                    <input 
                        type="text" 
                        placeholder="Ej: Caja Quirúrgica 1..." 
                        className="p-2 pl-3 outline-none font-bold text-sm text-[#312923] bg-transparent w-48 md:w-64"
                        value={newKitName}
                        onChange={(e) => setNewKitName(e.target.value)}
                    />
                    <button type="submit" className="p-2.5 bg-[#312923] text-white rounded-xl hover:bg-[#1a1512] transition-colors shadow-md">
                        <Plus size={16}/>
                    </button>
                </form>
            </div>

            {/* --- TABLERO KANBAN --- */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
                
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
        </div>
    );
}