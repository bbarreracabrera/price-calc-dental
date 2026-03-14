import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx'; 
import { 
  Calculator, User, Share2, X, Settings, 
  Library, Plus, Trash2, Save, History, Search, 
  Moon, Sun, TrendingUp, Cloud, Diamond, FileSpreadsheet, 
  Stethoscope, FileText, CalendarClock, Menu, ArrowLeft,
  Mail, Upload, Image as ImageIcon, Wallet, 
  Activity, Check, FileQuestion, Camera, Lock, Printer, LogOut,
  ArrowRight, Star, Droplets, FileBarChart, MapPin, Phone, AlertCircle,
  ChevronLeft, ChevronRight, Users, Clock, DollarSign, PenTool, FileSignature, Edit3, Loader, TrendingDown, CreditCard, Banknote, Box, Minus, AlertTriangle, Shield, Mic, MicOff, MessageCircle,
  BarChart2, PieChart, EyeOff, FileLock , FlaskConical 
} from 'lucide-react';
import { supabase } from './supabase';
import LegalText from './LegalText';
import LandingPage from './LandingPage';
import CatalogModal from './CatalogModal';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { Toaster, toast } from 'react-hot-toast';

// --- CONFIGURACIÓN BASE ---
const CONSENT_TEMPLATES = {
  general: { title: "Consentimiento General", text: "Autorizo al Dr/a. a realizar los exámenes y tratamientos dentales necesarios. Entiendo que la odontología no es una ciencia exacta y que no se pueden garantizar resultados. Me comprometo a seguir las indicaciones y asistir a mis citas." },
  exodoncia: { title: "Consentimiento Exodoncia", text: "Doy mi consentimiento para la extracción del diente indicado. He sido informado de los riesgos (dolor, infección, inflamación, parestesia) y beneficios. Autorizo el uso de anestesia local y acepto las instrucciones post-operatorias." },
  endo: { title: "Consentimiento Endodoncia", text: "Entiendo que el tratamiento de conducto busca salvar el diente, pero puede fallar, requerir retratamiento o cirugía. Conozco los riesgos de fractura instrumental o perforación. Acepto el procedimiento." }
};

const ANAMNESIS_TAGS = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Embarazo', 'Fumador', 'Coagulopatía', 'Epilepsia', 'Toma Medicamentos'];

const THEMES = {
  dark: { bg: 'bg-[#050505]', text: 'text-white', card: 'bg-[#121212]/90 border border-white/10 shadow-2xl', accent: 'text-[#D4AF37]', accentBg: 'bg-[#D4AF37]', inputBg: 'bg-white/5 border-white/5 focus-within:border-[#D4AF37]', subText: 'text-stone-400', gradient: 'bg-gradient-to-br from-[#D4AF37] to-[#B69121]', buttonSecondary: 'bg-white/5 border-white/10 text-white' },
  light: { bg: 'bg-[#FAFAFA]', text: 'text-stone-800', card: 'bg-white border-stone-200 shadow-xl', accent: 'text-amber-600', accentBg: 'bg-amber-500', inputBg: 'bg-stone-100 focus-within:bg-white focus-within:border-amber-500', subText: 'text-stone-500', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', buttonSecondary: 'bg-stone-100 border-stone-200 text-stone-600' },
  blue: { bg: 'bg-[#0a192f]', text: 'text-white', card: 'bg-[#112240]/90 border-cyan-500/20 shadow-cyan-900/20 shadow-2xl', accent: 'text-cyan-400', accentBg: 'bg-cyan-500', inputBg: 'bg-[#1d2d50] border-transparent focus-within:border-cyan-400', subText: 'text-slate-400', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-600', buttonSecondary: 'bg-white/5 border-white/10 text-cyan-400' }
};

// --- COMPONENTE DE GRÁFICO (CON PROTECCIÓN ANTI-NaN) ---
const SimpleLineChart = ({ data }) => {
    // 1. EL ESCUDO: Si no hay datos, o todos los ingresos están en 0, no dibujamos el SVG
    if (!data || data.length === 0 || data.every(d => !d.ingresos || d.ingresos === 0)) {
        return (
            <div className="w-full h-[250px] flex flex-col items-center justify-center text-stone-400/50 border border-white/5 rounded-3xl bg-black/5 dark:bg-white/5">
                <span className="text-4xl mb-3 opacity-50">📊</span>
                <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-500">Sin datos financieros</p>
                <p className="text-[10px] mt-1 font-bold">Registra tratamientos completados para ver la gráfica</p>
            </div>
        );
    }

    // 2. Si hay datos reales, renderizamos el gráfico normal
    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#06b6d4' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#06b6d4" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#0a0a0a', stroke: '#06b6d4', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} 
                />
            </LineChart>
        </ResponsiveContainer>
    );
};;

// --- COMPONENTES UI ---
const SignaturePad = ({ onSave, onCancel, theme }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  useEffect(() => { const canvas = canvasRef.current; if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; const ctx = canvas.getContext('2d'); ctx.strokeStyle = theme === 'dark' || theme === 'blue' ? '#fff' : '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; } }, [theme]);
  const startDrawing = (e) => { const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); const { x, y } = getCoords(e); ctx.moveTo(x, y); setIsDrawing(true); };
  const draw = (e) => { if (!isDrawing) return; const ctx = canvasRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); };
  const getCoords = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: clientX - rect.left, y: clientY - rect.top }; };
  return (<div className="space-y-4"><div className="border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20 touch-none h-48 relative"><canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={()=>setIsDrawing(false)}/><div className="absolute bottom-2 right-2 text-[10px] opacity-30 pointer-events-none text-white">Firme aquí</div></div><div className="flex gap-2"><button onClick={()=>onSave(canvasRef.current.toDataURL())} className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-bold">Confirmar</button><button onClick={onCancel} className="p-3 rounded-xl bg-white/10 text-xs">Cancelar</button></div></div>);
};

// --- NUEVO MOTOR GRÁFICO DEL ODONTOGRAMA (5 CARAS SVG + LÓGICA ANATÓMICA) ---
const ToothSVG = ({ number, faces, status, mode, treatment, size = 42, interactive = false, activeFace = 'o', onFaceClick }) => {
    // Colores Clínicos Reales
    const getDiagnosticColor = (f) => {
        if (f === 'caries') return '#ef4444'; 
        if (f === 'filled') return '#3b82f6'; 
        return 'transparent';
    };

    // Si está en "Modo Tratamiento", pintamos las caras según el presupuesto
    const getTreatmentColor = () => {
        if (treatment?.status === 'planned') return '#ef4444'; 
        if (treatment?.status === 'completed') return '#10b981'; 
        return 'transparent';
    };

    const isMissing = status === 'missing';
    const isCrown = status === 'crown';
    
    // Asignador inteligente de colores
    const getFaceColor = (faceId) => {
        if (isMissing) return 'transparent';
        if (isCrown) return '#eab308'; 
        if (mode === 'tratamientos' && treatment && treatment.name) return getTreatmentColor();
        return getDiagnosticColor(faces?.[faceId]);
    };

    const strokeColor = interactive ? '#888' : '#666'; 

    // --- MAGIA ANATÓMICA: ESPEJO MESIAL/DISTAL ---
    const num = parseInt(number, 10);
    // Cuadrantes 1 y 4 (Derecha del paciente)
    const isRightQuadrant = (num >= 11 && num <= 18) || (num >= 41 && num <= 48);
    
    // Asignación de caras físicas izquierda/derecha según el cuadrante
    const leftFaceId = isRightQuadrant ? 'd' : 'm';
    const rightFaceId = isRightQuadrant ? 'm' : 'd';

    // Constructor de las caras del diente
    const Face = ({ id, points }) => (
        <polygon 
            points={points} 
            fill={getFaceColor(id)} 
            stroke={strokeColor} 
            strokeWidth="4" 
            className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:fill-black/20 dark:hover:fill-white/20' : ''} ${interactive && activeFace === id && !isMissing && !isCrown ? 'stroke-cyan-500 stroke-[8px]' : ''}`}
            onClick={(e) => { if(interactive && onFaceClick) { e.stopPropagation(); onFaceClick(id); } }}
            style={{ zIndex: interactive && activeFace === id ? 10 : 1 }}
        />
    );

    return (
        <div className="relative flex flex-col items-center" style={{ width: size, height: size + 20 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
                <Face id="v" points="0,0 100,0 75,25 25,25" /> {/* Superior */}
                <Face id="l" points="0,100 25,75 75,75 100,100" /> {/* Inferior */}
                
                {/* Caras Laterales Inteligentes */}
                <Face id={leftFaceId} points="0,0 25,25 25,75 0,100" /> {/* Izquierda del dibujo */}
                <Face id={rightFaceId} points="100,0 75,25 75,75 100,100" /> {/* Derecha del dibujo */}
                
                <Face id="o" points="25,25 75,25 75,75 25,75" /> {/* Centro */}
            </svg>
            
            {/* Cruz si está extraído */}
            {isMissing && <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none text-red-500 font-black text-5xl opacity-80" style={{ height: size }}>X</div>}
            
            {/* Número del diente */}
            <span className={`text-[11px] font-black mt-1 ${mode === 'tratamientos' && treatment?.name ? 'text-emerald-500' : 'opacity-60 text-stone-500 dark:text-white'}`}>{number}</span>
        </div>
    );
};

// --- COMPONENTE DIENTE ACTUALIZADO (Soporta múltiples caras en Perio) ---
const Tooth = ({ number, status, onClick, theme, isPerioMode, perioData, data, mode, perioFace = 'v' }) => {
    // Alertas Perio
    const hasBOP = perioData && Object.values(perioData.bop || {}).some(v => v === true);
    const hasPus = perioData?.pus;
    const hasAlert = (perioData?.mobility > 0) || (perioData?.furcation > 0);

    // 1. COMPORTAMIENTO MODO PERIODONCIA (Gráfico Continuo Multi-Cara)
    if (isPerioMode) {
        const isMissing = status === 'missing' || data?.status === 'missing';
        
        if (isMissing) {
            return (
                <div className="flex flex-col items-center gap-1 opacity-20 pointer-events-none grayscale relative p-1 w-[40px]">
                    <svg viewBox="0 0 100 80" className="w-full h-12 mt-1">
                        <path d="M 15,25 Q 50,-5 85,25 L 80,75 Q 50,90 20,75 Z" fill="#000" />
                    </svg>
                    <span className="text-[9px] font-bold absolute bottom-0 bg-black text-white px-1 rounded">AUS</span>
                </div>
            );
        }

        const getY = (val) => 30 + ((parseInt(val) || 0) * 5); 
        const isLeftQuad = number >= 20 && number < 40; 
        
        // Asignación inteligente de datos según la cara
        let kLeft, kRight, kCenter;
        if (perioFace === 'v') {
            kCenter = 'v';
            kLeft = isLeftQuad ? 'vm' : 'vd';
            kRight = isLeftQuad ? 'vd' : 'vm';
        } else {
            kCenter = 'l'; // Palatino o Lingual usan la misma letra en tu base de datos
            kLeft = isLeftQuad ? 'lm' : 'ld';
            kRight = isLeftQuad ? 'ld' : 'lm';
        }

        const mgL = getY(perioData?.mg?.[kLeft]);
        const mgC = getY(perioData?.mg?.[kCenter]);
        const mgR = getY(perioData?.mg?.[kRight]);
        
        const pdL = getY((parseInt(perioData?.mg?.[kLeft]) || 0) + (parseInt(perioData?.pd?.[kLeft]) || 0));
        const pdC = getY((parseInt(perioData?.mg?.[kCenter]) || 0) + (parseInt(perioData?.pd?.[kCenter]) || 0));
        const pdR = getY((parseInt(perioData?.mg?.[kRight]) || 0) + (parseInt(perioData?.pd?.[kRight]) || 0));

        const hasData = perioData?.pd?.[kLeft] || perioData?.pd?.[kCenter] || perioData?.pd?.[kRight];

        return (
            <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative p-0.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 w-[44px]">
                
                {/* Alertas flotantes (solo en Vestibular para no duplicar basura visual) */}
                {perioFace === 'v' && (
                    <div className="absolute -top-1 flex gap-1 z-20">
                        {hasBOP && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"/>}
                        {hasPus && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_5px_yellow]"/>}
                        {hasAlert && <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white font-black shadow-md">!</div>}
                    </div>
                )}
                
                {/* Etiqueta V/P/L chiquita */}
                <span className="text-[7px] font-black opacity-30 absolute top-0 left-0 bg-black/10 px-1 rounded">
                    {perioFace === 'v' ? 'V' : (number < 30 ? 'P' : 'L')}
                </span>

                <svg viewBox="0 0 100 80" className="w-full h-12 drop-shadow-sm mt-2 overflow-visible">
                    <path d="M 15,25 Q 50,-5 85,25 L 80,75 Q 50,90 20,75 Z" fill={theme === 'light' ? '#e5e7eb' : '#374151'} fillOpacity={0.6} />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="2" strokeDasharray="4" opacity="0.3" />
                    
                    {hasData && (
                        <>
                            <polygon points={`0,${mgL} 50,${mgC} 100,${mgR} 100,${pdR} 50,${pdC} 0,${pdL}`} fill="#ef4444" fillOpacity="0.4" />
                            <polyline points={`0,${mgL} 50,${mgC} 100,${mgR}`} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points={`0,${pdL} 50,${pdC} 100,${pdR}`} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                    )}
                </svg>
                <span className="text-[9px] font-bold opacity-50 mt-1">{number}</span>
            </div>
        );
    }
    
    // 2. COMPORTAMIENTO MODO CLÍNICO (Nuevo Odontograma SVG 5 Caras)
    return (
        <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
            <ToothSVG 
                number={number} // Usamos la variable 'number' que recibe el componente
                faces={data?.faces} // Las caras vienen del objeto 'data'
                status={status || data?.status} // El estado puede venir en 'status' o 'data.status'
                mode={mode}
                treatment={data?.treatment}
                size={40} 
            />
        </div>
    );
};
// --- NUEVO COMPONENTE: CÉLULA DE HIGIENE O'LEARY CIRCULAR ---
const HygieneCell = ({ tooth, data = {}, onChange }) => {
    // Caras estándar de O'Leary: v (vestibular), l (lingual/palatino), m (mesial), d (distal)
    const isUpper = tooth < 30;
    
    return (
        <div className="flex flex-col items-center gap-1.5 p-1">
            <span className="text-[10px] font-black opacity-50">{tooth}</span>
            
            {/* Contenedor circular rotado 45 grados */}
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white/10 relative transform rotate-45 shadow-inner bg-black/40 hover:border-cyan-500/50 transition-colors">
                
                {/* Cuadrícula 2x2 interna */}
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-black">
                    {/* Top-Left (Al rotar queda Arriba = Vestibular) */}
                    <button 
                        onClick={() => onChange('v')} 
                        className={`w-full h-full transition-all hover:opacity-80 ${data.v ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                        title="Vestibular"
                    />
                    {/* Top-Right (Al rotar queda a la Derecha = Mesial/Distal) */}
                    <button 
                        onClick={() => onChange('m')} 
                        className={`w-full h-full transition-all hover:opacity-80 ${data.m ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                        title="Mesial"
                    />
                    {/* Bottom-Left (Al rotar queda a la Izquierda = Distal/Mesial) */}
                    <button 
                        onClick={() => onChange('d')} 
                        className={`w-full h-full transition-all hover:opacity-80 ${data.d ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                        title="Distal"
                    />
                    {/* Bottom-Right (Al rotar queda Abajo = Palatino/Lingual) */}
                    <button 
                        onClick={() => onChange('l')} 
                        className={`w-full h-full transition-all hover:opacity-80 ${data.l ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                        title={isUpper ? "Palatino" : "Lingual"}
                    />
                </div>

                {/* Centro del diente (Punto decorativo) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full z-10"></div>
            </div>
        </div>
    );
};
const Card = ({ children, className = "", theme, ...props }) => { const t = THEMES[theme] || THEMES.dark; return <div {...props} className={`p-6 rounded-3xl transition-all relative ${t.card} ${className}`}>{children}</div>; };
const Button = ({ onClick, children, variant = "primary", className = "", theme, disabled }) => { const t = THEMES[theme] || THEMES.dark; const styles = { primary: `${t.gradient} text-white shadow-lg`, secondary: t.buttonSecondary }; return <button disabled={disabled} onClick={onClick} className={`p-3 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>; };
const InputField = ({ label, icon: Icon, theme, textarea, ...props }) => { const t = THEMES[theme] || THEMES.dark; return (<div className="w-full">{label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 ${t.subText}`}>{label}</label>}<div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>{Icon && <Icon size={16} className={`mr-2 mt-0.5 ${t.subText}`}/>}{textarea ? <textarea {...props} rows="3" className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`}/> : <input {...props} className={`bg-transparent outline-none w-full font-bold text-sm ${t.text}`}/>}</div></div>); };
// --- COMPONENTE DE SEGURIDAD: URLS FIRMADAS PARA BUCKET PRIVADO ---
const PrivateImage = ({ img, onClick }) => {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        let isMounted = true; // Escudo protector
        const fetchUrl = async () => {
            if (img.url && img.url.startsWith('http')) {
                if (isMounted) setSignedUrl(img.url);
                return;
            }
            
            const filePath = img.path || img.url; 
            const { data, error } = await supabase.storage.from('patient-images').createSignedUrl(filePath, 3600);
            
            if (isMounted && data) setSignedUrl(data.signedUrl);
            if (error) console.error("Error seguridad imagen:", error);
        };
        fetchUrl();
        return () => { isMounted = false; }; // Se limpia al cerrar
    }, [img]);

    if (!signedUrl) return <div className="w-full h-full flex items-center justify-center bg-black/10"><Loader className="animate-spin opacity-50" size={20}/></div>;

    const isPdf = signedUrl.toLowerCase().includes('.pdf');

    if (isPdf) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10" onClick={() => window.open(signedUrl, '_blank')}>
                <span className="text-4xl mb-2">📄</span>
                <span className="text-[10px] font-bold px-2 text-center opacity-50 break-all">Ver Documento</span>
            </div>
        );
    }

    return <img src={signedUrl} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => onClick(signedUrl)} />;
};
// --- PESTAÑA DE TÉRMINOS Y CONDICIONES ---
const TermsScreen = ({ theme }) => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
            <div className={`${theme.card} rounded-3xl p-6 md:p-10 shadow-xl border border-white/5`}>
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                    <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Términos de Uso y Servicio</h2>
                        <p className={`text-sm ${theme.subText}`}>Última actualización: 28-02-2026</p>
                    </div>
                </div>

                {/* AQUÍ LLAMAMOS AL TEXTO LEGAL CON EL TEMA DE LA APP */}
                <div className={theme.subText}>
                    <LegalText isDarkTheme={false} />
                </div>
            </div>
        </div>
    );
};


// 1. LA FÁBRICA DE PACIENTES (Va separada arriba)
const getPatient = (id) => {
    const existing = patientRecords[id];
    if (existing) return existing;

    const base = { 
        id, 
        personal: { legalName: "" }, 
        anamnesis: { recent: '', remote: '', conditions: {} }, 
        clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, 
        consents: [], 
        images: [] 
    };
    
    return base;
};

// 2. EL BUSCADOR INTELIGENTE (ASÍNCRONO - V79)
const PatientSelect = ({ theme, patients, onSelect, placeholder = "Buscar Paciente..." }) => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [dbResults, setDbResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Motor de búsqueda en la nube (Se activa cuando escribes más de 2 letras)
    useEffect(() => {
        if (query.length < 2) {
            setDbResults([]);
            return;
        }
        
        // Retrasamos la búsqueda medio segundo para no disparar 10 búsquedas si escriben rápido
        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            
            // Buscamos directamente dentro del JSON en Supabase
            const { data } = await supabase
                .from('patients')
                .select('id, data')
                .ilike('data->personal->>legalName', `%${query}%`)
                .limit(10); // Traemos máximo 10 coincidencias
            
            if (data) {
                // Los preparamos para que React los entienda
                const formatted = data.map(r => ({ ...r.data, id: r.id }));
                setDbResults(formatted);
            }
            setIsSearching(false);
        }, 500); 

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Combinamos los que ya tienes descargados con los que encontró en la nube
    const combinedResults = useMemo(() => { 
        if (!query) return []; 
        const local = Object.values(patients).filter(p => p.personal?.legalName?.toLowerCase().includes(query.toLowerCase())); 
        
        // Unimos y filtramos duplicados (por si ya lo tenías local)
        const all = [...local, ...dbResults];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        return unique;
    }, [query, patients, dbResults]);
    
    const t = THEMES[theme] || THEMES.dark;
    
    return (
        <div className="relative w-full z-20">
            <InputField theme={theme} icon={Search} placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
            {showResults && query && (
                <div className={`absolute left-0 right-0 top-full mt-2 rounded-xl border max-h-48 overflow-y-auto shadow-xl ${t.card}`}>
                    
                    {isSearching && <div className="p-3 text-xs opacity-50 text-center flex items-center justify-center gap-2"><Loader size={12} className="animate-spin"/> Buscando en servidor...</div>}
                    
                    {!isSearching && combinedResults.length > 0 ? combinedResults.map(p => (
                        <div key={p.id} onClick={() => { onSelect(p); setQuery(p.personal?.legalName); setShowResults(false); }} className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center">
                            <p className="font-bold text-sm">{p.personal?.legalName}</p>
                            {/* Le ponemos una etiqueta visual si lo trajo de la nube */}
                            {!patients[p.id] && <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-black tracking-widest">NUBE</span>}
                        </div>
                    )) : !isSearching && (
                        <div className="p-3 text-xs opacity-50">
                            No encontrado. <span className="underline cursor-pointer font-bold ml-1 text-cyan-400" onClick={()=>{ onSelect({id:'new', name: query}); setShowResults(false); }}>Crear "{query}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AuthScreen = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [msg, setMsg] = useState('');
 
  // TU LINK AUTOMÁTICO DE MERCADO PAGO
  const MP_SUBSCRIPTION_LINK = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f46b2675174844d09cb9f59000fadd5d";

  // Leemos la URL para saber si el dentista acaba de pagar
  const urlParams = new URLSearchParams(window.location.search);
  const vieneDePago = urlParams.get('pago') === 'exitoso';
  
  // Si viene de pagar, le abrimos el modo "Registro". Si no, modo "Login" normal.
  const [isSignUp, setIsSignUp] = useState(vieneDePago);

  const handleAuth = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setMsg(''); 
    try { 
      if (isSignUp) { 
        // Creación de cuenta (solo si viene de Mercado Pago)
        const { error } = await supabase.auth.signUp({ email, password }); 
        if (error) throw error; 
        
        setMsg('¡Clínica creada! Iniciando sesión...'); 
        
        // Iniciamos sesión automáticamente DESPUÉS de que se creó
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } else { 
        // Login normal
        const { error } = await supabase.auth.signInWithPassword({ email, password }); 
        if (error) throw error; 
      } 
    } catch (error) { 
      setMsg(error.message); 
    } finally { 
      setLoading(false); 
    } 
  };

  // 👉 1. PEGA ESTA NUEVA FUNCIÓN AQUÍ:
  const handleResetPassword = async () => {
    if (!email) {
      setMsg('Por favor, ingresa tu correo electrónico arriba.');
      return;
    }
    setLoading(true);
    setMsg('Enviando correo...');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, 
    });
    if (error) setMsg("Error: " + error.message);
    else setMsg("¡Te enviamos un enlace al correo!");
    setLoading(false);
  };
 
  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 z-[100]">
      <div className="w-full max-w-sm flex flex-col items-center">    
        {/* LOGO DORADO PREMIUM */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
          <Cloud className="text-white" size={36} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2">ShiningCloud</h1>
        
        {/* Mensaje dinámico dependiendo de si pagaron o no */}
        {vieneDePago ? (
            <p className="text-amber-400 text-sm mb-8 font-bold text-center">
                ¡Suscripción confirmada! 💳<br/>Crea tu contraseña para entrar.
            </p>
        ) : (
            <p className="text-slate-400 text-sm mb-8 text-center">Ingresa a tu clínica</p>
        )}

        <form onSubmit={handleAuth} className="w-full space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl relative">
          {msg && <div className="p-3 bg-white/10 border border-white/20 text-white text-xs rounded-xl text-center font-bold">{msg}</div>}
          
          <input type="email" placeholder="Email" className="w-full p-4 bg-black/40 rounded-xl text-white outline-none border border-white/10 focus:border-amber-500 transition-colors" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Clave (mín. 6 caracteres)" className="w-full p-4 bg-black/40 rounded-xl text-white outline-none border border-white/10 focus:border-amber-500 transition-colors" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
          {/* Aquí está tu input de contraseña actual */}

        {/* 👉 2. PEGA EL BOTÓN JUSTO DEBAJO DEL INPUT DE CONTRASEÑA */}
        {!isSignUp && (
    <button 
      type="button" 
      onClick={handleResetPassword} 
      disabled={loading}
      className="text-sm text-cyan-400 hover:text-cyan-300 text-left -mt-2 mb-2 w-fit transition-colors"
    >
      ¿Olvidaste tu contraseña?
    </button>
  )}
          
          <button disabled={loading} className="w-full p-4 bg-amber-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors">
            {loading ? 'Procesando...' : (isSignUp ? 'Crear Mi Clínica' : 'Entrar')}
          </button>
        </form>

        {/* Botón hacia Mercado Pago si intentan registrarse sin pagar */}
        {!vieneDePago && (
          <button 
            onClick={(e) => { e.preventDefault(); window.location.href = MP_SUBSCRIPTION_LINK; }} 
            className="mt-6 text-xs font-bold text-white/60 uppercase tracking-widest hover:text-amber-400 transition-all duration-300 text-center"
          >
            ¿No tienes cuenta? <br/>
            <span className="underline underline-offset-4 mt-2 inline-block">Probar 30 días gratis</span>
          </button>
        )}
      </div>
    </div>
  );
};

const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const DEFAULT_CATALOG = [
    // DIAGNÓSTICO Y PREVENCIÓN
    { name: 'Consulta de Diagnóstico', price: 25000 },
    { name: 'Consulta de Especialidad', price: 40000 },
    { name: 'Radiografía Retroalveolar', price: 10000 },
    { name: 'Aplicación de Flúor Barniz', price: 25000 },
    { name: 'Sellante (por diente)', price: 20000 },
    { name: 'Instrucción de Higiene Oral', price: 15000 },

    // OPERATORIA (TAPADURAS)
    { name: 'Restauración Resina Simple (1 Cara)', price: 35000 },
    { name: 'Restauración Resina Compuesta (2 Caras)', price: 45000 },
    { name: 'Restauración Resina Compleja (3 o más caras)', price: 55000 },
    { name: 'Reconstrucción Coronaria (Resina)', price: 70000 },
    { name: 'Incrustación Cerámica / Resina Indirecta', price: 150000 },

    // PERIODONCIA (ENCÍAS)
    { name: 'Limpieza (Destartraje y Profilaxis)', price: 45000 },
    { name: 'Pulido Radicular (por sextante)', price: 40000 },
    { name: 'Cirugía Periodontal (por sextante)', price: 120000 },
    { name: 'Gingivectomía (por diente)', price: 35000 },
    { name: 'Férula de Contención Periodontal', price: 60000 },

    // ENDODONCIA (TRATAMIENTOS DE CONDUCTO)
    { name: 'Endodoncia Unirradicular', price: 120000 },
    { name: 'Endodoncia Birradicular', price: 150000 },
    { name: 'Endodoncia Multirradicular (Molares)', price: 190000 },
    { name: 'Retratamiento Endodóntico (Recargo)', price: 50000 },
    { name: 'Urgencia Endodóntica (Trepanación)', price: 45000 },

    // CIRUGÍA E IMPLANTES
    { name: 'Extracción Simple', price: 40000 },
    { name: 'Extracción Compleja / A colgajo', price: 70000 },
    { name: 'Extracción Tercer Molar (Erupcionado)', price: 80000 },
    { name: 'Extracción Tercer Molar (Incluido/Semi-incluido)', price: 130000 },
    { name: 'Instalación Implante (Fase Quirúrgica)', price: 550000 },
    { name: 'Elevación de Seno Maxilar', price: 350000 },
    { name: 'Injerto Óseo (por sitio)', price: 200000 },

    // PRÓTESIS FIJA Y REMOVIBLE
    { name: 'Corona Provisoria de Acrílico', price: 50000 },
    { name: 'Perno Muñón Metálico / Fibra de Vidrio', price: 80000 },
    { name: 'Corona Metal Porcelana', price: 250000 },
    { name: 'Corona Zirconio', price: 350000 },
    { name: 'Prótesis Removible Acrílica (1 a 4 dientes)', price: 150000 },
    { name: 'Prótesis Removible Metálica (Un maxilar)', price: 350000 },
    { name: 'Prótesis Total Acrílica (Un maxilar)', price: 280000 },
    { name: 'Reparación de Prótesis (Fractura/Diente)', price: 45000 },
    { name: 'Rebasado de Prótesis', price: 60000 },

    // ORTODONCIA
    { name: 'Estudio de Ortodoncia (Modelos, Fotos, Cefalometría)', price: 60000 },
    { name: 'Instalación Brackets Metálicos (Arcada)', price: 250000 },
    { name: 'Instalación Brackets Estéticos (Arcada)', price: 400000 },
    { name: 'Control Mensual Ortodoncia', price: 35000 },
    { name: 'Contención Fija o Removible (Arcada)', price: 80000 },

    // ESTÉTICA Y TTM (BRUXISMO)
    { name: 'Blanqueamiento Led (Clínica)', price: 150000 },
    { name: 'Blanqueamiento Cubetas (Casa)', price: 120000 },
    { name: 'Carilla de Porcelana (por diente)', price: 280000 },
    { name: 'Plano de Relajación (Placa de Bruxismo)', price: 120000 },
    { name: 'Aplicación Toxina Botulínica (Bruxismo/Estética)', price: 180000 },

    // ODONTOPEDIATRÍA
    { name: 'Pulpotomía / Pulpectomía (Diente temporal)', price: 60000 },
    { name: 'Corona de Acero (Diente temporal)', price: 75000 },
    { name: 'Extracción Diente Temporal', price: 25000 },
    { name: 'Mantenedor de Espacio', price: 70000 }
];

const getLocalDate = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
};

const formatRUT = (rut) => {
    if (!rut) return '';
    // Quita todo lo que no sea número o la letra K
    let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length <= 1) return cleanRut;
    
    // Separa el dígito verificador del resto
    let result = cleanRut.slice(-1);
    let body = cleanRut.slice(0, -1);
    
    // Agrega los puntos cada 3 números
    let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedBody}-${result}`;
};
// --- APP ---
export default function App() {
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('sc_theme_mode') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quoteMode, setQuoteMode] = useState('calc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [perioData, setPerioData] = useState({});
  // --- NUEVOS ESTADOS DEL COTIZADOR ---
  const [quoteItems, setQuoteItems] = useState([]);
  const [newQuoteItem, setNewQuoteItem] = useState({ name: '', price: '', tooth: '' });
  const [catalog, setCatalog] = useState([]);
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', price: '', id: null });

  // DATA
  const [config, setConfigLocal] = useState({ logo: null, hourlyRate: 25000, profitMargin: 30, name: "Dr. Benjamín" });
  const [patientRecords, setPatientRecords] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]); 
  const [protocols, setProtocols] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [team, setTeam] = useState([]); 
  const [userRole, setUserRole] = useState('admin');
  const [clinicOwner, setClinicOwner] = useState('');

  // UI STATES
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTab, setPatientTab] = useState('personal');
  const [activeFormType, setActiveFormType] = useState('general');
  const [viewingForm, setViewingForm] = useState(null);
  const [sessionData, setSessionData] = useState({ patientName: '', clinicalTime: 60, baseCost: 0, patientId: null });
  const [prescription, setPrescription] = useState([]);
  const [medInput, setMedInput] = useState({ name: '', dosage: '' });
// --- ESTADO DE AGENDA ACTUALIZADO ---
  const [newAppt, setNewAppt] = useState({ name: '', treatment: '', date: '', time: '', duration: 60, status: 'agendado', id: null });  const [newPack, setNewPack] = useState({ name: '', items: [] });
  const [newPackItem, setNewPackItem] = useState({ name: '', cost: '' });
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [modal, setModal] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // PERIO & CONSENT & IMAGES & ODONTOGRAMA PRO
  // --- NUEVO ESTADO PARA EL MODO ODONTOGRAMA ---
  const [odontogramMode, setOdontogramMode] = useState('hallazgos');
  // Actualizamos toothModalData para incluir datos de tratamiento
  const [toothModalData, setToothModalData] = useState({ id: null, status: null, faces: { v: null, l: null, m: null, d: null, o: null }, notes: '', treatment: {name: '', status: 'planned'}, mode: 'hallazgos' });
  const [consentTemplate, setConsentTemplate] = useState('general');
  const [consentText, setConsentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('Radiografías');
  const [selectedImg, setSelectedImg] = useState(null);
  const [rxPatient, setRxPatient] = useState(null);
  const [newEvolution, setNewEvolution] = useState('');
  // --- LÓGICA DE PERIODONTOGRAMA AVANZADO ---
  const PERIO_TOOTH_ORDER = [
      '18','17','16','15','14','13','12','11', '21','22','23','24','25','26','27','28',
      '38','37','36','35','34','33','32','31', '41','42','43','44','45','46','47','48'
  ];

 const goToAdjacentTooth = (direction, explicitData = null) => {
      if (!toothModalData || !toothModalData.id) return;

      // 1. AUTO-GUARDADO: Guardamos lo que haya en pantalla en la base de datos
      const dataToSave = explicitData || perioData;
      const p = getPatient(selectedPatientId);
      const updatedPerio = { ...p.clinical.perio, [toothModalData.id]: dataToSave };
      savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: updatedPerio } });

      // 2. NAVEGACIÓN: Calculamos el diente vecino
      const currentIndex = PERIO_TOOTH_ORDER.indexOf(toothModalData.id.toString());
      let nextIndex = currentIndex + direction;

      if (nextIndex >= 0 && nextIndex < PERIO_TOOTH_ORDER.length) {
          const nextId = PERIO_TOOTH_ORDER[nextIndex];
          const nextData = p.clinical.perio?.[nextId] || {}; // Buscamos si el nuevo diente ya tenía datos

          // 3. ACTUALIZAR PANTALLA
          setToothModalData({ id: nextId });
          setPerioData({
              pd: nextData.pd || {}, mg: nextData.mg || {}, bop: nextData.bop || {},
              pus: nextData.pus || false, mobility: nextData.mobility || 0, furcation: nextData.furcation || 0
          });
          notify(`Avanzando a pieza ${nextId}`);
      }
  };

  const handlePerioChange = (face, field, index, value) => {
      // Permite escribir números y el signo menos "-" para el margen (recesión/hiperplasia)
      let val = value;
      if (value !== '' && value !== '-') {
          val = parseInt(value, 10);
          if(isNaN(val)) return; // Evita que se ingresen letras
      }

      setToothModalData(prev => {
          const currentPerio = prev.perio || {};
          const key = `${field}_${face}`; // Ejemplo: 'pd_v' o 'mg_l'
          const newArray = [...(currentPerio[key] || ['','',''])];
          newArray[index] = val;
          
          return { ...prev, perio: { ...currentPerio, [key]: newArray } };
      });
  };

  const calcNIC = (pd, mg) => {
      if (pd === '' || mg === '' || pd === undefined || mg === undefined || pd === '-' || mg === '-') return '-';
      return parseInt(pd) + parseInt(mg);
  };
  // --- GUARDAR SNAPSHOT PERIODONTAL (HISTORIAL) ---
  const savePerioSnapshot = () => {
      const p = getPatient(selectedPatientId);
      const dateStr = new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
      
      const newSnapshot = {
          id: Date.now().toString(),
          date: dateStr,
          perio: JSON.parse(JSON.stringify(p.clinical.perio || {})), // Copia profunda exacta
          hygiene: JSON.parse(JSON.stringify(p.clinical.hygiene || {})), // Copia profunda exacta
          stats: getPerioStats()
      };

      const history = p.clinical.perioHistory || [];
      savePatientData(selectedPatientId, {
          ...p,
          clinical: {
              ...p.clinical,
              perioHistory: [...history, newSnapshot]
          }
      });
      notify(`Evolución Periodontal guardada con éxito (${dateStr})`);
  };
  // --- CARGAR SNAPSHOT PERIODONTAL EN PANTALLA ---
  const restoreSnapshot = (snap) => {
      if(window.confirm(`¿Estás seguro de cargar en pantalla la evolución del ${snap.date}?\n\nNota: Asegúrate de haber guardado tu trabajo actual si estabas haciendo cambios.`)) {
          const p = getPatient(selectedPatientId);
          
          // Reemplazamos los datos actuales de la pantalla con los del snapshot
          savePatientData(selectedPatientId, {
              ...p,
              clinical: {
                  ...p.clinical,
                  perio: JSON.parse(JSON.stringify(snap.perio || {})),
                  hygiene: JSON.parse(JSON.stringify(snap.hygiene || {}))
              }
          });
          notify(`Cargando evolución del ${snap.date}`);
      }
  };
  // --- MOTOR DE DICTADO POR VOZ (PERIODONCIA) ---
  const [isPerioVoiceActive, setIsPerioVoiceActive] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const startPerioDictation = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
          notify("Tu navegador no soporta dictado por voz (Te recomiendo Chrome).");
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; // Configurado para español
      recognition.continuous = false; // Se detiene al terminar la frase
      recognition.interimResults = false;

      recognition.onstart = () => {
          setIsPerioVoiceActive(true);
          setVoiceFeedback('Escuchando (ej: "tres, dos, tres")...');
      };

      recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setVoiceFeedback(`Escuchaste: "${transcript}"`);
          
          // 1. Convertir palabras a números y soporte para signos negativos
          const cleanText = transcript
              .replace(/uno/g, '1').replace(/dos/g, '2').replace(/tres/g, '3')
              .replace(/cuatro/g, '4').replace(/cinco/g, '5').replace(/seis/g, '6')
              .replace(/siete/g, '7').replace(/ocho/g, '8').replace(/nueve/g, '9').replace(/cero/g, '0')
              .replace(/menos /g, '-');

          setPerioData(prev => {
              let newData = { ...prev, pd: { ...(prev.pd || {}) }, mg: { ...(prev.mg || {}) }, bop: { ...(prev.bop || {}) } };
              
              let pdNumbers = [];
              let mgNumbers = [];

              if (cleanText.includes('margen')) {
                  const parts = cleanText.split('margen');
                  pdNumbers = parts[0].match(/-?\d/g) || [];
                  mgNumbers = parts[1].match(/-?\d/g) || [];
              } else {
                  pdNumbers = cleanText.match(/-?\d/g) || [];
              }
              
              // --- NUEVA INTELIGENCIA DE CARAS ---
              const isPalatino = cleanText.includes('palatino') || cleanText.includes('lingual');

              // 2. Rellenar Profundidad (PD)
              if (pdNumbers.length >= 6) {
                  // Si dicta 6 números de corrido, llena toda la pieza
                  if (pdNumbers[0]) newData.pd.vd = pdNumbers[0];
                  if (pdNumbers[1]) newData.pd.v  = pdNumbers[1];
                  if (pdNumbers[2]) newData.pd.vm = pdNumbers[2];
                  if (pdNumbers[3]) newData.pd.ld = pdNumbers[3]; 
                  if (pdNumbers[4]) newData.pd.l  = pdNumbers[4];
                  if (pdNumbers[5]) newData.pd.lm = pdNumbers[5];
              } else if (pdNumbers.length > 0) {
                  // Si dicta 3 números o menos, revisa de qué cara está hablando
                  if (isPalatino) {
                      if (pdNumbers[0]) newData.pd.ld = pdNumbers[0];
                      if (pdNumbers[1]) newData.pd.l  = pdNumbers[1];
                      if (pdNumbers[2]) newData.pd.lm = pdNumbers[2];
                  } else { // Por defecto va a Vestibular
                      if (pdNumbers[0]) newData.pd.vd = pdNumbers[0];
                      if (pdNumbers[1]) newData.pd.v  = pdNumbers[1];
                      if (pdNumbers[2]) newData.pd.vm = pdNumbers[2];
                  }
              }

              // 3. Rellenar Margen (MG) con la misma inteligencia
              if (mgNumbers.length >= 6) {
                  if (mgNumbers[0]) newData.mg.vd = mgNumbers[0];
                  if (mgNumbers[1]) newData.mg.v  = mgNumbers[1];
                  if (mgNumbers[2]) newData.mg.vm = mgNumbers[2];
                  if (mgNumbers[3]) newData.mg.ld = mgNumbers[3]; 
                  if (mgNumbers[4]) newData.mg.l  = mgNumbers[4];
                  if (mgNumbers[5]) newData.mg.lm = mgNumbers[5];
              } else if (mgNumbers.length > 0) {
                  if (isPalatino) {
                      if (mgNumbers[0]) newData.mg.ld = mgNumbers[0];
                      if (mgNumbers[1]) newData.mg.l  = mgNumbers[1];
                      if (mgNumbers[2]) newData.mg.lm = mgNumbers[2];
                  } else {
                      if (mgNumbers[0]) newData.mg.vd = mgNumbers[0];
                      if (mgNumbers[1]) newData.mg.v  = mgNumbers[1];
                      if (mgNumbers[2]) newData.mg.vm = mgNumbers[2];
                  }
              }

              // 4. Detectar Sangrado y Pus direccionado
              if (cleanText.includes('sangra') || cleanText.includes('sangrado')) {
                  if (isPalatino) {
                      newData.bop.l = true; // Sangrado palatino
                  } else {
                      newData.bop.v = true; // Sangrado vestibular
                  }
              }
              if (cleanText.includes('pus') || cleanText.includes('supura')) {
                  newData.pus = true;
              }
              // Si la IA escucha "Siguiente", guarda lo que dictaste y salta al próximo diente
              if (cleanText.includes('siguiente') || cleanText.includes('próximo') || cleanText.includes('avanza')) {
                  setTimeout(() => goToAdjacentTooth(1, newData), 100);
              } 
              // Si la IA escucha "Anterior" o "Atrás", retrocede
              else if (cleanText.includes('anterior') || cleanText.includes('atrás') || cleanText.includes('vuelve')) {
                  setTimeout(() => goToAdjacentTooth(-1, newData), 100);
              }

              return newData;
          });
      };

      recognition.onerror = () => {
          setVoiceFeedback('No se escuchó bien. Intenta de nuevo.');
          setIsPerioVoiceActive(false);
      };

      recognition.onend = () => {
          setIsPerioVoiceActive(false);
          // Borrar el mensaje después de 3 segundos
          setTimeout(() => setVoiceFeedback(''), 3000); 
      };

      recognition.start();
  };
  // --- INVENTARIO & PAGOS ---
  const [inventorySearch, setInventorySearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', stock: 0, min: 5, unit: 'u', id: null });
  const [paymentInput, setPaymentInput] = useState({ amount: '', method: 'Efectivo', date: getLocalDate(), receiptNumber: '' });
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState(null);
 // --- NUEVOS ESTADOS CENTRO FINANCIERO ---
  const [financeTab, setFinanceTab] = useState('resumen'); 
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Insumos', date: getLocalDate(), patientRef: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'dentist' });

  // --- ESTADOS DE LABORATORIO ---
  const [labWorks, setLabWorks] = useState([]);
  const [newLabWork, setNewLabWork] = useState({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
 
  // --- VOZ A TEXTO ---
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognitionRef = useRef(null);

  const logoInputRef = useRef(null);

  useEffect(() => { document.title = "ShiningCloud | Dental"; }, []);
  useEffect(() => {
      // 1. Truco infalible: Leemos la URL nativa por si Supabase se demora
      if (window.location.hash.includes('type=recovery')) {
          setModal('recovery');
      }

      // 2. Cargamos la sesión inicial
      supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
      });

      // 3. El vigía oficial de Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
              setModal('recovery');
          }
          setSession(session);
      });
      
      return () => subscription.unsubscribe();
  }, []);
  
useEffect(() => {
    if (!session) return;
    
    const load = async () => {
      // 1. PRIMERO: Averiguar quién soy y quién es el dueño de mi clínica
      const { data: t, error: tErr } = await supabase.from('team').select('*');
      let myClinicAdmin = session.user.email; 
      
      if (!tErr && t) {
          const allTeamData = t.map(r => ({...r.data, id: r.id}));
          const me = allTeamData.find(u => u.email === session.user.email);
          
          if (me) myClinicAdmin = me.admin_email; 
          
          const myTeam = allTeamData.filter(u => u.admin_email === myClinicAdmin);
          setTeam(myTeam);
          
          if (myTeam.length === 0 || !me) setUserRole('admin'); 
          else setUserRole(me.role);
      } else { 
          setUserRole('admin'); 
      }
      
      setClinicOwner(myClinicAdmin);

      // 2. SEGUNDO: Descargar SOLO los datos que le pertenecen a mi clínica
      const { data: s } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
      if (s) setConfigLocal(s.data);
      
      const { data: p } = await supabase.from('patients').select('*').eq('admin_email', myClinicAdmin).order('id', { ascending: false }).limit(50);
      if (p) { const m = {}; p.forEach(r => m[r.id] = r.data); setPatientRecords(m); }
      
      const { data: a } = await supabase.from('appointments').select('*').eq('admin_email', myClinicAdmin);
      if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));
      
      const { data: f } = await supabase.from('financials').select('*').eq('admin_email', myClinicAdmin);
      if (f) setFinancialRecords(f.map(r => ({ ...r.data, id: r.id })));
      
      const { data: pk } = await supabase.from('packs').select('*').eq('admin_email', myClinicAdmin);
      if (pk) setProtocols(pk.map(r => ({ ...r.data, id: r.id })));
      
      const { data: i, error: iErr } = await supabase.from('inventory').select('*').eq('admin_email', myClinicAdmin);
      if (!iErr && i) setInventory(i.map(r => ({ ...r.data, id: r.id })));

      const { data: catData } = await supabase.from('catalog').select('*').eq('admin_email', myClinicAdmin);
      if (catData) setCatalog(catData.map(r => ({ ...r.data, id: r.id })));

      const { data: labData } = await supabase.from('lab_works').select('*').eq('admin_email', myClinicAdmin);
      if (labData) setLabWorks(labData); 
    };
    
    load();
  }, [session]);

// --- V76/V78: SISTEMA DE AUDITORÍA CON ETIQUETA DE CLÍNICA ---
  const logAction = async (action, details, patientId = null) => {
      try {
          const currentOwner = clinicOwner || session.user.email;
          
          await supabase.from('audit_logs').insert({
              user_email: session.user.email,
              action: action,
              patient_id: patientId,
              details: details,
              timestamp: new Date().toISOString(),
              admin_email: currentOwner // <-- LA ETIQUETA MULTITENANT
          });
      } catch (error) {
          console.error("Error creating audit log", error);
      }
  };

  const notify = (m) => toast.success(m, { 
    style: { borderRadius: '12px', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '12px' },
    iconTheme: { primary: '#06b6d4', secondary: '#fff' }
});
  const toggleTheme = () => { const modes = ['dark', 'light', 'blue']; const next = modes[(modes.indexOf(themeMode) + 1) % modes.length]; setThemeMode(next); localStorage.setItem('sc_theme_mode', next); };
  // --- FUNCIÓN MAESTRA DE GUARDADO BLINDADA (V78) ---
  const saveToSupabase = async (t, id, d) => { 
      // Determinamos quién es el dueño de la clínica en este momento
      const currentOwner = clinicOwner || session.user.email;
      
      await supabase.from(t).upsert({ 
          id: id.toString(), 
          data: d,
          admin_email: currentOwner // <-- LA ETIQUETA MULTITENANT
      }); 
  };
  
  const getPatient = (id) => {
      const base = { id, personal: { legalName: id }, anamnesis: { recent: '', remote: '', conditions: {} }, clinical: { teeth: {}, perio: {}, hygiene: {}, evolution: [] }, consents: [], images: [] };
      const existing = patientRecords[id];
      if (!existing) return base;
      return { 
          ...base, ...existing, 
          anamnesis: { ...base.anamnesis, ...(existing.anamnesis || {}) }, 
          clinical: existing.clinical || base.clinical, 
          personal: existing.personal || base.personal 
      };
  };

  const savePatientData = async (id, d) => { 
      setPatientRecords(prev => ({...prev, [id]: d})); 
      await saveToSupabase('patients', id, d);
      // V76: Log de auditoría
      logAction('UPDATE_PATIENT', { patientName: d.personal.legalName }, id);
  };

  // --- SUBIDA DE LOGO OPTIMIZADA (EN BUCKET PÚBLICO SEPARADO) ---
  const handleLogoUpload = async (e) => { 
      const file = e.target.files[0]; 
      if (!file) return; 
      
      setUploading(true);
      notify("Subiendo logo...");
      
      try {
            // Eliminamos la extensión dinámica para forzar la sobreescritura del archivo anterior
            const fileName = `logo_${clinicOwner || session.user.email}_file`;
          
          // Subimos al bucket dedicado de logos
          const { error: uploadError } = await supabase.storage.from('clinic-logos').upload(fileName, file, { upsert: true });
          if (uploadError) throw uploadError;
          
          // Obtenemos el link público
          const { data: { publicUrl } } = supabase.storage.from('clinic-logos').getPublicUrl(fileName);
          
          // Guardamos SOLO el link en la base de datos
          const newConfig = { ...config, logo: publicUrl }; 
          setConfigLocal(newConfig); 
          
          // Guardamos con la etiqueta de seguridad multitenant
          await saveToSupabase('settings', 'general', newConfig); 
          
          notify("Logo Actualizado con éxito"); 
      } catch (err) {
          console.error(err);
          alert("Error subiendo el logo");
      } finally {
          setUploading(false);
      }
  };

  const currentTotal = useMemo(() => { const time = parseFloat(sessionData.clinicalTime) || 0; const base = parseFloat(sessionData.baseCost) || 0; const hourly = parseFloat(config.hourlyRate) || 0; const margin = parseFloat(config.profitMargin) || 0; return Math.round(((hourly / 60) * time + base) / (1 - margin / 100)); }, [sessionData, config]);
  const incomeRecords = financialRecords.filter(f => !f.type || f.type === 'income');
  const expenseRecords = financialRecords.filter(f => f.type === 'expense');
  const totalCollected = incomeRecords.reduce((acc, rec) => { const paymentsSum = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0); return acc + (paymentsSum > 0 ? paymentsSum : (Number(rec.paid) || 0)); }, 0);
  const totalExpenses = expenseRecords.reduce((a, b) => a + (Number(b.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;
  // Calcular deuda en la calle (total de tratamientos - lo que han pagado)
  const totalDebt = incomeRecords.reduce((acc, rec) => {
      const paid = (rec.payments || []).reduce((s, p) => s + Number(p.amount), 0) + (rec.paid && !rec.payments ? rec.paid : 0);
      const pending = (rec.total || 0) - paid;
      return acc + (pending > 0 ? pending : 0);
  }, 0);
  const todaysAppointments = appointments.filter(a => a.date === getLocalDate()).sort((a,b) => a.time.localeCompare(b.time));
  const filteredInventory = useMemo(() => { if(!inventorySearch) return inventory; return inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase())); }, [inventory, inventorySearch]);

 // --- SUBIDA SEGURA DE IMÁGENES CLÍNICAS (BUCKET PRIVADO) ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0]; 
      if (!file || !selectedPatientId) return; 
      setUploading(true);
      try {
          const fileName = `${selectedPatientId}_${Date.now()}.${file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage.from('patient-images').upload(fileName, file);
          if (uploadError) throw uploadError;
          
          const p = getPatient(selectedPatientId);
          
          // LA MAGIA: Ya no pedimos la URL pública, guardamos el "path" (fileName) interno
          const updatedImages = [...(p.images || []), { 
              id: Date.now(), 
              path: fileName, // <-- Guardamos la ruta interna para generar el Signed URL después
              url: fileName,  // Guardamos lo mismo aquí por compatibilidad con tu código actual
              date: new Date().toLocaleDateString(),
              folder: activeFolder 
          }];
          
          await savePatientData(selectedPatientId, { ...p, images: updatedImages });
          notify(`Archivo encriptado en ${activeFolder}`);
          logAction('UPLOAD_IMAGE', { fileName, folder: activeFolder }, selectedPatientId); 
      } catch (err) { 
          alert(`Error: ${err.message}`); 
      } finally { 
          setUploading(false); 
      }
  };

  const generatePDF = (type, data = null) => {
    try {
        const doc = new jsPDF();
        // Colores según tu tema (mantenemos tu lógica de colores)
        const primaryColor = themeMode === 'light' ? [217, 119, 6] : (themeMode === 'blue' ? [6, 182, 212] : [212, 175, 55]);
        
        // --- 1. ENCABEZADO PROFESIONAL (Basado en normativa chilena) ---
        doc.setFillColor(...primaryColor); 
        doc.rect(0, 0, 210, 3, 'F'); 

        if (config.logo) {
            try { doc.addImage(config.logo, 'PNG', 15, 10, 20, 20); } 
            catch (e) { console.warn("Logo incompatible"); }
        }

        // Datos del Profesional (Extraídos de config/Ajustes)
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(config.name?.toUpperCase() || "DOCTOR", 200, 15, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`RUT: ${config.rut || '---'}`, 200, 20, { align: 'right'});
        doc.text(`Registro Super. de Salud: ${config.rnpi || '---'}`, 200, 24, { align: 'right' });
        doc.text(`${config.university || ''}`, 200, 28, { align: 'right' });
        doc.text(`${config.address || ''}`, 200, 32, { align: 'right' });

        // --- 2. DATOS DEL PACIENTE ---
        const pData = (type === 'consent') ? getPatient(selectedPatientId) : (data || (sessionData.patientId ? patientRecords[sessionData.patientId] : null));
        const pName = pData?.personal?.legalName || (sessionData.patientName || 'Paciente...');
        const pRut = pData?.personal?.documentId || '---';
        const pAge = pData?.personal?.age ? `${pData.personal.age} años` : '';

        doc.setDrawColor(200);
        doc.line(15, 38, 195, 38); 

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("PACIENTE:", 15, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`${pName.toUpperCase()}`, 40, 45);
        doc.text(`RUT: ${pRut}`, 140, 45);
        doc.text(`EDAD: ${pAge}`, 15, 50);
        doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 140, 50);

        // --- 3. LÓGICA SEGÚN TIPO DE DOCUMENTO ---

        // CASO A: RECETA MÉDICA (RX)
        if (type === 'rx') {
            if (prescription.length === 0) { notify("Receta vacía"); return; }
            
            doc.setFontSize(16);
            doc.setFont("times", "italic", "bold");
            doc.text("RP:", 15, 65);

            autoTable(doc, {
                startY: 70,
                head: [['FÁRMACO (DCI / PRESENTACIÓN)', 'INDICACIONES (POSOLOGÍA)']],
                body: prescription.map(p => [p.name.toUpperCase(), p.dosage]),
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fontStyle: 'bold', textColor: primaryColor, borderBottom: { width: 0.5, color: primaryColor } },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
            });

            const finalY = doc.lastAutoTable.finalY + 30;
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.line(70, finalY + 20, 140, finalY + 20);
            doc.setFontSize(8);
            doc.text("FIRMA Y TIMBRE PROFESIONAL", 105, finalY + 25, { align: 'center' });
        } 

        // CASO B: PRESUPUESTO (QUOTE) - Restaurado y Mejorado
        else if (type === 'quote') {
            const qItems = data || []; 
            const totalQ = qItems.reduce((sum, item) => sum + Number(item.price), 0);
            
            doc.setFontSize(18);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("PRESUPUESTO DENTAL", 15, 65); 

            autoTable(doc, { 
                startY: 70, 
                head: [['TRATAMIENTO', 'DIENTE', 'VALOR']], 
                body: qItems.map(it => [it.name, it.tooth || '-', `$${Number(it.price).toLocaleString('es-CL')}`]),
                foot: [['', 'TOTAL A PAGAR:', `$${totalQ.toLocaleString('es-CL')}`]],
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold' },
                footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 252, 252] }
            }); 

            const finalY = doc.lastAutoTable.finalY + 15;
            if (finalY < 230) {
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text("Términos y Condiciones:", 15, finalY);
                doc.text("1. Este presupuesto tiene una validez de 30 días.", 15, finalY + 6);
                doc.text("2. Los valores pueden variar según hallazgos clínicos durante el tratamiento.", 15, finalY + 11);

                doc.setDrawColor(150);
                doc.line(30, finalY + 40, 85, finalY + 40); 
                doc.line(125, finalY + 40, 180, finalY + 40); 
                doc.text("Firma Profesional", 45, finalY + 45);
                doc.text("Firma Paciente", 145, finalY + 45);
            }
        }

        // CASO C: CONSENTIMIENTO
        else if (type === 'consent' && data) { 
            doc.setFontSize(14); doc.text(data.type, 105, 70, { align: 'center' }); 
            doc.setFontSize(10); doc.text(doc.splitTextToSize(data.text || '', 170), 20, 90); 
            if(data.signature) { try { doc.addImage(data.signature, 'PNG', 80, 200, 50, 30); } catch(e) { console.warn("Firma error"); } } 
        }

        // Pie de página global
        doc.setFontSize(7);
        doc.setTextColor(180);
        doc.text(`Documento generado por ShiningCloud - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        doc.save(`${type}_${pName}.pdf`); 
        notify("PDF Generado con éxito"); 
        logAction('GENERATE_PDF', { type }, selectedPatientId);

    } catch (e) { 
        console.error(e); 
        alert("Error generando PDF."); 
    }
};

  const getPerioStats = () => {
    if (!selectedPatientId) return { bop: 0, plaque: 0 };
    const p = getPatient(selectedPatientId);
    let sites=0, bop=0, faces=0, plaque=0;
    [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => {
        if (p.clinical.teeth[t]?.status !== 'missing') {
            sites+=6; faces+=4;
            const perio = p.clinical.perio?.[t] || {};
            const hygiene = p.clinical.hygiene?.[t] || {};
            if(perio.bop) Object.values(perio.bop).forEach(v=> {if(v) bop++});
            Object.values(hygiene).forEach(v=> {if(v) plaque++});
        }
    });
    return { bop: sites>0?Math.round((bop/sites)*100):0, plaque: faces>0?Math.round((plaque/faces)*100):0 };
  };

// --- LOGICA DE VOZ (MULTIPLE HALLAZGOS) ---
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Navegador no compatible. Por favor, usa Google Chrome.");
        return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'es-CL';
      recognition.continuous = true; 
      recognition.interimResults = false;
      
      recognition.onstart = () => { setIsListening(true); };

      recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) { 
              if (event.results[i].isFinal) transcript += event.results[i][0].transcript; 
          }

          if (transcript) {
              const text = transcript.toLowerCase();
              
              // 1. Detectar Caras (Anatomía)
              const facesMap = { 'vestibular': 'v', 'lingual': 'l', 'palatina': 'l', 'mesial': 'm', 'distal': 'd', 'oclusal': 'o', 'incisal': 'o' };
              const foundFaceKey = Object.keys(facesMap).find(f => text.includes(f));
              const faceId = foundFaceKey ? facesMap[foundFaceKey] : null;

              // 2. Detectar Diagnósticos (Comandos de Acción)
              if (text.includes('caries') || text.includes('lesión')) {
                  if (faceId) setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: 'caries' }, activeFace: faceId, status: null }));
              } 
              else if (text.includes('resina') || text.includes('empaste') || text.includes('obturación')) {
                  if (faceId) setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: 'filled' }, activeFace: faceId, status: null }));
              } 
              else if (text.includes('corona')) {
                  setToothModalData(prev => ({ ...prev, status: 'crown' }));
              } 
              else if (text.includes('ausente') || text.includes('extraído') || text.includes('extracción')) {
                  setToothModalData(prev => ({ ...prev, status: 'missing' }));
              } 
              else if (text.includes('sano') || text.includes('limpiar')) {
                  if (faceId) {
                      setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: null }, activeFace: faceId }));
                  } else {
                      setToothModalData(prev => ({ ...prev, faces: {v:null,l:null,m:null,d:null,o:null}, status: null }));
                  }
              }

              // 3. Escribir en la Evolución
              setToothModalData(prev => ({
                  ...prev, 
                  notes: (prev.notes ? prev.notes.trim() + ' ' : '') + transcript.charAt(0).toUpperCase() + transcript.slice(1) 
              }));
          }
      };

      recognition.onerror = () => { setIsListening(false); };
      recognition.onend = () => { setIsListening(false); };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // --- WHATSAPP HELPER ---
  const sendWhatsApp = (phone, text) => {
      if (!phone) return alert("El paciente no tiene teléfono registrado.");
      let cleanPhone = phone.replace(/\D/g, ''); 
      // Solo forzamos el 56 si el número tiene exactamente 8 o 9 dígitos (formato local chileno). Si tiene más, asumimos que ya trae código de país.
      if (cleanPhone.length === 8 || cleanPhone.length === 9) {
          cleanPhone = `56${cleanPhone}`;
      }
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPatientPhone = (name) => {
      if (!name) return '';
      const foundEntry = Object.values(patientRecords).find(p => p.personal?.legalName === name);
      return foundEntry?.personal?.phone || '';
  };

// --- GRÁFICO DINÁMICO DE INGRESOS ---
  const getChartData = () => {
      if (incomeRecords.length === 0) return [{label: 'Ayer', value: 0}, {label: 'Hoy', value: 0}];
      
      // Tomamos los últimos 6 ingresos registrados para mostrar la tendencia reciente
      const recentIncomes = [...incomeRecords].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6).reverse();
      
      return recentIncomes.map(rec => {
          const paid = (rec.payments || []).reduce((s,p)=>s+p.amount,0) + (rec.paid && !rec.payments ? rec.paid : 0);
          return { 
              label: rec.patientName.split(' ')[0] || 'Pac', // Muestra el primer nombre
              value: paid > 0 ? paid : 1000 // Valor mínimo para que el gráfico no se rompa si es 0
          };
      });
  };

  // --- MENU LOGIC ---
  const getMenuItems = () => {
      const base = [
          { id: 'dashboard', label: 'Inicio', icon: TrendingUp },
          { id: 'agenda', label: 'Agenda', icon: CalendarClock },
          { id: 'ficha', label: 'Pacientes', icon: User },
          { id: 'recalls', label: 'Retención CRM', icon: Users }, // <-- NUEVO BOTÓN
      ];
      if (userRole === 'admin' || userRole === 'assistant') { base.push({ id: 'history', label: 'Caja & Gastos', icon: Wallet }); }
      if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'quote', label: 'Cotizador', icon: Calculator }); }
      if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'clinical', label: 'Recetas', icon: Stethoscope }); }
      if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'catalog', label: 'Arancel', icon: Library }); }
      if (userRole === 'admin') { base.push({ id: 'inventory', label: 'Insumos', icon: Box }); base.push({ id: 'settings', label: 'Ajustes', icon: Settings }); }
      if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'lab', label: 'Laboratorio', icon: FlaskConical }); }
      base.push({ id: 'terms', label: 'Legal', icon: Shield });
      return base;
  };
// --- LÓGICA DEL CRM DE RETENCIÓN (RECALLS) ---
  const getRecalls = useMemo(() => {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      // 1. Ver quiénes ya tienen citas en el futuro (para no molestarlos)
      const futureAppts = appointments.filter(a => new Date(a.date) >= now);
      const futurePatientNames = new Set(futureAppts.map(a => a.name));

      // 2. Buscar citas que fueron hace 6 meses o más
      const pastAppts = appointments.filter(a => new Date(a.date) <= sixMonthsAgo);
      
      // 3. Agrupar por paciente para ver su ÚLTIMA cita
      const latestAppts = {};
      pastAppts.forEach(a => {
          if (!latestAppts[a.name] || new Date(a.date) > new Date(latestAppts[a.name].date)) {
              latestAppts[a.name] = a;
          }
      });

      // 4. Filtrar: Mostrar solo a los que NO tienen citas futuras
      return Object.values(latestAppts).filter(a => !futurePatientNames.has(a.name));
  }, [appointments]);
  if (!session) {
      if (!showLogin) {
          return <LandingPage onLoginClick={() => setShowLogin(true)} />;
      }
      return (
          <div className="relative min-h-screen">
              {/* Botón flotante para volver a la Landing Page */}
              <button 
                  onClick={() => setShowLogin(false)}
                  className="absolute top-6 left-6 z-50 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors bg-black/50 p-2 rounded-lg backdrop-blur-sm"
              >
                  ← Volver al inicio
              </button>
              
              {/* Tu pantalla de Login original */}
              <AuthScreen />
          </div>
      );
  }
  const t = THEMES[themeMode] || THEMES.dark;

  return (
    <div className={`min-h-screen flex ${t.bg} ${t.text} transition-all duration-500 font-sans`}>
        <Toaster position="bottom-center" reverseOrder={false} />
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={()=>setMobileMenuOpen(false)}></div>}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out ${t.card} border-r flex flex-col`}>
        <div className="p-8 border-b border-white/5 flex flex-col items-center gap-4 relative">
            <button onClick={()=>setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 opacity-50"><X/></button>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${t.gradient}`}>
                {config.logo ? <img src={config.logo} className="w-full h-full object-contain rounded-2xl"/> : <Cloud className="text-white" size={32}/>}
            </div>
            <div className="text-center">
                <h1 className="text-xl font-black tracking-tight">ShiningCloud</h1>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${t.subText}`}>Dental OS</p>
            </div>
        </div>
        
        <div className="px-6 py-6">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${userRole==='admin'?'bg-emerald-500':userRole==='dentist'?'bg-blue-500':'bg-purple-500'}`}>
                    {session.user.email[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{session.user.email.split('@')[0]}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${userRole==='admin'?'text-emerald-400':userRole==='dentist'?'text-blue-400':'text-purple-400'}`}>{userRole === 'admin' ? 'Admin' : userRole === 'dentist' ? 'Dr.' : 'Asist.'}</p>
                </div>
            </div>
        </div>

        <nav className="px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {getMenuItems().map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatientId(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wide transition-all duration-300 group ${activeTab === item.id ? t.activeNav : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}>
                    <item.icon size={18} className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-current' : ''}`}/> {item.label}
                </button>
            ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-white/5">
            <button onClick={toggleTheme} className="w-full p-3 rounded-2xl bg-white/5 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:bg-white/10 hover:scale-[1.02]">
                {themeMode==='dark'?<Moon size={14}/>:themeMode==='light'?<Sun size={14}/>:<Droplets size={14}/>} TEMA
            </button>
            <button onClick={()=>supabase.auth.signOut()} className="w-full p-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-xs transition-all hover:bg-red-500/20 hover:scale-[1.02]">
                <LogOut size={14} className="inline mr-2"/> SALIR
            </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-12 h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between mb-6"><button onClick={()=>setMobileMenuOpen(true)} className={`p-2 rounded-xl ${t.inputBg}`}><Menu/></button><span className="font-black text-lg">ShiningCloud | Dental</span><div className="w-8"></div></div>
        

        {activeTab === 'dashboard' && <div className="space-y-8 animate-in fade-in">
            <h1 className="text-4xl font-black">Hola, {config.name.split(' ')[0]} 👋</h1>
            {userRole === 'admin' && (<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card theme={themeMode} className="bg-emerald-500/10 border-emerald-500/20"><div className="flex justify-between mb-4"><div className="p-3 bg-emerald-500 rounded-xl text-white"><DollarSign/></div><span className="text-xs font-bold uppercase text-emerald-500">Recaudado</span></div><h2 className="text-3xl font-black">${totalCollected.toLocaleString()}</h2></Card><Card theme={themeMode} className="bg-red-500/10 border-red-500/20"><div className="flex justify-between mb-4"><div className="p-3 bg-red-500 rounded-xl text-white"><TrendingDown/></div><span className="text-xs font-bold uppercase text-red-500">Gastos</span></div><h2 className="text-3xl font-black">${totalExpenses.toLocaleString()}</h2></Card><Card theme={themeMode} className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-600'} text-white col-span-2 relative overflow-hidden`}><div className="relative z-10"><span className="text-xs font-bold uppercase opacity-80">Utilidad Neta</span><h2 className="text-4xl font-black mt-2">${netProfit.toLocaleString()}</h2><p className="text-xs opacity-60 mt-1">Ganancia Real</p></div><div className="absolute -right-4 -bottom-4 opacity-20"><DollarSign size={100}/></div></Card></div>)}
            
            {/* V75: CHART SECTION */}
            {userRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card theme={themeMode} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4"><BarChart2 className={t.accent} size={20}/><h3 className="font-bold">Crecimiento de Ingresos</h3></div>
                        <SimpleLineChart data={getChartData()} theme={themeMode} />
                        <div className="flex justify-between text-[10px] opacity-40 mt-2 px-1"><span>6 Meses</span><span>Hoy</span></div>
                    </Card>
                    <Card theme={themeMode} className="flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                        <PieChart size={64} className="opacity-20 mb-4"/>
                        <h3 className="font-bold text-xl">Top Tratamientos</h3>
                        <p className={`text-xs ${t.subText} mt-2 max-w-xs`}>El 60% de tus ingresos proviene de tratamientos de Ortodoncia y Limpiezas.</p>
                        <button onClick={() => { setActiveTab('history'); setFinanceTab('ingresos'); }} className="mt-4 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 mx-auto">Ir al Centro Financiero <ArrowRight size={12}/></button>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4"><h3 className="font-bold text-lg flex items-center gap-2"><Clock className={t.accent} size={20}/> Agenda de Hoy</h3><div className="space-y-2">{todaysAppointments.length === 0 ? (<div className="p-10 border border-dashed border-white/10 rounded-3xl text-center opacity-50 flex flex-col items-center gap-4"><p>No tienes pacientes hoy.</p><Button theme={themeMode} onClick={()=>setModal('appt')}>Agendar Cita</Button></div>) : (todaysAppointments.map(a => (<div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 ${t.card} hover:scale-[1.01] transition-transform`}><div className={`p-4 rounded-xl font-black text-white ${t.accentBg}`}>{a.time}</div><div className="flex-1"><h4 className="font-bold text-lg">{a.name}</h4><p className="text-xs opacity-50">{a.treatment}</p></div><button className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><ArrowRight size={16}/></button></div>)))}</div></div>
                <div className="space-y-6"><h3 className="font-bold text-lg">Accesos Rápidos</h3><div className="grid grid-cols-2 gap-3"><button onClick={()=>setModal('appt')} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><CalendarClock size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Agendar</span></button><button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(null); setSearchTerm('');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><User size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Paciente</span></button>{userRole !== 'dentist' && <button onClick={()=>{setActiveTab('quote'); setQuoteMode('calc');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><Calculator size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Cotizar</span></button>}{(userRole === 'admin' || userRole === 'assistant') && <button onClick={()=>{setActiveTab('history');}} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all group"><Wallet size={24} className={`${t.accent} group-hover:scale-110 transition-transform`}/><span className="text-xs font-bold">Caja</span></button>}</div></div>
            </div>
        </div>}

    {activeTab === 'terms' && <TermsScreen theme={t} />}

        {/* --- CENTRO FINANCIERO ACTUALIZADO (V77) --- */}
        {activeTab === 'history' && (userRole === 'admin' || userRole === 'assistant') && <div className="space-y-6 animate-in slide-in-from-right h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className={t.accent}/> Centro Financiero</h2>
                <Button theme={themeMode} variant="secondary" onClick={()=>{const ws=XLSX.utils.json_to_sheet(financialRecords); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Finanzas"); XLSX.writeFile(wb, "Reporte_Finanzas.xlsx");}}><FileSpreadsheet/> Excel</Button>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                <button onClick={()=>setFinanceTab('resumen')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='resumen'?t.accentBg:'opacity-50'}`}>📊 Resumen</button>
                <button onClick={()=>setFinanceTab('ingresos')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='ingresos'?t.accentBg:'opacity-50'}`}>💵 Ingresos y Caja</button>
                <button onClick={()=>setFinanceTab('deudores')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='deudores'?'bg-red-500 text-white':'opacity-50'}`}>🚨 Por Cobrar</button>
                <button onClick={()=>setFinanceTab('gastos')} className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${financeTab==='gastos'?t.accentBg:'opacity-50'}`}>🦷 Gastos / Lab</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {/* --- SUB-TAB 1: RESUMEN (Dueño) --- */}
                {financeTab === 'resumen' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card theme={themeMode} className="bg-emerald-500/10 border-emerald-500/20 text-center">
                                <p className="text-emerald-500 font-bold text-xs uppercase mb-2">Recaudado (En Banco)</p>
                                <h2 className="text-3xl font-black text-emerald-400">${totalCollected.toLocaleString()}</h2>
                            </Card>
                            <Card theme={themeMode} className="bg-red-500/10 border-red-500/20 text-center">
                                <p className="text-red-500 font-bold text-xs uppercase mb-2">Gastos (Operación)</p>
                                <h2 className="text-3xl font-black text-red-400">${totalExpenses.toLocaleString()}</h2>
                            </Card>
                            <Card theme={themeMode} className="bg-yellow-500/10 border-yellow-500/20 text-center">
                                <p className="text-yellow-500 font-bold text-xs uppercase mb-2">En la Calle (Deudas)</p>
                                <h2 className="text-3xl font-black text-yellow-400">${totalDebt.toLocaleString()}</h2>
                            </Card>
                        </div>
                        <Card theme={themeMode} className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-600'} text-white text-center py-8 shadow-2xl`}>
                            <p className="text-xs font-bold uppercase opacity-80 mb-2">Utilidad Real (Flujo de Caja)</p>
                            <h2 className="text-5xl font-black">${netProfit.toLocaleString()}</h2>
                        </Card>
                    </div>
                )}

                {/* --- SUB-TAB 2: INGRESOS GENERALES --- */}
                {financeTab === 'ingresos' && (
                    <div className="space-y-4 animate-in fade-in">
                        {incomeRecords.map(h=>{ 
                            const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                            const pending = (h.total || 0) - paid; 
                            return (
                            <Card key={h.id} theme={themeMode} onClick={()=>{setSelectedFinancialRecord(h); setPaymentInput({amount: pending > 0 ? pending : '', method:'Efectivo', date: getLocalDate()}); setModal('abono');}} className={`flex justify-between items-center cursor-pointer border-l-4 ${pending<=0?'border-emerald-500':'border-yellow-500'} hover:scale-[1.01] transition-transform`}>
                                <div><p className="font-bold">{h.patientName}</p><p className="text-[10px] opacity-40">{h.date} • Presupuesto: ${h.total?.toLocaleString()}</p></div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className={`font-black ${pending<=0?'text-emerald-500':'text-yellow-500'}`}>{pending <= 0 ? 'PAGADO' : `FALTA: $${pending.toLocaleString()}`}</p>
                                </div>
                            </Card>
                            )
                        })}
                    </div>
                )}

                {/* --- SUB-TAB 3: DEUDORES (CRM Financiero) --- */}
                {financeTab === 'deudores' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center">
                            <div><h3 className="text-red-500 font-bold">Planilla de Morosidad</h3><p className="text-[10px] text-red-400/70">Solo pacientes con saldo pendiente</p></div>
                            <h2 className="text-2xl font-black text-red-500">${totalDebt.toLocaleString()}</h2>
                        </div>
                        {incomeRecords.filter(h => {
                            const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                            return (h.total || 0) - paid > 0;
                        }).map(h=>{ 
                            const paid = (h.payments || []).reduce((s,p)=>s+p.amount,0) + (h.paid && !h.payments ? h.paid : 0);
                            const pending = (h.total || 0) - paid; 
                            return (
                            <Card key={h.id} theme={themeMode} onClick={()=>{setSelectedFinancialRecord(h); setPaymentInput({amount: pending > 0 ? pending : '', method:'Efectivo', date: getLocalDate()}); setModal('abono');}} className="flex flex-col md:flex-row justify-between items-center cursor-pointer border-l-4 border-red-500 hover:scale-[1.01] transition-transform gap-4">
                                <div className="w-full md:w-auto"><p className="font-bold">{h.patientName}</p><p className="text-[10px] opacity-40">{h.date} • Total tto: ${h.total?.toLocaleString()}</p></div>
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                                    <p className="font-black text-red-500 text-xl">-$ {pending.toLocaleString()}</p>
                                    <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(h.patientName), `Hola ${h.patientName}, me comunico de ShiningCloud Dental. Le recordamos amablemente que su ficha registra un saldo pendiente de $${pending.toLocaleString()}. ¿Gusta que le envíe los datos de transferencia para regularizarlo?`); }} className="flex items-center gap-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg transition-colors"><MessageCircle size={14}/> Cobrar Deuda</button>
                                </div>
                            </Card>
                            )
                        })}
                    </div>
                )}

                {/* --- SUB-TAB 4: GASTOS Y LABORATORIO --- */}
                {financeTab === 'gastos' && (
                    <div className="space-y-6 animate-in fade-in">
                        <Card theme={themeMode} className="space-y-4 border-l-4 border-stone-500">
                            <h3 className="font-bold text-lg">Egresos / Costos Clínica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InputField theme={themeMode} placeholder="Ítem (ej: Coronas Zirconio, Internet...)" value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description:e.target.value})}/>
                                <select className={`bg-[#121212] border border-white/10 rounded-xl px-3 p-3 text-xs font-bold outline-none ${t.text}`} value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category:e.target.value})}>
                                    <option value="Insumos">Caja: Insumos</option>
                                    <option value="Laboratorio">Caja: Trabajos de Laboratorio</option>
                                    <option value="Arriendo">Caja: Arriendo / Servicios</option>
                                    <option value="Marketing">Caja: Publicidad</option>
                                    <option value="Sueldos">Caja: Honorarios</option>
                                    <option value="Otros">Caja: Otros Egresos</option>
                                </select>
                                
                                {/* Campo exclusivo si seleccionan Laboratorio */}
                                {newExpense.category === 'Laboratorio' && (
                                    <div className="col-span-1 md:col-span-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-in zoom-in">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Asociar Costo a un Paciente</label>
                                        <PatientSelect theme={themeMode} patients={patientRecords} onSelect={(p) => setNewExpense({...newExpense, patientRef: p.personal.legalName})} placeholder="Buscar paciente..." />
                                        {newExpense.patientRef && <p className="text-[10px] mt-2 font-bold bg-blue-500 text-white inline-block px-2 py-1 rounded">Costo asignado a: {newExpense.patientRef}</p>}
                                    </div>
                                )}
                                
                                <InputField theme={themeMode} type="number" placeholder="$ Monto Exacto" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount:e.target.value})}/> 
                                <Button theme={themeMode} onClick={async()=>{ 
                                    if(newExpense.description && newExpense.amount){ 
                                        const id = Date.now().toString(); 
                                        const ex = {...newExpense, id, type: 'expense', amount: Number(newExpense.amount)};
                                        setFinancialRecords([...financialRecords, ex]); 
                                        await saveToSupabase('financials', id, ex); 
                                        setNewExpense({description:'', amount:'', category:'Insumos', date: getLocalDate(), patientRef:''}); 
                                        notify("Gasto registrado con éxito"); 
                                    } 
                                }}><Plus/></Button>
                            </div>
                        </Card>
                        
                        <div className="space-y-2">
                            {expenseRecords.map(ex => (
                                <div key={ex.id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${ex.category==='Laboratorio' ? 'bg-blue-500/20 text-blue-400' : 'bg-stone-500/20 text-stone-400'}`}>
                                            {ex.category==='Laboratorio' ? <Box size={18}/> : <TrendingDown size={18}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold">{ex.description}</p>
                                            <p className="text-[10px] opacity-60 mt-1">{ex.date} • {ex.category}</p>
                                            {ex.patientRef && <span className="text-[9px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded ml-1 font-bold">Pac: {ex.patientRef}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-red-500 text-lg">-${Number(ex.amount).toLocaleString()}</span>
                                        <button onClick={async()=>{ const filtered = financialRecords.filter(f=>f.id!==ex.id); setFinancialRecords(filtered); await supabase.from('financials').delete().eq('id', ex.id); notify("Egreso Eliminado"); }} className="p-2 bg-black/40 rounded-lg text-stone-500 hover:text-red-500 hover:bg-red-500/20 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>}

{/* --- PESTAÑA ARANCEL / CATÁLOGO --- */}
        {activeTab === 'catalog' && (userRole === 'admin' || userRole === 'dentist') && (
            <div className="space-y-6 animate-in fade-in h-full flex flex-col">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Library className={t.accent}/> Arancel de Prestaciones</h2>
                        <p className="text-xs opacity-50 mt-1">Administra tus tratamientos y precios fijos.</p>
                    </div>
                    <Button theme={themeMode} onClick={() => { setNewCatalogItem({name:'', price:'', id:null}); setModal('catalogItem'); }}><Plus/> Nuevo Tratamiento</Button>
                </div>
                <div className="grid gap-2 overflow-y-auto custom-scrollbar pb-10">
                   {catalog.length === 0 ? (
                        <div className="p-10 border border-dashed border-cyan-500/30 rounded-3xl text-center flex flex-col items-center bg-cyan-500/5">
                            <Library size={48} className="mb-4 text-cyan-500 opacity-50"/>
                            <h3 className="font-black text-lg mb-2">Tu arancel está vacío</h3>
                            <p className="text-xs opacity-70 mb-6 max-w-sm">No pierdas tiempo escribiendo desde cero. Carga un arancel base referencial y luego ajusta los precios a la realidad de tu clínica.</p>
                            
                            <Button theme={themeMode} onClick={async () => {
                                notify("Cargando arancel referencial...");
                                const newItems = [];
                                for (const item of DEFAULT_CATALOG) {
                                    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                    const fullItem = { ...item, id, admin_email: clinicOwner || session?.user?.email };
                                    newItems.push(fullItem);
                                    await saveToSupabase('catalog', id, fullItem);
                                }
                                setCatalog(newItems);
                                notify("¡Arancel base cargado con éxito!");
                            }}>
                                <Plus size={18} /> CARGAR ARANCEL REFERENCIAL (51 ÍTEMS)
                            </Button>
                        </div>
                    ) : (
                        catalog.sort((a,b)=>a.name.localeCompare(b.name)).map(item => (
                            <Card key={item.id} theme={themeMode} className="flex justify-between items-center p-4 hover:border-cyan-500/50 transition-colors">
                                <div><h4 className="font-bold">{item.name}</h4></div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-emerald-400">${Number(item.price).toLocaleString()}</span>
                                    <button onClick={() => { setNewCatalogItem(item); setModal('catalogItem'); }} className="p-2 text-stone-400 hover:text-cyan-400 transition-colors"><Edit3 size={16}/></button>
                                    <button onClick={async () => {
                                        setCatalog(catalog.filter(c => c.id !== item.id));
                                        await supabase.from('catalog').delete().eq('id', item.id);
                                        notify("Tratamiento eliminado");
                                    }} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        )}
        {activeTab === 'inventory' && userRole === 'admin' && <div className="space-y-6 animate-in fade-in"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Inventario</h2><Button theme={themeMode} onClick={()=>{setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); setModal('addItem');}}><Plus/> Nuevo Item</Button></div><div className="relative"><InputField theme={themeMode} icon={Search} placeholder="Buscar insumo..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} /></div><div className="space-y-2">{filteredInventory.map(item => { const isLow = (item.stock || 0) <= (item.min || 5); return (<div key={item.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isLow ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}><div className="flex items-center gap-4"><div className={`p-3 rounded-lg ${isLow ? 'bg-red-500 text-white' : 'bg-white/10'}`}>{isLow ? <AlertTriangle size={20}/> : <Box size={20}/>}</div><div><h4 className="font-bold">{item.name}</h4><p className="text-xs opacity-50">Mínimo: {item.min} {item.unit}</p></div></div><div className="flex items-center gap-4"><div className="flex items-center gap-2 bg-black/20 rounded-lg p-1"><button onClick={async()=>{ const n = Math.max(0, (item.stock||0)-1); const u = {...item, stock:n}; setInventory(inventory.map(i=>i.id===u.id?u:i)); await saveToSupabase('inventory', u.id, u); }} className="p-2 hover:bg-white/10 rounded"><Minus size={14}/></button><span className={`w-8 text-center font-bold ${isLow?'text-red-500':''}`}>{item.stock}</span><button onClick={async()=>{ const n = (item.stock||0)+1; const u = {...item, stock:n}; setInventory(inventory.map(i=>i.id===u.id?u:i)); await saveToSupabase('inventory', u.id, u); }} className="p-2 hover:bg-white/10 rounded"><Plus size={14}/></button></div><button onClick={()=>{setNewItem(item); setModal('addItem');}} className="p-2 text-white/50 hover:text-cyan-400"><Edit3 size={18}/></button></div></div>)})}</div></div>}
        {/* --- MÓDULO DE LABORATORIO EXTERNO --- */}
        {activeTab === 'lab' && (
            <div className="space-y-6 animate-in slide-in-from-bottom h-full">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3"><FlaskConical className={t.accent} size={28}/> Control de Laboratorio</h2>
                        <p className="text-xs opacity-50 mt-1">Gestiona los envíos y recepciones de coronas, prótesis y placas.</p>
                    </div>
                    <Button theme={themeMode} onClick={() => {
                        setNewLabWork({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
                        setModal('labWork');
                    }}>+ Nuevo Trabajo</Button>
                </div>

                <Card theme={themeMode}>
    {/* Agregamos 'w-full' aquí 👇 */}
    <div className="overflow-x-auto custom-scrollbar w-full"> 
        {/* Agregamos 'border-collapse' aquí 👇 */}
        <table className="w-full text-sm text-left border-collapse">
                            <thead className={`text-xs uppercase opacity-50 border-b ${t.border}`}>
                                <tr>
                                    <th className="px-5 py-4">Paciente</th>
                                    <th className="px-5 py-4">Trabajo</th>
                                    <th className="px-5 py-4 text-center">Pieza</th>
                                    <th className="px-5 py-4">Laboratorio</th>
                                    <th className="px-5 py-4">Envío</th>
                                    <th className="px-5 py-4">Entrega</th>
                                    <th className="px-5 py-4 text-center">Estado</th>
                                    <th className="px-5 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {labWorks.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-8 opacity-50 font-bold">No hay trabajos en curso. ¡Todo al día!</td></tr>
                                ) : (
                                    labWorks.sort((a,b) => new Date(a.expectedDate) - new Date(b.expectedDate)).map(work => {
                                        const isLate = new Date(work.expectedDate) < new Date() && work.status === 'sent';
                                        
                                        return (
                                        <tr key={work.id} className={`border-b ${t.border} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                                            <td className="px-5 py-5 font-bold min-w-[150px]">{work.patientName}</td>
                                            
                                            {/* CORRECCIÓN: El div ahora vive dentro de la celda */}
                                            <td className="px-5 py-5">
                                                <div className="max-w-[180px] truncate" title={work.workType}>{work.workType}</div>
                                            </td>
                                            
                                            <td className="px-5 py-5 text-center font-bold text-cyan-600 dark:text-cyan-400">{work.tooth || '-'}</td>
                                            <td className="px-5 py-5 whitespace-nowrap">{work.labName}</td>
                                            <td className="px-5 py-5 text-xs opacity-70 whitespace-nowrap">{work.sendDate}</td>
                                            <td className="px-5 py-5 font-bold whitespace-nowrap align-middle">
    <div className={`flex items-center gap-1 ${isLate ? 'text-red-500' : ''}`}>
        {isLate && <span>⚠️</span>} 
        <span>{work.expectedDate}</span>
    </div>
</td>
                                            <td className="px-5 py-5 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${work.status === 'received' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'}`}>
                                                    {work.status === 'received' ? '✅ Recibido' : '⏳ En Tránsito'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {work.status === 'sent' && (
                                                        <button onClick={async () => {
                                                            const updated = { ...work, status: 'received' };
                                                            setLabWorks(labWorks.map(w => w.id === work.id ? updated : w));
                                                            // ACTUALIZA EN SUPABASE
                                                            await supabase.from('lab_works').update({ status: 'received' }).eq('id', work.id);
                                                            if(typeof notify === 'function') notify("Trabajo marcado como RECIBIDO");
                                                        }} className="text-[10px] bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform font-bold">Recibir</button>
                                                    )}
                                                    <button onClick={async () => {
                                                        if(window.confirm("¿Seguro que deseas eliminar este registro?")){
                                                            setLabWorks(labWorks.filter(w => w.id !== work.id));
                                                            // BORRA DE SUPABASE
                                                            await supabase.from('lab_works').delete().eq('id', work.id);
                                                        }
                                                    }} className="p-1.5 text-red-500 opacity-50 hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        )}

      {/* --- SETTINGS (ACTUALIZADO: CON DATOS LEGALES MINSAL) --- */}
        {activeTab === 'settings' && <div className="space-y-6 animate-in slide-in-from-bottom h-full">
            <Card theme={themeMode} className="space-y-4">
                <div onClick={()=>logoInputRef.current.click()} className="p-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                    {config.logo ? <img src={config.logo} className="h-16 object-contain"/> : <><Camera className="mb-2 opacity-50"/><span className="text-xs font-bold opacity-50">SUBIR LOGO</span></>}
                </div>
                {userRole === 'admin' ? (
                    <>
                        <h3 className="text-xs font-black text-cyan-600 dark:text-cyan-500 mt-2 uppercase tracking-widest border-b border-white/10 pb-2">
                            Datos Generales
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField theme={themeMode} label="Nombre Clínica/Dr" value={config.name || ''} onChange={e=>setConfigLocal({...config, name:e.target.value})} />
                            <InputField theme={themeMode} label="RUT Profesional" value={config.rut || ''} onChange={e=>setConfigLocal({...config, rut: formatRUT(e.target.value)})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField theme={themeMode} label="Especialidad" value={config.specialty || ''} onChange={e=>setConfigLocal({...config, specialty:e.target.value})} />
                            <InputField theme={themeMode} label="Teléfono" value={config.phone || ''} onChange={e=>setConfigLocal({...config, phone:e.target.value})} />
                        </div>
                        
                        {/* --- NUEVA SECCIÓN: LEGAL MINSAL --- */}
                        <h3 className="text-xs font-black text-cyan-600 dark:text-cyan-500 mt-6 uppercase tracking-widest border-b border-white/10 pb-2">
                            Información Legal para Recetas (MINSAL)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField theme={themeMode} label="Registro Minsal (RNPI)" value={config.rnpi || ''} onChange={e=>setConfigLocal({...config, rnpi:e.target.value})} />
                            <InputField theme={themeMode} label="Universidad / Título" value={config.university || ''} onChange={e=>setConfigLocal({...config, university:e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <InputField theme={themeMode} label="Dirección Clínica" value={config.address || ''} onChange={e=>setConfigLocal({...config, address:e.target.value})} />
                        </div>
                        <p className="text-[10px] opacity-50 font-medium italic mb-2">
                            * El RUT, RNPI y la Universidad son obligatorios en Chile para la validez de recetas en farmacias.
                        </p>

                        <Button theme={themeMode} className="w-full mt-4" onClick={()=>{saveToSupabase('settings', 'general', config); notify("Ajustes Guardados");}}>GUARDAR DATOS</Button>
                    </>
                ) : <p className="text-center opacity-50 py-4">Contacta al administrador para editar datos.</p>}
            </Card>

            {/* GESTIÓN DE EQUIPO (SOLO ADMIN) */}
            {userRole === 'admin' && (
                <Card theme={themeMode} className="space-y-4 border-l-4 border-cyan-500">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Shield size={20}/> Gestión de Equipo</h3>
                    <div className="flex gap-2">
                        <InputField theme={themeMode} placeholder="Nombre" value={newMember.name} onChange={e=>setNewMember({...newMember, name:e.target.value})}/>
                        <InputField theme={themeMode} placeholder="Email" value={newMember.email} onChange={e=>setNewMember({...newMember, email:e.target.value})}/>
                        <select className={`bg-transparent border border-white/10 rounded-xl px-2 text-xs font-bold outline-none ${t.text}`} value={newMember.role} onChange={e=>setNewMember({...newMember, role:e.target.value})}><option className="bg-[#121212] text-white" value="admin">Admin</option><option className="bg-[#121212] text-white" value="dentist">Dentista</option><option className="bg-[#121212] text-white" value="assistant">Asistente</option></select>
                        <Button theme={themeMode} onClick={async()=>{ 
                            if(newMember.email && newMember.name){ 
                                const id=Date.now().toString(); 
                                const u={...newMember, id}; 
                                setTeam([...team, u]); 
                                await saveToSupabase('team', id, u); 
                                setNewMember({name:'', email:'', role:'dentist'}); 
                                notify("Usuario Agregado"); 
                            } 
                        }}><Plus/></Button>
                    </div>
                    <div className="space-y-2">
                        {team.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div><p className="font-bold">{member.name}</p><p className="text-[10px] opacity-50">{member.email}</p></div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/10 ${member.role==='admin'?'text-emerald-400':member.role==='dentist'?'text-blue-400':'text-stone-400'}`}>{member.role}</span>
                                    <button onClick={async()=>{ const f=team.filter(t=>t.id!==member.id); setTeam(f); await supabase.from('team').delete().eq('id', member.id); }} className="text-red-500 opacity-50 hover:opacity-100"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>}     

           {/* --- NUEVO COTIZADOR CLINICO (ARANCEL) --- */}
        {activeTab === 'quote' && (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') && (
            <div className="space-y-6 animate-in slide-in-from-bottom h-full">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator className={t.accent}/> Creador de Presupuestos</h2>
                        <p className="text-xs opacity-50 mt-1">Arma presupuestos de forma rápida y envíalos directo a caja.</p>
                    </div>
                    <Button theme={themeMode} variant="secondary" onClick={() => setQuoteItems([])}>Limpiar Lista</Button>
                </div>
                
                <Card theme={themeMode} className="space-y-6">
                 <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
                        if (p.id === 'new') {
                            let nombreReal = p.name;
                            if (!nombreReal || nombreReal.trim() === "") { nombreReal = window.prompt("Confirma el nombre:"); if (!nombreReal) return; }
                            const newId = "pac_" + Date.now().toString();
                            const newPatient = getPatient(newId);
                            newPatient.id = newId; newPatient.name = nombreReal;
                            if (!newPatient.personal) newPatient.personal = {};
                            newPatient.personal.legalName = nombreReal;
                            savePatientData(newId, newPatient);
                            setSessionData({...sessionData, patientName: nombreReal, patientId: newId});
                            notify("Paciente Creado");
                        } else {
                            // 👇 MAGIA INYECTADA AQUÍ 👇
                            setPatientRecords(prev => ({...prev, [p.id]: p}));
                            
                            setSessionData({...sessionData, patientName: p.personal?.legalName || p.name, patientId: p.id});
                        }
                    }} />
                    
                    {sessionData.patientId && (
                        /* Reemplazamos border-white/10 por t.border para la línea separadora */
                        <div className={`animate-in fade-in space-y-4 border-t ${t.border} pt-4`}>
                            <h3 className="font-bold">Agregar Procedimientos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="md:col-span-2 relative">
                                    {/* AQUÍ ESTÁ EL ARREGLO DEL BUSCADOR: Agregamos border-2 y colores dinámicos forzados para que no desaparezca */}
                                    <input 
                                        list="arancel-options"
                                        className={`w-full outline-none font-bold text-sm p-3 rounded-2xl border-2 border-black/10 dark:border-white/10 ${t.inputBg} ${t.text} focus:border-cyan-400 transition-all`}
                                        placeholder="Procedimiento (Busca o escribe)"
                                        value={newQuoteItem.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const found = catalog.find(c => c.name === val);
                                            if (found) { setNewQuoteItem({...newQuoteItem, name: val, price: found.price}); } 
                                            else { setNewQuoteItem({...newQuoteItem, name: val}); }
                                        }}
                                    />
                                    <datalist id="arancel-options">
                                        {catalog.map(c => <option key={c.id} value={c.name} />)}
                                    </datalist>
                                </div>
                                <div><InputField theme={themeMode} placeholder="N° Diente (Opcional)" value={newQuoteItem.tooth} onChange={e=>setNewQuoteItem({...newQuoteItem, tooth:e.target.value})}/></div>
                                <div className="md:col-span-2 flex gap-2">
                                    <InputField theme={themeMode} type="number" placeholder="$ Valor" value={newQuoteItem.price} onChange={e=>setNewQuoteItem({...newQuoteItem, price:e.target.value})}/>
                                    <Button theme={themeMode} onClick={()=>{
                                        if(newQuoteItem.name && newQuoteItem.price) {
                                            setQuoteItems([...quoteItems, { id: Date.now(), name: newQuoteItem.name, tooth: newQuoteItem.tooth, price: Number(newQuoteItem.price) }]);
                                            setNewQuoteItem({name:'', price:'', tooth:''});
                                        }
                                    }}><Plus/></Button>
                                </div>
                            </div>

                            {/* Limpiamos el bg-black/20 y pusimos un fondo suave que se adapta al tema */}
                            <div className={`rounded-xl p-4 space-y-2 mt-4 max-h-48 overflow-y-auto bg-black/5 dark:bg-white/5 border ${t.border}`}>
                                {quoteItems.length === 0 ? <p className="text-center text-xs opacity-50 py-4">El presupuesto está vacío.</p> : (
                                    quoteItems.map((item) => (
                                        <div key={item.id} className={`flex justify-between items-center text-sm border-b ${t.border} pb-2 last:border-0 hover:opacity-70 transition-colors p-1 rounded`}>
                                            <div>
                                                <span className="font-bold">{item.name}</span>
                                                {item.tooth && <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/20">Diente {item.tooth}</span>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400">${item.price.toLocaleString()}</span>
                                                <button onClick={()=>setQuoteItems(quoteItems.filter(i=>i.id !== item.id))} className="text-red-500 opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={`flex justify-between items-center py-4 border-t border-b ${t.border} my-4`}>
                                <span className="text-sm font-bold opacity-50 uppercase tracking-widest">Total Presupuesto</span>
                                <h3 className="text-4xl font-black text-cyan-600 dark:text-cyan-400">${quoteItems.reduce((acc, item) => acc + item.price, 0).toLocaleString()}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button theme={themeMode} disabled={quoteItems.length===0} onClick={async ()=>{ 
                                    const total = quoteItems.reduce((acc, item) => acc + item.price, 0);
                                    const id = Date.now().toString(); 
                                    const detalle = quoteItems.map(i => `${i.name}${i.tooth ? ` (D${i.tooth})` : ''}`).join(' + ');
                                    
                                    await saveToSupabase('financials', id, {
                                        id, total: total, paid: 0, payments: [], patientName: sessionData.patientName, 
                                        date: getLocalDate(), type: 'income', description: detalle
                                    }); 
                                    
                                    notify("Aprobado y enviado a Caja"); 
                                    setQuoteItems([]);
                                    setActiveTab('history');
                                }}>✅ APROBAR Y ENVIAR A CAJA</Button>
                                
                                <Button theme={themeMode} variant="secondary" disabled={quoteItems.length===0} onClick={()=>generatePDF('quote', quoteItems)}>
                                    <Printer/> IMPRIMIR / PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        )}
       {/* --- AGENDA FLEXIBLE ACTUALIZADA --- */}
{activeTab === 'agenda' && <div className="space-y-4 h-full flex flex-col">
    <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Agenda Semanal</h2>
            <div className={`flex items-center gap-2 rounded-xl p-1 border ${t.border} ${t.cardBg}`}>
                <button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d)}} className="p-2 rounded hover:opacity-50 transition-opacity"><ChevronLeft size={16}/></button>
                <button onClick={()=>setCurrentDate(new Date())} className="text-xs font-bold px-2">HOY</button>
                <button onClick={()=>{const d=new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d)}} className="p-2 rounded hover:opacity-50 transition-opacity"><ChevronRight size={16}/></button>
            </div>
        </div>
        <div className="hidden md:flex gap-2 text-[9px] font-bold uppercase opacity-60">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-stone-500"></div>Agendado</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Confirmado</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>En Espera</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Atendiendo</span>
        </div>
        <Button theme={themeMode} onClick={()=>{setNewAppt({name: '', treatment: '', date: '', time: '', duration: 60, status: 'agendado', id: null}); setModal('appt');}}><Plus/> Agendar</Button>
    </div>
    
    <div className={`flex-1 overflow-auto rounded-2xl border ${t.border} ${t.cardBg} custom-scrollbar`}>
        <div className="grid grid-cols-8 min-w-[800px]">
            {/* Usamos t.bg para que el fondo pegajoso tome el color sólido exacto de tu tema */}
            <div className={`p-4 border-b border-r ${t.border} text-xs font-bold text-center opacity-50 sticky top-0 z-20 ${t.bg}`}>HORA</div>
            {Array.from({length:7}, (_,i)=>{const d=new Date(currentDate); d.setDate(d.getDate()-d.getDay()+1+i); return d;}).map(d => (
                <div key={d} className={`p-4 border-b ${t.border} text-center sticky top-0 z-20 ${t.bg} ${d.toDateString()===new Date().toDateString() ? t.accent : ''}`}>
                    <p className="text-xs font-bold opacity-70">{['LUN','MAR','MIE','JUE','VIE','SAB','DOM'][d.getDay()===0?6:d.getDay()-1]}</p>
                    <p className="text-xl font-black">{d.getDate()}</p>
                </div>
            ))}
            
            {Array.from({length:12}, (_,i)=>8+i).map(h => (
                <React.Fragment key={h}>
                    <div className="p-2 border-r border-b border-white/5 text-xs font-bold opacity-50 text-center h-24">{h}:00</div>
                    {Array.from({length:7}, (_,i)=>{const d=new Date(currentDate); d.setDate(d.getDate()-d.getDay()+1+i); return d;}).map(d => { 
                        const dateStr = d.toISOString().split('T')[0]; 
                        const appt = appointments.find(a => a.date === dateStr && parseInt(a.time.split(':')[0]) === h); 
                        
                        // Diccionario de colores según estado
                        const statusColors = {
                            agendado: 'border-stone-500 bg-stone-500/20 text-stone-300',
                            confirmado: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
                            espera: 'border-yellow-500 bg-yellow-500/20 text-yellow-300',
                            atendiendo: 'border-blue-500 bg-blue-500/20 text-blue-300',
                            no_asistio: 'border-red-500 bg-red-500/20 text-red-300'
                        };

                        return (
                            <div key={d+h} className={`border-b border-white/5 border-r relative group h-24 transition-all hover:bg-white/5 ${!appt ? 'cursor-pointer' : ''}`} onClick={()=>{if(!appt) { setNewAppt({name: '', treatment: '', date: dateStr, time: `${h.toString().padStart(2, '0')}:00`, duration: 60, status: 'agendado', id: null}); setModal('appt'); }}}>
                                {appt && (
                                    <div 
                                        onClick={(e)=>{e.stopPropagation(); setNewAppt(appt); setModal('appt');}}
                                        className={`absolute top-0 left-0 w-full rounded-xl border-l-4 shadow-lg flex flex-col justify-between cursor-pointer hover:scale-105 transition-all p-2 z-10 overflow-hidden ${statusColors[appt.status || 'agendado']}`}
                                        style={{ height: `${(appt.duration || 60) / 60 * 100}%`, minHeight: '60px' }}
                                    >
                                        <div>
                                            <p className="text-xs font-black truncate leading-tight">{appt.name}</p>
                                            <p className="text-[9px] opacity-80 truncate">{appt.time} • {appt.treatment}</p>
                                        </div>
                                    </div>
                                )}
                                {!appt && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus size={14} className="opacity-50"/></div>}
                            </div>
                        ) 
                    })}
                </React.Fragment>
            ))}
        </div>
    </div>
</div>}
        {activeTab === 'ficha' && !selectedPatientId && (
            <div className="space-y-4 animate-in slide-in-from-bottom">
                <div className="flex gap-2">
                    <PatientSelect 
                        theme={themeMode} 
                        patients={patientRecords} 
                        placeholder="Buscar o Crear Paciente..." 
                        onSelect={(p) => { 
                            if (p.id === 'new') { 
                                let nombreReal = p.name;
                                
                                // Red de seguridad por si el nombre llega vacío
                                if (!nombreReal || nombreReal.trim() === "") {
                                    nombreReal = window.prompt("Confirma el nombre del nuevo paciente:");
                                    if (!nombreReal) return; 
                                }

                                const newId = "pac_" + Date.now().toString(); 
                                
                                const newPatient = getPatient(newId);
                                newPatient.id = newId;
                                newPatient.name = nombreReal;
                                if (!newPatient.personal) newPatient.personal = {};
                                newPatient.personal.legalName = nombreReal;
                                
                                savePatientData(newId, newPatient); 
                                setSelectedPatientId(newId); 
                                notify("Paciente Creado Exitosamente");
                            } else { 
                                // 👇 LA MAGIA ESTÁ EXACTAMENTE AQUÍ 👇
                                // Inyectamos el paciente de la nube a la memoria local antes de abrirlo
                                setPatientRecords(prev => ({...prev, [p.id]: p}));
                                setSelectedPatientId(p.id); 
                            } 
                        }} 
                    />
                </div>
                <div className="grid gap-2">
                    {Object.keys(patientRecords).map(k => (
                        <Card key={k} theme={themeMode} onClick={() => setSelectedPatientId(k)} className="cursor-pointer py-4 flex justify-between items-center">
                            <span className="font-bold capitalize">{patientRecords[k]?.personal?.legalName || 'Paciente sin nombre'}</span>
                            <ArrowRight size={14}/>
                        </Card>
                    ))}
                </div>
            </div>
        )}
        
        {activeTab === 'ficha' && selectedPatientId && <div className="space-y-4 animate-in slide-in-from-right">
            <button onClick={()=>setSelectedPatientId(null)} className="flex items-center gap-2 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"><ArrowLeft size={14}/> VOLVER AL BUSCADOR</button>
            
            <div className="flex justify-between items-start">
                <h2 className="text-3xl font-black capitalize">{getPatient(selectedPatientId).personal?.legalName || 'Paciente'}</h2>
            </div>

            {/* --- BANNER DE ALERTA MÉDICA GLOBAL --- */}
            {(() => {
                const p = getPatient(selectedPatientId);
                const criticalConditions = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Coagulopatía', 'Epilepsia'];
                const activeAlerts = Object.entries(p.anamnesis?.conditions || {}).filter(([k, v]) => v && criticalConditions.includes(k)).map(([k]) => k);
                
                if (activeAlerts.length > 0 || (p.anamnesis?.remote && p.anamnesis.remote.toLowerCase().includes('alergia'))) {
                    return (
                        <div className="w-full bg-red-500/20 border-2 border-red-500/50 p-3 rounded-xl flex items-center gap-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <AlertTriangle className="text-red-500 shrink-0" size={24}/>
                            <div>
                                <p className="text-xs font-black text-red-500 uppercase tracking-widest leading-none">Alerta Médica Activa</p>
                                <p className="text-sm font-bold text-red-400 mt-0.5">{activeAlerts.join(' • ')} {(p.anamnesis?.remote && p.anamnesis.remote.toLowerCase().includes('alergia')) ? '• Revisar Alergias en Anamnesis' : ''}</p>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">{[{id:'personal', label:'Datos', icon: User}, {id:'anamnesis', label:'Fichas / Anam.', icon: FileQuestion, restricted: true}, {id:'clinical', label:'Odontograma', icon: Activity}, {id:'perio', label:'Periodontograma', icon: FileBarChart, restricted: true}, {id:'evolution', label:'Evolución', icon: FileText, restricted: true}, {id:'consent', label:'Consentimientos', icon: FileSignature}, {id:'images', label:'Galería', icon: ImageIcon}].map(b=>{
            if (userRole === 'assistant' && b.restricted) return null; // V76: Role Protection
            return (<button key={b.id} onClick={()=>setPatientTab(b.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap ${patientTab===b.id?t.accentBg:'bg-white/5'}`}>{b.label}</button>)
        })}</div>{patientTab === 'personal' && <Card theme={themeMode} className="space-y-4"><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Nombre Completo" value={getPatient(selectedPatientId).personal.legalName} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, legalName: e.target.value}})} /><InputField theme={themeMode} label="RUT / DNI" value={getPatient(selectedPatientId).personal?.rut || ''} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, rut: formatRUT(e.target.value)}})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Email" icon={Mail} value={getPatient(selectedPatientId).personal.email} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, email: e.target.value}})} /><div className="flex items-end gap-2"><InputField theme={themeMode} label="Teléfono" icon={Phone} value={getPatient(selectedPatientId).personal.phone} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, phone: e.target.value}})} />{getPatient(selectedPatientId).personal.phone && <button onClick={()=>sendWhatsApp(getPatient(selectedPatientId).personal.phone, "Hola, me comunico de ShiningCloud Dental.")} className="p-3 bg-emerald-500 rounded-xl text-white mb-[2px]"><MessageCircle size={18}/></button>}</div></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Fecha Nacimiento" type="date" value={getPatient(selectedPatientId).personal.birthDate} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, birthDate: e.target.value}})} /><InputField theme={themeMode} label="Ocupación" value={getPatient(selectedPatientId).personal.occupation} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, occupation: e.target.value}})} /></div><InputField theme={themeMode} label="Dirección" icon={MapPin} value={getPatient(selectedPatientId).personal.address} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, address: e.target.value}})} /><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Ciudad" value={getPatient(selectedPatientId).personal.city} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, city: e.target.value}})} /><InputField theme={themeMode} label="Comuna" value={getPatient(selectedPatientId).personal.commune} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, commune: e.target.value}})} /></div><div className="grid grid-cols-2 gap-4"><InputField theme={themeMode} label="Previsión" value={getPatient(selectedPatientId).personal.convention} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, convention: e.target.value}})} /><InputField theme={themeMode} label="Apoderado (Si aplica)" value={getPatient(selectedPatientId).personal.guardian} onChange={e=>savePatientData(selectedPatientId, {...getPatient(selectedPatientId), personal: {...getPatient(selectedPatientId).personal, guardian: e.target.value}})} /></div></Card>}
                {patientTab === 'anamnesis' && (() => {
                    const p = getPatient(selectedPatientId);
                    
                    // Inicializadores seguros de borradores
                    const drafts = p.anamnesis?.drafts || { general: {}, cirugia: {}, endodoncia: {} };
                    const history = p.anamnesis?.history || [];
                    
                    const setDraft = (type, field, value) => {
                        savePatientData(selectedPatientId, { ...p, anamnesis: { ...p.anamnesis, drafts: { ...drafts, [type]: { ...drafts[type], [field]: value } } } });
                    };

                    const saveFinalForm = (type) => {
                        if (!window.confirm(`¿Guardar esta Ficha de ${type} como definitiva? No se podrá editar después.`)) return;
                        
                        const newForm = {
                            id: Date.now().toString(),
                            type: type,
                            date: new Date().toLocaleString(),
                            author: session?.user?.email,
                            data: { ...drafts[type] }
                        };
                        
                        // Guardamos en el historial y limpiamos el borrador
                        savePatientData(selectedPatientId, { 
                            ...p, 
                            anamnesis: { 
                                ...p.anamnesis, 
                                history: [newForm, ...history],
                                drafts: { ...drafts, [type]: {} } // Limpia el formulario
                            } 
                        });
                        notify(`Ficha de ${type} guardada en el historial`);
                        setViewingForm(newForm); // Lo abrimos en modo lectura
                    };

                    // Datos activos según si estamos viendo el historial o escribiendo un borrador
                    const activeData = viewingForm ? viewingForm.data : drafts[activeFormType];
                    const isReadOnly = viewingForm !== null;

                    return (
                        <div className="space-y-4 animate-in fade-in h-full flex flex-col">
                            
                            {/* CABECERA Y NAVEGACIÓN */}
                            <div className="flex justify-between items-center mb-2">
                                {isReadOnly ? (
                                    <div className="flex items-center gap-3">
                                        <button onClick={()=>setViewingForm(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"><ArrowLeft size={14} className="inline mr-1"/> Volver a Edición</button>
                                        <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">Ficha Histórica: {viewingForm.type}</span>
                                        <span className="text-[10px] opacity-50 bg-black/20 px-2 py-1 rounded border border-white/5">{viewingForm.date} • {viewingForm.author}</span>
                                    </div>
                                ) : (
                                    <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar w-full">
                                        <button onClick={()=>setActiveFormType('general')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='general'?t.accentBg:'opacity-50'}`}>📋 Ficha General</button>
                                        <button onClick={()=>setActiveFormType('cirugia')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='cirugia'?'bg-red-500 text-white':'opacity-50'}`}>🔪 Cirugía</button>
                                        <button onClick={()=>setActiveFormType('endodoncia')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='endodoncia'?'bg-purple-500 text-white':'opacity-50'}`}>🔬 Endodoncia</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6">
                                {/* --- 1. FICHA GENERAL EXTENDIDA --- */}
                        {(isReadOnly ? viewingForm.type === 'general' : activeFormType === 'general') && (
                            <Card theme={themeMode} className="space-y-6 border-t-2 border-t-amber-500 animate-in slide-in-from-left">
                                <h3 className="font-black text-amber-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Anamnesis y Examen General</h3>
                                
                                {/* ALARMAS GLOBALES (Siempre editables, actualizan el Banner Rojo al instante) */}
                                {!isReadOnly && (
                                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl mb-4">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Alertas Médicas Globales</p>
                                        <div className="flex flex-wrap gap-2">
                                            {ANAMNESIS_TAGS.map(tag => {
                                                const isActive = getPatient(selectedPatientId).anamnesis?.conditions?.[tag];
                                                return (
                                                    <button key={tag} onClick={() => { 
                                                        const pat = getPatient(selectedPatientId); 
                                                        const newCond = { ...pat.anamnesis.conditions, [tag]: !isActive }; 
                                                        savePatientData(selectedPatientId, { ...pat, anamnesis: { ...pat.anamnesis, conditions: newCond } }); 
                                                    }} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${isActive ? 'bg-red-500 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-stone-400 hover:border-white/30'}`}>{tag}</button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">1. Motivo de Consulta</h4>
                                    <InputField theme={themeMode} textarea label="Motivo de Consulta (En palabras del paciente)" disabled={isReadOnly} value={activeData.motivo || ''} onChange={e=>setDraft('general', 'motivo', e.target.value)} />
                                    <InputField theme={themeMode} textarea label="Historia de la Enfermedad Actual" disabled={isReadOnly} value={activeData.enfermedadActual || ''} onChange={e=>setDraft('general', 'enfermedadActual', e.target.value)} />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">2. Antecedentes Remotos</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Antecedentes Médicos y Quirúrgicos" disabled={isReadOnly} value={activeData.medicos || ''} onChange={e=>setDraft('general', 'medicos', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Fármacos en Uso y Alergias Detalladas" disabled={isReadOnly} value={activeData.farmacosAlergias || ''} onChange={e=>setDraft('general', 'farmacosAlergias', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Hábitos (Tabaco, Alcohol, Bruxismo, etc.)" disabled={isReadOnly} value={activeData.habitos || ''} onChange={e=>setDraft('general', 'habitos', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Antecedentes Odontológicos (Traumas, Ortodoncia previa)" disabled={isReadOnly} value={activeData.odontologicos || ''} onChange={e=>setDraft('general', 'odontologicos', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">3. Examen Físico</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Examen Extraoral (ATM, Asimetrías, Ganglios)" disabled={isReadOnly} value={activeData.extraoral || ''} onChange={e=>setDraft('general', 'extraoral', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Examen Intraoral (Mucosas, Lengua, Piso de boca)" disabled={isReadOnly} value={activeData.intraoral || ''} onChange={e=>setDraft('general', 'intraoral', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField theme={themeMode} textarea label="Examen de Oclusión (Clase Angle, Overjet, Guías)" disabled={isReadOnly} value={activeData.oclusion || ''} onChange={e=>setDraft('general', 'oclusion', e.target.value)} />
                                        <InputField theme={themeMode} textarea label="Examen Periodontal Inicial (Biotipo, Higiene, Sangrado)" disabled={isReadOnly} value={activeData.periodonto || ''} onChange={e=>setDraft('general', 'periodonto', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-amber-500/20 pb-1">4. Conclusión</h4>
                                    <InputField theme={themeMode} textarea label="Diagnóstico Clínico Integral" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('general', 'diagnostico', e.target.value)} />
                                    <InputField theme={themeMode} textarea label="Plan de Tratamiento (Fases)" disabled={isReadOnly} value={activeData.plan || ''} onChange={e=>setDraft('general', 'plan', e.target.value)} />
                                </div>
                            </Card>
                        )}

                                {/* --- 2. FICHA PRE-QUIRÚRGICA --- */}
                                {(isReadOnly ? viewingForm.type === 'cirugia' : activeFormType === 'cirugia') && (
                                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-red-500">
                                        <h3 className="font-black text-red-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Protocolo Pre-Quirúrgico</h3>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">ASA</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.asa || ''} onChange={e=>setDraft('cirugia', 'asa', e.target.value)}>
                                                    <option value="">Seleccione...</option><option value="I">ASA I</option><option value="II">ASA II</option><option value="III">ASA III</option>
                                                </select>
                                            </div>
                                            <InputField theme={themeMode} label="Presión Art." placeholder="120/80" disabled={isReadOnly} value={activeData.pa || ''} onChange={e=>setDraft('cirugia', 'pa', e.target.value)} />
                                            <InputField theme={themeMode} label="Frec. Card." placeholder="Lpm" disabled={isReadOnly} value={activeData.fc || ''} onChange={e=>setDraft('cirugia', 'fc', e.target.value)} />
                                            <InputField theme={themeMode} label="HGT (Glicemia)" placeholder="mg/dl" disabled={isReadOnly} value={activeData.hgt || ''} onChange={e=>setDraft('cirugia', 'hgt', e.target.value)} />
                                        </div>

                                        <InputField theme={themeMode} textarea label="Sistemática Radiográfica" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('cirugia', 'rx', e.target.value)} />
                                        
                                        <div className="space-y-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                                            <InputField theme={themeMode} textarea label="Diagnóstico Quirúrgico" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('cirugia', 'diagnostico', e.target.value)} />
                                            <InputField theme={themeMode} textarea label="Paso a paso Quirúrgico (Técnica)" disabled={isReadOnly} value={activeData.tecnica || ''} onChange={e=>setDraft('cirugia', 'tecnica', e.target.value)} />
                                        </div>
                                    </Card>
                                )}

                                {/* --- 3. FICHA ENDODONCIA --- */}
                                {(isReadOnly ? viewingForm.type === 'endodoncia' : activeFormType === 'endodoncia') && (
                                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-purple-500">
                                        <h3 className="font-black text-purple-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Evaluación Endodóntica</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputField theme={themeMode} label="Diente a Tratar" type="number" placeholder="Ej: 36" disabled={isReadOnly} value={activeData.diente || ''} onChange={e=>setDraft('endodoncia', 'diente', e.target.value)} />
                                            <div className="md:col-span-2">
                                                <InputField theme={themeMode} label="Semiología del Dolor" placeholder="Localización, cronología, alivio..." disabled={isReadOnly} value={activeData.dolor || ''} onChange={e=>setDraft('endodoncia', 'dolor', e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Pruebas Sensibilidad (Frío)</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.frio || ''} onChange={e=>setDraft('endodoncia', 'frio', e.target.value)}>
                                                    <option value="">Seleccione...</option><option value="Normal">Normal</option><option value="Aumentada (+)">Aumentada (+)</option><option value="Disminuida (-)">Disminuida (-)</option><option value="Sin Respuesta">Sin Respuesta</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Percusión / Palpación</label>
                                                <input className={`w-full p-3 rounded-xl border text-sm font-bold outline-none ${t.inputBg} ${t.text} ${t.border}`} placeholder="Vertical (+), Horizontal (-)..." disabled={isReadOnly} value={activeData.percusion || ''} onChange={e=>setDraft('endodoncia', 'percusion', e.target.value)} />
                                            </div>
                                        </div>

                                        <InputField theme={themeMode} textarea label="Examen Radiográfico (Raíces, conductos, zona apical)" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('endodoncia', 'rx', e.target.value)} />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Diagnóstico Pulpar</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.dxPulpar || ''} onChange={e=>setDraft('endodoncia', 'dxPulpar', e.target.value)}>
                                                    <option value="">Seleccione...</option>
                                                    <option value="Pulpa Normal">Pulpa Normal</option>
                                                    <option value="Pulpitis Reversible">Pulpitis Reversible</option>
                                                    <option value="Pulpitis Irreversible Sintomática">Pulpitis Irreversible Sintomática</option>
                                                    <option value="Pulpitis Irreversible Asintomática">Pulpitis Irreversible Asintomática</option>
                                                    <option value="Necrosis Pulpar">Necrosis Pulpar</option>
                                                    <option value="Diente Previamente Tratado">Diente Previamente Tratado</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Diagnóstico Periapical</label>
                                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.dxPeriapical || ''} onChange={e=>setDraft('endodoncia', 'dxPeriapical', e.target.value)}>
                                                    <option value="">Seleccione...</option>
                                                    <option value="Tejido Apical Normal">Tejido Apical Normal</option>
                                                    <option value="Periodontitis Apical Sintomática">Periodontitis Apical Sintomática</option>
                                                    <option value="Periodontitis Apical Asintomática">Periodontitis Apical Asintomática</option>
                                                    <option value="Absceso Apical Agudo">Absceso Apical Agudo</option>
                                                    <option value="Absceso Apical Crónico">Absceso Apical Crónico</option>
                                                </select>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* BOTÓN DE GUARDADO (SOLO EN MODO BORRADOR) */}
                                {!isReadOnly && (
                                    <button onClick={() => saveFinalForm(activeFormType)} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30">
                                        💾 GUARDAR FICHA DEFINITIVA
                                    </button>
                                )}

                                {/* LISTA DE FICHAS HISTÓRICAS DE ESTE PACIENTE */}
                                {!isReadOnly && (
                                    <div className="pt-6 border-t border-white/10 mt-6">
                                        <h4 className="font-bold text-sm mb-3">Historial de Fichas Guardadas</h4>
                                        {history.length === 0 ? (
                                            <p className="text-xs opacity-50 text-center py-4 border border-dashed border-white/10 rounded-xl">No hay fichas históricas guardadas.</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {history.map(form => (
                                                    <div key={form.id} onClick={() => setViewingForm(form)} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${form.type==='general'?'bg-amber-500/20 text-amber-500':form.type==='cirugia'?'bg-red-500/20 text-red-500':'bg-purple-500/20 text-purple-500'}`}>
                                                                <FileText size={16}/>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm capitalize">Ficha {form.type}</p>
                                                                <p className="text-[10px] opacity-50">{form.date}</p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"/>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}                {/* --- ODONTOGRAMA DUAL ACTUALIZADO --- */}
{patientTab === 'clinical' && <Card theme={themeMode} className="flex flex-col items-center gap-8">
    <div className="flex bg-white/5 p-1 rounded-xl w-full max-w-md mx-auto mb-2">
        <button onClick={()=>setOdontogramMode('hallazgos')} className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all ${odontogramMode==='hallazgos'?t.accentBg:'opacity-50'}`}>🔍 Hallazgos (Diagnóstico)</button>
        <button onClick={()=>setOdontogramMode('tratamientos')} className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all ${odontogramMode==='tratamientos'?'bg-emerald-500 text-white':'opacity-50'}`}>🛠️ Plan de Tratamiento</button>
    </div>
    
    <div className="flex gap-2 flex-wrap justify-center">
        {TEETH_UPPER.map(n=><Tooth key={n} number={n} mode={odontogramMode} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: getPatient(selectedPatientId).clinical.teeth[n]?.treatment || {name:'', status:'planned'}}); setModal('tooth');}} theme={themeMode}/>)}
    </div>
    <div className="flex gap-2 flex-wrap justify-center">
        {TEETH_LOWER.map(n=><Tooth key={n} number={n} mode={odontogramMode} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: getPatient(selectedPatientId).clinical.teeth[n]?.treatment || {name:'', status:'planned'}}); setModal('tooth');}} theme={themeMode}/>)}
    </div>
    {/* --- LISTA DE RESUMEN Y ATAJO AL COTIZADOR --- */}
        <div className="w-full mt-6 space-y-4">
           <h3 className="font-bold border-b border-white/10 pb-3 flex justify-between items-center">
                <span>📋 Resumen del Odontograma</span>
                {/* Botón Mágico que recolecta los dientes y lleva los datos al cotizador */}
                {(userRole === 'admin' || userRole === 'dentist') && (
                    <button onClick={() => {
                        const pData = getPatient(selectedPatientId);
                        const teeth = pData.clinical?.teeth || {};
                        const newQuoteItems = [];
                        
                        // 1. Recorrer los 32 dientes buscando tratamientos "Por hacer"
                        [...TEETH_UPPER, ...TEETH_LOWER].forEach(n => {
                            const tData = teeth[n];
                            if (tData && tData.treatment && tData.treatment.name && tData.treatment.status !== 'completed') {
                                // Buscar el precio en el catálogo
                                const catalogItem = catalog.find(c => c.name === tData.treatment.name);
                                
                                newQuoteItems.push({
                                    id: Date.now() + Math.random(), // ID único
                                    name: tData.treatment.name,
                                    tooth: n.toString(),
                                    price: catalogItem ? Number(catalogItem.price) : 0 // Si no lo encuentra en el arancel, pone $0
                                });
                            }
                        });

                        // 2. Si encontró tratamientos, los carga a la lista de cobro
                        if (newQuoteItems.length > 0) {
                            setQuoteItems(newQuoteItems);
                            notify(`¡Magia! Se importaron ${newQuoteItems.length} tratamientos al cotizador.`);
                        }

                        // 3. Viaje a la pestaña del cotizador
                        setActiveTab('quote');
                        setSessionData({...sessionData, patientName: pData.personal?.legalName || pData.name, patientId: selectedPatientId});
                    }} className="text-[10px] bg-emerald-500 text-white px-4 py-2 rounded-xl uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                        Generar Presupuesto 💰
                    </button>
                )}
            </h3>
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {/* Filtramos y mostramos solo los dientes que tienen algún dato */}
                {[...TEETH_UPPER, ...TEETH_LOWER].map(n => {
                    const toothData = getPatient(selectedPatientId).clinical.teeth[n];
                    if (!toothData) return null;
                    
                    const hasFaces = toothData.faces && Object.values(toothData.faces).some(v => v);
                    const hasNotes = toothData.notes && toothData.notes.trim() !== '';
                    const hasTreatment = toothData.treatment && toothData.treatment.name;
                    
                    if (toothData.status || hasFaces || hasNotes || hasTreatment) {
                        return (
                            <div key={n} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...toothData, faces: toothData.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: toothData.treatment || {name:'', status:'planned'}}); setModal('tooth');}} className="flex flex-col md:flex-row gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-black/40 flex items-center justify-center font-black text-lg text-cyan-400 group-hover:scale-110 transition-transform">{n}</div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <span className="font-bold text-stone-400 uppercase text-[9px] block mb-0.5">Diagnóstico</span>
                                        <span className="font-bold">{toothData.status === 'missing' ? 'Ausente' : toothData.status === 'caries' ? 'Caries' : toothData.status === 'filled' ? 'Restauración' : toothData.status === 'crown' ? 'Corona' : 'Sano'}</span>
                                        {hasFaces && <span className="ml-1 opacity-70">({Object.entries(toothData.faces).filter(([k,v])=>v).map(([k,v])=>k.toUpperCase()).join(', ')})</span>}
                                    </div>
                                    <div>
                                        <span className="font-bold text-stone-400 uppercase text-[9px] block mb-0.5">Observaciones</span>
                                        <span className="opacity-80">{toothData.notes || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-stone-400 uppercase text-[9px] block mb-0.5">Tratamiento Planificado</span>
                                        {hasTreatment ? (
                                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${toothData.treatment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {toothData.treatment.name} {toothData.treatment.status === 'completed' ? '(Listo)' : '(Por Hacer)'}
                                            </span>
                                        ) : <span className="opacity-50">-</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
                
                {/* Mensaje si el odontograma está vacío */}
                {![...TEETH_UPPER, ...TEETH_LOWER].some(n => {
                    const d = getPatient(selectedPatientId).clinical.teeth[n];
                    return d && (d.status || (d.faces && Object.values(d.faces).some(v=>v)) || d.notes || d.treatment?.name);
                }) && (
                    <div className="text-center py-8 opacity-40 border border-dashed border-white/10 rounded-xl">
                        <p>No hay hallazgos registrados aún.</p>
                        <p className="text-[10px]">Haz clic en un diente para comenzar.</p>
                    </div>
                )}
            </div>
        </div>
</Card>}
{patientTab === 'perio' && (
    <div className="space-y-4">
        {/* ENCABEZADO Y BOTÓN DE HISTORIAL */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div>
                <h2 className="text-xl font-black text-cyan-500">Periodontograma Clínico</h2>
                <p className="text-[10px] opacity-50 uppercase tracking-widest font-bold">Modo Evolutivo Integrado</p>
            </div>
            <button 
                onClick={savePerioSnapshot} 
                className="mt-3 md:mt-0 px-5 py-2.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2"
            >
                <span className="text-sm">💾</span> Guardar Evolución
            </button>
        </div>
        
        {/* --- TARJETAS DE ÍNDICES (INTACTAS) --- */}
        <div className="grid grid-cols-2 gap-4">
            <Card theme={themeMode} className="bg-red-500/10 border-red-500/20 text-center">
                <p className="text-red-500 font-bold text-xs uppercase">Índice Sangrado (BOP)</p>
                <h2 className="text-4xl font-black text-red-500">{getPerioStats().bop}%</h2>
                <p className="text-[10px] opacity-50">Calculado sobre 6 puntos</p>
            </Card>
            <Card theme={themeMode} className="bg-yellow-500/10 border-yellow-500/20 text-center">
                <p className="text-yellow-500 font-bold text-xs uppercase">Índice de Higiene</p>
                <h2 className="text-4xl font-black text-yellow-500">{getPerioStats().plaque}%</h2>
                <p className="text-[10px] opacity-50">O'Leary (4 caras)</p>
            </Card>
        </div>

        {/* --- NUEVA CUADRÍCULA CLÍNICA (4 FILAS) --- */}
        <Card theme={themeMode} className="flex flex-col gap-6 overflow-x-auto p-4 md:p-6 custom-scrollbar">
            
            {/* MAXILAR SUPERIOR */}
            <div className="flex items-stretch relative">
                <div className="flex items-center justify-center border-r border-white/10 pr-2 mr-2 md:pr-4 md:mr-4">
                    <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-cyan-500 opacity-80" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        Superior
                    </span>
                </div>
                
                <div className="flex flex-col gap-4 flex-1">
                    {/* Fila Vestibular Superior */}
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Vestibular</span>
                        <div className="flex gap-1 flex-nowrap md:flex-wrap">
                            {TEETH_UPPER.map(n => {
                                const p = getPatient(selectedPatientId);
                                return <Tooth key={`v-${n}`} number={n} isPerioMode={true} perioFace="v" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                            })}
                        </div>
                    </div>
                    {/* Fila Palatino Superior */}
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Palatino</span>
                        <div className="flex gap-1 flex-nowrap md:flex-wrap">
                            {TEETH_UPPER.map(n => {
                                const p = getPatient(selectedPatientId);
                                return <Tooth key={`p-${n}`} number={n} isPerioMode={true} perioFace="l" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-white/5 my-2"></div>

            {/* MAXILAR INFERIOR */}
            <div className="flex items-stretch relative">
                <div className="flex items-center justify-center border-r border-white/10 pr-2 mr-2 md:pr-4 md:mr-4">
                    <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-cyan-500 opacity-80" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        Inferior
                    </span>
                </div>
                
                <div className="flex flex-col gap-4 flex-1">
                    {/* Fila Vestibular Inferior */}
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Vestibular</span>
                        <div className="flex gap-1 flex-nowrap md:flex-wrap">
                            {TEETH_LOWER.map(n => {
                                const p = getPatient(selectedPatientId);
                                return <Tooth key={`v-${n}`} number={n} isPerioMode={true} perioFace="v" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                            })}
                        </div>
                    </div>
                    {/* Fila Lingual Inferior */}
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Lingual</span>
                        <div className="flex gap-1 flex-nowrap md:flex-wrap">
                            {TEETH_LOWER.map(n => {
                                const p = getPatient(selectedPatientId);
                                return <Tooth key={`l-${n}`} number={n} isPerioMode={true} perioFace="l" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        {/* --- TABLA DE HIGIENE O'LEARY (REDISEÑADA) --- */}
        <Card theme={themeMode} className="space-y-6 p-4 md:p-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                    <h3 className="font-black text-lg text-cyan-500">Índice de Placa (O'Leary)</h3>
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Control de Higiene</p>
                </div>
                {/* Leyenda Visual */}
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-white/5">
                    <span className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"/> Placa
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-white/10 border border-white/20 rounded-full"/> Limpio
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-6 items-center">
                {/* FILA SUPERIOR */}
                <div className="w-full bg-black/5 p-4 rounded-3xl border border-white/5">
                    <span className="block text-[9px] font-black opacity-30 uppercase tracking-widest mb-2 text-center">Maxilar Superior</span>
                    <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                        {TEETH_UPPER.map(t => { 
                            const p = getPatient(selectedPatientId); 
                            if(p.clinical.teeth[t]?.status === 'missing') return null; 
                            return ( 
                                <HygieneCell 
                                    key={t} 
                                    tooth={t} 
                                    data={p.clinical.hygiene?.[t]} 
                                    onChange={(face) => { 
                                        const current = p.clinical.hygiene?.[t] || {}; 
                                        const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; 
                                        savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); 
                                    }} 
                                /> 
                            ); 
                        })}
                    </div>
                </div>

                {/* FILA INFERIOR */}
                <div className="w-full bg-black/5 p-4 rounded-3xl border border-white/5">
                    <span className="block text-[9px] font-black opacity-30 uppercase tracking-widest mb-2 text-center">Maxilar Inferior</span>
                    <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                        {TEETH_LOWER.map(t => { 
                            const p = getPatient(selectedPatientId); 
                            if(p.clinical.teeth[t]?.status === 'missing') return null; 
                            return ( 
                                <HygieneCell 
                                    key={t} 
                                    tooth={t} 
                                    data={p.clinical.hygiene?.[t]} 
                                    onChange={(face) => { 
                                        const current = p.clinical.hygiene?.[t] || {}; 
                                        const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; 
                                        savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); 
                                    }} 
                                /> 
                            ); 
                        })}
                    </div>
                </div>
            </div>
        </Card>
        {/* --- HISTORIAL DE EVOLUCIONES PERIODONTALES --- */}
        <Card theme={themeMode} className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="font-bold text-cyan-500">Historial Clínico de Evoluciones</h3>
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-black">Snapshots</span>
            </div>
            
            {(!getPatient(selectedPatientId).clinical.perioHistory || getPatient(selectedPatientId).clinical.perioHistory.length === 0) ? (
                <div className="text-center py-8 bg-black/10 rounded-2xl border border-white/5 border-dashed">
                    <p className="text-xs opacity-50 font-bold uppercase tracking-widest">No hay evoluciones guardadas aún</p>
                    <p className="text-[10px] opacity-30 mt-1">Llena el periodontograma y haz clic en "Guardar Evolución" arriba.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Invertimos el arreglo para ver el más reciente primero */}
                    {[...getPatient(selectedPatientId).clinical.perioHistory].reverse().map((snap, idx, arr) => (
                        <div key={snap.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start border-b border-white/5 pb-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                                        Evolución #{arr.length - idx}
                                    </span>
                                    <span className="text-[9px] font-bold opacity-50 mt-0.5">{snap.date}</span>
                                </div>
                                {/* Botoncito de acción (AHORA SÍ FUNCIONA) */}
                                <button 
                                    onClick={() => restoreSnapshot(snap)}
                                    className="p-1.5 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-cyan-500/20 text-[10px] font-black uppercase text-cyan-500"
                                >
                                    Ver Detalle
                                </button>
                            </div>
                            
                            {/* Resumen de los índices en ese momento exacto */}
                            <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg">
                                <div className="flex flex-col items-center flex-1 border-r border-white/5">
                                    <span className="text-[8px] uppercase tracking-widest opacity-50 font-black mb-1">BOP</span>
                                    <span className="text-[11px] font-black text-red-400">{snap.stats?.bop || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center flex-1">
                                    <span className="text-[8px] uppercase tracking-widest opacity-50 font-black mb-1">Higiene</span>
                                    <span className="text-[11px] font-black text-yellow-400">{snap.stats?.plaque || 0}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    </div>
)}                
                {/* V76: EVOLUTION TAB - SECURE (READ ONLY HISTORY) */}
                {patientTab === 'evolution' && <div className="space-y-2">
                    <div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>
                        <textarea rows="3" placeholder="Escribir nueva evolución (No editable después de guardar)..." className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`} value={newEvolution} onChange={e=>setNewEvolution(e.target.value)} />
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={toggleVoice} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'text-stone-400 hover:text-cyan-400'}`}>
                                {isListening ? <MicOff size={18}/> : <Mic size={18}/>}
                            </button>
                        </div>
                    </div>
                    {voiceStatus && <p className="text-[10px] text-right opacity-60 animate-pulse font-bold">{voiceStatus}</p>}
                    <Button theme={themeMode} className="w-full" onClick={()=>{ 
                        if (!newEvolution.trim()) return;
                        const p=getPatient(selectedPatientId); 
                        // V76: Integridad - Nueva evolución se añade al principio, nunca se reemplaza el array
                        const n={id:Date.now(), text:newEvolution, date:new Date().toLocaleString(), author: session.user.email}; 
                        savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, evolution: [n, ...(p.clinical.evolution||[])]}}); 
                        setNewEvolution(''); 
                        logAction('ADD_EVOLUTION', { text_preview: newEvolution.substring(0,20) }, selectedPatientId);
                    }}>GUARDAR Y BLOQUEAR</Button>
                    
                    <div className="space-y-2 mt-4">
                        {getPatient(selectedPatientId).clinical.evolution?.map(ev=>(
                            <div key={ev.id} className={`p-4 rounded-xl border border-white/5 relative ${t.card}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileLock size={14} className="text-emerald-500"/>
                                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{ev.date}</span>
                                    </div>
                                    <span className="text-[9px] opacity-30">{ev.author}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{ev.text}</p>
                            </div>
                        ))}
                    </div>
                </div>}

                {patientTab === 'consent' && <div className="space-y-4">{modal === 'sign' ? (<Card theme={themeMode} className="space-y-4"><h3 className="font-bold">{CONSENT_TEMPLATES[consentTemplate].title}</h3><textarea className="w-full h-48 bg-black/20 p-4 rounded-xl text-sm leading-relaxed outline-none border border-white/10 focus:border-emerald-500 transition-colors resize-none text-white" value={consentText} onChange={(e)=>setConsentText(e.target.value)} /><SignaturePad theme={themeMode} onSave={(sig)=>{ const p=getPatient(selectedPatientId); savePatientData(selectedPatientId, {...p, consents:[{id:Date.now(), type:CONSENT_TEMPLATES[consentTemplate].title, text:consentText, signature:sig}, ...(p.consents||[])]}); setModal(null); }} onCancel={()=>setModal(null)}/></Card>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Object.entries(CONSENT_TEMPLATES).map(([key, tpl]) => (<Card key={key} onClick={()=>{setConsentTemplate(key); setConsentText(tpl.text); setModal('sign');}} theme={themeMode} className="cursor-pointer hover:border-emerald-500 hover:scale-[1.02] transition-transform"><FileSignature className="text-emerald-500 mb-2"/><span className="font-bold text-sm block">{tpl.title}</span></Card>))}</div>)}<h3 className="font-bold pt-4 border-t border-white/10 mt-4">Historial</h3><div className="space-y-2">{(getPatient(selectedPatientId).consents || []).map(c => (<Card key={c.id} theme={themeMode} className="flex justify-between items-center py-3"><div><p className="font-bold text-sm">{c.type}</p><p className="text-[10px] opacity-50">{c.date}</p></div><div className="flex items-center gap-3"><div className="bg-white p-1 rounded"><img src={c.signature} className="h-8 object-contain" alt="Firma"/></div><button onClick={()=>generatePDF('consent', c)} className={`p-2 rounded-xl ${t.inputBg} hover:opacity-80`}><Printer size={16}/></button></div></Card>))}</div></div>}
                {patientTab === 'images' && (
          <div className="space-y-6 animate-in fade-in h-full flex flex-col">
              
              {/* --- 1. LAS PESTAÑAS DE LAS CARPETAS --- */}
              <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                  {['Radiografías', 'Fotos Clínicas', 'Documentos', 'Otros'].map(folder => (
                      <button 
                          key={folder}
                          onClick={() => setActiveFolder(folder)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${t.border} ${activeFolder === folder ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' : 'opacity-50 hover:opacity-100'}`}
                      >
                          {folder === 'Radiografías' ? '🦴 ' : folder === 'Fotos Clínicas' ? '📸 ' : folder === 'Documentos' ? '📄 ' : '📁 '}
                          {folder}
                      </button>
                  ))}
              </div>

              {/* --- 2. ZONA DE SUBIDA (Te avisa a qué carpeta va) --- */}
              <div className={`flex items-center justify-center border-2 border-dashed ${t.border} rounded-3xl p-8 relative group hover:opacity-70 transition-colors cursor-pointer ${t.cardBg}`}>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*,application/pdf" onChange={handleImageUpload} disabled={uploading}/>
                  {uploading ? (
                      <Loader className="animate-spin text-cyan-400" size={30}/> 
                  ) : (
                      <div className="text-center">
                          <Upload className="mx-auto mb-2 opacity-30"/>
                          <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                              Subir archivo a <span className="text-cyan-500">{activeFolder}</span>
                          </span>
                      </div>
                  )}
              </div>

              {/* --- 3. LA CUADRÍCULA DE FOTOS (Filtrada por la carpeta activa) --- */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getPatient(selectedPatientId).images?.filter(img => (img.folder || 'Otros') === activeFolder).length === 0 ? (
                          <div className="col-span-full py-10 text-center opacity-30 text-sm font-bold">
                              No hay archivos en la carpeta {activeFolder}
                          </div>
                      ) : (
                          getPatient(selectedPatientId).images?.filter(img => (img.folder || 'Otros') === activeFolder).map(img => (
                              <div key={img.id} className={`relative group rounded-2xl overflow-hidden aspect-square border ${t.border} bg-black/5 dark:bg-white/5`}>
                                  
                                  {/* AQUI LLAMAMOS A NUESTRO COMPONENTE DE SEGURIDAD */}
                                  <PrivateImage img={img} onClick={setSelectedImg} />
                                  
                                  <button onClick={async()=>{ 
                                      if(window.confirm("¿Seguro que deseas eliminar este archivo?")) {
                                          const p = getPatient(selectedPatientId); 
                                          const f = p.images.filter(i => i.id !== img.id); 
                                          await savePatientData(selectedPatientId, {...p, images:f}); 
                                          
                                          // Limpiamos el archivo real de Supabase para no ocupar espacio "basura"
                                          const filePath = img.path || img.url;
                                          if (filePath && !filePath.startsWith('http')) {
                                              await supabase.storage.from('patient-images').remove([filePath]);
                                          }
                                          
                                          notify("Eliminado"); 
                                      }
                                  }} className="absolute top-2 right-2 p-2 bg-red-500 shadow-lg rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                      <Trash2 size={14}/>
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
            </div>
        }

        {/* --- TABS COMUNES (MANTENIDOS) --- */}
        {activeTab === 'clinical' && (userRole === 'admin' || userRole === 'dentist') && <Card theme={themeMode} className="space-y-4"><PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
            if (p.id === 'new') {
                const newId = "pac_" + Date.now().toString();
                const nombreReal = p.name;
                
                const newPatient = getPatient(newId);
                newPatient.id = newId;
                newPatient.name = nombreReal;
                if (!newPatient.personal) newPatient.personal = {};
                newPatient.personal.legalName = nombreReal;
                
                savePatientData(newId, newPatient);
                setRxPatient(newPatient);
                notify("Paciente Creado Exitosamente");
            } else {
                // 👇 MAGIA INYECTADA AQUÍ 👇
                setPatientRecords(prev => ({...prev, [p.id]: p}));
                
                setRxPatient(p);
            }
        }} />{rxPatient && (<div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in"><div className={`w-12 h-12 rounded-full ${t.accentBg} flex items-center justify-center font-bold text-white`}>{rxPatient.personal.legalName[0]}</div><div><p className="font-bold">{rxPatient.personal.legalName}</p><p className="text-xs opacity-60">RUT: {rxPatient.personal.rut}</p></div></div>)}<div className="flex gap-2"><InputField theme={themeMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/><InputField theme={themeMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/><Button theme={themeMode} onClick={()=>{setPrescription([...prescription, medInput]); setMedInput({name:'', dosage:''});}}><Plus/></Button></div>{prescription.map((p,i)=>(<div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between text-xs"><span>{p.name} - {p.dosage}</span><X size={14} onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}/></div>))}<Button theme={themeMode} className="w-full" onClick={()=>generatePDF('rx', rxPatient)}><Printer/> GENERAR PDF</Button></Card>}
        {/* --- PESTAÑA DE RETENCIÓN (CRM) --- */}
        {activeTab === 'recalls' && (userRole === 'admin' || userRole === 'assistant') && <div className="space-y-6 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Users className={t.accent}/> CRM de Retención</h2>
                    <p className="text-xs opacity-50 mt-1">Pacientes inactivos por más de 6 meses sin citas futuras.</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold">
                    {getRecalls.length} Pacientes para recuperar
                </div>
            </div>

            {getRecalls.length === 0 ? (
                <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center opacity-50 flex flex-col items-center gap-4">
                    <Star size={40} className="opacity-30"/>
                    <p>¡Excelente! No tienes pacientes inactivos o atrasados en sus controles.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {getRecalls.map(appt => (
                        <Card key={appt.id} theme={themeMode} className="flex flex-col md:flex-row justify-between items-center p-4 hover:border-emerald-500/50 transition-colors">
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg opacity-50">
                                    {appt.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{appt.name}</h4>
                                    <p className="text-xs text-red-400">Última visita: {appt.date.split('-').reverse().join('/')} ({appt.treatment})</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={()=>{setActiveTab('ficha'); setSelectedPatientId(Object.keys(patientRecords).find(k => patientRecords[k].personal?.legalName === appt.name));}} className="flex-1 md:flex-none p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">
                                    Ver Ficha
                                </button>
                                <button onClick={()=>sendWhatsApp(getPatientPhone(appt.name), `Hola ${appt.name}, nos comunicamos de ShiningCloud Dental. Vemos que han pasado más de 6 meses desde tu última atención (${appt.treatment}). Nos encantaría agendar un control preventivo gratuito para ver cómo estás. ¿Te gustaría ver horarios disponibles?`)} className="flex-1 md:flex-none p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
                                    <MessageCircle size={16}/> Recuperar por WhatsApp
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>}
      </main>
{/* --- MODAL DIENTE LATERAL (CORREGIDO, UNIFICADO Y CON PERIO) --- */}
{modal === 'tooth' && (
    <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Fondo sutil */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setModal(null)} />

        <Card theme={themeMode} className="w-full max-w-sm h-full relative z-10 shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 rounded-none">
            
            {/* ENCABEZADO CON NAVEGACIÓN RÁPIDA (NUEVO) */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => goToAdjacentTooth(-1)} className="p-1.5 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-lg transition-all"><ChevronLeft size={20} /></button>
                    <h3 className="text-2xl font-black italic tracking-tighter w-20 text-center text-cyan-500">{toothModalData.id}</h3>
                    <button onClick={() => goToAdjacentTooth(1)} className="p-1.5 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-lg transition-all"><ChevronRight size={20} /></button>
                </div>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* --- SECCIÓN: PERIODONTOGRAMA TIPO DENTALINK (SOLO EN MODO PERIO) --- */}
                {activeTab === 'perio' && (
                    <div className="p-4 border border-white/10 rounded-3xl bg-black/5 dark:bg-white/5 shadow-inner animate-in fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                            <h3 className="text-sm font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                                📏 Periodontograma
                            </h3>
                        </div>

                        {/* TABLAS VESTIBULAR Y LINGUAL/PALATINO */}
                        {['v', 'l'].map(face => (
                            <div key={face} className="mb-5 bg-white/5 p-3 rounded-2xl border border-white/5 relative mt-4">
                                <h4 className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-2 text-center absolute -top-3 left-1/2 -translate-x-1/2 bg-[#121212] px-3 py-0.5 rounded-full border border-white/10">
                                    {face === 'v' ? 'Vestibular' : (parseInt(toothModalData.id) > 30 ? 'Lingual' : 'Palatino')}
                                </h4>
                                
                                <div className="grid grid-cols-4 gap-1 mb-1 mt-2">
                                    <div></div>
                                    <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Dist</span>
                                    <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Cent</span>
                                    <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Mesi</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-4 gap-1 items-center">
                                        <span className="text-[9px] font-bold text-right pr-1 opacity-70">Prof.</span>
                                        {[0, 1, 2].map(idx => (
                                            <input key={`pd-${face}-${idx}`} type="text" value={toothModalData.perio?.[`pd_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'pd', idx, e.target.value)} className={`w-full h-8 text-center text-xs font-bold rounded-lg bg-black/20 border outline-none ${toothModalData.perio?.[`pd_${face}`]?.[idx] >= 4 ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-white/10 focus:border-cyan-500'}`} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 items-center">
                                        <span className="text-[9px] font-bold text-right pr-1 opacity-70">Margen</span>
                                        {[0, 1, 2].map(idx => (
                                            <input key={`mg-${face}-${idx}`} type="text" value={toothModalData.perio?.[`mg_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'mg', idx, e.target.value)} className="w-full h-8 text-center text-xs font-bold rounded-lg bg-black/20 border border-white/10 focus:border-blue-400 outline-none text-blue-400" />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 items-center mt-2 pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-black text-right pr-1 text-cyan-600">NIC</span>
                                        {[0, 1, 2].map(idx => {
                                            const nic = calcNIC(toothModalData.perio?.[`pd_${face}`]?.[idx], toothModalData.perio?.[`mg_${face}`]?.[idx]);
                                            return (
                                                <div key={`nic-${face}-${idx}`} className={`w-full h-7 flex items-center justify-center text-xs font-black rounded-lg bg-black/10 ${nic >= 4 || nic === '-' ? 'text-orange-500' : 'text-emerald-500'}`}>{nic}</div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* ALERTAS PERIO */}
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            <button onClick={() => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, bop: !prev.perio?.bop } }))} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${toothModalData.perio?.bop ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-transparent border-white/10 opacity-50'}`}>🩸 BOP</button>
                            <button onClick={() => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, pus: !prev.perio?.pus } }))} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${toothModalData.perio?.pus ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-transparent border-white/10 opacity-50'}`}>🟡 PUS</button>
                            <select className="p-2 rounded-xl bg-transparent border border-white/10 text-[10px] font-black outline-none text-center appearance-none" value={toothModalData.perio?.mobility || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, mobility: parseInt(e.target.value) } }))}><option value={0} className="bg-[#121212]">Mov 0</option><option value={1} className="bg-[#121212]">Mov I</option><option value={2} className="bg-[#121212]">Mov II</option><option value={3} className="bg-[#121212]">Mov III</option></select>
                            <select className="p-2 rounded-xl bg-transparent border border-white/10 text-[10px] font-black outline-none text-center appearance-none" value={toothModalData.perio?.furcation || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, furcation: parseInt(e.target.value) } }))}><option value={0} className="bg-[#121212]">Furca 0</option><option value={1} className="bg-[#121212]">Furca I</option><option value={2} className="bg-[#121212]">Furca II</option><option value={3} className="bg-[#121212]">Furca III</option></select>
                        </div>
                    </div>
                )}

                {/* Selector de Modo (Hallazgos vs Tratamientos) */}
                <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                    <button onClick={() => setToothModalData({...toothModalData, mode: 'hallazgos'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${toothModalData.mode === 'hallazgos' ? 'bg-white dark:bg-white/10 shadow-sm text-cyan-500' : 'opacity-50'}`}>Hallazgos</button>
                    <button onClick={() => setToothModalData({...toothModalData, mode: 'tratamientos'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${toothModalData.mode === 'tratamientos' ? 'bg-white dark:bg-white/10 shadow-sm text-cyan-500' : 'opacity-50'}`}>Tratamientos</button>
                </div>

                {toothModalData.mode === 'hallazgos' ? (
                    /* --- MODO HALLAZGOS --- */
                    <div className="space-y-6 animate-in fade-in">
                        <div className={`flex flex-col items-center p-6 rounded-3xl border transition-colors ${t.border} bg-black/5 dark:bg-white/5 shadow-inner`}>
                            <ToothSVG number={toothModalData.id} faces={toothModalData.faces} status={toothModalData.status} size={100} interactive={true} activeFace={toothModalData.activeFace || 'o'} onFaceClick={(face) => setToothModalData({...toothModalData, activeFace: face})} />
                            <p className="text-[10px] font-black opacity-50 mt-4 uppercase tracking-[0.2em]">
                                Cara: <span className="text-cyan-500">{toothModalData.activeFace === 'v' ? 'Vestibular' : toothModalData.activeFace === 'l' ? 'Lingual/Palatino' : toothModalData.activeFace === 'm' ? 'Mesial' : toothModalData.activeFace === 'd' ? 'Distal' : 'Oclusal'}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">En Cara</span>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'caries'}, status: null})} className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-2xl text-[11px] font-black transition-all">🔴 CARIES</button>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'filled'}, status: null})} className="w-full p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-2xl text-[11px] font-black transition-all">🔵 RESINA</button>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: null}})} className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black transition-all opacity-70 hover:opacity-100">⚪ LIMPIAR CARA</button>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">En Pieza</span>
                                <button onClick={() => setToothModalData({...toothModalData, status: 'crown'})} className="w-full p-3 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-black border border-yellow-500/20 rounded-2xl text-[11px] font-black transition-all">🟡 CORONA</button>
                                <button onClick={() => setToothModalData({...toothModalData, status: 'missing'})} className="w-full p-3 bg-stone-500/10 text-stone-500 hover:bg-stone-500 hover:text-white border border-stone-500/20 rounded-2xl text-[11px] font-black transition-all">❌ AUSENTE</button>
                                <button onClick={() => setToothModalData({...toothModalData, faces: {v:null,l:null,m:null,d:null,o:null}, status:null})} className="w-full p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-2xl text-[11px] font-black transition-all">✅ DIENTE SANO</button>
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40">Evolución Clínica</label>
                            <div className="relative group">
                                <textarea rows="4" placeholder="Dicta hallazgos..." className={`w-full p-5 rounded-3xl border ${t.border} ${t.inputBg} outline-none focus:border-cyan-500 font-bold text-sm resize-none transition-all shadow-inner`} value={toothModalData.notes || ''} onChange={e => setToothModalData({...toothModalData, notes: e.target.value})} />
                                <button onClick={() => toggleVoice()} className={`absolute bottom-4 right-4 p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse text-white scale-110' : 'bg-cyan-500 text-white shadow-cyan-500/20'}`}>
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- MODO TRATAMIENTOS --- */
                    <div className="space-y-6 animate-in fade-in">
                        <div className="w-full">
                            <label className="text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 text-stone-400">Tratamiento Planificado</label>
                            <input list="catalog-tooth-options" className={`w-full outline-none font-bold text-sm p-4 rounded-2xl border ${t.border} ${t.inputBg} focus:border-cyan-400 transition-all shadow-inner`} placeholder="Busca en tu arancel..." value={toothModalData.treatment?.name || ''} onChange={e => setToothModalData({...toothModalData, treatment: {...(toothModalData.treatment || {}), name: e.target.value, status: toothModalData.treatment?.status || 'planned'}})} />
                            <datalist id="catalog-tooth-options">{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'planned'}})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${toothModalData.treatment?.status === 'planned' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'border-white/10 opacity-50'}`}>Por Hacer</button>
                            <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'completed'}})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${toothModalData.treatment?.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-white/10 opacity-50'}`}>Realizado</button>
                        </div>
                        <button onClick={() => setToothModalData({...toothModalData, treatment: null})} className="w-full p-2 text-[10px] font-bold text-red-400 opacity-50 hover:opacity-100 uppercase tracking-widest transition-opacity">Eliminar Tratamiento</button>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-white/5 bg-black/5">
                <button 
                    onClick={() => {
                        const p = getPatient(selectedPatientId); 
                        const ut = {...p.clinical.teeth, [toothModalData.id]: {
                            status: toothModalData.status, 
                            faces: toothModalData.faces, 
                            notes: toothModalData.notes, 
                            treatment: toothModalData.treatment,
                            perio: toothModalData.perio // <-- ¡ESTO FALTABA PARA GUARDAR EL SONDAJE!
                        }}; 
                        savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, teeth: ut}}); 
                        setModal(null); 
                        notify("Diente Guardado con éxito");
                    }}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 transition-all shadow-xl active:scale-95"
                >
                    GUARDAR DATOS
                </button>
            </div>
        </Card>
    </div>
)}

{/* --- MODAL NUEVO TRABAJO DE LABORATORIO --- */}
      {modal === 'labWork' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-md space-y-4 relative p-6 rounded-3xl border shadow-2xl ${themeMode === 'light' ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                  <button onClick={()=>setModal(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"><X size={20}/></button>
                  <h3 className="text-xl font-bold flex items-center gap-2"><FlaskConical size={24} className="text-cyan-500"/> Enviar a Laboratorio</h3>
                  
                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Paciente</label>
                      <select 
                          className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500 text-black' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`}
                          value={newLabWork.patientId}
                          onChange={(e) => {
                              const p = Object.values(patientRecords).find(pat => pat.id === e.target.value);
                              if (p) setNewLabWork({...newLabWork, patientId: p.id, patientName: p.personal?.legalName || p.name});
                          }}
                      >
                          <option value="" className={themeMode === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'}>Selecciona un paciente...</option>
                          {Object.values(patientRecords).map(p => (
                              <option key={p.id} value={p.id} className={themeMode === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'}>
                                  {p.personal?.legalName || p.name}
                              </option>
                          ))}
                      </select>
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tipo de Trabajo</label>
                      <input type="text" placeholder="Ej: Corona de Porcelana, Placa..." className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.workType} onChange={e=>setNewLabWork({...newLabWork, workType:e.target.value})}/>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Diente (Opcional)</label>
                          <input type="text" placeholder="N°" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.tooth} onChange={e=>setNewLabWork({...newLabWork, tooth:e.target.value})}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Laboratorio</label>
                          <input type="text" placeholder="Nombre Lab" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.labName} onChange={e=>setNewLabWork({...newLabWork, labName:e.target.value})}/>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Fecha de Envío</label>
                          <input type="date" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.sendDate} onChange={e=>setNewLabWork({...newLabWork, sendDate:e.target.value})}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Entrega Esperada</label>
                          <input type="date" className={`w-full p-3 rounded-xl border text-sm font-bold outline-none transition-colors ${themeMode === 'light' ? 'bg-gray-50 border-gray-200 focus:border-cyan-500' : 'bg-black/20 border-white/10 focus:border-cyan-400 text-white'}`} value={newLabWork.expectedDate} onChange={e=>setNewLabWork({...newLabWork, expectedDate:e.target.value})}/>
                      </div>
                  </div>

                  <button className="w-full mt-4 p-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold tracking-widest uppercase transition-colors shadow-lg shadow-cyan-500/30" onClick={async ()=>{
                      if(newLabWork.patientId && newLabWork.workType && newLabWork.expectedDate){
                          const id = newLabWork.id || Date.now().toString();
                          
                          // --- PASO 3 APLICADO AQUÍ ---
                          const data = { ...newLabWork, id, admin_email: clinicOwner };
                          
                          // GUARDA EN SUPABASE PRIMERO
                          const { error } = await supabase.from('lab_works').insert([data]);
                          
                          if (error) {
                              console.error("Error guardando en Supabase:", error);
                              alert("Hubo un error al guardar en la nube.");
                          } else {
                              // SI FUE EXITOSO, ACTUALIZA LA PANTALLA
                              setLabWorks([...labWorks, data]);
                              setModal(null);
                              if(typeof notify === 'function') notify("✅ Trabajo enviado y guardado en la nube");
                          }
                      } else {
                          alert("Por favor selecciona un paciente, el tipo de trabajo y la fecha de entrega.");
                      }
                  }}>GUARDAR Y ENVIAR</button>
              </div>
          </div>
      )}

      {/* MODAL DE ABONOS */}
      {modal === 'abono' && selectedFinancialRecord && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
              <Card  className="w-full max-w-md space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <div><h3 className="text-xl font-bold">{selectedFinancialRecord.patientName}</h3><p className="text-xs opacity-50">{selectedFinancialRecord.date}</p></div>
                      <button onClick={()=>setModal(null)}><X/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 bg-white/5 rounded-xl"><p className="text-[10px] uppercase opacity-50">Total</p><p className="font-bold">${(selectedFinancialRecord.total||0).toLocaleString()}</p></div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl"><p className="text-[10px] uppercase text-emerald-500">Pagado</p><p className="font-bold text-emerald-400">${((selectedFinancialRecord.payments||[]).reduce((s,p)=>s+p.amount,0) + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0)).toLocaleString()}</p></div>
                      <div className="p-3 bg-red-500/10 rounded-xl"><p className="text-[10px] uppercase text-red-500">Deuda</p><p className="font-bold text-red-400">${((selectedFinancialRecord.total||0) - ((selectedFinancialRecord.payments||[]).reduce((s,p)=>s+p.amount,0) + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0))).toLocaleString()}</p></div>
                  </div>
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl">
                      <h4 className="font-bold text-sm">Registrar Nuevo Abono</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <InputField  type="number" placeholder="$ Monto" value={paymentInput.amount} onChange={e=>setPaymentInput({...paymentInput, amount:e.target.value})} />
                          <select className="bg-[#121212] border border-white/10 rounded-xl px-2 p-3 text-xs font-bold outline-none text-white" value={paymentInput.method} onChange={e=>setPaymentInput({...paymentInput, method:e.target.value})}>
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Tarjeta">Tarjeta</option>
                          </select>
                          <InputField  placeholder="N° Boleta (Opc.)" value={paymentInput.receiptNumber} onChange={e=>setPaymentInput({...paymentInput, receiptNumber:e.target.value})} />
                      </div>
                      <Button  className="w-full" onClick={async ()=>{
                          if(!paymentInput.amount) return;
                          const newPayment = { amount: Number(paymentInput.amount), method: paymentInput.method, date: new Date().toLocaleDateString(), receiptNumber: paymentInput.receiptNumber };
                          const currentPayments = selectedFinancialRecord.payments || [];
                          if (!selectedFinancialRecord.payments && selectedFinancialRecord.paid > 0) {
                              currentPayments.push({ amount: selectedFinancialRecord.paid, method: 'Histórico', date: selectedFinancialRecord.date });
                          }
                          const updatedPayments = [...currentPayments, newPayment];
                          const newTotalPaid = updatedPayments.reduce((s,p)=>s+p.amount, 0);
                          const nr = {...selectedFinancialRecord, paid: newTotalPaid, payments: updatedPayments}; 
                          setFinancialRecords(prev => prev.map(h => h.id === nr.id ? nr : h));
                          await saveToSupabase('financials', nr.id, nr); 
                          setModal(null); setPaymentInput({amount:'', method:'Efectivo', date: getLocalDate(), receiptNumber: ''}); notify("Abono Registrado");
                      }}>CONFIRMAR PAGO</Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                      <p className="text-[10px] font-bold opacity-50 uppercase">Historial de Pagos</p>
                      {(selectedFinancialRecord.payments || []).length > 0 ? (selectedFinancialRecord.payments.map((p, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                              <div className="flex gap-2 items-center">
                                  <span className="opacity-50">{p.date}</span> 
                                  <span className="font-bold">{p.method}</span>
                                  {p.receiptNumber && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-stone-300 font-mono tracking-wider border border-white/10">Bol: {p.receiptNumber}</span>}
                              </div>
                              <span className="font-bold text-emerald-400">+${p.amount.toLocaleString()}</span>
                          </div>
                      ))) : <p className="text-xs opacity-30 text-center">Sin abonos registrados.</p>}
                  </div>
              </Card>
          </div>
      )}

      {/* MODAL INVENTARIO */}
      {modal === 'addItem' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <Card theme={themeMode} className="w-full max-w-sm space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl">{newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                      <button onClick={()=>{setModal(null); if(newItem.id) setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); }} className="opacity-50 hover:opacity-100 transition-opacity"><X/></button>
                  </div>
                  <InputField theme={themeMode} placeholder="Nombre (ej: Anestesia)" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/>
                  <div className="flex gap-2">
                      <InputField theme={themeMode} label="Stock" type="number" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:Number(e.target.value)})}/>
                      <InputField theme={themeMode} label="Mínimo" type="number" value={newItem.min} onChange={e=>setNewItem({...newItem, min:Number(e.target.value)})}/>
                  </div>
                  <div className="flex gap-2">
                      <Button theme={themeMode} className="flex-1" onClick={async()=>{ 
                          if(newItem.name){ 
                              const id = newItem.id || Date.now().toString(); 
                              const itemData = { ...newItem, id }; 
                              let updatedInventory; 
                              if (newItem.id) { updatedInventory = inventory.map(i => i.id === id ? itemData : i); } 
                              else { updatedInventory = [...inventory, itemData]; } 
                              setInventory(updatedInventory); 
                              await saveToSupabase('inventory', id, itemData); 
                              setModal(null); 
                              setNewItem({name:'', stock:0, min:5, unit:'u', id:null}); 
                              notify("Guardado"); 
                          }
                      }}>GUARDAR</Button>
                      
                      {newItem.id && (
                          <button onClick={async()=>{ 
                              const filtered = inventory.filter(i=>i.id!==newItem.id); 
                              setInventory(filtered); 
                              await supabase.from('inventory').delete().eq('id', newItem.id); 
                              setModal(null); 
                              notify("Eliminado"); 
                          }} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl"><Trash2 size={20}/></button>
                      )}
                  </div>
              </Card>
          </div>
      )}

    {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA (FORZADO) */}
      {modal === 'recovery' && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-red-500/30 p-8 rounded-3xl w-full max-w-md text-white shadow-[0_0_50px_rgba(239,68,68,0.1)]">
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
                      onClick={async () => {
                          if (newPasswordInput.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
                          
                          // Enviamos la nueva contraseña a Supabase
                          const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
                          
                          if (error) {
                              notify("Error al actualizar: " + error.message);
                          } else {
                              notify("¡Contraseña actualizada con éxito! Ya puedes usar el sistema.");
                              setModal(null);
                              setNewPasswordInput('');
                              window.location.hash = ''; // Limpiamos la URL
                          }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl transition-all shadow-lg active:scale-95"
                  >
                      GUARDAR NUEVA CONTRASEÑA
                  </button>
              </div>
          </div>
      )}

     {/* MODAL ARANCEL EXTERNO */}
      {modal === 'catalogItem' && (
          <CatalogModal 
              themeMode={themeMode} newCatalogItem={newCatalogItem} setNewCatalogItem={setNewCatalogItem} 
              catalog={catalog} setCatalog={setCatalog} setModal={setModal} 
              clinicOwner={clinicOwner} notify={notify} saveToSupabase={saveToSupabase} 
          />
      )}

{/* --- MODAL PERIODONTAL AVANZADO (CON GRÁFICO VISUAL EN TIEMPO REAL) --- */}
{modal === 'perio' && (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <Card theme={themeMode} className="w-full max-w-sm space-y-3 relative overflow-hidden border-t-2 border-t-cyan-500 p-5">
            
            {/* ENCABEZADO COMPACTO CON MOTOR DE VOZ */}
            <div className="flex justify-between items-center pb-2 border-b border-white/10 relative">
                <button onClick={() => goToAdjacentTooth(-1)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg transition-all"><ChevronLeft size={18} className="text-cyan-500"/></button>
                
                <div className="text-center leading-tight flex flex-col items-center">
                    <h3 className="font-black text-xl tracking-tighter text-cyan-500">{toothModalData.id}</h3>
                    {/* El Botón del Micrófono */}
                    <button 
                        onClick={startPerioDictation}
                        className={`mt-1 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg ${isPerioVoiceActive ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/30'}`}
                    >
                        {isPerioVoiceActive ? <MicOff size={10} /> : <Mic size={10} />}
                        {isPerioVoiceActive ? 'Escuchando...' : 'Dictar'}
                    </button>
                </div>

                <button onClick={() => goToAdjacentTooth(1)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg transition-all"><ChevronRight size={18} className="text-cyan-500"/></button>
            </div>

            {/* FEEDBACK DE VOZ (Muestra lo que la IA entendió) */}
            {voiceFeedback && (
                <div className="text-center text-[10px] font-bold text-yellow-400 bg-black/40 p-1.5 rounded-lg border border-yellow-500/30 mt-1 animate-in slide-in-from-top-2">
                    {voiceFeedback}
                </div>
            )}
            
            {/* GRÁFICO VISUAL EN TIEMPO REAL (EL "KILLER FEATURE") */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                    { title: 'Vestibular', keys: ['vd', 'v', 'vm'] },
                    { title: toothModalData.id < 30 ? 'Palatino' : 'Lingual', keys: ['ld', 'l', 'lm'] }
                ].map((graph, idx) => {
                    // Función para calcular la coordenada Y en el SVG (0mm = Y:30)
                    const getY = (val) => 30 + ((parseInt(val) || 0) * 5); 
                    
                    const mg0 = getY(perioData.mg?.[graph.keys[0]]);
                    const mg1 = getY(perioData.mg?.[graph.keys[1]]);
                    const mg2 = getY(perioData.mg?.[graph.keys[2]]);
                    
                    const pd0 = getY((parseInt(perioData.mg?.[graph.keys[0]]) || 0) + (parseInt(perioData.pd?.[graph.keys[0]]) || 0));
                    const pd1 = getY((parseInt(perioData.mg?.[graph.keys[1]]) || 0) + (parseInt(perioData.pd?.[graph.keys[1]]) || 0));
                    const pd2 = getY((parseInt(perioData.mg?.[graph.keys[2]]) || 0) + (parseInt(perioData.pd?.[graph.keys[2]]) || 0));

                    return (
                        <div key={idx} className="bg-black/20 rounded-xl border border-white/5 p-2 flex flex-col items-center">
                            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1">{graph.title}</span>
                            <svg viewBox="0 0 100 80" className="w-full h-16 drop-shadow-md">
                                {/* Fondo: Silueta abstracta de la raíz */}
                                <path d="M 10,25 Q 50,-5 90,25 L 85,75 Q 50,90 15,75 Z" fill={themeMode === 'light' ? '#e5e7eb' : '#374151'} opacity="0.4" />
                                
                                {/* Línea Cemento Esmalte (LCE) = Y:30 */}
                                <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="1" strokeDasharray="2" opacity="0.3" />
                                
                                {/* Zona de Bolsa Periodontal (Roja) */}
                                <polygon points={`15,${mg0} 50,${mg1} 85,${mg2} 85,${pd2} 50,${pd1} 15,${pd0}`} fill="#ef4444" fillOpacity="0.3" />
                                
                                {/* Línea del Margen Gingival (Azul) */}
                                <polyline points={`15,${mg0} 50,${mg1} 85,${mg2}`} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                
                                {/* Línea Base de la Bolsa (Roja Oscura) */}
                                <polyline points={`15,${pd0} 50,${pd1} 85,${pd2}`} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )
                })}
            </div>

            {/* TABLAS COMPACTAS (PD, MG, NIC) */}
            <div className="space-y-3 mt-2">
                {[
                    { faceName: 'Vestibular', keys: ['vd', 'v', 'vm'] },
                    { faceName: toothModalData.id < 30 ? 'Palatino' : 'Lingual', keys: ['ld', 'l', 'lm'] }
                ].map((faceData, faceIdx) => (
                    <div key={faceIdx} className="bg-black/20 p-2.5 rounded-xl border border-white/5 relative">
                        <div className="grid grid-cols-4 gap-1.5 mb-1">
                            <div></div>
                            <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Dist</span>
                            <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Cent</span>
                            <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Mesi</span>
                        </div>

                        <div className="space-y-1.5">
                            {/* PD Y BOP (DISEÑO ARREGLADO) */}
                            <div className="grid grid-cols-4 gap-1.5 items-start">
                                <span className="text-[9px] font-bold text-right pr-1 opacity-70 mt-2">Prof.</span>
                                {faceData.keys.map(k => {
                                    const pdValue = perioData.pd?.[k] || '';
                                    const isDanger = parseInt(pdValue) >= 4;
                                    const isBOP = perioData.bop?.[k];
                                    return (
                                        <div key={`pd-${k}`} className="flex flex-col gap-1">
                                            {/* Input de Profundidad */}
                                            <input className={`w-full h-7 rounded text-center text-xs font-black p-0 outline-none border transition-all ${t.inputBg} ${t.text} ${isDanger ? 'border-red-500 text-red-500 bg-red-500/10' : t.border} focus:border-cyan-400`} value={pdValue} onChange={e=>setPerioData({...perioData, pd: {...(perioData.pd || {}), [k]: e.target.value}})} />
                                            {/* Botón Explícito de Sangrado (BOP) */}
                                            <button 
                                                onClick={()=>setPerioData({...perioData, bop: {...(perioData.bop || {}), [k]: !isBOP}})} 
                                                className={`w-full py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all border ${isBOP ? 'bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-black/20 text-white/30 border-white/10 hover:bg-white/10'}`} 
                                                title="Sangrado (Bleeding on Probing)"
                                            >
                                                BOP
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 items-center mt-1">
                                <span className="text-[9px] font-bold text-right pr-1 opacity-70">Margen</span>
                                {faceData.keys.map(k => (
                                    <input key={`mg-${k}`} className={`w-full h-6 rounded text-center text-xs font-bold p-0 outline-none border transition-all ${t.inputBg} ${t.text} ${t.border} focus:border-blue-400 text-blue-400`} value={perioData.mg?.[k] || ''} onChange={e=>setPerioData({...perioData, mg: {...(perioData.mg || {}), [k]: e.target.value}})} />
                                ))}
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 items-center mt-1 pt-1 border-t border-white/5">
                                <span className="text-[9px] font-black text-right pr-1 text-cyan-600">NIC</span>
                                {faceData.keys.map(k => {
                                    const nic = calcNIC(perioData.pd?.[k], perioData.mg?.[k]);
                                    const isDangerNIC = parseInt(nic) >= 4;
                                    return (
                                        <div key={`nic-${k}`} className={`w-full h-6 flex items-center justify-center rounded text-xs font-black bg-black/20 ${nic === '-' ? 'opacity-30' : (isDangerNIC ? 'text-orange-500' : 'text-emerald-500')}`}>{nic}</div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* MOVILIDAD, FURCA Y PUS (UNA SOLA LÍNEA COMPACTA) */}
            <div className="grid grid-cols-3 gap-2 mt-2">
                <select className={`w-full p-2 rounded-lg text-center text-[9px] font-bold outline-none border transition-all ${t.inputBg} ${t.text} ${t.border} appearance-none cursor-pointer`} value={perioData.mobility || 0} onChange={e=>setPerioData({...perioData, mobility: parseInt(e.target.value)})}>
                    <option value={0}>Mov 0</option><option value={1}>Mov I</option><option value={2}>Mov II</option><option value={3}>Mov III</option>
                </select>
                <select className={`w-full p-2 rounded-lg text-center text-[9px] font-bold outline-none border transition-all ${t.inputBg} ${t.text} ${t.border} appearance-none cursor-pointer`} value={perioData.furcation || 0} onChange={e=>setPerioData({...perioData, furcation: parseInt(e.target.value)})}>
                    <option value={0}>Furca 0</option><option value={1}>Furca I</option><option value={2}>Furca II</option><option value={3}>Furca III</option>
                </select>
                <div onClick={()=>setPerioData({...perioData, pus: !perioData.pus})} className={`w-full flex items-center justify-center rounded-lg border text-center font-black text-[9px] cursor-pointer transition-all ${perioData.pus ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : `bg-transparent border-white/10 opacity-50`}`}>
                    {perioData.pus ? '🟡 PUS' : '⚪ PUS'}
                </div>
            </div>
            
            {/* BOTONES DE ACCIÓN */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => setModal(null)} className="w-full py-2 rounded-lg border border-white/10 text-[10px] font-black uppercase opacity-50 hover:opacity-100 transition-all">Cancelar</button>
                <button onClick={()=>{ 
                    const p = getPatient(selectedPatientId); 
                    const newPerio = { ...p.clinical.perio, [toothModalData.id]: perioData }; 
                    savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: newPerio }}); 
                    setModal(null); 
                    notify("Registro Guardado"); 
                }} className="w-full py-2 bg-cyan-500 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                    Guardar
                </button>
            </div>
        </Card>
    </div>
)}
      {/* --- MODAL AGENDAR CITA ACTUALIZADO --- */}
{modal === 'appt' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
    <Card  className="w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl">{newAppt.id ? 'Editar Cita' : 'Agendar Cita'}</h3>
            <button onClick={()=>setModal(null)} className="opacity-50 hover:opacity-100"><X size={20}/></button>
        </div>
       {!newAppt.id && <PatientSelect patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
            if (p.id === 'new') {
                const newId = "pac_" + Date.now().toString();
                const nombreReal = p.name;
                const newPatient = getPatient(newId);
                newPatient.id = newId;
                newPatient.name = nombreReal;
                if (!newPatient.personal) newPatient.personal = {};
                newPatient.personal.legalName = nombreReal;
                
                savePatientData(newId, newPatient);
                setNewAppt({...newAppt, name: nombreReal});
                notify("Paciente Creado Exitosamente");
            } else {
                // 👇 MAGIA INYECTADA AQUÍ 👇
                setPatientRecords(prev => ({...prev, [p.id]: p}));
                
                setNewAppt({...newAppt, name: p.personal?.legalName || p.name});
            }
        }} />}
        
        {newAppt.id && <p className="font-bold text-lg text-cyan-400">{newAppt.name}</p>}
        
        <InputField  label="Tratamiento" value={newAppt.treatment} onChange={e=>setNewAppt({...newAppt, treatment:e.target.value})}/>
        
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Fecha y Hora</label>
                <input type="date" className="w-full bg-white/5 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.date} onChange={e=>setNewAppt({...newAppt, date:e.target.value})}/>
                <input type="time" className="w-full bg-white/5 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.time} onChange={e=>setNewAppt({...newAppt, time:e.target.value})}/>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Detalles</label>
                <select className="w-full bg-[#121212] border border-white/10 p-3 rounded-xl text-white outline-none text-xs" value={newAppt.duration} onChange={e=>setNewAppt({...newAppt, duration: Number(e.target.value)})}>
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 Hora</option>
                    <option value={90}>1.5 Horas</option>
                    <option value={120}>2 Horas</option>
                </select>
                <select className={`w-full border border-white/10 p-3 rounded-xl text-white outline-none text-xs font-bold bg-[#121212] ${newAppt.status==='agendado'?'text-stone-400':newAppt.status==='confirmado'?'text-emerald-400':newAppt.status==='espera'?'text-yellow-400':newAppt.status==='atendiendo'?'text-blue-400':'text-red-400'}`} value={newAppt.status} onChange={e=>setNewAppt({...newAppt, status:e.target.value})}>
                    <option value="agendado">⚪ Por Confirmar</option>
                    <option value="confirmado">🟢 Confirmado</option>
                    <option value="espera">🟡 En Sala Espera</option>
                    <option value="atendiendo">🔵 En Box (Atendiendo)</option>
                    <option value="no_asistio">🔴 No Asistió</option>
                </select>
            </div>
        </div>

        <div className="flex gap-2 pt-2">
            {newAppt.id && (
                <button onClick={async (e) => {
    e.stopPropagation(); 
    try {
        const { error } = await supabase.from('appointments').delete().eq('id', newAppt.id);
        if (error) throw error;
        setAppointments(appointments.filter(a => a.id !== newAppt.id)); 
        setModal(null); 
        notify("Cita Eliminada");
    } catch (err) {
        alert("Error al eliminar la cita. Revisa tu conexión.");
    }
}} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl">
    <Trash2 size={20}/>
</button>
            )}
            <Button  className="flex-1" onClick={async ()=>{ 
                if(newAppt.name){ 
                    const id = newAppt.id || Date.now().toString(); 
                    const nd = {...newAppt, id}; 
                    if (newAppt.id) {
                        setAppointments(appointments.map(a => a.id === id ? nd : a));
                    } else {
                        setAppointments([...appointments, nd]); 
                    }
                    await saveToSupabase('appointments', id, nd); 
                    setModal(null); 
                    notify(newAppt.id ? "Cita Actualizada" : "Cita Agendada"); 
                }
            }}>{newAppt.id ? 'ACTUALIZAR' : 'AGENDAR'}</Button>
        </div>
        
        {/* Atajo de WhatsApp para confirmar rápido */}
        {newAppt.id && (
            <button onClick={(e)=>{ e.stopPropagation(); sendWhatsApp(getPatientPhone(newAppt.name), `Hola ${newAppt.name}, le escribimos de ShiningCloud Dental para confirmar su cita para el ${newAppt.date.split('-').reverse().join('/')} a las ${newAppt.time}. ¿Nos confirma su asistencia?`); }} className="w-full flex items-center justify-center gap-2 text-[10px] bg-white/5 py-2 rounded-xl hover:bg-white/10 text-stone-400 transition-colors uppercase font-bold tracking-widest mt-2">
                <MessageCircle size={14} className="text-emerald-400"/> Enviar WhatsApp de Confirmación
            </button>
        )}
    </Card>
</div>}
      {/* --- MODAL CARGAR / ELIMINAR PACKS --- */}
      {modal === 'loadPack' && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <Card  className="w-full max-w-sm h-96 flex flex-col">
              <h3 className="font-bold mb-4">Protocolos Guardados</h3>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {protocols.length === 0 && <p className="text-xs opacity-50 text-center mt-10">No hay packs creados.</p>}
                  {protocols.map(pr=>(
                      <div key={pr.id} className="p-4 bg-white/5 rounded-xl border border-transparent hover:border-cyan-500/50 flex justify-between items-center group transition-all">
                          <div className="cursor-pointer flex-1" onClick={()=>{setSessionData({...sessionData, treatmentName:pr.name, baseCost:pr.totalCost}); setModal(null); notify("Pack Cargado");}}>
                              <p className="font-bold text-sm">{pr.name}</p>
                              <p className="text-cyan-400 text-xs font-black">${pr.totalCost.toLocaleString()}</p>
                          </div>
                          {/* Botón de Eliminar Pack */}
                          <button onClick={async (e)=>{
                              e.stopPropagation(); 
                              setProtocols(protocols.filter(p=>p.id !== pr.id)); 
                              await supabase.from('packs').delete().eq('id', pr.id); 
                              notify("Pack Eliminado");
                          }} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all">
                              <Trash2 size={16}/>
                          </button>
                      </div>
                  ))}
              </div>
              <button onClick={()=>setModal(null)} className="mt-4 text-xs font-bold bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">Cerrar</button>
          </Card>
      </div>}
      
      {selectedImg && <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4" onClick={()=>setSelectedImg(null)}><img src={selectedImg} className="max-w-full max-h-[85%] rounded-xl shadow-2xl animate-in zoom-in"/><span className="mt-4 text-white font-bold opacity-50">CLICK PARA CERRAR</span></div>}
    </div>
  );
}