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

  const contactWhatsApp = "56932745439";

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Hola, me interesa digitalizar mi clínica con ShiningCloud Dental. ¿Me podrías dar más información?");
    window.open(`https://wa.me/${contactWhatsApp}?text=${msg}`, '_blank');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cierra el menú móvil al hacer scroll
  useEffect(() => {
    if (mobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenu]);

  const scrollToSection = (id) => {
    setMobileMenu(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
      }
    }, 100);
  };

  const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-white border border-[#DFD2C4] rounded-2xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-5 flex items-center justify-between text-left group"
        >
          <span className="font-bold text-[#312923] text-sm md:text-base pr-4">{question}</span>
          <ChevronDown className={`text-[#9A8F84] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </button>
        {isOpen && (
          <div className="px-6 pb-6">
            <p className="text-[#6B615A] text-sm leading-relaxed">{answer}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans selection:bg-[#CBAAA2] selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FDFBF7]/95 backdrop-blur-xl border-b border-[#DFD2C4]/50 py-3 shadow-sm' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 group cursor-pointer" 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#312923] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Cloud className="text-white" size={18} />
            </div>
            <span className="text-base md:text-xl font-black tracking-tighter">
              ShiningCloud<span className="text-[#5B6651]"> Dental</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Funciones</button>
            <button onClick={() => scrollToSection('comparativa')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Comparativa</button>
            <button onClick={() => scrollToSection('pricing')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">FAQ</button>
            <button 
              onClick={onLoginClick}
              className="px-6 py-2.5 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
            >
              Iniciar sesión <ArrowRight size={12} />
            </button>
          </div>

          {/* Mobile: botón entrar + hamburguesa */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              type="button"
              onClick={onLoginClick}
              className="relative z-[60] px-4 py-2.5 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
            >
              Entrar
            </button>
            <button 
              type="button"
              className="relative z-[60] p-2 text-[#312923] rounded-xl hover:bg-[#DFD2C4]/30 transition-colors"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Menú"
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 z-[55] md:hidden" 
              onClick={() => setMobileMenu(false)}
            />
            {/* Panel */}
            <div className="absolute top-full left-0 right-0 bg-white border-b border-[#DFD2C4] z-[56] md:hidden shadow-2xl">
              <div className="px-6 py-6 space-y-1">
                <button onClick={() => scrollToSection('features')} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-colors">Funciones</button>
                <button onClick={() => scrollToSection('comparativa')} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-colors">Comparativa</button>
                <button onClick={() => scrollToSection('pricing')} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-colors">Planes</button>
                <button onClick={() => scrollToSection('faq')} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-colors">FAQ</button>
                <div className="pt-4 pb-2">
                  <button 
                    type="button"
                    onClick={onLoginClick} 
                    className="w-full py-4 bg-[#312923] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-colors active:scale-95"
                  >
                    Iniciar Sesión →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-44 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 md:w-[500px] md:h-[500px] opacity-[0.03] pointer-events-none rotate-12 translate-x-1/4 -translate-y-1/4">
          <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M100 10C70 10 45 35 45 65c0 20 8 38 20 50L55 210h90l-10-95c12-12 20-30 20-50 0-30-25-55-55-55z" fill="#312923"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            
            {/* Texto principal */}
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-[#5B6651]/10 mx-auto lg:mx-0">
                <span className="w-2 h-2 bg-[#5B6651] rounded-full animate-pulse shrink-0"></span>
                Hecho en Chile, para dentistas chilenos
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-[#312923]">
                Abriste tu consultorio.
                <br/>
                <span className="text-[#5B6651]">¿Y ahora quién lleva la agenda?</span>
              </h1>

              <p className="text-base md:text-xl text-[#6B615A] font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                ShiningCloud Dental es el software de gestión que los odontólogos en Chile necesitaban. Sin contratos. Con facturación SII.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                <button 
                  type="button"
                  onClick={onLoginClick}
                  className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-[#312923] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-[#312923]/20 flex items-center justify-center gap-3 group active:scale-95"
                >
                  Prueba gratis <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-[#312923] border border-[#DFD2C4] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Ver demo <Play size={16} fill="currentColor" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-[#DFD2C4]/50 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[
                    { initials: 'DR', bg: 'bg-[#312923]' },
                    { initials: 'MC', bg: 'bg-[#5B6651]' },
                    { initials: 'AP', bg: 'bg-[#312923]' },
                    { initials: '+', bg: 'bg-[#CBAAA2]' },
                  ].map((item, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm ${item.bg}`}>
                      {item.initials}
                    </div>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-[#9A8F84] font-bold text-center sm:text-left">
                  <span className="text-[#312923]">+80 odontólogos</span> ya digitalizaron su clínica
                </p>
              </div>
            </div>

            {/* Hero Mockup — visible desde sm en adelante */}
            <div className="relative hidden sm:block">
              <div className="bg-white rounded-[2rem] shadow-2xl border border-[#DFD2C4] overflow-hidden lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="bg-[#312923] px-4 md:px-6 py-3 md:py-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-[9px] text-white/40 font-mono tracking-widest uppercase truncate">shiningcloud.cl/app</span>
                </div>
                <div className="p-5 md:p-8 bg-[#FDFBF7]/50 space-y-4 md:space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Dashboard</p>
                      <p className="text-sm md:text-lg font-black">Lunes 30 — 3 citas hoy</p>
                    </div>
                    <button 
                      type="button"
                      onClick={onLoginClick} 
                      className="px-3 md:px-4 py-1.5 md:py-2 bg-[#5B6651] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg"
                    >
                      + Nuevo
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {[
                      { label: 'Utilidad', val: '$1.2M', c: 'text-[#5B6651]' },
                      { label: 'Pacientes', val: '47', c: 'text-[#312923]' },
                      { label: 'No-Show', val: '8%', c: 'text-[#CBAAA2]' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-3 md:p-4 rounded-xl border border-[#DFD2C4]/50 shadow-sm">
                        <p className="text-[7px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">{s.label}</p>
                        <p className={`text-base md:text-xl font-black ${s.c}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {['María González — Ortodoncia 10:00', 'Carlos Ruiz — Limpieza 11:30', 'Ana Pérez — Implante 14:00'].map((appt, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#DFD2C4]/30">
                        <div className="w-2 h-2 rounded-full bg-[#5B6651] shrink-0"></div>
                        <span className="text-[10px] font-bold text-[#312923] truncate">{appt}</span>
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
      <section id="features" className="py-16 md:py-28 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16 space-y-3">
          <div className="inline-block px-4 py-1.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Potencia Clínica</div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#312923]">Diseñado para el <span className="text-[#5B6651]">Alto Rendimiento.</span></h2>
          <p className="text-[#9A8F84] font-medium text-base md:text-lg max-w-2xl mx-auto">Todo lo que tu clínica necesita, organizado en una grilla de superpoderes digitales.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Ficha Clínica — ocupa 2 columnas en lg */}
          <div className="sm:col-span-2 bg-[#312923] rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl flex flex-col justify-between text-white min-h-[280px]">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000 hidden md:block">
              <ShieldCheck size={300} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <ShieldCheck className="text-[#CBAAA2]" size={26} />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-4 tracking-tight leading-none">Ficha Clínica <br className="hidden md:block"/> Legal & Segura</h3>
              <p className="text-[#A3968B] text-sm md:text-base font-medium leading-relaxed max-w-sm">
                Cumple con la Ley 20.584 automáticamente. Firmas digitales, historial inalterable y cifrado de grado bancario.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#CBAAA2] mt-6">
              <div className="w-2 h-2 rounded-full bg-[#CBAAA2] animate-pulse shrink-0" /> Certificación CENS en Proceso
            </div>
          </div>

          {/* Odontograma */}
          <div className="sm:col-span-2 bg-white border border-[#DFD2C4] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all min-h-[200px]">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-[#312923]">Odontograma Interactivo</h3>
                <p className="text-[#6B615A] font-medium text-sm max-w-xs">Visualización de 32 piezas y presupuestos que se generan con un clic.</p>
              </div>
              <div className="w-12 h-12 bg-[#5B6651]/10 text-[#5B6651] rounded-2xl flex items-center justify-center shrink-0">
                <Activity size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-8 w-6 rounded-lg border-2 transition-all ${i === 3 ? 'bg-[#5B6651] border-[#5B6651]' : 'bg-[#FDFBF7] border-[#DFD2C4]'}`} />
              ))}
              <span className="ml-3 text-[8px] font-black text-[#5B6651] uppercase tracking-widest hidden sm:block">Presupuesto Automático</span>
            </div>
          </div>

          {/* Laboratorio */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-10 h-10 bg-[#312923] text-white rounded-xl flex items-center justify-center mb-4">
              <FlaskConical size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#312923] mb-2">Lab Connect</h4>
              <p className="text-[#9A8F84] text-sm font-medium">Envía trabajos al laboratorio y recibe confirmación en tiempo real.</p>
            </div>
          </div>

          {/* Finanzas */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-10 h-10 bg-[#5B6651] text-white rounded-xl flex items-center justify-center mb-4">
              <BarChart3 size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#312923] mb-2">Caja & Finanzas</h4>
              <p className="text-[#9A8F84] text-sm font-medium">Control de abonos, saldos y flujo de caja diario sin complicaciones.</p>
            </div>
          </div>

          {/* Agenda */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-10 h-10 bg-[#CBAAA2] text-white rounded-xl flex items-center justify-center mb-4">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#312923] mb-2">Agenda Inteligente</h4>
              <p className="text-[#9A8F84] text-sm font-medium">Recordatorios automáticos por WhatsApp. Reduce el no-show hasta un 60%.</p>
            </div>
          </div>

          {/* Inventario */}
          <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="w-10 h-10 bg-[#9A8F84] text-white rounded-xl flex items-center justify-center mb-4">
              <Box size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#312923] mb-2">Inventario & Insumos</h4>
              <p className="text-[#9A8F84] text-sm font-medium">Alertas de stock mínimo y control de vencimientos en tiempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section id="comparativa" className="py-16 md:py-24 bg-[#312923] text-white px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">¿Por qué cambiar el papel por la nube?</h2>
            <p className="text-[#A3968B] text-base md:text-lg">Comparamos la gestión tradicional vs la experiencia ShiningCloud.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-10">
              <h3 className="text-base font-black uppercase tracking-widest text-[#CBAAA2] mb-6">Gestión Tradicional</h3>
              <ul className="space-y-4">
                {[
                  'Fichas de papel que se pierden o dañan',
                  'Agendas manuales con tachones y errores',
                  'Cero respaldo legal ante fiscalizaciones',
                  'Difícil calcular la utilidad real del mes'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#A3968B] text-sm md:text-base">
                    <X className="text-red-400 shrink-0 mt-0.5" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#5B6651] rounded-[2rem] p-6 md:p-10 shadow-2xl">
              <h3 className="text-base font-black uppercase tracking-widest text-white/60 mb-6">ShiningCloud Dental</h3>
              <ul className="space-y-4">
                {[
                  'Historial clínico digital e inalterable',
                  'Agenda inteligente con recordatorios WA',
                  'Respaldo legal Ley 20.584 y CENS',
                  'Dashboard financiero en tiempo real'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white text-sm md:text-base font-bold">
                    <CheckCircle2 className="text-white shrink-0 mt-0.5" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-28 px-4 md:px-6 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16 space-y-3">
            <div className="inline-block px-4 py-1.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[9px] font-black uppercase tracking-[0.3em]">Planes</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#312923]">Simple y sin sorpresas.</h2>
            <p className="text-[#9A8F84] font-medium text-base md:text-lg max-w-xl mx-auto">Sin contratos anuales. Sin letra chica. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Plan Gratuito */}
            <div className="bg-white border border-[#DFD2C4] rounded-[2rem] p-7 md:p-10 flex flex-col">
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-2">Gratis</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl md:text-5xl font-black text-[#312923]">$0</span>
                  <span className="text-[#9A8F84] font-bold mb-1">/mes</span>
                </div>
                <p className="text-sm text-[#6B615A] mt-2">Para empezar a digitalizar tu clínica hoy.</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  'Hasta 30 pacientes',
                  'Ficha clínica básica',
                  'Agenda con 1 profesional',
                  'Odontograma interactivo',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#6B615A]">
                    <CheckCircle2 size={16} className="text-[#5B6651] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                type="button"
                onClick={onLoginClick}
                className="w-full py-3.5 border-2 border-[#312923] text-[#312923] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#312923] hover:text-white transition-all active:scale-95"
              >
                Empezar gratis
              </button>
            </div>

            {/* Plan Pro */}
            <div className="bg-[#312923] rounded-[2rem] p-7 md:p-10 flex flex-col text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-5 right-5 px-3 py-1 bg-[#5B6651] rounded-full text-[8px] font-black uppercase tracking-widest">Más popular</div>
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#A3968B] mb-2">Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl md:text-5xl font-black">$29.990</span>
                  <span className="text-[#A3968B] font-bold mb-1">/mes</span>
                </div>
                <p className="text-sm text-[#A3968B] mt-2">Todo lo que necesitas para crecer.</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  'Pacientes ilimitados',
                  'Múltiples profesionales',
                  'Recordatorios WhatsApp',
                  'Facturación SII integrada',
                  'Laboratorio Connect',
                  'Soporte prioritario',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                    <CheckCircle2 size={16} className="text-[#CBAAA2] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                type="button"
                onClick={onLoginClick}
                className="w-full py-3.5 bg-white text-[#312923] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FDFBF7] transition-all active:scale-95"
              >
                Probar 14 días gratis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 px-4 md:px-6 bg-[#F5F0E8]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-14 space-y-3">
            <div className="inline-block px-4 py-1.5 bg-[#312923]/10 text-[#312923] rounded-full text-[9px] font-black uppercase tracking-[0.3em]">FAQ</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#312923]">Preguntas frecuentes.</h2>
          </div>
          <div className="space-y-3">
            <FAQItem 
              question="¿Necesito instalar algo para usar ShiningCloud?"
              answer="No. ShiningCloud es 100% web. Funciona desde cualquier navegador en tu computador, tablet o celular. Sin instalaciones, sin actualizaciones manuales."
            />
            <FAQItem 
              question="¿Mis datos están seguros?"
              answer="Sí. Usamos cifrado de grado bancario (AES-256) y los datos se almacenan en servidores certificados. Cumplimos con la Ley 19.628 de protección de datos personales de Chile."
            />
            <FAQItem 
              question="¿Puedo usar ShiningCloud con más de un dentista?"
              answer="Sí, el plan Pro permite agregar múltiples profesionales con roles diferenciados: dentista, asistente y administrador. Cada uno ve solo lo que necesita."
            />
            <FAQItem 
              question="¿Cómo funciona la facturación con el SII?"
              answer="Integración directa con el SII para emitir boletas y facturas electrónicas desde la misma plataforma. No necesitas usar otro software de facturación."
            />
            <FAQItem 
              question="¿Puedo cancelar en cualquier momento?"
              answer="Sí. No hay contratos ni períodos mínimos. Puedes cancelar tu suscripción cuando quieras desde la configuración de tu cuenta."
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 px-4 text-center bg-[#FDFBF7] border-t border-[#DFD2C4]">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#312923] leading-tight">
            ¿Listo para elevar el nivel de tu clínica?
          </h2>
          <p className="text-[#6B615A] text-base md:text-lg font-medium">
            Únete a más de 80 odontólogos que ya gestionan su clínica con ShiningCloud.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              type="button"
              onClick={onLoginClick}
              className="w-full sm:w-auto px-10 py-4 bg-[#312923] text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
            >
              Empezar ahora gratis
            </button>
            <button 
              type="button"
              onClick={handleWhatsApp}
              className="w-full sm:w-auto px-10 py-4 bg-white border border-[#DFD2C4] text-[#312923] rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#FDFBF7] transition-all active:scale-95"
            >
              Hablar con soporte
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-[#FDFBF7] border-t border-[#DFD2C4]/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#312923] rounded-lg flex items-center justify-center">
              <Cloud className="text-white" size={14} />
            </div>
            <span className="font-black text-sm text-[#312923]">ShiningCloud Dental</span>
          </div>
          <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest text-center">
            © 2025 ShiningCloud. Hecho con ♥ en Santiago, Chile.
          </p>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleWhatsApp}
              className="text-[10px] font-bold text-[#9A8F84] hover:text-[#312923] uppercase tracking-widest transition-colors"
            >
              Contacto
            </button>
            <button 
              type="button"
              onClick={onLoginClick}
              className="text-[10px] font-bold text-[#9A8F84] hover:text-[#312923] uppercase tracking-widest transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
