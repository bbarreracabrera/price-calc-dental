import React, { useState } from 'react';
import { supabase } from '../supabase';
import { CheckCircle } from 'lucide-react';

export default function ResetPasswordPage({ onComplete }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

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

    const inputClass = "w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-1 mb-2 block";

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#DFD2C4]/60 p-8 w-full max-w-md shadow-xl">
                <h1 className="text-2xl font-black text-[#312923] tracking-tighter mb-1">Nueva contraseña</h1>
                <p className="text-sm font-bold text-[#9A8F84] mb-6">
                    Ingresa tu nueva contraseña para acceder a tu cuenta.
                </p>

                {success ? (
                    <div className="flex items-center gap-3 bg-[#5B6651]/10 border border-[#5B6651]/20 rounded-2xl p-4">
                        <CheckCircle size={20} className="text-[#5B6651] shrink-0" />
                        <div>
                            <p className="font-black text-[#5B6651]">¡Contraseña actualizada!</p>
                            <p className="text-sm font-bold text-[#9A8F84] mt-0.5">Redirigiendo al inicio...</p>
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
                            className="w-full py-4 bg-[#312923] hover:bg-[#1a1512] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#312923]/20 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
