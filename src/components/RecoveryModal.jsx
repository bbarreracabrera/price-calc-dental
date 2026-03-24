import React from 'react';

export default function RecoveryModal({ 
    newPasswordInput, setNewPasswordInput, supabase, notify, setModal 
}) {
    const handleUpdate = async () => {
        if (newPasswordInput.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
        // Usamos supabase directamente
        const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
        
        if (error) {
            if(typeof notify === 'function') notify("Error al actualizar: " + error.message);
        } else {
            if(typeof notify === 'function') notify("¡Contraseña actualizada con éxito! Ya puedes usar el sistema.");
            setModal(null);
            setNewPasswordInput('');
            window.location.hash = ''; // Limpiamos la URL nativa
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#121212] border border-red-500/30 p-8 rounded-3xl w-full max-w-md text-white shadow-[0_0_50px_rgba(239,68,68,0.1)] relative">
                <h2 className="text-2xl font-black mb-2 text-amber-400">Actualiza tu Contraseña</h2>
                <p className="text-slate-400 text-sm mb-6">Por seguridad, debes establecer una nueva contraseña para tu cuenta ahora mismo antes de continuar.</p>
                
                <input 
                    type="password" 
                    placeholder="Nueva contraseña (mín. 6 caracteres)" 
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 outline-none mb-6 font-bold"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                />
                
                <button 
                    onClick={handleUpdate}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl transition-all shadow-lg active:scale-95"
                >
                    GUARDAR NUEVA CONTRASEÑA
                </button>
            </div>
        </div>
    );
}