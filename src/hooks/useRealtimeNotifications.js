/**
 * useRealtimeNotifications
 * ========================
 * Hook para notificaciones en tiempo real usando Supabase Realtime.
 * 
 * Escucha cambios en:
 * - lab_works: Nuevas órdenes y cambios de estado (clínica ↔ laboratorio)
 * - appointments: Nuevas citas agendadas
 * 
 * Uso:
 *   const { notifications, unreadCount, markAllRead } = useRealtimeNotifications(supabase, session, clinicOwner);
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const MAX_NOTIFICATIONS = 50;

export function useRealtimeNotifications(supabase, session, clinicOwner) {
    const [notifications, setNotifications] = useState([]);
    const channelRef = useRef(null);

    const addNotification = useCallback((notif) => {
        setNotifications(prev => {
            // Evitar duplicados por id
            if (prev.some(n => n.id === notif.id)) return prev;
            return [notif, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
    }, []);

    useEffect(() => {
        if (!session?.user?.email || !clinicOwner) return;

        // Limpiar canal anterior si existe
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`clinic-notifications-${clinicOwner}`)

            // ── Cambios en lab_works ────────────────────────────────────
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lab_works',
                    filter: `admin_email=eq.${clinicOwner}`,
                },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    const data = newRecord?.data || {};

                    if (eventType === 'INSERT') {
                        addNotification({
                            id: `lab-insert-${newRecord.id}-${Date.now()}`,
                            type: 'lab_new',
                            title: 'Nueva orden técnica creada',
                            body: `Trabajo "${data.workType || 'Sin tipo'}" para ${data.patientName || 'Paciente'} enviado a ${data.labName || 'laboratorio'}.`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            icon: '🔬',
                        });
                    }

                    if (eventType === 'UPDATE') {
                        const oldStatus = oldRecord?.status;
                        const newStatus = newRecord?.status;
                        if (oldStatus !== newStatus) {
                            const statusLabels = {
                                recibido: 'Recibido por el laboratorio',
                                cad_cam: 'En diseño CAD/CAM',
                                ceramica: 'En cerámica',
                                listo: 'Listo para despacho',
                                despachado: 'Despachado',
                            };
                            addNotification({
                                id: `lab-status-${newRecord.id}-${newStatus}-${Date.now()}`,
                                type: 'lab_status',
                                title: `Trabajo actualizado: ${statusLabels[newStatus] || newStatus}`,
                                body: `"${data.workType || 'Trabajo'}" de ${data.patientName || 'Paciente'} — ${statusLabels[newStatus] || newStatus}`,
                                timestamp: new Date().toISOString(),
                                read: false,
                                icon: newStatus === 'despachado' ? '🚚' : newStatus === 'listo' ? '✅' : '⚙️',
                            });
                        }
                    }
                }
            )

            // ── Nuevas citas agendadas ──────────────────────────────────
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'appointments',
                    filter: `admin_email=eq.${clinicOwner}`,
                },
                (payload) => {
                    const data = payload.new?.data || {};
                    addNotification({
                        id: `appt-${payload.new?.id}-${Date.now()}`,
                        type: 'appointment_new',
                        title: 'Nueva cita agendada',
                        body: `${data.name || 'Paciente'} — ${data.date || ''} ${data.time || ''}`.trim(),
                        timestamp: new Date().toISOString(),
                        read: false,
                        icon: '📅',
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Canal de notificaciones activo');
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [session?.user?.email, clinicOwner, supabase, addNotification]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const markRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return { notifications, unreadCount, markAllRead, markRead, clearAll };
}

/**
 * useLabRealtimeNotifications
 * ===========================
 * Versión para el portal de laboratorio.
 * Escucha nuevas órdenes asignadas al laboratorio.
 */
export function useLabRealtimeNotifications(supabase, session) {
    const [notifications, setNotifications] = useState([]);
    const channelRef = useRef(null);
    const labEmail = session?.user?.email;

    const addNotification = useCallback((notif) => {
        setNotifications(prev => {
            if (prev.some(n => n.id === notif.id)) return prev;
            return [notif, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
    }, []);

    useEffect(() => {
        if (!labEmail) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`lab-notifications-${labEmail}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'lab_works',
                    filter: `lab_email=eq.${labEmail}`,
                },
                (payload) => {
                    const data = payload.new?.data || {};
                    addNotification({
                        id: `lab-new-${payload.new?.id}-${Date.now()}`,
                        type: 'new_order',
                        title: '¡Nueva orden recibida!',
                        body: `${data.workType || 'Trabajo'} para ${data.patientName || 'Paciente'} — Entrega: ${data.expectedDate || 'Sin fecha'}`,
                        timestamp: new Date().toISOString(),
                        read: false,
                        icon: '🔬',
                    });
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [labEmail, supabase, addNotification]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const markAllRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);
    const markRead = useCallback((id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);

    return { notifications, unreadCount, markAllRead, markRead };
}
