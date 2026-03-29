import React, { useState, useEffect } from 'react';
import { Cloud, Mic, ShieldCheck, Smartphone, Zap, CheckCircle2, GanttChartSquare, Lock, ArrowRight, Activity, Wallet } from 'lucide-react';
import LegalText from './LegalText';
import { ToothSVG } from './ToothSystem';

export default function LandingPage({ onLoginClick }) {
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    
    // 👇 AQUÍ PONES TU LINK DE MERCADO PAGO / STRIPE
    const PAYMENT_LINK = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f46b2675174844d09cb9f59000fadd5d"; 
    
    useEffect(() => {
        if (window.location.hash.includes('type=recovery')) {
            onLoginClick(); 
        }
    }, [onLoginClick]);

    const heroFaces = { o: 'caries', m: 'filled', d: null, v: null, l: null };
    const heroStatus = ['endo', 'crown'];

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white overflow-x-hidden">
            
            {/* --- NAVEGACIÓN --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-lg border-b border-[#DFD2C4]/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                        <div className="w-8 h-8 bg-[#5B6651] rounded-xl shadow-sm flex items-center justify-center">
                            <Cloud className="text-white" size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-[#312923]">ShiningCloud<span className="text-[#CBAAA2]">Dental</span></span>
                    </div>
                    <button onClick={onLoginClick} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-white hover:bg-[#FDFBF7] text-[#5B6651] border border-[#DFD2C4] rounded-full transition-all shadow-sm hover:border-[#5B6651]">
                        Acceso Profesionales
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-8">
                
                <div className="flex-1 text-center md:text-left z-10 relative">
                    <span className="inline-block px-4 py-1.5 rounded-full border border-[#CBAAA2]/30 bg-white text-[#CBAAA2] text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                        Odontología de Autor Digital
                    </span>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-[#312923] leading-[1.05]">
                        La clínica digital <br />
                        <span className="text-[#CBAAA2] italic">ahora es para todos.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-[#6B615A] max-w-2xl mx-auto md:mx-0 mb-10 leading-relaxed font-medium">
                        Democratizamos la tecnología dental. ShiningCloud es la plataforma diseñada para transformar tu clínica en una operación <strong className="text-[#312923] font-black">100% digital, elegante y segura</strong>, sin la complejidad visual de siempre.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="group px-8 py-4 bg-[#5B6651] text-white font-black rounded-full transition-all hover:bg-[#4a5442] hover:shadow-xl hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-3 text-[11px] tracking-widest uppercase">
                            Digitalizar mi clínica <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex justify-center md:justify-end w-full relative z-10 scale-100 md:scale-110 mt-12 md:mt-0">
                    <div className="relative p-12 bg-white rounded-[3rem] border border-[#DFD2C4]/40 group" style={{ boxShadow: '0 25px 50px -12px rgba(91, 102, 81, 0.1)' }}>
                        
                        <div className="absolute -top-4 -left-4 md:-left-12 flex gap-3 items-center px-5 py-3 bg-white text-[#312923] border border-[#DFD2C4]/50 rounded-full text-[11px] font-bold shadow-xl z-20">
                            <div className="w-2 h-2 rounded-full bg-[#CBAAA2] animate-pulse"></div>
                            {/* 👇 AQUÍ ESTÁ EL CAMBIO DE TEXTO SOLICITADO 👇 */}
                            <span>"Corona en Pieza 16" - <span className="text-[#5B6651]">Guardado</span></span>
                        </div>

                        <ToothSVG number={16} faces={heroFaces} status={heroStatus} size={180} interactive={false} />
                        
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#CBAAA2]/15 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                </div>
                
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[600px] bg-[#DFD2C4]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            </div>

            {/* --- SHOWCASE VISUAL (BENTO GRID ESTILO APPLE) --- */}
            <div id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-[#DFD2C4]/30">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-[#312923] tracking-tight mb-4">Ingeniería Clínica de Precisión</h2>
                    <p className="text-[#9A8F84] font-bold">Herramientas poderosas empaquetadas en un diseño minimalista.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
                    
                    {/* BENTO 1: Inteligencia de Voz (Oscuro y Grande) */}
                    <div className="md:col-span-2 bg-[#312923] rounded-[2.5rem] p-10 md:p-12 flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-[#312923]/10">
                        <div className="absolute -right-10 -bottom-10 opacity-10 text-[#DFD2C4] transform group-hover:scale-110 transition-transform duration-700">
                            <Mic size={250} strokeWidth={1}/>
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <Activity className="text-[#DFD2C4]" size={28} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">Dictado Clínico por IA</h3>
                            <p className="text-[#A3968B] font-medium max-w-md leading-relaxed">Habla con naturalidad. La Inteligencia Artificial escucha tus hallazgos y los inyecta directamente en el odontograma y la ficha periodontal en tiempo real.</p>
                        </div>
                    </div>

                    {/* BENTO 2: Flujo Financiero */}
                    <div className="md:col-span-1 bg-white border border-[#DFD2C4]/60 rounded-[2.5rem] p-10 flex flex-col justify-between hover:border-[#5B6651]/50 transition-colors shadow-sm">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-[#5B6651]/10 flex items-center justify-center mb-6 border border-[#5B6651]/20">
                                <Wallet className="text-[#5B6651]" size={28} />
                            </div>
                            <h3 className="text-xl font-black text-[#312923] mb-3 tracking-tight">Finanzas de Lujo</h3>
                            <p className="text-[#6B615A] text-sm font-medium leading-relaxed">Emite presupuestos en PDF, controla tus gastos, utilidades netas y deudas de pacientes con un par de clics.</p>
                        </div>
                    </div>

                    {/* BENTO 3: Nube y Multiplataforma */}
                    <div className="md:col-span-1 bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-[2.5rem] p-10 flex flex-col justify-between hover:border-[#CBAAA2]/50 transition-colors shadow-inner">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-[#CBAAA2]/10 flex items-center justify-center mb-6 border border-[#CBAAA2]/20">
                                <Smartphone className="text-[#CBAAA2]" size={28} />
                            </div>
                            <h3 className="text-xl font-black text-[#312923] mb-3 tracking-tight">Cero Instalaciones</h3>
                            <p className="text-[#6B615A] text-sm font-medium leading-relaxed">Accede desde el iPad en el sillón dental o tu celular en casa. Toda la clínica viaja contigo en tiempo real.</p>
                        </div>
                    </div>

                    {/* BENTO 4: Seguridad y Ley (Verde Oliva) */}
                    <div className="md:col-span-2 bg-[#5B6651] rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden group shadow-xl shadow-[#5B6651]/20">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                            <div className="w-20 h-20 shrink-0 rounded-[2rem] bg-white flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                                <ShieldCheck className="text-[#5B6651]" size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Estándar Legal MINSAL</h3>
                                <p className="text-[#DFD2C4] font-medium leading-relaxed">Diseñado respetando la Ley 20.584 y 19.628 de Chile. Fichas inalterables, recetas con RNPI y privacidad multitenant de grado bancario.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- PRECIOS SIMPLIFICADOS --- */}
            <div id="pricing" className="bg-white border-y border-[#DFD2C4]/40 py-24">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-[#312923] mb-4 tracking-tight">Un solo plan. Cero letras chicas.</h2>
                    <p className="text-[#6B615A] mb-16 max-w-xl mx-auto text-lg font-bold">
                        Creemos en el acceso justo a la tecnología de punta.
                    </p>

                    <div className="max-w-md mx-auto relative group">
                        {/* Sombra Oliva suave */}
                        <div className="absolute -inset-2 bg-[#5B6651]/5 rounded-[40px] blur-xl transition-all"></div>
                        
                        <div className="relative bg-[#FDFBF7] p-10 md:p-12 rounded-[2.5rem] border border-[#DFD2C4]/50" style={{ boxShadow: '0 25px 50px -12px rgba(91, 102, 81, 0.1)' }}>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3968B] bg-white px-4 py-1.5 rounded-full inline-block border border-[#DFD2C4] mb-8 shadow-sm">Suscripción Profesional</h3>
                            <div className="flex items-baseline justify-center gap-1 mb-10">
                                <span className="text-6xl font-black tracking-tighter text-[#312923]">$10.000</span>
                                <span className="text-[#9A8F84] font-bold text-sm">CLP/mes</span>
                            </div>
                            
                            <ul className="text-left space-y-4 mb-10">
                                {[
                                    'Ficha Clínica y Anamnesis Legal',
                                    'Odontograma y Perio por Voz (IA)',
                                    'Agenda y Recordatorios',
                                    'Gestión de Presupuestos y Caja',
                                    'Almacenamiento de RX e Imágenes',
                                    'Usuarios y Asistentes Ilimitados'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#6B615A]">
                                        <CheckCircle2 size={20} className="text-[#5B6651] shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="space-y-6">
                                <label className="flex items-start gap-3 cursor-pointer group text-left bg-white p-5 rounded-2xl border border-[#DFD2C4]/40 hover:border-[#5B6651]/50 transition-colors shadow-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        className="mt-1 w-5 h-5 accent-[#5B6651] rounded border-[#DFD2C4] cursor-pointer"
                                    />
                                    <span className="text-xs text-[#6B615A] font-bold leading-relaxed">
                                        Acepto los <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-[#CBAAA2] hover:underline font-black">Términos de Servicio</button> para operar.
                                    </span>
                                </label>

                                {/* BOTÓN DE PAGO REACTIVADO */}
                                <button 
                                    disabled={!acceptedTerms}
                                    onClick={() => window.location.href = PAYMENT_LINK}
                                    className={`w-full py-4 font-black rounded-2xl transition-all text-[11px] uppercase tracking-widest flex justify-center items-center gap-2 ${
                                        acceptedTerms 
                                        ? "bg-[#312923] text-white hover:bg-[#1a1512] shadow-lg shadow-[#312923]/20 hover:-translate-y-0.5" 
                                        : "bg-[#DFD2C4]/40 text-[#9A8F84] cursor-not-allowed"
                                    }`}
                                >
                                    Iniciar Digitalización <ArrowRight size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL DE TÉRMINOS --- */}
            {showTerms && (
                <div className="fixed inset-0 bg-[#312923]/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white border border-[#DFD2C4] rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] flex flex-col relative shadow-2xl animate-in zoom-in-95">
                        <div className="p-8 border-b border-[#DFD2C4]/40 flex justify-between items-center bg-[#FDFBF7] rounded-t-[2.5rem]">
                            <div>
                                <h2 className="text-2xl font-black text-[#312923] tracking-tight">Marco Legal y Privacidad</h2>
                                <p className="text-[10px] text-[#A3968B] font-black uppercase tracking-widest mt-1 text-left">ShiningCloud Dental</p>
                            </div>
                            <button onClick={() => setShowTerms(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-[#9A8F84] hover:bg-[#DFD2C4]/30 hover:text-[#312923] transition-colors border border-[#DFD2C4]/50">✕</button>
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
            <footer className="py-12 text-center bg-[#FDFBF7] border-t border-[#DFD2C4]/40">
                <div className="flex items-center justify-center gap-2 opacity-40 mb-3 text-[#312923]">
                    <Cloud size={16} />
                    <span className="font-black text-sm tracking-widest uppercase">ShiningCloud</span>
                </div>
                <p className="text-[#9A8F84] text-[10px] font-bold px-4 uppercase tracking-widest">
                    © {new Date().getFullYear()} ShiningCloud Dental Chile.
                </p>
            </footer>
        </div>
    );
}