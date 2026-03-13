import React, { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import LegalText from './LegalText';

export default function LandingPage({ onLoginClick }) {
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    
    // Si la URL oculta dice que venimos a recuperar la clave...
    useEffect(() => {
        if (window.location.hash.includes('type=recovery')) {
            onLoginClick(); 
        }
    }, [onLoginClick]);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden relative">
            {/* Navegación */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center">
                        <Cloud className="text-white" size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-xl tracking-tighter">ShiningCloud</span>
                </div>
                <button onClick={onLoginClick} className="px-6 py-2 text-sm font-bold bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/5">
                    Iniciar Sesión
                </button>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-20 pb-32 text-center px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 relative z-10 leading-tight">
                    El software dental <br className="hidden md:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        que realmente quieres usar.
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 relative z-10">
                    Olvídate de los sistemas lentos de los años 90. ShiningCloud es rápido, seguro y cuenta con <b>dictado por voz de IA</b> para que llenes fichas sin soltar el instrumental.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-full transition-all shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] hover:-translate-y-1 text-lg">
                        Ver Planes y Precios
                    </button>
                    <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full transition-all border border-white/10">
                        Ver Funciones
                    </button>
                </div>
            </div>

            {/* Características */}
            <div id="features" className="container mx-auto px-6 py-24 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Diseñado para la clínica moderna</h2>
                    <p className="text-slate-400">Todo lo que necesitas, a un clic de distancia.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: '🎙️', title: 'Periodontograma por Voz', desc: 'Dicta las profundidades y sangrados mientras examinas. La IA lo dibuja en tiempo real.' },
                        { icon: '🦷', title: 'Odontograma Interactivo', desc: 'Diseño anatómico ultra rápido. Registra caries, restauraciones y ausencias en segundos.' },
                        { icon: '💸', title: 'Presupuestos a 1 Clic', desc: 'Genera cotizaciones hermosas, envíalas por WhatsApp y controla los pagos.' },
                        { icon: '🔒', title: 'Cumplimiento Legal (Ley 19.628)', desc: 'Arquitectura Multitenant con encriptación de grado bancario. Datos clínicos 100% aislados y privados.' },
                        { icon: '📸', title: 'Galería Privada', desc: 'Almacenamiento seguro en la nube para radiografías y fotos clínicas.' },
                        { icon: '📱', title: '100% Móvil y Rápido', desc: 'Úsalo desde tu iPad en el sillón o celular en la casa. Carga al instante.' },
                    ].map((feat, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors">
                            <div className="text-4xl mb-4">{feat.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Precios y Checkout */}
            <div id="pricing" className="container mx-auto px-6 py-24 border-t border-white/5 text-center">
                <h2 className="text-3xl md:text-4xl font-black mb-12">Un precio simple. Todo incluido.</h2>
                <div className="max-w-md mx-auto p-1 rounded-3xl bg-gradient-to-b from-cyan-500/50 to-transparent">
                    <div className="bg-[#0B0F19] p-8 rounded-[22px]">
                        <h3 className="text-2xl font-bold mb-2">Plan Pro</h3>
                        <p className="text-slate-400 text-sm mb-6">Para clínicas que quieren crecer sin límites.</p>
                        <div className="mb-6">
                            <span className="text-5xl font-black tracking-tighter">$10.000</span>
                            <span className="text-slate-400 font-bold"> CLP / mes</span>
                        </div>
                        <ul className="text-left space-y-4 mb-8">
                            {['Pacientes ilimitados', 'Dictado por voz con IA', 'Agenda y recordatorios', 'Gestión de presupuestos', 'Soporte prioritario'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <span className="text-cyan-400">✓</span> {item}
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-white/10">
                            <label className="flex items-start gap-3 cursor-pointer group text-left">
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-5 h-5 accent-amber-500 rounded cursor-pointer"
                                />
                                <span className="text-xs text-slate-400 leading-relaxed">
                                    He leído y acepto los <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-amber-400 hover:text-amber-300 underline font-bold">Términos de Servicio y Política de Privacidad</button>.
                                </span>
                            </label>
                            <button 
                                disabled={!acceptedTerms}
                                onClick={() => window.location.href = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f46b2675174844d09cb9f59000fadd5d"}
                                className={`w-full py-4 font-black rounded-xl transition-all text-lg ${
                                    acceptedTerms 
                                    ? "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]" 
                                    : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                                }`}
                            >
                                Suscribirse y Crear Cuenta
                            </button>
                            {!acceptedTerms && <p className="text-[10px] text-red-400/80">Debes aceptar los términos para continuar.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Términos */}
            {showTerms && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#0B0F19] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col relative shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Términos de Servicio</h2>
                            <button onClick={() => setShowTerms(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <LegalText isDarkTheme={true} />
                        </div>
                        <div className="p-6 border-t border-white/10">
                            <button 
                                onClick={() => { setAcceptedTerms(true); setShowTerms(false); }} 
                                className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                            >
                                Entendido y acepto
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <footer className="border-t border-white/5 py-10 text-center text-slate-500 text-sm">
                <p>© {new Date().getFullYear()} ShiningCloud Dental. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}