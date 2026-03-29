import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { BarChart2 } from 'lucide-react';

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

// --- INPUT DINÁMICO ---
export const InputField = ({ label, icon: Icon, theme, textarea, className="", ...props }) => { 
    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[11px] font-bold uppercase tracking-widest ml-1 text-[#9A8F84]">{label}</label>}
            <div className="relative group">
                {/* Icono cambia a Rosa al hacer focus */}
                {Icon && <Icon size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#DFD2C4] group-focus-within:text-[#CBAAA2] transition-colors" />}
                {textarea ? 
                    <textarea 
                        {...props} 
                        rows="3" 
                        className={`w-full p-4 ${Icon ? 'pl-11' : 'pl-4'} rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-medium text-[#312923] resize-none text-sm`}
                    /> : 
                    <input 
                        {...props} 
                        className={`w-full p-4 ${Icon ? 'pl-11' : 'pl-4'} rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] focus:bg-white focus:border-[#CBAAA2] focus:ring-4 focus:ring-[#CBAAA2]/10 outline-none transition-all font-medium text-[#312923] text-sm`}
                    />
                }
            </div>
        </div>
    ); 
};

// --- PANEL DE FIRMA DIGITAL (Adaptado a Paleta Terrosa) ---
export const SignaturePad = ({ onSave, onCancel, theme }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    useEffect(() => { 
        const canvas = canvasRef.current; 
        if (canvas) { 
            canvas.width = canvas.offsetWidth; 
            canvas.height = canvas.offsetHeight; 
            const ctx = canvas.getContext('2d'); 
            // CAMBIO AQUÍ: La firma ahora es el gris verdoso oscuro profundo de la paleta
            ctx.strokeStyle = '#374151'; 
            ctx.lineWidth = 3; 
            ctx.lineCap = 'round'; 
            ctx.lineJoin = 'round';
        } 
    }, []);
    
    const startDrawing = (e) => { const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); const { x, y } = getCoords(e); ctx.moveTo(x, y); setIsDrawing(true); };
    const draw = (e) => { if (!isDrawing) return; const ctx = canvasRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); };
    const getCoords = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: clientX - rect.left, y: clientY - rect.top }; };
    
    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl overflow-hidden bg-[#E5E7EB]/50 touch-none h-48 relative hover:bg-[#E5E7EB] transition-colors">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={()=>setIsDrawing(false)}/>
                <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest opacity-40 pointer-events-none text-[#4B5563]">Firme Aquí</div>
            </div>
            <div className="flex gap-3">
                <Button onClick={()=>onSave(canvasRef.current.toDataURL())} variant="primary" className="flex-1">Confirmar Firma</Button>
                <Button onClick={onCancel} variant="ghost" className="px-6">Cancelar</Button>
            </div>
        </div>
    );
};

// --- GRÁFICO FINANCIERO (Adaptado a Paleta Terrosa) ---
export const SimpleLineChart = ({ data }) => {
    if (!data || data.length === 0 || data.every(d => !d.ingresos || d.ingresos === 0)) {
        return (
            <div className="w-full h-[250px] flex flex-col items-center justify-center text-gray-400 border border-gray-100 rounded-3xl bg-gray-50">
                {/* CAMBIO AQUÍ: Icono en el marrón topo premium */}
                <BarChart2 size={48} className="mb-4 opacity-20 text-[#9CA3AF]" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Sin datos financieros</p>
                <p className="text-[11px] mt-1 font-medium text-gray-400">Registra tratamientos completados para ver la gráfica</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* Grilla gris muy clara */}
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                {/* Textos de los ejes en gris medio */}
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} fontWeight="600" />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} fontWeight="600" />
                {/* Tooltip con fondo blanco y sombra suave */}
                <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    // CAMBIO AQUÍ: Título en el marrón topo premium de Apple
                    itemStyle={{ color: '#9CA3AF' }} 
                />
                {/* Línea en el marrón topo premium de Apple con puntos interactivos */}
                <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    // CAMBIO AQUÍ: La línea es el marrón topo premium de Apple
                    stroke="#9CA3AF" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#ffffff', stroke: '#9CA3AF', strokeWidth: 2 }} 
                    activeDot={{ r: 7, fill: '#9CA3AF', stroke: '#ffffff', strokeWidth: 3, boxShadow: '0 0 10px rgba(156,163,175,0.5)' }} 
                />
            </LineChart>
        </ResponsiveContainer>
    );
};