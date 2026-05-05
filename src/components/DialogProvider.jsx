import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

const DialogContext = createContext({
    confirm: () => Promise.resolve(false),
    prompt: () => Promise.resolve(null),
});

export const useDialog = () => useContext(DialogContext);

function ConfirmDialog({ message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[200] bg-[#312923]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white border border-[#DFD2C4]/50 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-amber-500" />
                    </div>
                    <p className="text-sm font-bold text-[#6B615A] leading-relaxed whitespace-pre-line pt-2">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] border border-[#DFD2C4] hover:bg-[#F5EFE8] transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PromptDialog({ message, defaultValue = '', placeholder = '', confirmText = 'Aceptar', cancelText = 'Cancelar', onConfirm, onCancel }) {
    const [value, setValue] = useState(defaultValue);
    return (
        <div className="fixed inset-0 z-[200] bg-[#312923]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white border border-[#DFD2C4]/50 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <p className="text-sm font-bold text-[#6B615A] leading-relaxed mb-5">{message}</p>
                <input
                    autoFocus
                    className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors mb-5"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onConfirm(value || null);
                        if (e.key === 'Escape') onCancel();
                    }}
                />
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] border border-[#DFD2C4] hover:bg-[#F5EFE8] transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(value || null)}
                        className="flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-[#312923] hover:bg-[#1a1512] transition-all shadow-lg shadow-[#312923]/20"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DialogProvider({ children }) {
    const [confirmState, setConfirmState] = useState(null);
    const [promptState, setPromptState] = useState(null);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmState({ message, options, resolve });
        });
    }, []);

    const prompt = useCallback((message, defaultValue = '', options = {}) => {
        return new Promise((resolve) => {
            setPromptState({ message, defaultValue, options, resolve });
        });
    }, []);

    return (
        <DialogContext.Provider value={{ confirm, prompt }}>
            {children}
            {confirmState && (
                <ConfirmDialog
                    message={confirmState.message}
                    {...confirmState.options}
                    onConfirm={() => { confirmState.resolve(true); setConfirmState(null); }}
                    onCancel={() => { confirmState.resolve(false); setConfirmState(null); }}
                />
            )}
            {promptState && (
                <PromptDialog
                    message={promptState.message}
                    defaultValue={promptState.defaultValue}
                    {...promptState.options}
                    onConfirm={(val) => { promptState.resolve(val); setPromptState(null); }}
                    onCancel={() => { promptState.resolve(null); setPromptState(null); }}
                />
            )}
        </DialogContext.Provider>
    );
}
