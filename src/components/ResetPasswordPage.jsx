import React, { useState } from 'react';
import { supabase } from '../supabase';
import { CheckCircle } from 'lucide-react';

export default function ResetPasswordPage({ onComplete, linkError }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(linkError ? (linkError.isExpired ? 'El enlace ha expirado.' : 'El enlace no es válido.') : '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setSuccess(true);
        setTimeout(() => {
            if (onComplete) onComplete();
            else window.location.href = '/';
        }, 2000);
    };

    const inputClass = "w-full p-4 rounded-2xl bg-[#FBFAF8] border border-[#D9D2C7] outline-none font-bold text-[#241F1B] focus:border-[#46523C] transition-colors shadow-sm";
    const labelClass = "text-[11px] font-black uppercase tracking-widest text-[#5E554E] ml-1 mb-2 block";

    return (
        <div className="min-h-screen bg-[#FBFAF8] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#D9D2C7]/60 p-8 w-full max-w-md shadow-xl">
                <h1 className="text-2xl font-black text-[#241F1B] tracking-tighter mb-1">Nueva contraseña</h1>
                <p className="text-sm font-bold text-[#5E554E] mb-6">
                    {linkError ? 'Hubo un problema con tu solicitud.' : 'Ingresa tu nueva contraseña para acceder a tu cuenta.'}
                </p>

                {linkError ? (
                    <div className="space-y-6">
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                            <p className="text-sm font-bold text-red-600 mb-1">
                                {linkError.isExpired ? 'Enlace Expirado' : 'Enlace Inválido'}
                            </p>
                            <p className="text-xs text-red-500/80 leading-relaxed">
                                {linkError.isExpired 
                                    ? 'Por seguridad, los enlaces de recuperación expiran después de una hora.' 
                                    : 'Este enlace ya no es válido o ya fue utilizado.'}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full py-4 bg-[#241F1B] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#241F1B]/20"
                        >
                            Volver al inicio
                        </button>
                    </div>
                ) : success ? (
                    <div className="flex items-center gap-3 bg-[#46523C]/10 border border-[#46523C]/20 rounded-2xl p-4">
                        <CheckCircle size={20} className="text-[#46523C] shrink-0" />
                        <div>
                            <p className="font-black text-[#46523C]">¡Contraseña actualizada!</p>
                            <p className="text-sm font-bold text-[#5E554E] mt-0.5">Redirigiendo al inicio...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelClass}>Nueva contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClass}
                                placeholder="Mínimo 6 caracteres"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className={inputClass}
                                placeholder="Repite la contraseña"
                            />
                        </div>

                        {error && (
                            <p className="text-sm font-bold text-red-500 ml-1">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#241F1B] hover:bg-[#1a1512] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#241F1B]/20 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
