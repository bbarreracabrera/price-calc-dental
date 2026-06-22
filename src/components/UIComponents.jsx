import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { BarChart2, Trash2 } from 'lucide-react';

// --- TARJETA BASE ---
export const Card = ({ children, className = "", theme, onClick, ...props }) => { 
    return (
        <div 
            {...props} 
            onClick={onClick}
            // Bordes suaves y sombra tintada en oliva al hacer hover
            className={`p-6 bg-white rounded-[2rem] border border-[#DFD2C4]/50 transition-all duration-300 relative ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-[#CBAAA2] hover:-translate-y-0.5' : ''} ${className}`}
            style={{ boxShadow: onClick ? '' : '0 10px 25px -5px rgba(91, 102, 81, 0.06)' }}
        >
            {children}
        </div>
    ); 
};

// --- BOTÓN PRINCIPAL ---
export const Button = ({ onClick, children, variant = "primary", className = "", theme, disabled }) => { 
    const styles = { 
        // Botón principal: Verde Oliva Profundo
        primary: `bg-[#5B6651] hover:bg-[#4a5442] text-white shadow-sm hover:shadow-md`, 
        // Botón secundario: Fondo Crema, texto Topo, hover Rosa Suave
        secondary: `bg-[#FDFBF7] text-[#6B615A] hover:bg-[#CBAAA2]/10 hover:text-[#5B6651] border border-[#DFD2C4]`,
        danger: `bg-red-50 text-red-600 hover:bg-red-100 border border-red-100/50`,
        ghost: `bg-transparent text-[#9A8F84] hover:bg-[#DFD2C4]/20 hover:text-[#312923]`
    }; 
    
    const selectedStyle = styles[variant] || styles.primary;

    return (
        <button 
            disabled={disabled} 
            onClick={onClick} 
            className={`p-3.5 rounded-2xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${selectedStyle} ${className}`}
        >
            {children}
        </button>
    ); 
};

// --- INPUT DINÁMICO (CORREGIDO PARA SOPORTAR onBlur Y AUTOGUARDADO) ---
export const InputField = ({ label, icon: Icon, theme, textarea, className="", value, onChange, onBlur, ...props }) => { 
    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[11px] font-bold uppercase tracking-widest ml-1 text-[#9A8F84]">{label}</label>}
            <div className="relative group">
                {/* Icono cambia a Rosa al hacer focus */}
                {Icon && <Icon size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#DFD2C4] group-focus-within:text-[#CBAAA2] transition-colors" />}
                {textarea ? 
                    <textarea 
                        {...props} 
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur} // <-- CLAVE: Exponer el evento onBlur para el auto-guardado
                        rows="3" 
                        className={`w-full p-4 ${Icon ? 'pl-11' : 'pl-4'} rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-medium text-[#312923] resize-none text-sm`}
                    /> : 
                    <input 
                        {...props} 
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur} // <-- CLAVE: Exponer el evento onBlur para el auto-guardado
                        className={`w-full p-4 ${Icon ? 'pl-11' : 'pl-4'} rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-medium text-[#312923] text-sm`}
                    />
                }
            </div>
        </div>
    ); 
};

// --- PANEL DE FIRMA DIGITAL ---
export const SignaturePad = ({ onSignatureChange }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#312923';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches?.[0]?.clientX ?? e.clientX;
        const clientY = e.touches?.[0]?.clientY ?? e.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        if (!hasSignature) {
            setHasSignature(true);
            if (onSignatureChange) onSignatureChange(true);
        }
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        if (onSignatureChange) onSignatureChange(false);
    };

    SignaturePad.getSignature = () => canvasRef.current?.toDataURL('image/png');

    return (
        <div ref={containerRef} className="relative">
            <div className="border-2 border-dashed border-[#DFD2C4] rounded-2xl bg-white relative overflow-hidden">
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-[#9A8F84] text-sm italic">✍️ Firma aquí</p>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className="w-full touch-none cursor-crosshair"
                    style={{ height: 200 }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            {hasSignature && (
                <button
                    onClick={clearSignature}
                    className="mt-2 px-3 py-1.5 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl text-xs font-bold text-[#312923] hover:bg-[#DFD2C4]/30 flex items-center gap-1 transition-colors"
                >
                    <Trash2 size={12} /> Limpiar firma
                </button>
            )}
        </div>
    );
};

// --- GRÁFICO FINANCIERO ---
export const SimpleLineChart = ({ data }) => {
    if (!data || data.length === 0 || data.every(d => !d.ingresos || d.ingresos === 0)) {
        return (
            <div className="w-full h-[250px] flex flex-col items-center justify-center text-gray-400 border border-gray-100 rounded-3xl bg-gray-50">
                <BarChart2 size={48} className="mb-4 opacity-20 text-[#9CA3AF]" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Sin datos financieros</p>
                <p className="text-[11px] mt-1 font-medium text-gray-400">Registra tratamientos completados para ver la gráfica</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} fontWeight="600" />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} fontWeight="600" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    itemStyle={{ color: '#9CA3AF' }} 
                />
                <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#5B6651"
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#ffffff', stroke: '#9CA3AF', strokeWidth: 2 }} 
                    activeDot={{ r: 7, fill: '#9CA3AF', stroke: '#ffffff', strokeWidth: 3, boxShadow: '0 0 10px rgba(156,163,175,0.5)' }} 
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

// --- MODAL DE CONFIRMACIÓN (reemplaza window.confirm) ---
// Uso: <ConfirmModal title="..." message="..." onConfirm={fn} onCancel={fn} danger={bool} />
export const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-[2rem] shadow-2xl border border-[#DFD2C4]/50 p-8 max-w-sm w-full animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-black text-[#312923] tracking-tight mb-3">{title}</h3>
                {message && <p className="text-sm text-[#9A8F84] font-medium leading-relaxed mb-6">{message}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl border border-[#DFD2C4] text-[11px] font-black uppercase tracking-widest text-[#9A8F84] hover:bg-[#FDFBF7] transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            danger
                                ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'
                                : 'bg-[#5B6651] text-white hover:bg-[#4a5442]'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE TEXTO (reemplaza window.prompt) ---
// Uso: <PromptModal message="..." placeholder="..." value={str} onChange={fn} onSubmit={fn} onCancel={fn} />
export const PromptModal = ({ message, placeholder = '', value = '', onChange, onSubmit, onCancel, confirmLabel = 'Confirmar' }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-[2rem] shadow-2xl border border-[#DFD2C4]/50 p-8 max-w-sm w-full animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-black text-[#312923] tracking-tight mb-4">{message}</h3>
                <input
                    autoFocus
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onSubmit(); if (e.key === 'Escape') onCancel(); }}
                    placeholder={placeholder}
                    className="w-full p-4 rounded-2xl border border-[#DFD2C4] bg-[#FDFBF7] focus:bg-white focus:border-[#5B6651] focus:ring-4 focus:ring-[#5B6651]/20 outline-none transition-all font-medium text-[#312923] mb-6"
                />
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-[#DFD2C4] text-[11px] font-black uppercase tracking-widest text-[#9A8F84] hover:bg-[#FDFBF7] transition-all">Cancelar</button>
                    <button
                        onClick={onSubmit}
                        disabled={!value.trim()}
                        className="flex-1 py-3 rounded-2xl bg-[#5B6651] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#4a5442] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};
