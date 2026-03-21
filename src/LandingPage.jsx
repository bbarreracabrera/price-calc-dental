import React, { useState, useEffect } from 'react';
import { Cloud, Mic, ShieldCheck, Smartphone, Zap, CheckCircle2, GanttChartSquare, Lock, ArrowRight} from 'lucide-react';
import LegalText from './LegalText';

export default function LandingPage({ onLoginClick }) {
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    
    useEffect(() => {
        if (window.location.hash.includes('type=recovery')) {
            onLoginClick(); 
        }
    }, [onLoginClick]);

    // Componente para pilares de misión
    const FeatureCard = ({ icon: Icon, title, desc }) => (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="text-cyan-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden relative">
            
            {/* Navegación */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                        <Cloud className="text-white" size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase">ShiningCloud<span className="text-cyan-500">CL</span></span>
                </div>
                <button onClick={onLoginClick} className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10">
                    Acceso Profesionales
                </button>
            </nav>

            {/* Hero Section - Foco en la Misión */}
            <div className="relative pt-24 pb-32 text-center px-4 max-w-5xl mx-auto">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none"></div>
                
                <span className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 relative z-10">
                    Odontología Digital para todo Chile
                </span>

                <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 relative z-10 leading-[0.9] text-white">
                    La consulta digital <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        ahora es para todos.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 relative z-10 leading-relaxed">
                    Democratizamos la tecnología dental eliminando las barreras de costo. ShiningCloud es la herramienta chilena diseñada para transformar tu práctica en una operación <b>100% digital, legal y multiplataforma</b>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-10 py-5 bg-white text-[#0B0F19] font-black rounded-2xl transition-all hover:bg-cyan-400 hover:scale-105 text-lg flex items-center justify-center gap-2">
                        Digitalizar mi clínica ahora <ArrowRight size={20}/>
                    </button>
                </div>
            </div>

            {/* Misión y Pilares */}
            <div id="features" className="container mx-auto px-6 py-32 border-t border-white/5">
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={ShieldCheck} 
                        title="Cumplimiento Normativo" 
                        desc="Diseñado bajo la normativa chilena de Ficha Clínica. Cumplimiento estricto de la Ley 19.628 sobre protección de la vida privada y datos sensibles."
                    />
                    <FeatureCard 
                        icon={Smartphone} 
                        title="Uso Multiplataforma" 
                        desc="Sin instalaciones complejas. Accede desde tu laptop en el box, tablet en el sillón o celular, con la fluidez de una aplicación nativa."
                    />
                    <FeatureCard 
                        icon={Mic} 
                        title="Dictado Clínico Directo" 
                        desc="Optimiza tu tiempo. Registra evoluciones y periodontogramas mediante voz, permitiendo una atención fluida sin soltar el instrumental."
                    />
                    <FeatureCard 
                        icon={Lock} 
                        title="Privacidad Multitenant" 
                        desc="Arquitectura de seguridad avanzada: tus datos clínicos están físicamente aislados y encriptados. Solo tú y tu equipo tienen acceso."
                    />
                    <FeatureCard 
                        icon={GanttChartSquare} 
                        title="Gestión de Aranceles" 
                        desc="Democratizamos el orden financiero. Configura tus prestaciones, genera presupuestos al instante y controla el flujo de caja de tu clínica."
                    />
                    <FeatureCard 
                        icon={Zap} 
                        title="Velocidad Extrema" 
                        desc="Olvídate de servidores lentos. Nuestra infraestructura en la nube responde al instante, garantizando fluidez en cada diagnóstico."
                    />
                </div>
            </div>

            {/* Precios Simplificados */}
            <div id="pricing" className="container mx-auto px-6 py-24 border-t border-white/5 text-center">
                <h2 className="text-4xl font-black mb-4">Un solo plan. Sin letras chicas.</h2>
                <p className="text-slate-400 mb-16 max-w-xl mx-auto text-lg">
                    Creemos en el acceso justo. Por menos, obtienes una clínica digital completa.
                </p>

                <div className="max-w-md mx-auto relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[30px] blur opacity-25"></div>
                    <div className="relative bg-[#0F172A] p-10 rounded-[28px] border border-white/10">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 mb-4">Suscripción Profesional</h3>
                        <div className="flex items-baseline justify-center gap-1 mb-8">
                            <span className="text-6xl font-black tracking-tighter text-white">$10.000</span>
                            <span className="text-slate-400 font-bold">CLP/mes</span>
                        </div>
                        
                        <ul className="text-left space-y-5 mb-10">
                            {[
                                'Ficha Clínica y Anamnesis Legal',
                                'Odontograma y Perio por Voz',
                                'Agenda y Recordatorios',
                                'Gestión de Presupuestos y Caja',
                                'Almacenamiento de RX e Imágenes',
                                'Usuarios y Asistentes Ilimitados'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                    <CheckCircle2 size={18} className="text-cyan-500" /> {item}
                                </li>
                            ))}
                        </ul>

                        <div className="space-y-6">
                            <label className="flex items-start gap-3 cursor-pointer group text-left">
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-5 h-5 accent-cyan-500 rounded border-white/20 bg-white/5"
                                />
                                <span className="text-[11px] text-slate-400 leading-tight">
                                    Acepto los <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-cyan-400 hover:underline font-bold">Términos de Servicio y Privacidad</button> para operar bajo la normativa legal chilena.
                                </span>
                            </label>

                            <button 
                                disabled={!acceptedTerms}
                                onClick={() => window.location.href = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f46b2675174844d09cb9f59000fadd5d"}
                                className={`w-full py-5 font-black rounded-2xl transition-all text-sm uppercase tracking-widest shadow-xl ${
                                    acceptedTerms 
                                    ? "bg-cyan-500 text-black hover:bg-cyan-400" 
                                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                }`}
                            >
                                Iniciar Digitalización
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Términos */}
            {showTerms && (
                <div className="fixed inset-0 bg-[#0B0F19]/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
                    <div className="bg-[#0F172A] border border-white/10 rounded-[32px] w-full max-w-3xl max-h-[85vh] flex flex-col relative shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Marco Legal y Privacidad</h2>
                                <p className="text-xs text-cyan-500 font-bold uppercase tracking-widest mt-1 text-left">ShiningCloud Chile</p>
                            </div>
                            <button onClick={() => setShowTerms(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white transition-colors text-xl">✕</button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar text-left">
                            <LegalText isDarkTheme={true} />
                        </div>
                        <div className="p-8 border-t border-white/5">
                            <button 
                                onClick={() => { setAcceptedTerms(true); setShowTerms(false); }} 
                                className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                            >
                                Entendido y acepto las condiciones
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="border-t border-white/5 py-12 text-center">
                <div className="flex items-center justify-center gap-2 opacity-50 mb-4">
                    <Cloud size={16} />
                    <span className="font-black text-sm tracking-widest uppercase">ShiningCloud</span>
                </div>
                <p className="text-slate-600 text-xs tracking-tight px-4">
                    © {new Date().getFullYear()} ShiningCloud Dental Chile. Operando bajo estándares de seguridad HIPAA/Ley 19.628.
                </p>
            </footer>
        </div>
    );
}