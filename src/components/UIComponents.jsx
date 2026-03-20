import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { Loader, BarChart2 } from 'lucide-react';
import { THEMES } from '../constants';

// --- TARJETA BASE ---
export const Card = ({ children, className = "", theme, ...props }) => { 
    const t = THEMES[theme] || THEMES.dark; 
    return <div {...props} className={`p-6 rounded-3xl transition-all relative ${t.card} ${className}`}>{children}</div>; 
};

// --- BOTÓN PRINCIPAL ---
export const Button = ({ onClick, children, variant = "primary", className = "", theme, disabled }) => { 
    const t = THEMES[theme] || THEMES.dark; 
    const styles = { primary: `${t.gradient} text-white shadow-lg`, secondary: t.buttonSecondary }; 
    return <button disabled={disabled} onClick={onClick} className={`p-3 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>; 
};

// --- INPUT DINÁMICO ---
export const InputField = ({ label, icon: Icon, theme, textarea, ...props }) => { 
    const t = THEMES[theme] || THEMES.dark; 
    return (
        <div className="w-full">
            {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 ${t.subText}`}>{label}</label>}
            <div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>
                {Icon && <Icon size={16} className={`mr-2 mt-0.5 ${t.subText}`}/>}
                {textarea ? 
                    <textarea {...props} rows="3" className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`}/> : 
                    <input {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${t.text}`}/>
                }
            </div>
        </div>
    ); 
};

// --- PANEL DE FIRMA DIGITAL ---
export const SignaturePad = ({ onSave, onCancel, theme }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    useEffect(() => { 
        const canvas = canvasRef.current; 
        if (canvas) { 
            canvas.width = canvas.offsetWidth; 
            canvas.height = canvas.offsetHeight; 
            const ctx = canvas.getContext('2d'); 
            ctx.strokeStyle = theme === 'dark' || theme === 'blue' ? '#fff' : '#000'; 
            ctx.lineWidth = 2; 
            ctx.lineCap = 'round'; 
        } 
    }, [theme]);
    
    const startDrawing = (e) => { const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); const { x, y } = getCoords(e); ctx.moveTo(x, y); setIsDrawing(true); };
    const draw = (e) => { if (!isDrawing) return; const ctx = canvasRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); };
    const getCoords = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: clientX - rect.left, y: clientY - rect.top }; };
    
    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20 touch-none h-48 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={()=>setIsDrawing(false)}/>
                <div className="absolute bottom-2 right-2 text-[10px] opacity-30 pointer-events-none text-white">Firme aquí</div>
            </div>
            <div className="flex gap-2">
                <button onClick={()=>onSave(canvasRef.current.toDataURL())} className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-bold">Confirmar</button>
                <button onClick={onCancel} className="p-3 rounded-xl bg-white/10 text-xs">Cancelar</button>
            </div>
        </div>
    );
};

// --- GRÁFICO FINANCIERO (Sin Emojis) ---
export const SimpleLineChart = ({ data }) => {
    if (!data || data.length === 0 || data.every(d => !d.ingresos || d.ingresos === 0)) {
        return (
            <div className="w-full h-[250px] flex flex-col items-center justify-center text-stone-400/50 border border-white/5 rounded-3xl bg-black/5 dark:bg-white/5">
                <BarChart2 size={48} className="mb-3 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-500">Sin datos financieros</p>
                <p className="text-[10px] mt-1 font-bold">Registra tratamientos completados para ver la gráfica</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#06b6d4' }} />
                <Line type="monotone" dataKey="ingresos" stroke="#06b6d4" strokeWidth={4} dot={{ r: 4, fill: '#0a0a0a', stroke: '#06b6d4', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};