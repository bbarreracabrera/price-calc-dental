import React, { useState, useEffect } from 'react';
import { 
  Cloud, ArrowRight, CheckCircle2, Menu, X, Star, Sparkles,
  MessageCircle, ShieldCheck, Zap, Calculator, Users, Box, 
  Stethoscope, FlaskConical, BarChart3, ChevronRight, Play,
  Globe, Heart, MousePointer2, Mail, Clock, Activity, Shield,
  FileText, Smartphone, HelpCircle, ChevronDown, Minus, Check
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

  // Icono de diente: la marca ya usa esta silueta como motivo de fondo en el
  // hero. La reutilizamos como firma visual consistente en la tabla comparativa.
  const ToothMark = ({ className = '', size = 20 }) => (
    <svg viewBox="0 0 200 220" width={size} height={size} className={className} fill="currentColor">
      <path d="M100 10C70 10 45 35 45 65c0 20 8 38 20 50L55 210h90l-10-95c12-12 20-30 20-50 0-30-25-55-55-55z" />
    </svg>
  );

  const comparativaRows = [
    { label: 'Ficha clínica que cumple Ley 20.584', notebook: false, generic: 'partial', sc: true },
    { label: 'Odontograma digital por pieza', notebook: false, generic: true, sc: true },
    { label: 'Recordatorios automáticos de citas', notebook: false, generic: 'partial', sc: true },
    { label: 'Facturación SII integrada', notebook: false, generic: false, sc: true },
    { label: 'Acceso simultáneo desde varios dispositivos', notebook: false, generic: true, sc: true },
    { label: 'Soporte en español, por WhatsApp', notebook: '—', generic: false, sc: true },
    { label: 'Sin contrato de permanencia', notebook: true, generic: false, sc: true },
    { label: 'Costo mensual', notebook: '$0*', generic: '$35.000+', sc: '$15.000' },
  ];

  const ComparCell = ({ value }) => {
    if (value === true) return <Check className="text-[#5B6651] mx-auto" size={18} strokeWidth={3} />;
    if (value === false) return <Minus className="text-[#DFD2C4] mx-auto" size={18} strokeWidth={3} />;
    if (value === 'partial') return <span className="text-[10px] font-black uppercase tracking-widest text-[#CBAAA2]">A veces</span>;
    return <span className="text-xs md:text-sm font-black text-[#312923]">{value}</span>;
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
                    onClick={() => {
                      setMobileMenu(false);
                      onLoginClick();
                    }} 
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
        {/* Firma visual: silueta de diente, ahora protagonista y no solo decoración de esquina */}
        <div className="absolute top-10 right-0 w-64 h-64 md:w-[440px] md:h-[440px] opacity-[0.05] pointer-events-none translate-x-1/4">
          <ToothMark className="w-full h-full text-[#312923]" size="100%" />
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
                <ShieldCheck className="text-[#CBAAA2]" size={32} />
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
            <div>
              <div className="w-12 h-12 bg-[#FDFBF7] rounded-xl flex items-center justify-center mb-6 border border-[#DFD2C4]/50 group-hover:scale-110 transition-transform">
                <Stethoscope className="text-[#5B6651]" size={24} />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-4 tracking-tight">Odontograma 360°</h3>
              <p className="text-[#6B615A] font-medium">Visualiza el estado de tus pacientes con precisión quirúrgica. Historial por pieza y evolución temporal.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#DFD2C4]/50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Adulto & Pediátrico</span>
              <ChevronRight className="text-[#DFD2C4] group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Finanzas */}
          <div className="md:col-span-2 bg-white border border-[#DFD2C4] rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 flex flex-col justify-between group hover:border-[#CBAAA2]/30 transition-all shadow-sm">
            <div>
              <div className="w-12 h-12 bg-[#FDFBF7] rounded-xl flex items-center justify-center mb-6 border border-[#DFD2C4]/50 group-hover:scale-110 transition-transform">
                <Calculator className="text-[#CBAAA2]" size={24} />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-4 tracking-tight">Control de Flujo</h3>
              <p className="text-[#6B615A] font-medium">Gestión de presupuestos, abonos y deudas. Conciliación bancaria simple para dentistas independientes.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#DFD2C4]/50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Integrado con SII</span>
              <ChevronRight className="text-[#DFD2C4] group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa Section — antes el nav apuntaba acá y no había nada */}
      <section id="comparativa" className="py-20 md:py-32 px-4 md:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <div className="inline-block px-4 py-1.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">La Comparación Honesta</div>
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#312923]">Cuaderno, otro software, <br className="hidden md:block"/> o <span className="text-[#5B6651]">ShiningCloud.</span></h2>
          <p className="text-[#9A8F84] font-medium text-lg md:text-xl max-w-2xl mx-auto">Lo que de verdad cambia cuando dejas el papel — y lo que otros softwares dentales todavía no resuelven.</p>
        </div>

        <div className="bg-white border border-[#DFD2C4] rounded-[2rem] md:rounded-[3rem] shadow-sm overflow-hidden">
          {/* Encabezado de columnas */}
          <div className="grid grid-cols-4 border-b border-[#DFD2C4]/60">
            <div className="p-4 md:p-6"></div>
            <div className="p-3 md:p-6 text-center border-l border-[#DFD2C4]/40">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Cuaderno</p>
              <p className="text-[9px] md:text-[10px] font-bold text-[#9A8F84]/70">/ Excel</p>
            </div>
            <div className="p-3 md:p-6 text-center border-l border-[#DFD2C4]/40">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Otro</p>
              <p className="text-[9px] md:text-[10px] font-bold text-[#9A8F84]/70">software</p>
            </div>
            <div className="p-3 md:p-6 text-center border-l border-[#DFD2C4]/40 bg-[#5B6651]/5 flex flex-col items-center justify-center gap-1">
              <ToothMark className="text-[#5B6651]" size={16} />
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#5B6651]">ShiningCloud</p>
            </div>
          </div>

          {/* Filas */}
          {comparativaRows.map((row, i) => (
            <div key={i} className={`grid grid-cols-4 items-center ${i !== comparativaRows.length - 1 ? 'border-b border-[#DFD2C4]/40' : ''}`}>
              <div className="p-3 md:p-6">
                <p className="text-[11px] md:text-sm font-bold text-[#312923] leading-tight">{row.label}</p>
              </div>
              <div className="p-3 md:p-6 text-center border-l border-[#DFD2C4]/40"><ComparCell value={row.notebook} /></div>
              <div className="p-3 md:p-6 text-center border-l border-[#DFD2C4]/40"><ComparCell value={row.generic} /></div>
              <div className="p-3 md:p-6 text-center border-l border-[#DFD2C4]/40 bg-[#5B6651]/5"><ComparCell value={row.sc} /></div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold text-[#9A8F84] mt-4 text-center">*Un cuaderno es gratis en dinero, pero cuesta horas administrativas, citas perdidas y riesgo de incumplir la Ley 20.584.</p>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-4 md:px-6 bg-[#312923] text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 md:mb-24 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-white/10 text-[#DFD2C4] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">Precio de Lanzamiento</div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Un solo plan. <br className="md:hidden"/> <span className="text-[#DFD2C4]">Todo incluido.</span></h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 text-[#312923] shadow-2xl relative group overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#5B6651] text-white px-8 py-2 font-black text-[10px] uppercase tracking-widest rounded-bl-3xl">Fundadores</div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <h3 className="text-2xl font-black mb-2">Plan Profesional</h3>
                  <p className="text-[#9A8F84] font-medium">Ideal para clínicas y dentistas independientes.</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="flex items-baseline gap-1 md:justify-end">
                    <span className="text-2xl md:text-3xl font-bold">$</span>
                    <span className="text-5xl md:text-7xl font-black tracking-tighter">15.000</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-1">Pesos Chilenos / Mes</p>
                </div>
              </div>

              <ul className="grid sm:grid-cols-2 gap-4 md:gap-6 mb-12">
                {[
                  'Pacientes Ilimitados', 'Agenda Multiprofesional', 'Odontograma 3D', 
                  'Ficha Clínica Legal', 'Control Financiero', 'Recetas Digitales',
                  'Gestión de Inventario', 'Soporte Prioritario 24/7'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm md:text-base font-bold text-[#6B615A]">
                    <CheckCircle2 className="text-[#5B6651] shrink-0" size={18} />
                    {item}
                  </li>
                ))}
              </ul>

              <button 
                onClick={onLoginClick}
                className="w-full py-6 md:py-8 bg-[#312923] text-white rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 group"
              >
                Comenzar ahora gratis <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
              
              <p className="text-center mt-6 text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">Precio fijo para las primeras clínicas fundadoras. Paga con Webpay o MercadoPago. Sin contratos de permanencia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16 md:mb-20 space-y-4">
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#312923]">Preguntas <span className="text-[#CBAAA2]">Frecuentes</span></h2>
          <p className="text-[#9A8F84] font-medium text-lg">Resolvemos tus dudas sobre la migración digital.</p>
        </div>

        <div className="space-y-4">
          <FAQItem 
            question="¿Es difícil migrar mis datos desde otro software?" 
            answer="Para nada. Contamos con un equipo de soporte especializado que te ayudará a importar tus pacientes y fichas desde archivos Excel o bases de datos de otros proveedores sin costo adicional."
          />
          <FAQItem 
            question="¿El software cumple con la normativa de salud en Chile?" 
            answer="Sí, ShiningCloud Dental está diseñado bajo los estándares de la Ley 20.584 de Derechos y Deberes de los Pacientes, garantizando la confidencialidad y la integridad de la ficha clínica electrónica."
          />
          <FAQItem 
            question="¿Puedo usarlo en varios computadores al mismo tiempo?" 
            answer="¡Sí! Al ser una plataforma 100% en la nube, puedes acceder desde cualquier dispositivo (PC, Mac, Tablet o Smartphone) de forma simultánea sin límites de usuarios."
          />
          <FAQItem 
            question="¿Qué pasa si decido dejar de usar el servicio?" 
            answer="Tus datos son tuyos. En cualquier momento puedes exportar toda tu base de datos de pacientes e historial clínico en formatos estándar. No tenemos cláusulas de permanencia."
          />
        </div>
      </section>

      {/* Footer / CTA Final */}
      <footer className="py-20 px-4 text-center bg-[#FDFBF7] border-t border-[#DFD2C4]">
        <div className="max-w-4xl mx-auto space-y-10 md:space-y-16">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[#312923] leading-[0.9]">¿Listo para elevar el nivel de tu clínica?</h2>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center px-4">
            <button 
              onClick={onLoginClick}
              className="w-full sm:w-auto px-10 md:px-16 py-5 md:py-7 bg-[#312923] text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl"
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
