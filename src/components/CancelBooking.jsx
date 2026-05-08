import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';

export default function CancelBooking() {
    const [status, setStatus] = useState('loading');
    const [appointment, setAppointment] = useState(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        const loadAppointment = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('cancel');

            if (!token) {
                setStatus('invalid');
                return;
            }

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .filter('data->>cancel_token', 'eq', token);

            if (error || !data || data.length === 0) {
                setStatus('not_found');
                return;
            }

            const appt = data[0];

            if (appt.data?.status === 'cancelled') {
                setStatus('already_cancelled');
                setAppointment(appt);
                return;
            }

            setAppointment(appt);
            setStatus('ready');
        };

        loadAppointment();
    }, []);

    const handleCancel = async () => {
        if (!appointment) return;
        setConfirming(true);

        const updatedData = {
            ...appointment.data,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('appointments')
            .update({ data: updatedData })
            .eq('id', appointment.id);

        setConfirming(false);

        if (error) {
            setStatus('error');
            return;
        }

        setStatus('cancelled');
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#DFD2C4]/60 p-8 w-full max-w-md shadow-xl text-center">
                {status === 'loading' && (
                    <>
                        <Loader size={48} className="text-[#5B6651] animate-spin mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923]">Cargando reserva...</h1>
                    </>
                )}

                {status === 'invalid' && (
                    <>
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923] mb-2">Link inválido</h1>
                        <p className="text-sm font-bold text-[#9A8F84]">El link de cancelación no es válido.</p>
                    </>
                )}

                {status === 'not_found' && (
                    <>
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923] mb-2">Reserva no encontrada</h1>
                        <p className="text-sm font-bold text-[#9A8F84]">
                            No encontramos la reserva. Puede que ya haya sido cancelada o el link haya expirado.
                        </p>
                    </>
                )}

                {status === 'already_cancelled' && (
                    <>
                        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923] mb-2">Ya cancelada</h1>
                        <p className="text-sm font-bold text-[#9A8F84]">Esta reserva ya estaba cancelada.</p>
                    </>
                )}

                {status === 'ready' && appointment && (
                    <>
                        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923] mb-2">¿Cancelar reserva?</h1>

                        <div className="bg-[#FDFBF7] rounded-2xl p-4 my-4 text-left space-y-3 border border-[#DFD2C4]/50">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Paciente</p>
                                <p className="font-black text-[#312923]">{appointment.data?.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Fecha y hora</p>
                                <p className="font-black text-[#312923]">{appointment.data?.date} — {appointment.data?.time}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Tratamiento</p>
                                <p className="font-bold text-[#312923]">{appointment.data?.treatment || 'Consulta'}</p>
                            </div>
                        </div>

                        <p className="text-sm font-bold text-[#9A8F84] mb-6">Esta acción no se puede deshacer.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 py-3 border border-[#DFD2C4] rounded-2xl font-black text-sm text-[#312923] hover:bg-[#FDFBF7] transition-colors"
                            >
                                Mantener
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={confirming}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-sm transition-colors disabled:opacity-50"
                            >
                                {confirming ? 'Cancelando...' : 'Sí, cancelar'}
                            </button>
                        </div>
                    </>
                )}

                {status === 'cancelled' && (
                    <>
                        <CheckCircle size={48} className="text-[#5B6651] mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923] mb-2">Reserva cancelada</h1>
                        <p className="text-sm font-bold text-[#9A8F84] mb-6">
                            Tu reserva ha sido cancelada exitosamente.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-3 bg-[#5B6651] hover:bg-[#4a5442] text-white rounded-2xl font-black text-sm transition-colors"
                        >
                            Volver al inicio
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#312923] mb-2">Error</h1>
                        <p className="text-sm font-bold text-[#9A8F84]">
                            No pudimos cancelar la reserva. Intenta más tarde o contacta a la clínica.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
