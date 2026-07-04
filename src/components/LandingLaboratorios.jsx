import React, { useState, useEffect } from 'react';
import {
  Cloud, ArrowRight, CheckCircle2, Menu, X, FlaskConical,
  Zap, Shield, BarChart3, ChevronDown, MessageCircle, Mail,
  Package, Clock, Star, Users, Smartphone, Lock, Globe
} from 'lucide-react';

export default function LandingLaboratorios({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const contactWhatsApp = "56932745439";
  const contactEmail = "b.barreracabrera.dent@gmail.com";

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Hola, soy técnico dental y me interesa unirme a ShiningCloud como laboratorio asociado. ¿Me podrías dar más información?");
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
      const offsetPosition = elementRect - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#DFD2C4]/50 py-4 shadow-sm' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-10 h-10 bg-[#312923] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Cloud className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">ShiningCloud<span className="text-[#5B6651]"> Lab</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection('como-funciona')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Cómo Funciona</button>
            <button onClick={() => scrollToSection('planes')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">FAQ</button>
            <a href="/" className="text-[10px] font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Para Clínicas</a>
            <button
              onClick={onLoginClick}
              className="px-8 py-3 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#312923]/10 flex items-center gap-2"
            >
              Unirse Gratis <ArrowRight size={14} />
            </button>
          </div>

          <button className="md:hidden p-2 text-[#312923]" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#DFD2C4] p-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
            <button onClick={() => scrollToSection('como-funciona')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A]">Cómo Funciona</button>
            <button onClick={() => scrollToSection('planes')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A]">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="w-full text-left text-xs font-black uppercase tracking-widest text-[#6B615A]">FAQ</button>
            <a href="/" className="block text-xs font-black uppercase tracking-widest text-[#6B615A]">Para Clínicas</a>
            <button onClick={onLoginClick} className="w-full py-4 bg-[#312923] text-white rounded-xl font-black text-xs uppercase tracking-widest">Unirse Gratis</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-48 pb-24 px-6 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] opacity-[0.03] pointer-events-none rotate-12">
          <FlaskConical size={500} />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-[#5B6651]/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 bg-[#5B6651] rounded-full animate-pulse"></span>
                Para Técnicos Dentales en Chile
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-[#312923] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Tu laboratorio,<br/>
                <span className="text-[#5B6651]">en una sola pantalla.</span>
              </h1>

              <p className="text-xl md:text-2xl text-[#6B615A] font-medium leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                Recibe órdenes de las clínicas que usan ShiningCloud Dental, gestiona tus trabajos y comunícate con los dentistas, todo desde un panel profesional y gratuito.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 pt-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                <button
                  onClick={onLoginClick}
                  className="px-12 py-6 bg-[#312923] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-[#312923]/20 flex items-center justify-center gap-3 group"
                >
                  Empezar Gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="px-12 py-6 bg-white text-[#312923] border border-[#DFD2C4] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-3"
                >
                  Hablar con soporte <MessageCircle size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4 pt-8 border-t border-[#DFD2C4]/50">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm ${i % 2 === 0 ? 'bg-[#5B6651]' : 'bg-[#312923]'}`}>
                      {['TL', 'PR', 'MG', '+'][i-1]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#9A8F84] font-bold">
                  <span className="text-[#312923]">Laboratorios activos</span> ya reciben órdenes digitales
                </p>
              </div>
            </div>

            {/* Mockup Dashboard Lab */}
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-[#DFD2C4] overflow-hidden transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="bg-[#312923] px-6 py-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-[10px] text-white/40 font-mono tracking-widest uppercase">Lab Dashboard</span>
                </div>
                <div className="p-8 bg-[#FDFBF7]/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Trabajos Activos</p>
                      <p className="text-lg font-black">7 órdenes en proceso</p>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">En Línea</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { tipo: 'Corona Zirconio', paciente: 'J. Rodríguez', estado: 'CAD/CAM', color: 'bg-blue-100 text-blue-700' },
                      { tipo: 'Prótesis Total', paciente: 'M. González', estado: 'Cerámica', color: 'bg-amber-100 text-amber-700' },
                      { tipo: 'Incrustación', paciente: 'P. Soto', estado: 'Listo', color: 'bg-emerald-100 text-emerald-700' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#DFD2C4]/50 shadow-sm">
                        <div>
                          <p className="text-xs font-black text-[#312923]">{item.tipo}</p>
                          <p className="text-[9px] text-[#9A8F84] font-bold">{item.paciente}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.color}`}>{item.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section id="como-funciona" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Flujo de Trabajo</div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#312923]">Así de simple <span className="text-[#5B6651]">funciona.</span></h2>
            <p className="text-[#9A8F84] font-medium text-xl max-w-2xl mx-auto">Desde que la clínica crea la orden hasta que el trabajo llega a producción.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', icon: <Mail size={28} />, title: 'Recibes la Orden', desc: 'La clínica crea una orden técnica con todos los detalles: tipo de trabajo, pieza, color y archivos STL/DICOM adjuntos.' },
              { num: '02', icon: <Package size={28} />, title: 'Confirmas Recepción', desc: 'Marcas la orden como recibida. La clínica ve en tiempo real que ya tienes el trabajo.' },
              { num: '03', icon: <Zap size={28} />, title: 'Actualizas el Estado', desc: 'Avanzas el estado (CAD/CAM → Cerámica → Listo) y el dentista recibe notificación automática.' },
              { num: '04', icon: <CheckCircle2 size={28} />, title: 'Despachas', desc: 'Marcas como despachado. El historial queda registrado para auditoría y trazabilidad.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[2rem] p-8 space-y-4 h-full hover:border-[#5B6651]/30 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 bg-[#312923] text-white rounded-2xl flex items-center justify-center shadow-lg">
                      {step.icon}
                    </div>
                    <span className="text-5xl font-black text-[#DFD2C4] leading-none">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-black text-[#312923]">{step.title}</h3>
                  <p className="text-[#6B615A] text-sm font-medium leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10 w-8 h-8 bg-white border border-[#DFD2C4] rounded-full items-center justify-center shadow-sm">
                    <ArrowRight size={14} className="text-[#9A8F84]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-block px-4 py-1.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Herramientas Pro</div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#312923]">Todo lo que necesitas <span className="text-[#5B6651]">para crecer.</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <BarChart3 size={32} />,
              title: 'Panel Kanban de Trabajos',
              desc: 'Visualiza todos tus trabajos en columnas por estado. Arrastra y actualiza con un clic.',
              color: 'bg-[#312923] text-white',
              iconBg: 'bg-white/10',
            },
            {
              icon: <Shield size={32} />,
              title: 'Archivos Seguros',
              desc: 'Recibe STL, DICOM y radiografías con acceso mediante URLs firmadas. Cumplimiento Ley 19.628.',
              color: 'bg-white border border-[#DFD2C4]',
              iconBg: 'bg-[#5B6651]/10 text-[#5B6651]',
            },
            {
              icon: <Smartphone size={32} />,
              title: '100% Móvil',
              desc: 'Gestiona tus trabajos desde el taller, en el celular. Sin instalar nada.',
              color: 'bg-white border border-[#DFD2C4]',
              iconBg: 'bg-[#CBAAA2]/10 text-[#CBAAA2]',
            },
            {
              icon: <Users size={32} />,
              title: 'Red de Clínicas',
              desc: 'Conéctate con múltiples clínicas que usan ShiningCloud. Expande tu cartera de clientes.',
              color: 'bg-white border border-[#DFD2C4]',
              iconBg: 'bg-[#5B6651]/10 text-[#5B6651]',
            },
            {
              icon: <Clock size={32} />,
              title: 'Historial Completo',
              desc: 'Registro de todos los trabajos completados con fechas, detalles técnicos y archivos.',
              color: 'bg-white border border-[#DFD2C4]',
              iconBg: 'bg-[#312923]/10 text-[#312923]',
            },
            {
              icon: <Lock size={32} />,
              title: 'Datos Protegidos',
              desc: 'Tus datos y los de los pacientes están cifrados. Nunca compartimos información con terceros.',
              color: 'bg-[#5B6651] text-white',
              iconBg: 'bg-white/10',
            },
          ].map((f, i) => (
            <div key={i} className={`${f.color} rounded-[2.5rem] p-10 space-y-6 hover:shadow-xl transition-all`}>
              <div className={`w-16 h-16 ${f.iconBg} rounded-2xl flex items-center justify-center`}>
                {f.icon}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight">{f.title}</h3>
                <p className={`text-sm font-medium leading-relaxed ${f.color.includes('bg-[#312923]') || f.color.includes('bg-[#5B6651]') ? 'opacity-70' : 'text-[#6B615A]'}`}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Precios Transparentes</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#312923]">2 modalidades. <span className="text-[#CBAAA2]">Tú eliges.</span></h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan Gratis */}
            <div className="bg-[#FDFBF7] border-2 border-[#DFD2C4] rounded-[2.5rem] p-10 space-y-8">
              <div>
                <div className="inline-block px-3 py-1 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[9px] font-black uppercase tracking-widest mb-4">Socio Gratis</div>
                <div className="flex items-end gap-2">
                  <span className="text-7xl font-black text-[#312923]">$0</span>
                  <span className="text-[#9A8F84] font-bold mb-2">/mes</span>
                </div>
                <p className="text-[#6B615A] text-sm font-medium mt-2">Para laboratorios que trabajan con clínicas ShiningCloud.</p>
              </div>
              <ul className="space-y-4">
                {[
                  'Recibir órdenes de clínicas conectadas',
                  'Panel Kanban de trabajos',
                  'Actualización de estados en tiempo real',
                  'Acceso seguro a archivos STL/DICOM',
                  'Historial de trabajos completados',
                  'Soporte por WhatsApp',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#312923]">
                    <CheckCircle2 size={16} className="text-[#5B6651] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onLoginClick}
                className="w-full py-5 border-2 border-[#312923] text-[#312923] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#312923] hover:text-white transition-all"
              >
                Empezar Gratis
              </button>
            </div>

            {/* Plan Pro */}
            <div className="bg-[#312923] rounded-[2.5rem] p-10 space-y-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Star size={200} />
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-[#CBAAA2]/20 text-[#CBAAA2] rounded-full text-[9px] font-black uppercase tracking-widest mb-4">Lab Pro — Próximamente</div>
                <div className="flex items-end gap-2">
                  <span className="text-7xl font-black">$12.990</span>
                  <span className="text-[#9A8F84] font-bold mb-2">/mes</span>
                </div>
                <p className="text-[#9A8F84] text-sm font-medium mt-2">Para laboratorios que quieren escalar su negocio.</p>
              </div>
              <ul className="space-y-4 relative z-10">
                {[
                  'Todo lo del plan Gratis',
                  'Trabajos externos (sin clínica conectada)',
                  'Facturación electrónica SII',
                  'Multi-técnico interno',
                  'Análisis de revenue mensual',
                  'Materiales y stock con trazabilidad',
                  'Onboarding personalizado',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/80">
                    <CheckCircle2 size={16} className="text-[#CBAAA2] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleWhatsApp}
                className="w-full py-5 bg-white text-[#312923] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#FDFBF7] transition-all relative z-10"
              >
                Notificarme cuando esté listo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-1.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Preguntas Frecuentes</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#312923]">Dudas <span className="text-[#CBAAA2]">Frecuentes.</span></h2>
        </div>
        <div className="space-y-4">
          <FAQItem
            question="¿Necesito que la clínica ya use ShiningCloud para registrarme?"
            answer="En el plan Gratis, sí. Tu cuenta de laboratorio se activa cuando una clínica que usa ShiningCloud te invita o te conecta desde su panel. Con el plan Pro (próximamente), podrás crear trabajos externos de cualquier clínica."
          />
          <FAQItem
            question="¿Cómo recibo las órdenes de trabajo?"
            answer="Cuando una clínica te asigna un trabajo, recibes una notificación y aparece automáticamente en tu panel Kanban. Puedes ver todos los detalles: tipo de trabajo, pieza, color, instrucciones y archivos adjuntos (STL, DICOM, imágenes)."
          />
          <FAQItem
            question="¿Los archivos STL y DICOM son seguros?"
            answer="Sí. Los archivos se almacenan en un bucket privado de Supabase Storage con políticas RLS. El acceso se genera mediante URLs firmadas con expiración de 1 hora, cumpliendo la Ley 19.628 de Protección de Datos Personales."
          />
          <FAQItem
            question="¿Puedo trabajar con varias clínicas al mismo tiempo?"
            answer="Sí. Tu panel muestra trabajos de todas las clínicas que te han conectado. Puedes filtrar por clínica, estado y fecha de entrega."
          />
          <FAQItem
            question="¿Hay app móvil?"
            answer="La plataforma es 100% responsive y funciona perfectamente desde el navegador de tu celular. No necesitas descargar nada."
          />
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 bg-[#312923] relative overflow-hidden">
        <div className="absolute bottom-[-10%] left-[-5%] opacity-[0.03] pointer-events-none -rotate-12">
          <FlaskConical size={600} />
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-tight">
            Tu laboratorio merece<br/>
            <span className="text-[#CBAAA2]">herramientas profesionales.</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={onLoginClick}
              className="px-12 py-6 bg-white text-[#312923] rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-[#FDFBF7] transition-all shadow-2xl flex items-center justify-center gap-3 group"
            >
              Empezar Gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-12 py-6 bg-white/10 text-white border border-white/20 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            >
              Hablar con soporte <MessageCircle size={18} />
            </button>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9A8F84]">
            Sin tarjeta de crédito · Plan gratis para siempre
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#DFD2C4] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#312923] rounded-xl flex items-center justify-center shadow-lg">
              <Cloud className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">ShiningCloud<span className="text-[#5B6651]"> Lab</span></span>
          </div>
          <div className="flex gap-6 text-sm font-bold text-[#6B615A]">
            <a href="/" className="hover:text-[#312923] transition-colors">Para Clínicas</a>
            <a href={`mailto:${contactEmail}`} className="hover:text-[#312923] transition-colors">Contacto</a>
          </div>
          <div className="flex gap-4">
            <button onClick={handleWhatsApp} className="w-10 h-10 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl flex items-center justify-center hover:bg-[#DFD2C4]/20 transition-colors">
              <MessageCircle size={18} />
            </button>
            <a href={`mailto:${contactEmail}`} className="w-10 h-10 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl flex items-center justify-center hover:bg-[#DFD2C4]/20 transition-colors">
              <Mail size={18} />
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-[#DFD2C4]/50 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">© 2026 ShiningCloud Dental. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
