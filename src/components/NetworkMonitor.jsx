import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCcw, CheckCircle } from 'lucide-react';
import { supabase } from '../supabase'; // Ajusta la ruta a tu supabase.ts

export default function NetworkMonitor() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const [pendingItems, setPendingItems] = useState(0);

    // Revisar cuántos elementos hay en la bóveda
    const checkQueue = () => {
        const queue = JSON.parse(localStorage.getItem('shining_offline_queue') || '[]');
        setPendingItems(queue.length);
    };

    useEffect(() => {
        checkQueue();

        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineData(); // Iniciar sincronización automática al volver internet
        };
        const handleOffline = () => {
            setIsOnline(false);
            checkQueue();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Intentar sincronizar al cargar la app si hay internet
        if (navigator.onLine) syncOfflineData();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // El motor que vacía la bóveda
    const syncOfflineData = async () => {
        const queue = JSON.parse(localStorage.getItem('shining_offline_queue') || '[]');
        if (queue.length === 0) return;

        setSyncing(true);
        console.log(`Iniciando sincronización de ${queue.length} elementos...`);

        const failedItems = [];
        
        // Obtenemos el correo del admin para no perder los permisos RLS
        const { data: { session } } = await supabase.auth.getSession();
        const currentEmail = session?.user?.email;

        for (const item of queue) {
            try {
                let payload = { id: item.id };
                
                if (['clinic_config', 'clinical_evolutions'].includes(item.table)) {
                    payload = { id: item.id, ...item.data };
                } else {
                    payload.data = item.data;
                    if (currentEmail) payload.admin_email = currentEmail;
                }

                // Intentamos subirlo a Supabase
                const { error } = await supabase.from(item.table).upsert([payload]);
                if (error) throw error;
            } catch (err) {
                console.error("Error sincronizando ítem:", err);
                failedItems.push(item); // Si falla, se queda en la mochila
            }
        }

        // Actualizamos la bóveda solo con los que fallaron
        localStorage.setItem('shining_offline_queue', JSON.stringify(failedItems));
        setPendingItems(failedItems.length);
        setSyncing(false);
    };
    // Si hay internet y no hay nada que sincronizar, nos hacemos invisibles
    if (isOnline && pendingItems === 0 && !syncing) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-bottom">
            {!isOnline ? (
                <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-black text-[11px] uppercase tracking-widest">
                    <WifiOff size={16} className="animate-pulse" />
                    Sin Conexión
                    {pendingItems > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-md ml-2">{pendingItems} Guardados Localmente</span>}
                </div>
            ) : syncing ? (
                <div className="bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-black text-[11px] uppercase tracking-widest">
                    <RefreshCcw size={16} className="animate-spin" />
                    Sincronizando la Nube ({pendingItems})...
                </div>
            ) : pendingItems > 0 ? (
                <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-black text-[11px] uppercase tracking-widest">
                    <CheckCircle size={16} />
                    ¡Sincronización Completada!
                </div>
            ) : null}
        </div>
    );
}