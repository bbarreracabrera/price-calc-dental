import React, { useState, useEffect } from 'react';
import { 
  Cloud, Mic, ShieldCheck, Zap, CheckCircle2, ArrowRight, Box, FlaskConical, BarChart3, 
  ChevronRight, Lock, Calculator, Users, MessageCircle, Phone, Menu, X, Star, Sparkles
} from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: "Dictado por Voz Clínico",
      desc: "Completa tus fichas y odontogramas sin soltar los instrumentos. Nuestra IA entiende terminología dental en tiempo real.",
      icon: Mic,
      color: "text-red-500",
      bg: "bg-red-50"
    },
    {
      title: "Finanzas Inteligentes",
      desc: "Cálculo automático de rentabilidad, comisiones de doctores y ticket promedio. Reportes listos para tu contador.",
      icon: Calculator,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Importación Express",
      desc: "¿Vienes de Dentalink o Reservo? Sube tu Excel y migra toda tu clínica en menos de un minuto. Sin complicaciones.",
      icon: Zap,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  const stats = [
    { label: "Dentistas", value: "+100" },
    { label: "Fichas Creadas", value: "+15k" },
    { label: "Tiempo Ahorrado", value: "40%" }
  ];

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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#beneficios" className="text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Beneficios</a>
            <a href="#precios" className="text-xs font-black uppercase tracking-widest text-[#6B615A] hover:text-[#312923] transition-colors">Precios</a>
            <button 
              onClick={onLoginClick}
              className="px-8 py-3 bg-[#312923] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#312923]/10 flex items-center gap-2"
            >
              Acceso Clínicas <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[60] bg-[#FDFBF7] p-8 flex flex-col space-y-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
             <span className="text-xl font-black tracking-tighter">ShiningCloud</span>
             <button onClick={() => setMobileMenu(false)}><X size={32}/></button>
          </div>
          <div className="flex flex-col space-y-6">
            <a href="#beneficios" onClick={() => setMobileMenu(false)} className="text-2xl font-black">Beneficios</a>
            <a href="#precios" onClick={() => setMobileMenu(false)} className="text-2xl font-black">Precios</a>
            <button onClick={() => { setMobileMenu(false); onLoginClick(); }} className="w-full py-5 bg-[#312923] text-white rounded-2xl font-black uppercase tracking-widest">Entrar</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 px-6 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#CBAAA2]/10 via-transparent to-transparent blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-[#5B6651]/10">
              <Sparkles size={14} className="text-amber-500" /> El nuevo estándar dental
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-[#312923]">
              La odontología <br/>
              <span className="text-[#5B6651]">ahora es más</span> <br/>
              accesible.
            </h1>
            <p className="text-xl text-[#6B615A] font-medium leading-relaxed max-w-xl">
              Mucho más que un software de fichas. ShiningCloud es el primer ecosistema que une <strong>dictado por voz clínico</strong>, finanzas avanzadas y logística de insumos en una sola plataforma ultra-rápida.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={onLoginClick}
                className="px-12 py-6 bg-[#312923] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-[#312923]/20 flex items-center justify-center gap-3 group"
              >
                Digitalizar mi clínica <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-5 px-6 py-2">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-12 h-12 rounded-full border-4 border-[#FDFBF7] bg-[#DFD2C4] shadow-sm flex items-center justify-center text-[10px] font-black`}>
                      <Users size={16} className="text-[#312923]/40" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 text-amber-500 mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                  <p className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest leading-tight">
                    +100 Dentistas <br/> en Chile
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Preview Element */}
          <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
            <div className="aspect-[4/3] bg-white rounded-[3.5rem] border border-[#DFD2C4] shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF7] to-white flex items-center justify-center">
                  <div className="w-24 h-24 bg-[#312923] rounded-3xl shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-700 cursor-pointer">
                    <Mic className="text-white" size={40} />
                  </div>
               </div>
               
               {/* Floating UI Elements */}
               <div className="absolute top-10 right-10 bg-white p-6 rounded-[2rem] shadow-xl border border-[#DFD2C4]/50 animate-bounce duration-[3000ms]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20}/></div>
                    <div>
                      <p className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Ficha Clínica</p>
                      <p className="text-sm font-black">100% Digital</p>
                    </div>
                  </div>
               </div>

               <div className="absolute bottom-10 left-10 bg-[#312923] p-8 rounded-[2.5rem] shadow-2xl border border-white/10 w-2/3">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CBAAA2]">Efecto ShiningCloud</p>
                      <Zap size={16} className="text-amber-400" />
                    </div>
                    <p className="text-2xl font-black text-white leading-tight">Velocidad de gestión <br/> incrementada +300%</p>
                  </div>
               </div>
            </div>
            {/* Background glows */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#CBAAA2]/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#5B6651]/20 rounded-full blur-[100px] -z-10" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-[#DFD2C4]/40 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {stats.map((s, i) => (
            <div key={i} className="space-y-1">
              <p className="text-5xl font-black tracking-tighter text-[#312923]">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9A8F84]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="beneficios" className="py-32 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#312923]">Potencia tu clínica con <br/> <span className="text-[#5B6651]">superpoderes.</span></h2>
            <p className="text-[#6B615A] text-lg font-medium">Diseñamos cada herramienta para que te enfoques en tus pacientes, mientras nosotros automatizamos el resto.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <div key={i} className="p-12 rounded-[3rem] border border-[#DFD2C4]/50 hover:border-[#5B6651]/40 transition-all hover:shadow-2xl group bg-[#FDFBF7]/50">
                <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-sm`}>
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-black mb-5 text-[#312923]">{f.title}</h3>
                <p className="text-[#6B615A] font-medium leading-relaxed text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6 bg-[#312923] text-white overflow-hidden relative">
         <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <ShieldCheck size={600} />
         </div>
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-4">
              <h3 className="text-3xl font-black tracking-tight">Seguridad de grado bancario.</h3>
              <p className="text-[#9A8F84] font-medium max-w-md">Tus datos y los de tus pacientes están protegidos bajo los más altos estándares legales en Chile.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-10 opacity-60">
               <div className="flex items-center gap-3 font-black tracking-tighter text-xl"><Lock size={24} className="text-[#CBAAA2]"/> AWS Encrypted</div>
               <div className="flex items-center gap-3 font-black tracking-tighter text-xl"><ShieldCheck size={24} className="text-[#CBAAA2]"/> Ley 19.628</div>
               <div className="flex items-center gap-3 font-black tracking-tighter text-xl"><Cloud size={24} className="text-[#CBAAA2]"/> 99.9% Uptime</div>
            </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-40 px-6 relative">
        <div className="max-w-5xl mx-auto bg-white rounded-[4rem] p-12 md:p-24 border border-[#DFD2C4] text-center space-y-12 relative overflow-hidden shadow-2xl">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CBAAA2]/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[#CBAAA2]">
              Precio Disruptivo Lanzamiento
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#312923]">Más accesible, <br/> más potente.</h2>
          </div>

          <div className="py-16 border-y border-[#DFD2C4]/50 space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#9A8F84]">Plan Profesional Único</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl font-bold text-[#9A8F84] line-through opacity-50">$45.000</span>
              <span className="text-7xl md:text-9xl font-black text-[#312923] tracking-tighter">$10.000</span>
              <span className="text-2xl font-black text-[#5B6651]">/mes</span>
            </div>
            <p className="text-[#9A8F84] font-bold italic text-lg">"El software dental más barato de Chile"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
            {[
              "Usuarios y Doctores Ilimitados",
              "Soporte Personalizado 24/7",
              "Migración de Datos Gratis",
              "Odontograma por Voz Incluido",
              "Módulo Financiero Avanzado",
              "Recetas y Consentimientos"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#5B6651]/10 flex items-center justify-center text-[#5B6651]"><CheckCircle2 size={16} /></div>
                <span className="text-sm font-black text-[#6B615A]">{item}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={onLoginClick}
            className="w-full py-8 bg-[#312923] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-black transition-all shadow-2xl shadow-[#312923]/30"
          >
            Empezar mi transformación ahora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-[#DFD2C4]/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <Cloud className="text-[#312923]" size={28} />
              <span className="text-2xl font-black tracking-tighter text-[#312923]">ShiningCloud <span className="text-[#9A8F84]">Dental</span></span>
            </div>
            <p className="text-lg text-[#6B615A] font-medium max-w-md leading-relaxed">
              Transformando la gestión dental en Chile con tecnología accesible y de alto impacto. Desarrollado para odontólogos, por odontólogos.
            </p>
            <div className="flex gap-6">
              <div className="w-14 h-14 bg-white border border-[#DFD2C4] rounded-2xl flex items-center justify-center text-[#312923] hover:bg-[#312923] hover:text-white transition-all cursor-pointer shadow-sm">
                <MessageCircle size={24} />
              </div>
              <div className="w-14 h-14 bg-white border border-[#DFD2C4] rounded-2xl flex items-center justify-center text-[#312923] hover:bg-[#312923] hover:text-white transition-all cursor-pointer shadow-sm">
                <Phone size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#312923]">Producto</h4>
            <ul className="space-y-4 text-sm font-bold text-[#9A8F84]">
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Beneficios</li>
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Precios</li>
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Seguridad</li>
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Calculadora PRA</li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#312923]">Legal</h4>
            <ul className="space-y-4 text-sm font-bold text-[#9A8F84]">
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Privacidad</li>
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Términos</li>
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Ley 19.628</li>
              <li className="hover:text-[#312923] cursor-pointer transition-colors">Contacto</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-[#DFD2C4]/30 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#DFD2C4]">
            © 2026 ShiningCloud Dental • Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
