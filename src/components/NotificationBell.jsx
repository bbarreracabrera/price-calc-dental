import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, FlaskConical, Calendar, Zap } from 'lucide-react';

const TYPE_ICONS = {
    lab_new: '🔬',
    lab_status: '⚙️',
    appointment_new: '📅',
    new_order: '🔬',
};

const TYPE_COLORS = {
    lab_new: 'bg-blue-50 border-blue-100',
    lab_status: 'bg-amber-50 border-amber-100',
    appointment_new: 'bg-emerald-50 border-emerald-100',
    new_order: 'bg-blue-50 border-blue-100',
};

function formatRelativeTime(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    return then.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

export default function NotificationBell({ notifications = [], unreadCount = 0, onMarkAllRead, onMarkRead, onClearAll }) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Botón campana */}
            <button
                onClick={handleOpen}
                className="relative p-2.5 text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-all"
                title="Notificaciones"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel de notificaciones */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#DFD2C4] rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFD2C4]/50">
                        <div>
                            <h3 className="font-black text-sm text-[#312923]">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <p className="text-[10px] text-[#9A8F84] font-bold">{unreadCount} sin leer</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllRead}
                                    className="p-1.5 text-[#9A8F84] hover:text-[#5B6651] hover:bg-[#5B6651]/10 rounded-lg transition-colors"
                                    title="Marcar todas como leídas"
                                >
                                    <CheckCheck size={14} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={onClearAll}
                                    className="p-1.5 text-[#9A8F84] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Limpiar todas"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-lg transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <Bell size={32} className="text-[#DFD2C4] mb-3" />
                                <p className="text-sm font-bold text-[#9A8F84]">Sin notificaciones</p>
                                <p className="text-[10px] text-[#DFD2C4] font-bold mt-1">Las actualizaciones aparecerán aquí en tiempo real</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${notif.read ? 'bg-white border-[#DFD2C4]/50 opacity-60' : TYPE_COLORS[notif.type] || 'bg-[#FDFBF7] border-[#DFD2C4]'}`}
                                        onClick={() => onMarkRead && onMarkRead(notif.id)}
                                    >
                                        <span className="text-xl shrink-0 mt-0.5">{notif.icon || TYPE_ICONS[notif.type] || '🔔'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-[#312923] leading-tight">{notif.title}</p>
                                            <p className="text-[10px] text-[#9A8F84] font-medium mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                                            <p className="text-[9px] text-[#DFD2C4] font-bold mt-1 uppercase tracking-widest">{formatRelativeTime(notif.timestamp)}</p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-[#DFD2C4]/50 bg-[#FDFBF7]/50">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Realtime activo · Supabase</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
