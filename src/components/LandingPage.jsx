import React, { useState, useEffect } from 'react';
import { Cloud, Mic, ShieldCheck, Zap, CheckCircle2, ArrowRight, Box, FlaskConical, BarChart3, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import LegalText from './LegalText';

export default function LandingPage({ onLoginClick }) {
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    
    // 👇 TU LINK DE MERCADO PAGO
    const PAYMENT_LINK = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f46b2675174844d09cb9f59000fadd5d"; 
    
    useEffect(() => {
        if (window.location.hash.includes('type=recovery')) onLoginClick(); 

        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [onLoginClick]);

    const faqs = [
        { q: "¿Mis datos y los de mis pacientes están seguros?", a: "Absolutamente. Utilizamos servidores encriptados de grado bancario. Además, ShiningCloud cumple con los estándares de la Ley 20.584 de Derechos y Deberes del Paciente y la Ley de Protección de Datos (19.628)." },
        { q: "¿Necesito instalar algo en mi computador?", a: "No. ShiningCloud es 100% web. Funciona en Windows, Mac, iPad, tablets y celulares modernos. Solo necesitas conexión a internet y tu navegador favorito." },
        { q: "¿Puedo tener múltiples doctores y asistentes?", a: "Sí, el plan profesional incluye cuentas ilimitadas para tu equipo. El dueño de la clínica tiene control total sobre los permisos y accesos de cada miembro." },
        { q: "¿Cómo funciona el dictado por voz?", a: "Nuestra Inteligencia Artificial está entrenada con terminología odontológica. Al activar el micrófono, la IA transcribe tus hallazgos directamente a la ficha clínica y marca el odontograma." }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white overflow-x-hidden">
            
            {/* --- NAVEGACIÓN --- */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#DFD2C4]/50 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
                        <div className="w-9 h-9 bg-gradient-to-br from-[#5B6651] to-[#312923] rounded-xl shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Cloud className="text-white" size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-[#312923]">ShiningCloud<span className="text-[#CBAAA2]">Dental</span></span>
                    </div>
                    <button onClick={onLoginClick} className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest bg-white hover:bg-[#312923] hover:text-white text-[#312923] border border-[#DFD2C4] hover:border-[#312923] rounded-full transition-all shadow-sm flex items-center gap-2 group">
                        Acceso Clínicas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION (CENTRADO Y LIMPIO) --- */}
            <div className="relative pt-32 pb-16 md:pt-48 md:pb-24 px-6 max-w-5xl mx-auto text-center flex flex-col items-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#5B6651]/20 bg-[#5B6651]/5 text-[#5B6651] text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Zap size={14} className="text-amber-500"/> El Nuevo Estándar Dental
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter mb-6 text-[#312923] leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                    La odontología <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B6651] via-[#8A9581] to-[#CBAAA2]">
                        ahora es más accesible.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-[#6B615A] max-w-3xl mx-auto mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    Mucho más que un software de fichas. ShiningCloud es el primer ecosistema que une <strong>dictado de voz clínico, finanzas y reabastecimiento de insumos</strong> en una sola plataforma ultra-rápida.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
                    <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="group px-8 py-4 bg-[#312923] text-white font-black rounded-full transition-all hover:bg-black hover:shadow-xl hover:shadow-[#312923]/20 hover:-translate-y-1 flex items-center justify-center gap-3 text-[11px] tracking-widest uppercase">
                        Digitalizar mi clínica <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>

            {/* --- PRUEBA SOCIAL / TRUST --- */}
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 mb-20 border-t border-[#DFD2C4]/40 pt-16 mt-10">
                <span className="text-xs font-black uppercase tracking-widest text-[#9A8F84]">Infraestructura Segura</span>
                <div className="flex flex-wrap justify-center items-center gap-8 text-[#6B615A] font-black text-lg tracking-tighter">
                    <span className="flex items-center gap-2"><Lock size={20}/> AWS Encrypted</span>
                    <span className="flex items-center gap-2"><ShieldCheck size={20}/> Ley MINSAL 20.584</span>
                    <span className="flex items-center gap-2"><Cloud size={20}/> Cloud Native</span>
                </div>
            </div>

            {/* --- MEGA BENTO GRID 3.0 (MICRO-UIs EXPLICATIVAS Y FOTO) --- */}
            <div id="features" className="max-w-7xl mx-auto px-6 mb-32 relative z-10">
                
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#CBAAA2]/10 via-[#FDFBF7] to-transparent blur-[100px] rounded-full pointer-events-none -z-10"></div>

                <div className="text-center mb-16 animate-in fade-in duration-1000">
                    <h2 className="text-3xl md:text-5xl font-black text-[#312923] tracking-tighter mb-4">Ingeniería Clínica Explicada</h2>
                    <p className="text-[#6B615A] text-lg font-medium max-w-2xl mx-auto">Diseñamos cada herramienta para que dirijas tu clínica sin fricción. Mira cómo funciona la magia por dentro.</p>
                </div>
                
                {/* Grilla Asimétrica */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[auto]">
                    
                    {/* 1. VOZ IA + FOTO ODONTOGRAMA (Ocupa 2 columnas) */}
                    <div className="md:col-span-2 bg-[#312923] rounded-[2.5rem] pt-8 px-8 md:pt-12 md:px-12 overflow-hidden relative flex flex-col justify-between group shadow-xl hover:shadow-2xl transition-shadow min-h-[500px]">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#5B6651]/30 rounded-full blur-3xl group-hover:bg-[#CBAAA2]/20 transition-colors duration-1000"></div>
                        <div className="relative z-10 mb-8 md:mb-12">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <Mic className="text-white" size={24} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter">Odontograma Inteligente</h3>
                            <p className="text-[#DFD2C4] font-medium text-base md:text-lg max-w-md">No toques el mouse. Habla con naturalidad y la Inteligencia Artificial transcribe y dibuja los hallazgos en tiempo real.</p>
                        </div>
                        
                        {/* Foto del Odontograma asomándose por abajo */}
                        <div className="relative z-10 w-full mt-auto translate-y-12 group-hover:translate-y-4 transition-transform duration-700">
                            <img 
                                src="/odontograma.png" 
                                alt="Odontograma ShiningCloud" 
                                className="w-full rounded-t-2xl border-t border-l border-r border-white/20 shadow-2xl object-cover object-top"
                            />
                            {/* Alerta superpuesta en la imagen */}
                            <div className="absolute -top-4 left-4 md:left-6 flex gap-3 items-center px-4 py-2 bg-[#FDFBF7] text-[#312923] border border-[#DFD2C4] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl z-20">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Escuchando hallazgos...
                            </div>
                        </div>
                    </div>

                    {/* 2. SUPPLY B2B (Verde Corporativo) */}
                    <div className="bg-gradient-to-br from-[#5B6651] to-[#4a5442] rounded-[2.5rem] p-8 md:p-10 overflow-hidden relative flex flex-col justify-between group shadow-xl text-white">
                        <div className="relative z-10 mb-8">
                            <Box className="text-[#DFD2C4] mb-6" size={32} />
                            <h3 className="text-2xl font-black mb-2 tracking-tight">Logística B2B</h3>
                            <p className="text-white/80 text-sm font-medium">Reabastece tus insumos con 1 clic directamente desde tu inventario.</p>
                        </div>
                        {/* Micro-UI Explicativa */}
                        <div className="bg-white rounded-2xl p-5 text-[#312923] shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border border-white/20">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">Quedan 2 cajas</span>
                            </div>
                            <p className="font-black text-base mb-4">Guantes Nitrilo (S)</p>
                            <button className="w-full bg-[#312923] text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2">
                                <Zap size={14} className="text-amber-400"/> Pedir Supply
                            </button>
                        </div>
                    </div>

                    {/* 3. FINANZAS Y LEGAL (Beige/Blanco) */}
                    <div className="bg-white border border-[#DFD2C4]/80 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between group hover:border-[#CBAAA2] transition-colors shadow-sm">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-xl bg-[#FDFBF7] border border-[#DFD2C4] flex items-center justify-center mb-6">
                                <BarChart3 className="text-[#312923]" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-[#312923] mb-2 tracking-tight">Finanzas & Ley</h3>
                            <p className="text-[#6B615A] text-sm font-medium">Fichas inalterables (Ley 20.584) y métricas de utilidad en tiempo real.</p>
                        </div>
                        {/* Micro-UI Explicativa */}
                        <div className="bg-[#FDFBF7] rounded-2xl p-5 border border-[#DFD2C4]/50 group-hover:-translate-y-2 transition-transform duration-500">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">Utilidad Neta</p>
                            <p className="text-3xl font-black text-[#5B6651] tracking-tighter mb-4">$3.450.000</p>
                            <div className="h-2 bg-[#DFD2C4]/30 rounded-full overflow-hidden">
                                <div className="h-full bg-[#5B6651] w-3/4 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* 4. LAB NETWORK (Azul/Blanco) */}
                    <div className="bg-white border border-[#DFD2C4]/80 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between group hover:border-blue-300 transition-colors shadow-sm">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                                <FlaskConical className="text-blue-500" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-[#312923] mb-2 tracking-tight">Lab Network</h3>
                            <p className="text-[#6B615A] text-sm font-medium">Tus trabajos de laboratorio centralizados. Se acabaron los papeles perdidos.</p>
                        </div>
                        {/* Micro-UI Explicativa */}
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 group-hover:-translate-y-2 transition-transform duration-500 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white"><CheckCircle2 size={12}/></div>
                                <span className="text-xs font-bold text-blue-900">Impresión Enviada</span>
                            </div>
                            <div className="w-0.5 h-4 bg-blue-200 ml-3"></div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                </div>
                                <span className="text-xs font-black text-blue-900">Lab: Diseñando Corona</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. BIOSEGURIDAD (Palo Rosa/Blanco) */}
                    <div className="bg-[#CBAAA2] rounded-[2.5rem] p-8 md:p-10 overflow-hidden relative flex flex-col justify-between group shadow-xl text-white hover:shadow-2xl transition-shadow">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                        <div className="relative z-10 mb-8">
                            <ShieldCheck className="text-white mb-6" size={32} />
                            <h3 className="text-2xl font-black mb-2 tracking-tight">Bioseguridad</h3>
                            <p className="text-white/90 text-sm font-medium">Trazabilidad de esterilización por paciente. Blindaje clínico total.</p>
                        </div>
                        {/* Micro-UI Explicativa */}
                        <div className="bg-white rounded-2xl p-4 shadow-xl relative z-10 group-hover:rotate-2 transition-transform duration-500">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Autoclave #1</span>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">Aprobado</span>
                            </div>
                            <p className="text-[#312923] font-black text-sm">Lote: 4892-A</p>
                            <p className="text-[#6B615A] text-xs font-bold mt-1">Temp: 134°C / 45 Min</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- FAQ (PREGUNTAS FRECUENTES) --- */}
            <div className="max-w-3xl mx-auto px-6 py-24 border-t border-[#DFD2C4]/30">
                <h2 className="text-3xl font-black text-center text-[#312923] tracking-tighter mb-12">Preguntas Frecuentes</h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white border border-[#DFD2C4]/60 rounded-2xl overflow-hidden hover:border-[#CBAAA2] transition-colors shadow-sm">
                            <button 
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-[#312923]"
                            >
                                {faq.q}
                                <ChevronDown size={20} className={`text-[#9A8F84] transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <p className="text-[#6B615A] text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- PRECIOS (LIMPIO) --- */}
            <div id="pricing" className="bg-[#312923] text-white py-32 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Únete al estándar digital.</h2>
                    <p className="text-[#DFD2C4] mb-16 text-lg font-medium">
                        Un solo plan. Cero letras chicas. Actualizaciones incluidas para siempre.
                    </p>

                    <div className="bg-white text-[#312923] p-10 md:p-14 rounded-[3rem] shadow-2xl relative transform transition-transform hover:scale-[1.02] duration-500 max-w-2xl mx-auto">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#5B6651] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">
                            Suscripción Profesional
                        </div>
                        
                        <div className="flex items-baseline justify-center gap-1 mb-10 mt-4">
                            <span className="text-6xl md:text-7xl font-black tracking-tighter">$10.000</span>
                            <span className="text-[#9A8F84] font-bold text-sm uppercase tracking-widest">CLP / mes</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10 bg-[#FDFBF7] p-6 rounded-3xl border border-[#DFD2C4]/40">
                            {[
                                'Odontograma por Voz',
                                'Suministros (Supply B2B)',
                                'Agenda Clínica',
                                'Caja y Presupuestos',
                                'Red de Laboratorios',
                                'Usuarios Ilimitados'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm font-bold text-[#6B615A]">
                                    <CheckCircle2 size={18} className="text-[#5B6651] shrink-0" /> {item}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <label className="flex items-start gap-3 cursor-pointer group text-left p-4 rounded-2xl border border-[#DFD2C4]/40 hover:border-[#5B6651]/50 transition-colors bg-white">
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-5 h-5 accent-[#5B6651] rounded border-[#DFD2C4] cursor-pointer shrink-0"
                                />
                                <span className="text-xs text-[#6B615A] font-bold leading-relaxed">
                                    Acepto los <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-[#CBAAA2] hover:underline font-black">Términos de Servicio</button> para operar en la nube.
                                </span>
                            </label>

                            <button 
                                disabled={!acceptedTerms}
                                onClick={() => window.location.href = PAYMENT_LINK}
                                className={`w-full py-5 font-black rounded-2xl transition-all text-xs uppercase tracking-widest flex justify-center items-center gap-2 ${
                                    acceptedTerms 
                                    ? "bg-[#009EE3] text-white hover:bg-[#0089C5] shadow-lg shadow-blue-500/30 hover:-translate-y-1" 
                                    : "bg-[#DFD2C4]/30 text-[#9A8F84] cursor-not-allowed"
                                }`}
                            >
                                Suscribirse con MercadoPago <ArrowRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL DE TÉRMINOS --- */}
            {showTerms && (
                <div className="fixed inset-0 bg-[#312923]/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white border border-[#DFD2C4] rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] flex flex-col relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-[#DFD2C4]/40 flex justify-between items-center bg-[#FDFBF7] rounded-t-[2.5rem]">
                            <div>
                                <h2 className="text-2xl font-black text-[#312923] tracking-tight">Marco Legal y Privacidad</h2>
                                <p className="text-[10px] text-[#A3968B] font-black uppercase tracking-widest mt-1 text-left">ShiningCloud Dental</p>
                            </div>
                            <button onClick={() => setShowTerms(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-[#9A8F84] hover:bg-[#DFD2C4]/30 hover:text-[#312923] transition-colors border border-[#DFD2C4]/50 shadow-sm">✕</button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar text-left text-[#6B615A] bg-white">
                            <LegalText />
                        </div>
                        <div className="p-6 md:p-8 border-t border-[#DFD2C4]/40 bg-[#FDFBF7] rounded-b-[2.5rem]">
                            <button 
                                onClick={() => { setAcceptedTerms(true); setShowTerms(false); }} 
                                className="w-full py-4 bg-[#5B6651] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#4a5442] transition-all shadow-lg shadow-[#5B6651]/20 hover:-translate-y-0.5"
                            >
                                Entendido y acepto las condiciones
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FOOTER --- */}
            <footer className="py-12 text-center bg-white border-t border-[#DFD2C4]/40">
                <div className="flex items-center justify-center gap-2 opacity-60 mb-3 text-[#312923] hover:opacity-100 transition-opacity cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                    <Cloud size={20} className="text-[#CBAAA2]"/>
                    <span className="font-black text-base tracking-widest uppercase">ShiningCloud</span>
                </div>
                <p className="text-[#9A8F84] text-[10px] font-bold px-4 uppercase tracking-widest">
                    © {new Date().getFullYear()} ShiningCloud Dental Chile. Innovación Clínica.
                </p>
            </footer>
        </div>
    );
}