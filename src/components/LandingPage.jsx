import React, { useState, useEffect } from 'react';
import { 
  Cloud, ArrowRight, CheckCircle2, Menu, X, Star, Sparkles,
  MessageCircle, ShieldCheck, Zap, Calculator, Users, Box, 
  Stethoscope, FlaskConical, BarChart3, ChevronRight, Play,
  Globe, Heart, MousePointer2, Mail, Clock, Activity
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

  // Paleta de colores ShiningCloud:
  // Primary: #312923 (Negro carbón)
  // Accent: #5B6651 (Verde musgo)
  // Soft: #CBAAA2 (Rosa arcilla)
  // Background: #FDFBF7 (Crema)

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════
           NAVBAR
      ══════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#DFD2C4]/50 py-4 shadow-sm' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-[#312923] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Cloud className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">ShiningCloud<span className="text-[#5B6651]"> Dental</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Funciones</a>
            <a href="#como-funciona" className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Cómo funciona</a>
            <a href="#pricing" className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Planes</a>
            <button 
              onClick={onLoginClick}
              className="px-8 py-3 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#312923]/10 flex items-center gap-2"
            >
              Iniciar sesión <ArrowRight size={14} />
            </button>
          </div>

          <button className="md:hidden p-2 text-[#312923]" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#DFD2C4] p-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-xs font-black uppercase tracking-widest text-[#6B615A]">Funciones</a>
            <a href="#como-funciona" onClick={() => setMobileMenu(false)} className="block text-xs font-black uppercase tracking-widest text-[#6B615A]">Cómo funciona</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-xs font-black uppercase tracking-widest text-[#6B615A]">Planes</a>
            <button onClick={onLoginClick} className="w-full py-4 bg-[#312923] text-white rounded-xl font-black text-xs uppercase tracking-widest">Iniciar Sesión</button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative pt-48 pb-24 px-6 overflow-hidden">
        {/* Diente decorativo de fondo */}
        <div className="absolute top-[-10%] right-[-5%] opacity-[0.03] pointer-events-none rotate-12">
          <svg width="600" height="600" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 10C70 10 45 35 45 65c0 20 8 38 20 50L55 210h90l-10-95c12-12 20-30 20-50 0-30-25-55-55-55z" fill="#312923"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-[#5B6651]/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 bg-[#5B6651] rounded-full animate-pulse"></span>
                Hecho en Chile, para dentistas chilenos
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-[#312923] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Abriste tu consultorio.<br/>
                <span className="text-[#5B6651]">¿Y ahora quién lleva la agenda y la ficha?</span>
              </h1>

              <p className="text-xl md:text-2xl text-[#6B615A] font-medium leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                ShiningCloud Dental es el software de gestión que los odontólogos recién egresados en Chile necesitaban. Sin contratos. Con facturación SII.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 pt-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                <button 
                  onClick={onLoginClick}
                  className="px-12 py-6 bg-[#312923] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-[#312923]/20 flex items-center justify-center gap-3 group"
                >
                  Prueba gratis 14 días <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={handleWhatsApp}
                  className="px-12 py-6 bg-white text-[#312923] border border-[#DFD2C4] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-3"
                >
                  Ver demo (2 min) <Play size={18} fill="currentColor" />
                </button>
              </div>

              <div className="flex items-center gap-4 pt-8 border-t border-[#DFD2C4]/50">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm ${i % 2 === 0 ? 'bg-[#5B6651]' : 'bg-[#312923]'}`}>
                      {['DR', 'MC', 'AP', '+'][i-1]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#9A8F84] font-bold">
                  <span className="text-[#312923]">+80 odontólogos</span> ya digitalizaron su clínica
                </p>
              </div>
            </div>

            {/* Mockup del producto */}
            <div className="relative fade-up delay-2 hidden lg:block">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-[#DFD2C4] overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="bg-[#312923] px-6 py-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-[10px] text-white/40 font-mono tracking-widest uppercase">shiningcloud.cl/app</span>
                </div>
                <div className="p-8 bg-[#FDFBF7]/50 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Dashboard</p>
                      <p className="text-lg font-black">Lunes 30 — 3 citas hoy</p>
                    </div>
                    <div className="px-4 py-2 bg-[#5B6651] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#5B6651]/20">+ Nuevo paciente</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Utilidad', val: '$1.2M', c: 'text-[#5B6651]' },
                      { label: 'Pacientes', val: '47', c: 'text-[#312923]' },
                      { label: 'No-Show', val: '8%', c: 'text-[#CBAAA2]' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl border border-[#DFD2C4]/50 shadow-sm">
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.c}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl border border-[#DFD2C4]/50 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[#DFD2C4]/50 bg-[#FDFBF7]/50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest">Agenda hoy</span>
                      <ChevronRight size={14} className="text-[#9A8F84]" />
                    </div>
                    {[1, 2].map(i => (
                      <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-[#DFD2C4]/20 last:border-0">
                        <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-[#5B6651]' : 'bg-amber-400'}`} />
                        <div className="flex-1">
                          <p className="text-xs font-black">{i === 1 ? 'María Jiménez' : 'Carlos Rojas'}</p>
                          <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">{i === 1 ? '09:00 · Endodoncia' : '11:30 · Control'}</p>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${i === 1 ? 'bg-[#5B6651]/10 text-[#5B6651]' : 'bg-amber-50 text-amber-600'}`}>
                          {i === 1 ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           FEATURES BENTO
      ══════════════════════════════════════════════ */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-block px-4 py-1.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Potencia Clínica</div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#312923]">Diseñado para el <span className="text-[#5B6651]">Alto Rendimiento.</span></h2>
          <p className="text-[#9A8F84] font-medium text-xl max-w-2xl mx-auto">Todo lo que tu clínica necesita, organizado en una grilla de superpoderes digitales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[300px]">
          {/* Ficha Clínica */}
          <div className="md:col-span-2 md:row-span-2 bg-[#312923] rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl flex flex-col justify-between text-white">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck size={400} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-10 backdrop-blur-md border border-white/10">
                <ShieldCheck className="text-[#CBAAA2]" size={32} />
              </div>
              <h3 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight leading-none">Ficha Clínica <br/> Legal & Segura</h3>
              <p className="text-[#A3968B] text-xl font-medium leading-relaxed max-w-sm">
                Cumple con la Ley 20.584 automáticamente. Firmas digitales, historial inalterable y cifrado de grado bancario.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#CBAAA2]">
              <div className="w-2 h-2 rounded-full bg-[#CBAAA2] animate-pulse" /> Certificación CENS en Proceso
            </div>
          </div>

          {/* Odontograma */}
          <div className="md:col-span-2 bg-white border border-[#DFD2C4] rounded-[3.5rem] p-12 flex flex-col justify-between group hover:border-[#5B6651]/30 transition-all shadow-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tight text-[#312923]">Odontograma 3D</h3>
                <p className="text-[#6B615A] font-medium text-base max-w-xs">Visualización interactiva y presupuestos que se generan con un clic.</p>
              </div>
              <div className="w-14 h-14 bg-[#5B6651]/10 text-[#5B6651] rounded-2xl flex items-center justify-center">
                <Activity size={28} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-10 w-8 rounded-lg border-2 transition-all ${i === 3 ? 'bg-[#5B6651] border-[#5B6651]' : 'bg-[#FDFBF7] border-[#DFD2C4]'}`} />
              ))}
              <span className="ml-4 text-[10px] font-black text-[#5B6651] uppercase tracking-widest">Presupuesto Automático</span>
            </div>
          </div>

          {/* Laboratorio */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[3rem] p-8 flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-[#312923] text-white rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <FlaskConical size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight">Logística Lab</h3>
              <p className="text-[#6B615A] text-xs font-medium leading-relaxed">Envía órdenes y archivos STL directamente a tu laboratorio asociado.</p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5B6651]">
              <CheckCircle2 size={14}/> 100% Digital
            </div>
          </div>

          {/* Finanzas */}
          <div className="bg-[#5B6651] rounded-[3rem] p-8 flex flex-col justify-between text-white shadow-xl group overflow-hidden relative">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Calculator size={150} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                <Calculator className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight">Finanzas <br/> Inteligentes</h3>
            </div>
            <p className="relative z-10 text-white/70 text-xs font-medium">Controla tus gastos, boletas y rentabilidad real por tratamiento.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           PRICING SECTION
      ══════════════════════════════════════════════ */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto bg-[#312923] rounded-[4rem] p-12 md:p-24 text-white text-center space-y-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Calculator size={400} />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.5em] text-[#CBAAA2]">
              Lanzamiento 2026
            </div>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter">Un solo precio. <br/> Sin límites.</h2>
          </div>

          <div className="py-20 border-y border-white/10 space-y-8 relative z-10">
            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#9A8F84]">Plan Profesional Ilimitado</p>
            <div className="flex items-center justify-center gap-6">
              <span className="text-4xl font-bold text-[#9A8F84] line-through opacity-30">$45.000</span>
              <span className="text-8xl md:text-[10rem] font-black text-white tracking-tighter leading-none">$10.000</span>
              <div className="text-left">
                <p className="text-2xl font-black text-[#CBAAA2]">/mes</p>
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">IVA Incluido</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 pt-4">
              {['Pacientes Ilimitados', 'Soporte 24/7', 'Boleta SII', 'Backup Diario'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                  <CheckCircle2 size={14} className="text-[#5B6651]" /> {f}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <button 
              onClick={onLoginClick}
              className="w-full py-8 bg-white text-[#312923] rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] hover:bg-[#FDFBF7] transition-all shadow-xl hover:scale-[1.02]"
            >
              Comenzar ahora
            </button>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9A8F84]">
              Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="bg-white border-t border-[#DFD2C4] py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#312923] rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter">ShiningCloud<span className="text-[#5B6651]"> Dental</span></span>
            </div>
            <p className="text-[#6B615A] font-medium text-lg max-w-sm">
              Transformando la odontología en Chile a través de la tecnología, el diseño y la eficiencia.
            </p>
            <div className="flex gap-4">
              <button onClick={handleWhatsApp} className="w-12 h-12 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl flex items-center justify-center hover:bg-[#DFD2C4]/20 transition-colors">
                <MessageCircle size={20} />
              </button>
              <a href={`mailto:${contactEmail}`} className="w-12 h-12 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl flex items-center justify-center hover:bg-[#DFD2C4]/20 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#312923]">Plataforma</h4>
            <ul className="space-y-4 text-sm font-bold text-[#6B615A]">
              <li><a href="#features" className="hover:text-[#312923] transition-colors">Funciones</a></li>
              <li><a href="#pricing" className="hover:text-[#312923] transition-colors">Precios</a></li>
              <li><a href="#" className="hover:text-[#312923] transition-colors">Laboratorios</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#312923]">Legal</h4>
            <ul className="space-y-4 text-sm font-bold text-[#6B615A]">
              <li><a href="#" className="hover:text-[#312923] transition-colors">Términos de Uso</a></li>
              <li><a href="#" className="hover:text-[#312923] transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-[#312923] transition-colors">Ley 19.628</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-[#DFD2C4]/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">© 2026 ShiningCloud Dental. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5B6651]">
            <ShieldCheck size={14} /> Servidores Encriptados en Chile
          </div>
        </div>
      </footer>

    </div>
  );
}
