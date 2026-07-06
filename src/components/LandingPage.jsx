import React, { useState, useEffect } from 'react';
import { 
  Cloud, ArrowRight, CheckCircle2, Menu, X, Star, Sparkles,
  MessageCircle, ShieldCheck, Zap, Calculator, Users, Box, 
  Stethoscope, FlaskConical, BarChart3, ChevronRight, Play,
  Globe, Heart, MousePointer2, Mail, Clock, Activity, Shield,
  FileText, Smartphone, HelpCircle, ChevronDown
} from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [ctaEmail, setCtaEmail] = useState("");

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

  const scrollToSection = (id) => {
    setMobileMenu(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-white border border-[#DFD2C4] rounded-2xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-5 flex items-center justify-between text-left group"
        >
          <span className="font-bold text-[#312923] text-sm md:text-base">{question}</span>
          <ChevronDown className={`text-[#9A8F84] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </button>
        {isOpen && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[#6B615A] text-sm leading-relaxed">{answer}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#DFD2C4]/50 py-4 shadow-sm' : 'bg-transparent py-4 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#312923] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Cloud className="text-white" size={20} />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter">ShiningCloud<span className="text-[#5B6651] hidden xs:inline"> Dental</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection('features')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Funciones</button>
            <button onClick={() => scrollToSection('comparativa')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Comparativa</button>
            <button onClick={() => scrollToSection('pricing')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">FAQ</button>
            <button 
              onClick={onLoginClick}
              className="px-8 py-3 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#312923]/10 flex items-center gap-2"
            >
              Iniciar sesión <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={onLoginClick}
              className="px-4 py-2 bg-[#312923] text-white rounded-full font-black text-[9px] uppercase tracking-widest"
            >
              Entrar
            </button>
            <button className="p-2 text-[#312923]" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#DFD2C4] p-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
            <button onClick={() => scrollToSection('features')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A] py-2">Funciones</button>
            <button onClick={() => scrollToSection('comparativa')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A] py-2">Comparativa</button>
            <button onClick={() => scrollToSection('pricing')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A] py-2">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A] py-2">FAQ</button>
            <button onClick={onLoginClick} className="w-full py-4 bg-[#312923] text-white rounded-xl font-black text-xs uppercase tracking-widest mt-4">Iniciar Sesión</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] opacity-[0.03] pointer-events-none rotate-12">
          <svg width="400" height="400" className="md:w-[600px] md:h-[600px]" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 10C70 10 45 35 45 65c0 20 8 38 20 50L55 210h90l-10-95c12-12 20-30 20-50 0-30-25-55-55-55z" fill="#312923"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="space-y-6 md:space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-[#5B6651]/10 animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto lg:mx-0">
                <span className="w-2 h-2 bg-[#5B6651] rounded-full animate-pulse"></span>
                Hecho en Chile, para dentistas chilenos
              </div>

              <h1 className="text-4xl xs:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-[#312923] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Abriste tu consultorio.<br className="hidden xs:block"/>
                <span className="text-[#5B6651]"> ¿Y ahora quién lleva la agenda?</span>
              </h1>

              <p className="text-lg md:text-2xl text-[#6B615A] font-medium leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 mx-auto lg:mx-0">
                ShiningCloud Dental es el software de gestión que los odontólogos en Chile necesitaban. Sin contratos. Con facturación SII.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-5 pt-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                <button 
                  onClick={onLoginClick}
                  className="w-full sm:w-auto px-8 md:px-12 py-5 md:py-6 bg-[#312923] text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-[#312923]/20 flex items-center justify-center gap-3 group"
                >
                  Prueba gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={handleWhatsApp}
                  className="w-full sm:w-auto px-8 md:px-12 py-5 md:py-6 bg-white text-[#312923] border border-[#DFD2C4] rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.25em] hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-3"
                >
                  Ver demo <Play size={18} fill="currentColor" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-[#DFD2C4]/50 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center text-[9px] md:text-[10px] font-black text-white shadow-sm ${i % 2 === 0 ? 'bg-[#5B6651]' : 'bg-[#312923]'}`}>
                      {['DR', 'MC', 'AP', '+'][i-1]}
                    </div>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-[#9A8F84] font-bold text-center sm:text-left">
                  <span className="text-[#312923]">+80 odontólogos</span> ya digitalizaron su clínica
                </p>
              </div>
            </div>

            {/* Hero Mockup (Visible en tablets/desktop) */}
            <div className="relative fade-up delay-2 hidden sm:block lg:block">
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-[#DFD2C4] overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="bg-[#312923] px-4 md:px-6 py-3 md:py-4 flex items-center gap-2">
                  <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-red-400"></div>
                  <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-[8px] md:text-[10px] text-white/40 font-mono tracking-widest uppercase truncate">shiningcloud.cl/app</span>
                </div>
                <div className="p-4 md:p-8 bg-[#FDFBF7]/50 space-y-4 md:space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Dashboard</p>
                      <p className="text-sm md:text-lg font-black">Lunes 30 — 3 citas hoy</p>
                    </div>
                    <button onClick={onLoginClick} className="px-3 md:px-4 py-1.5 md:py-2 bg-[#5B6651] text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl shadow-lg shadow-[#5B6651]/20">+ Nuevo</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {[
                      { label: 'Utilidad', val: '$1.2M', c: 'text-[#5B6651]' },
                      { label: 'Pacientes', val: '47', c: 'text-[#312923]' },
                      { label: 'No-Show', val: '8%', c: 'text-[#CBAAA2]' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-2 md:p-4 rounded-xl md:rounded-2xl border border-[#DFD2C4]/50 shadow-sm">
                        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">{s.label}</p>
                        <p className={`text-sm md:text-xl font-black ${s.c}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-20 space-y-4">
          <div className="inline-block px-4 py-1.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Potencia Clínica</div>
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#312923]">Diseñado para el <span className="text-[#5B6651]">Alto Rendimiento.</span></h2>
          <p className="text-[#9A8F84] font-medium text-lg md:text-xl max-w-2xl mx-auto">Todo lo que tu clínica necesita, organizado en una grilla de superpoderes digitales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[300px]">
          {/* Ficha Clínica */}
          <div className="md:col-span-2 md:row-span-2 bg-[#312923] rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl flex flex-col justify-between text-white">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000 hidden md:block">
              <ShieldCheck size={400} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-10 backdrop-blur-md border border-white/10">
                <ShieldCheck className="text-[#CBAAA2]" size={28} md:size={32} />
              </div>
              <h3 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight leading-none">Ficha Clínica <br className="hidden md:block"/> Legal & Segura</h3>
              <p className="text-[#A3968B] text-lg md:text-xl font-medium leading-relaxed max-w-sm">
                Cumple con la Ley 20.584 automáticamente. Firmas digitales, historial inalterable y cifrado de grado bancario.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#CBAAA2] mt-8 md:mt-0">
              <div className="w-2 h-2 rounded-full bg-[#CBAAA2] animate-pulse" /> Certificación CENS en Proceso
            </div>
          </div>

          {/* Odontograma */}
          <div className="md:col-span-2 bg-white border border-[#DFD2C4] rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 flex flex-col justify-between group hover:border-[#5B6651]/30 transition-all shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-[#312923]">Odontograma Interactiva</h3>
                <p className="text-[#6B615A] font-medium text-sm md:text-base max-w-xs">Visualización interactiva de 32 piezas y presupuestos que se generan con un clic.</p>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#5B6651]/10 text-[#5B6651] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                <Activity size={24} md:size={28} />
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 mt-6 md:mt-0">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-8 md:h-10 w-6 md:w-8 rounded-lg border-2 transition-all ${i === 3 ? 'bg-[#5B6651] border-[#5B6651]' : 'bg-[#FDFBF7] border-[#DFD2C4]'}`} />
              ))}
              <span className="ml-2 md:ml-4 text-[8px] md:text-[10px] font-black text-[#5B6651] uppercase tracking-widest">Presupuesto Automático</span>
            </div>
          </div>

          {/* Laboratorio */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#312923] text-white rounded-xl flex items-center justify-center mb-4">
              <FlaskConical size={20} md:size={24} />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-black text-[#312923] mb-2">Lab Connect</h4>
              <p className="text-[#9A8F84] text-xs md:text-sm font-medium">Envía trabajos al laboratorio y recibe confirmación en tiempo real.</p>
            </div>
          </div>

          {/* Finanzas */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#5B6651] text-white rounded-xl flex items-center justify-center mb-4">
              <BarChart3 size={20} md:size={24} />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-black text-[#312923] mb-2">Caja & Finanzas</h4>
              <p className="text-[#9A8F84] text-xs md:text-sm font-medium">Control de abonos, saldos y flujo de caja diario sin complicaciones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resto de secciones (simplificadas para móvil) */}
      <section id="comparativa" className="py-20 bg-[#312923] text-white px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-4">¿Por qué cambiar el papel por la nube?</h2>
            <p className="text-[#A3968B] text-lg md:text-xl">Comparamos la gestión tradicional vs la experiencia ShiningCloud.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12">
              <h3 className="text-xl font-black uppercase tracking-widest text-[#CBAAA2] mb-8">Gestión Tradicional</h3>
              <ul className="space-y-6">
                {['Fichas de papel que se pierden o dañan', 'Agendas manuales con tachones y errores', 'Cero respaldo legal ante fiscalizaciones', 'Difícil calcular la utilidad real del mes'].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-[#A3968B] text-sm md:text-base">
                    <X className="text-red-400 shrink-0 mt-1" size={18} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#5B6651] rounded-[2rem] p-8 md:p-12 shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-widest text-white/60 mb-8">ShiningCloud Dental</h3>
              <ul className="space-y-6">
                {['Historial clínico digital e inalterable', 'Agenda inteligente con recordatorios WA', 'Respaldo legal Ley 20.584 y CENS', 'Dashboard financiero en tiempo real'].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-white text-sm md:text-base font-bold">
                    <CheckCircle2 className="text-white shrink-0 mt-1" size={18} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA Final */}
      <footer className="py-20 px-4 text-center bg-[#FDFBF7] border-t border-[#DFD2C4]">
        <div className="max-w-4xl mx-auto space-y-10">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[#312923]">¿Listo para elevar el nivel de tu clínica?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onLoginClick}
              className="px-12 py-6 bg-[#312923] text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl"
            >
              Empezar ahora gratis
            </button>
            <button 
              onClick={handleWhatsApp}
              className="px-12 py-6 bg-white border border-[#DFD2C4] text-[#312923] rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#FDFBF7] transition-all"
            >
              Hablar con soporte
            </button>
          </div>
          <div className="pt-20 border-t border-[#DFD2C4]/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#312923] rounded-lg flex items-center justify-center">
                <Cloud className="text-white" size={18} />
              </div>
              <span className="font-black text-sm">ShiningCloud Dental</span>
            </div>
            <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">© 2024 ShiningCloud. Hecho con ♥ en Santiago, Chile.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
