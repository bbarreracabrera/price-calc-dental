import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function MPOAuthCallback() {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Conectando con MercadoPago...');

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const error = params.get('error');

            if (error) {
                setStatus('error');
                setMessage('Conexión cancelada o falló: ' + error);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('No se recibió el código de autorización.');
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.email) {
                setStatus('error');
                setMessage('Debes estar logueado para conectar MercadoPago.');
                return;
            }

            try {
                const { data, error: invokeError } = await supabase.functions.invoke(
                    'mp-oauth-exchange',
                    { body: { code, user_email: session.user.email } }
                );

                if (invokeError || data?.error) {
                    setStatus('error');
                    setMessage(data?.error || invokeError?.message || 'Error al conectar con MercadoPago.');
                    return;
                }

                setStatus('success');
                setMessage('MercadoPago conectado exitosamente. Redirigiendo...');
                setTimeout(() => { window.location.href = '/?tab=settings'; }, 2000);

            } catch (err) {
                setStatus('error');
                setMessage('Error inesperado: ' + err.message);
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] border border-[#DFD2C4]/50 p-10 w-full max-w-md shadow-2xl text-center">
                {status === 'loading' && (
                    <>
                        <Loader size={48} className="text-[#5B6651] animate-spin mx-auto mb-5" />
                        <h1 className="text-xl font-black text-[#312923] tracking-tight mb-2">Conectando...</h1>
                        <p className="text-sm font-bold text-[#9A8F84]">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle size={48} className="text-[#5B6651] mx-auto mb-5" />
                        <h1 className="text-xl font-black text-[#312923] tracking-tight mb-2">¡Conectado!</h1>
                        <p className="text-sm font-bold text-[#9A8F84]">{message}</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={48} className="text-red-500 mx-auto mb-5" />
                        <h1 className="text-xl font-black text-[#312923] tracking-tight mb-2">Error de Conexión</h1>
                        <p className="text-sm font-bold text-[#9A8F84] mb-6">{message}</p>
                        <button
                            onClick={() => { window.location.href = '/?tab=settings'; }}
                            className="px-6 py-3 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20"
                        >
                            Volver a Configuración
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
