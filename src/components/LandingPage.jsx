import React, { useState, useEffect } from 'react';
import { 
  Cloud, Mic, ShieldCheck, Zap, CheckCircle2, ArrowRight, Box, FlaskConical, BarChart3, 
  ChevronRight, Lock, Calculator, Users, MessageCircle, Phone, Menu, X, Star, Sparkles,
  Stethoscope, FileSpreadsheet, Activity, Globe, Heart, MousePointer2, Mail
} from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const contactWhatsApp = "56932745439";
  const contactEmail = "b.barreracabrera.dent@gmail.com";

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Hola, me interesa digitalizar mi clínica con ShiningCloud Dental. ¿Me podrías dar más información?");
    window.open(`https://wa.me/${contactWhatsApp}?text=${msg}`, '_blank');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#DFD2C4]/50 py-4 shadow-sm' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-[#312923] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Cloud className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">ShiningCloud <span className="text-[#9A8F84]">Dental</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#experiencia" className="text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Funciones</a>
            <a href="#precios" className="text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Precios</a>
            <button onClick={handleWhatsApp} className="text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Contacto</button>
            <button 
              onClick={onLoginClick}
              className="px-8 py-3 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#312923]/10 flex items-center gap-2"
            >
              Acceso Clínicas <ArrowRight size={14} />
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-[#5B6651]/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={14} className="text-amber-500" /> El software dental más rápido de Chile
          </div>
          <h1 className="text-6xl md:text-[7.5rem] font-black tracking-tighter leading-[0.85] text-[#312923] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Odontología <br/>
            <span className="text-[#5B6651]">Sin Fricción.</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#6B615A] font-medium leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Mucho más que fichas clínicas. ShiningCloud es un ecosistema de alto rendimiento que une <strong>dictado por voz, finanzas avanzadas y logística</strong> en una sola plataforma ultra-ligera.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
            <button 
              onClick={onLoginClick}
              className="px-12 py-6 bg-[#312923] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-[#312923]/20 flex items-center justify-center gap-3 group"
            >
              Comenzar Ahora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={handleWhatsApp}
              className="px-12 py-6 bg-white text-[#312923] border border-[#DFD2C4] rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-3"
            >
              Hablar con un experto <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* THE BENTO GRID 3.0 */}
      <section id="experiencia" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#312923]">Diseñado para el <span className="text-[#5B6651]">Alto Rendimiento.</span></h2>
          <p className="text-[#9A8F84] font-medium text-lg">Todo lo que tu clínica necesita, organizado en una grilla de superpoderes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[280px]">
          
          {/* 1. Odontograma por Voz (Grande) */}
          <div className="md:col-span-2 md:row-span-2 bg-[#312923] rounded-[3rem] p-10 relative overflow-hidden group shadow-xl flex flex-col justify-between text-white">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Mic size={300} />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                <Mic className="text-white" size={28} />
              </div>
              <h3 className="text-4xl font-black mb-4 tracking-tight leading-none">Dictado por Voz <br/> Clínico IA</h3>
              <p className="text-[#A3968B] text-lg font-medium leading-relaxed max-w-sm">
                Completa odontogramas y evoluciones sin tocar el mouse. Nuestra IA está entrenada con terminología dental chilena.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#CBAAA2]">
              <Activity size={16} className="animate-pulse" /> Escuchando hallazgos en tiempo real
            </div>
          </div>

          {/* 2. Finanzas (Horizontal) */}
          <div className="md:col-span-2 bg-white border border-[#DFD2C4] rounded-[3rem] p-10 flex flex-col justify-between group hover:border-[#5B6651]/30 transition-all shadow-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight text-[#312923]">Finanzas & Rentabilidad</h3>
                <p className="text-[#6B615A] font-medium text-sm max-w-xs">Calcula el ticket promedio y la utilidad neta de tu clínica al instante.</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Calculator size={24} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="h-12 w-8 bg-[#5B6651]/10 rounded-t-lg" />
              <div className="h-16 w-8 bg-[#5B6651]/20 rounded-t-lg" />
              <div className="h-24 w-8 bg-[#5B6651] rounded-t-lg" />
              <div className="h-20 w-8 bg-[#5B6651]/40 rounded-t-lg" />
              <span className="ml-4 text-xs font-black text-[#5B6651] uppercase tracking-widest">Utilidad +24%</span>
            </div>
          </div>

          {/* 3. Laboratorio (Vertical) */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[3rem] p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <FlaskConical size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight">Lab Network</h3>
              <p className="text-[#6B615A] text-xs font-medium leading-relaxed">Centraliza tus órdenes de trabajo y archivos STL con laboratorios.</p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600">
              <CheckCircle2 size={14}/> 12 Trabajos Activos
            </div>
          </div>

          {/* 4. Importación (Vertical) */}
          <div className="bg-[#5B6651] rounded-[3rem] p-8 flex flex-col justify-between text-white shadow-xl group overflow-hidden relative">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Zap size={150} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                <Zap className="text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight">Migración <br/> en 1 Minuto</h3>
            </div>
            <p className="relative z-10 text-white/70 text-xs font-medium">Sube tu Excel de Dentalink o Reservo y nosotros hacemos el resto.</p>
          </div>

          {/* 5. CRM & Retención (Horizontal Largo) */}
          <div className="md:col-span-2 bg-white border border-[#DFD2C4] rounded-[3rem] p-10 flex items-center justify-between group hover:border-amber-300 transition-all shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-[#312923]">Retención CRM</h3>
              <p className="text-[#6B615A] font-medium text-sm max-w-xs">Identifica pacientes inactivos y automatiza recordatorios por WhatsApp.</p>
            </div>
            <div className="hidden sm:flex flex-col gap-2">
               <div className="px-4 py-2 bg-[#FDFBF7] border border-[#DFD2C4] rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500" /> Paciente Inactivo
               </div>
               <div className="px-4 py-2 bg-[#5B6651] text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <MessageCircle size={12} /> Enviar Recordatorio
               </div>
            </div>
          </div>

          {/* 6. Insumos (Cuadrado) */}
          <div className="bg-white border border-[#DFD2C4] rounded-[3rem] p-8 flex flex-col justify-between group hover:border-red-300 transition-all shadow-sm">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <Box size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight text-[#312923]">Control Stock</h3>
              <p className="text-[#6B615A] text-xs font-medium">Alertas inteligentes de stock crítico y vencimiento de insumos.</p>
            </div>
            <div className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg self-start">
              Stock Crítico: 2
            </div>
          </div>

          {/* 7. Recetas (Cuadrado) */}
          <div className="bg-[#312923] rounded-[3rem] p-8 flex flex-col justify-between text-white group shadow-xl">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Stethoscope size={24} className="text-[#CBAAA2]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight">Recetas PDF</h3>
              <p className="text-white/60 text-xs font-medium">Genera recetas y consentimientos profesionales en segundos.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#CBAAA2]">
              <ShieldCheck size={14}/> Firma Digital
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto bg-[#312923] rounded-[4rem] p-12 md:p-24 text-white text-center space-y-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Calculator size={400} />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-[#CBAAA2]">
              Transparencia Total
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Un solo precio. <br/> Sin límites.</h2>
          </div>

          <div className="py-16 border-y border-white/10 space-y-6 relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#9A8F84]">Plan Profesional Ilimitado</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl font-bold text-[#9A8F84] line-through opacity-50">$45.000</span>
              <span className="text-7xl md:text-9xl font-black text-white tracking-tighter">$10.000</span>
              <span className="text-2xl font-black text-[#CBAAA2]">/mes</span>
            </div>
            <p className="text-[#9A8F84] font-bold italic text-lg">"El software más potente y accesible de Chile"</p>
          </div>

          <button 
            onClick={onLoginClick}
            className="w-full py-8 bg-white text-[#312923] rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-[#FDFBF7] transition-all shadow-xl relative z-10"
          >
            Digitalizar mi clínica ahora
          </button>
          
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] relative z-10">
            Paga solo por lo que usas. Sin contratos de largo plazo.
          </p>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#5B6651]/10 rounded-2xl flex items-center justify-center mx-auto">
              <Lock size={32} className="text-[#5B6651]" />
            </div>
            <h3 className="text-lg font-black text-[#312923]">Ley 19.628 Cumplida</h3>
            <p className="text-sm text-[#6B615A] font-medium">Encriptación de datos de pacientes. URLs firmadas. Cumplimiento total.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#5B6651]/10 rounded-2xl flex items-center justify-center mx-auto">
              <Cloud size={32} className="text-[#5B6651]" />
            </div>
            <h3 className="text-lg font-black text-[#312923]">AWS Encriptado</h3>
            <p className="text-sm text-[#6B615A] font-medium">Infraestructura de clase mundial. Backups automáticos. 99.9% uptime.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#5B6651]/10 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck size={32} className="text-[#5B6651]" />
            </div>
            <h3 className="text-lg font-black text-[#312923]">Soporte 24/7</h3>
            <p className="text-sm text-[#6B615A] font-medium">Equipo dedicado. Respuestas en menos de 1 hora. Siempre disponibles.</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-[#5B6651] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-black tracking-tighter">Transforma tu Clínica Hoy</h2>
          <p className="text-xl font-medium text-[#DFD2C4]">15 días gratis. Sin tarjeta de crédito. Acceso completo a todas las funciones.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onLoginClick}
              className="px-12 py-6 bg-white text-[#5B6651] rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-[#FDFBF7] transition-all shadow-xl flex items-center justify-center gap-3"
            >
              Comenzar Prueba Gratis <ArrowRight size={18} />
            </button>
            <button 
              onClick={handleWhatsApp}
              className="px-12 py-6 bg-white/10 text-white border border-white/30 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            >
              <MessageCircle size={18} /> Hablar con Ventas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-[#DFD2C4]/50 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#312923] rounded-lg flex items-center justify-center text-white font-black text-xs">SC</div>
                <span className="font-black text-[#312923]">ShiningCloud Dental</span>
              </div>
              <p className="text-[11px] text-[#9A8F84] font-bold">La odontología más rápida de Chile.</p>
            </div>
            <div>
              <h4 className="font-black text-[#312923] text-[10px] uppercase tracking-widest mb-4">Producto</h4>
              <ul className="space-y-2 text-[10px] text-[#6B615A] font-bold">
                <li><button onClick={onLoginClick} className="hover:text-[#5B6651] transition-colors">Características</button></li>
                <li><button onClick={() => window.location.href = '#precios'} className="hover:text-[#5B6651] transition-colors">Precios</button></li>
                <li><button onClick={handleWhatsApp} className="hover:text-[#5B6651] transition-colors">Contacto</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[#312923] text-[10px] uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2 text-[10px] text-[#6B615A] font-bold">
                <li><span className="hover:text-[#5B6651] cursor-pointer transition-colors">Privacidad</span></li>
                <li><span className="hover:text-[#5B6651] cursor-pointer transition-colors">Términos</span></li>
                <li><span className="hover:text-[#5B6651] cursor-pointer transition-colors">Ley 19.628</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[#312923] text-[10px] uppercase tracking-widest mb-4">Contacto Directo</h4>
              <div className="space-y-3">
                <button onClick={handleWhatsApp} className="flex items-center gap-2 text-[10px] font-bold text-[#5B6651] hover:text-[#4a5442] transition-colors">
                  <MessageCircle size={14} /> +56 9 3274 5439
                </button>
                <button onClick={() => window.location.href = `mailto:${contactEmail}`} className="flex items-center gap-2 text-[10px] font-bold text-[#5B6651] hover:text-[#4a5442] transition-colors">
                  <Mail size={14} /> Email
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-[#DFD2C4]/50 pt-8 text-center">
            <p className="text-[10px] font-bold text-[#9A8F84]">© 2026 ShiningCloud Dental. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
