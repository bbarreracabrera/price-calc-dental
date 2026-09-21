import { useEffect, useRef, useState } from 'react';
import { Menu, X, Check, Plus, Cloud } from 'lucide-react';

// ============================================================================
// LANDING PAGE
// ----------------------------------------------------------------------------
// Reemplaza la versión anterior, que tenía casi todos los tics típicos de una
// página "hecha por IA": etiquetas en mayúsculas sobre cada título, un grid de
// tarjetas idénticas, un mockup de ventana de navegador genérico, el mismo
// botón negro con flecha repetido cuatro veces, y — más grave que el estilo —
// afirmaciones falsas ("+80 odontólogos ya digitalizaron su clínica",
// "Certificación CENS en Proceso") en un producto que hoy no tiene un solo
// cliente ni ha iniciado ese trámite.
//
// Esta versión:
//   · Usa Fraunces (serif editorial) para titulares, solo aquí — el resto de
//     la app se queda en Plus Jakarta Sans.
//   · Reemplaza el mockup de navegador por un panel de lectura en vivo, en la
//     línea de un instrumento clínico, no de un producto de software genérico.
//   · Un solo momento de animación orquestado en el hero (titular + panel);
//     nada de scroll-reveal repetido en cada sección.
//   · El precio se muestra como una cotización real, con el mismo lenguaje
//     visual que ya usan los PDF de presupuesto de la app.
//   · Cero cifras inventadas. El framing es "cuentas fundadoras", que es
//     honesto para una etapa pre-lanzamiento.
// ============================================================================

const NAV_LINKS = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#comparativa', label: 'Comparativa' },
  { href: '#precio', label: 'Precio' },
  { href: '#faq', label: 'Preguntas' },
];

const WHATSAPP_URL =
  'https://wa.me/56932745439?text=' +
  encodeURIComponent('Hola, me interesa digitalizar mi clínica con ShiningCloud Dental');

const FAQS = [
  {
    q: '¿Es difícil migrar mis pacientes desde otro sistema?',
    a: 'No. Hay un asistente que importa tus pacientes desde Excel o desde Dentalink, Reservo o AgendaPro, valida los datos y evita duplicados automáticamente.',
  },
  {
    q: '¿Cumple con la normativa chilena?',
    a: 'Sí. La ficha sigue la estructura del Decreto 41 de 2012, los consentimientos usan firma electrónica válida bajo la Ley 19.799, y los datos se manejan conforme a la Ley 19.628.',
  },
  {
    q: '¿Puedo usarlo en varios computadores a la vez?',
    a: 'Sí, es una plataforma en la nube. Entras desde el computador de la clínica, tu notebook o tu celular, sin límite de dispositivos.',
  },
  {
    q: '¿Qué pasa si dejo de usarlo?',
    a: 'Tus datos son tuyos. Puedes exportar toda tu base de pacientes en cualquier momento. No hay cláusula de permanencia.',
  },
];

/** Cuenta ascendente, una sola vez al montar. Respeta reduce-motion. */
function useCountUp(target, { prefix = '', suffix = '', duration = 1400, reduceMotion }) {
  const [value, setValue] = useState(reduceMotion ? target : 0);
  useEffect(() => {
    if (reduceMotion) { setValue(target); return undefined; }
    let raf; let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduceMotion]);
  return `${prefix}${value.toLocaleString('es-CL')}${suffix}`;
}

export default function LandingPage({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const heroRef = useRef(null);
  const tiltRef = useRef(null);
  const magneticRef = useRef(null);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setScrolled(h.scrollTop > 40);
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  // El único elemento que sigue al cursor: el panel del hero, con un tilt 3D
  // sutil. Reservado a un solo lugar a propósito — es el momento memorable,
  // no un efecto repetido por toda la página.
  const handleHeroMouseMove = (e) => {
    if (reduceMotion || !tiltRef.current || !heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tiltRef.current.style.transform = `rotateY(${-6 + x * 10}deg) rotateX(${3 - y * 8}deg)`;
  };
  const handleHeroMouseLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = 'rotateY(-6deg) rotateX(3deg)';
  };

  // El único botón magnético: el CTA principal del hero.
  const handleMagneticMove = (e) => {
    if (reduceMotion || !magneticRef.current) return;
    const r = magneticRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.4;
    magneticRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const handleMagneticLeave = () => {
    if (magneticRef.current) magneticRef.current.style.transform = 'translate(0,0)';
  };

  const pacientes = useCountUp(7, { reduceMotion });
  const ingresos = useCountUp(1240, { prefix: '$', suffix: 'k', reduceMotion });
  const asistencia = useCountUp(92, { suffix: '%', reduceMotion });
  const sparkHeights = [30, 55, 40, 70, 50, 85, 65];

  return (
    <div className="bg-canvas text-ink font-sans antialiased">

      {/* Barra de progreso de scroll */}
      <div
        className="fixed left-0 top-0 z-[100] h-[3px] bg-gradient-to-r from-rose to-accent transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />

      {/* ===== NAV ===== */}
      <nav className={`fixed inset-x-0 top-0 z-[90] transition-all duration-300 ${
        scrolled ? 'bg-canvas/95 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md' : 'py-5'
      }`}>
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
            <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] bg-ink">
              <Cloud size={18} className="text-white" strokeWidth={2.4} />
            </span>
            ShiningCloud <span className="text-accent">Dental</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onLoginClick}
              className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:-translate-y-px hover:bg-black"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] text-ink transition-colors hover:bg-raised md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="flex flex-col gap-0.5 border-b border-line bg-canvas/98 px-6 pb-5 backdrop-blur-md md:hidden">
            {NAV_LINKS.map(l => (
              <a
                key={l.href} href={l.href} onClick={closeMobile}
                className="border-t border-line py-3.5 text-[15.5px] font-bold text-ink"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={() => { closeMobile(); onLoginClick?.(); }}
              className="mt-3.5 rounded-full bg-ink py-3 text-center text-[13px] font-bold text-white"
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden pb-24 pt-[150px]"
      >
        {/* Retícula de milímetro de fondo — el motivo propio del producto
            (como un periodontograma), no un blob de gradiente genérico. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(#E6DFD5 1px, transparent 1px), linear-gradient(90deg, #E6DFD5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 75% 20%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 75% 20%, black, transparent)',
          }}
        />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="mb-4.5 flex items-center gap-2 text-sm font-semibold text-rose">
              <span className="h-[7px] w-[7px] animate-pulse-dot rounded-full bg-rose" />
              Hecho en Valdivia, para dentistas chilenos
            </div>

            <h1 className="font-serif text-[38px] font-medium leading-[1.04] tracking-[-0.02em] sm:text-[52px] lg:text-[66px]">
              <span className="block overflow-hidden">
                <span className="block translate-y-full animate-rise opacity-0 [animation-delay:.05s]">
                  Abriste tu consultorio.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="block translate-y-full animate-rise text-accent opacity-0 [animation-delay:.18s]">
                  ¿Quién lleva la ficha?
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-[46ch] animate-fade-up-in text-lg font-medium leading-relaxed text-muted opacity-0 [animation-delay:.5s]">
              ShiningCloud reemplaza el cuaderno y el Excel por un sistema clínico que cumple la Ley 20.584 desde el primer paciente que registras.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-7 animate-fade-up-in opacity-0 [animation-delay:.65s]">
              <a
                ref={magneticRef}
                href="#precio"
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-ink px-7 py-4 text-[15px] font-bold tracking-tight text-white transition-[background-color] duration-200 hover:bg-black [&_span]:transition-transform [&_span]:duration-300 hover:[&_span]:translate-x-1"
              >
                Empezar gratis <span className="inline-flex">→</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank" rel="noopener noreferrer"
                className="border-b-[1.5px] border-line-strong pb-0.5 text-sm font-bold text-ink transition-colors hover:border-ink"
              >
                Hablar por WhatsApp
              </a>
            </div>

            <div className="mt-10 max-w-[42ch] animate-fade-up-in border-t border-line pt-6 text-[13.5px] leading-relaxed text-faint opacity-0 [animation-delay:.8s]">
              <b className="font-bold text-muted">Estamos abriendo las primeras cuentas fundadoras.</b> Precio fijo de por vida para quienes se suman ahora, antes del lanzamiento público.
            </div>
          </div>

          {/* Panel instrumento — reemplaza el mockup de navegador genérico */}
          <div className="animate-fade-up-in opacity-0 [animation-delay:.35s]" style={{ perspective: '1400px' }}>
            <div
              ref={tiltRef}
              className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_2px_4px_rgba(70,82,60,.05),0_24px_60px_-20px_rgba(36,31,27,.18)] transition-transform duration-150 ease-out"
              style={{ transform: 'rotateY(-6deg) rotateX(3deg)' }}
            >
              <div className="flex items-center justify-between border-b border-line px-5.5 py-4.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative h-2 w-2 rounded-full bg-rose">
                    <span className="absolute -inset-1.5 animate-ring rounded-full border-[1.5px] border-rose" />
                  </span>
                  <span className="text-[12.5px] font-bold text-muted">Panel de hoy</span>
                </div>
                <span className="text-xs font-semibold text-faint">Lunes 30</span>
              </div>

              <div className="p-5.5">
                <div className="mb-4.5 grid grid-cols-3 gap-2.5">
                  <div className="rounded-[14px] border border-line bg-canvas p-3.5">
                    <p className="mb-1.5 text-[11.5px] font-semibold text-faint">Pacientes</p>
                    <p className="tabular-nums text-[21px] font-extrabold tracking-tight">{pacientes}</p>
                  </div>
                  <div className="rounded-[14px] border border-line bg-canvas p-3.5">
                    <p className="mb-1.5 text-[11.5px] font-semibold text-faint">Ingresos</p>
                    <p className="tabular-nums text-[21px] font-extrabold tracking-tight text-accent">{ingresos}</p>
                  </div>
                  <div className="rounded-[14px] border border-line bg-canvas p-3.5">
                    <p className="mb-1.5 text-[11.5px] font-semibold text-faint">Asistencia</p>
                    <p className="tabular-nums text-[21px] font-extrabold tracking-tight text-rose">{asistencia}</p>
                  </div>
                </div>

                <div className="flex h-16 items-end gap-1.5 px-0.5">
                  {sparkHeights.map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 origin-bottom scale-y-0 animate-grow rounded-t-[5px] rounded-b-[2px] ${
                        i === sparkHeights.length - 1 ? 'bg-accent' : 'bg-accent-soft'
                      }`}
                      style={{ height: `${h}%`, animationDelay: `${0.9 + i * 0.05}s` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between border-t border-line bg-canvas px-5.5 py-3.5 text-xs text-faint">
                <span>Actualizado en tiempo real</span>
                <span>shiningcloud.cl</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Franja de confianza — honesta, sin logos inventados ===== */}
      <div className="border-y border-line py-7">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-10 px-6 text-[13.5px] font-bold text-faint">
          {['Ley 20.584 — Ficha clínica', 'Ley 19.628 — Protección de datos', 'Ley 19.799 — Firma electrónica'].map(t => (
            <span key={t} className="flex items-center gap-2">
              <Check size={15} className="shrink-0 text-accent" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* ===== FUNCIONES: filas alternadas, no tarjetas idénticas ===== */}
      <section id="funciones" className="py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-16 max-w-[640px]">
            <h2 className="font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
              Todo lo que hoy haces a mano, en un solo lugar.
            </h2>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted sm:text-[16.5px]">
              No es una lista de funciones. Es lo que reemplaza al cuaderno, la carpeta de fichas y el Excel de cobros.
            </p>
          </div>

          {/* Ficha clínica */}
          <div className="group grid grid-cols-1 items-center gap-10 border-t border-line py-12 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
            <div className="flex min-h-[220px] items-center justify-center rounded-[20px] border border-line bg-raised p-8 transition-transform duration-300 ease-out group-hover:-translate-y-1">
              <div className="relative w-40 rounded-[10px] border border-line-strong bg-surface p-4">
                <div className="mb-2 h-1.5 w-full rounded bg-line" />
                <div className="mb-2 h-1.5 w-[70%] rounded bg-line" />
                <div className="h-1.5 w-[85%] rounded bg-line" />
                <div className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose text-center text-[10px] font-extrabold leading-tight text-white shadow-[0_6px_16px_-4px_rgba(125,74,67,.5)]">
                  LEY<br />20.584
                </div>
              </div>
            </div>
            <div>
              <span className="mb-4 inline-block rounded-lg bg-accent-soft px-3 py-1.5 text-[12.5px] font-bold text-accent">Ficha clínica</span>
              <h3 className="mb-3 text-[27px] font-semibold tracking-tight">Legal desde el primer registro</h3>
              <p className="max-w-[44ch] text-[15.5px] leading-relaxed text-muted">
                Identificación completa, registro cronológico y consentimientos firmados. La estructura que exige el Decreto 41, sin que tengas que memorizarlo.
              </p>
            </div>
          </div>

          {/* Odontograma */}
          <div className="group grid grid-cols-1 items-center gap-10 border-t border-line py-12 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
            <div className="order-2 flex min-h-[220px] items-center justify-center rounded-[20px] border border-line bg-raised p-8 transition-transform duration-300 ease-out group-hover:-translate-y-1 md:order-1">
              <div className="grid grid-cols-4 gap-2.5">
                {['line-strong', 'rose', 'line-strong', 'accent', 'line-strong', 'line-strong', 'rose', 'line-strong'].map((c, i) => (
                  <svg key={i} viewBox="0 0 200 220" fill="currentColor" className={`h-[42px] w-9 ${
                    c === 'rose' ? 'text-rose' : c === 'accent' ? 'text-accent' : 'text-line-strong'
                  }`}>
                    <path d="M100 10C70 10 45 35 45 65c0 20 8 38 20 50L55 210h90l-10-95c12-12 20-30 20-50 0-30-25-55-55-55z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="mb-4 inline-block rounded-lg bg-accent-soft px-3 py-1.5 text-[12.5px] font-bold text-accent">Odontograma</span>
              <h3 className="mb-3 text-[27px] font-semibold tracking-tight">Estado por pieza, no por ficha entera</h3>
              <p className="max-w-[44ch] text-[15.5px] leading-relaxed text-muted">
                Marca hallazgos, tratamientos y evolución diente por diente. En la próxima cita, el historial completo aparece solo.
              </p>
            </div>
          </div>

          {/* Finanzas */}
          <div className="group grid grid-cols-1 items-center gap-10 border-y border-line py-12 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
            <div className="flex min-h-[220px] items-center justify-center rounded-[20px] border border-line bg-raised p-8 transition-transform duration-300 ease-out group-hover:-translate-y-1">
              <div className="w-[170px]">
                <p className="mb-2.5 font-serif text-[26px] font-medium">$1.240.000</p>
                <div className="flex h-11 items-end gap-1.5">
                  {[40, 60, 35, 75, 55, 90].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t-[3px] ${i === 5 ? 'bg-sky' : 'bg-sky-soft'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <span className="mb-4 inline-block rounded-lg bg-accent-soft px-3 py-1.5 text-[12.5px] font-bold text-accent">Control financiero</span>
              <h3 className="mb-3 text-[27px] font-semibold tracking-tight">Presupuestos, abonos y saldos</h3>
              <p className="max-w-[44ch] text-[15.5px] leading-relaxed text-muted">
                Cotiza un tratamiento, cobra en cuotas y sabe exactamente quién te debe qué. Integrado con boleta electrónica del SII.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARATIVA ===== */}
      <section id="comparativa" className="py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-16 max-w-[640px]">
            <h2 className="font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
              Cuaderno, otro software, o esto.
            </h2>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted sm:text-[16.5px]">
              Una comparación sin adornos de lo que de verdad cambia cuando dejas el papel.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  <th className="pb-4" />
                  <th className="pb-4 text-center text-[13.5px] font-bold text-faint">Cuaderno o Excel</th>
                  <th className="pb-4 text-center text-[13.5px] font-bold text-faint">Otro software</th>
                  <th className="rounded-t-xl bg-accent-soft pb-4 text-center text-[13.5px] font-bold text-faint">ShiningCloud</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ficha que cumple la Ley 20.584', 'no', 'a veces', 'si'],
                  ['Odontograma digital por pieza', 'no', 'si', 'si'],
                  ['Recordatorios automáticos', 'no', 'a veces', 'si'],
                  ['Boleta electrónica SII', 'no', 'no', 'si'],
                  ['Soporte en español, por WhatsApp', 'no', 'no', 'si'],
                ].map(([label, a, b, c], i, arr) => (
                  <tr key={label}>
                    <td className="border-t border-line px-4 py-4 text-[14.5px] font-semibold">{label}</td>
                    {[a, b].map((v, j) => (
                      <td key={j} className={`border-t border-line px-4 py-4 text-center text-[14.5px] font-semibold ${
                        v === 'no' ? 'text-line-strong' : v === 'si' ? 'text-accent' : 'text-sand'
                      }`}>
                        {v === 'no' ? 'No' : v === 'si' ? 'Sí' : 'A veces'}
                      </td>
                    ))}
                    <td className={`border-t border-line bg-accent-soft px-4 py-4 text-center text-[14.5px] font-bold text-accent ${
                      i === arr.length - 1 ? 'rounded-b-xl' : ''
                    }`}>
                      Sí
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="border-t border-line px-4 py-4 text-[14.5px] font-semibold">Costo mensual</td>
                  <td className="border-t border-line px-4 py-4 text-center text-[14.5px] font-semibold">$0*</td>
                  <td className="border-t border-line px-4 py-4 text-center text-[14.5px] font-semibold">$35.000+</td>
                  <td className="rounded-b-xl border-t border-line bg-accent-soft px-4 py-4 text-center text-[14.5px] font-extrabold text-accent">$10.000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] text-faint">*Gratis en dinero, pero cuesta horas administrativas y riesgo de incumplir la Ley 20.584.</p>
        </div>
      </section>

      {/* ===== PRECIO: estilo cotización real ===== */}
      <section id="precio" className="py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto mb-16 max-w-[640px] text-center">
            <h2 className="font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
              Un plan. Sin letra chica.
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-base leading-relaxed text-muted sm:text-[16.5px]">
              Precio fijo para las clínicas que se suman en esta primera etapa.
            </p>
          </div>

          <div className="mx-auto max-w-[560px] overflow-hidden rounded-3xl border border-line-strong bg-surface shadow-[0_30px_70px_-30px_rgba(36,31,27,.22)]">
            <div className="h-[5px] bg-gradient-to-r from-rose to-accent" />
            <div className="flex items-start justify-between border-b border-dashed border-line-strong px-8 py-7">
              <div>
                <h3 className="text-xl font-semibold">Plan Fundador</h3>
                <p className="mt-1 text-xs font-semibold text-faint">Válido para las primeras clínicas</p>
              </div>
              <div className="text-right text-xs font-bold text-faint">N.º 001<br />Sept. 2026</div>
            </div>

            <div className="space-y-0.5 px-8 pb-2.5 pt-6">
              {['Pacientes ilimitados', 'Ficha clínica legal', 'Agenda multiprofesional', 'Facturación SII', 'Soporte por WhatsApp'].map(item => (
                <div key={item} className="flex items-baseline gap-2 py-2 text-[14.5px] font-semibold text-muted">
                  {item}
                  <span className="mb-1 flex-1 border-b-[1.5px] border-dotted border-line-strong" />
                  <span className="text-[13px] font-bold text-accent">Incluido</span>
                </div>
              ))}
            </div>

            <div className="mx-8 mt-4.5 flex items-baseline justify-between rounded-2xl bg-canvas p-5">
              <span className="text-[13px] font-bold text-muted">Total mensual</span>
              <span className="font-serif text-4xl font-medium">$10.000<span className="text-[15px] font-semibold text-faint"> CLP</span></span>
            </div>

            <div className="px-8 pb-8 pt-6">
              <button
                onClick={onLoginClick}
                className="w-full rounded-2xl bg-ink py-4 text-[14.5px] font-bold text-white transition-colors hover:bg-black"
              >
                Empezar ahora, gratis por 30 días
              </button>
              <p className="mt-4 text-center text-xs leading-relaxed text-faint">Sin contrato de permanencia. Cancela cuando quieras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-16 max-w-[640px]">
            <h2 className="font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
              Preguntas antes de partir
            </h2>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted sm:text-[16.5px]">
              Lo que más nos preguntan los dentistas que están por dejar el papel.
            </p>
          </div>

          <div>
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className={`border-t border-line ${i === FAQS.length - 1 ? 'border-b' : ''}`}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    // text-ink explícito: un <button> no siempre hereda el color
                    // de texto del contenedor en todos los navegadores, así que
                    // sin esto la pregunta puede salir con el color por defecto
                    // del sistema en vez del de la marca.
                    className="flex w-full items-center justify-between gap-5 py-5.5 text-left text-[16px] font-semibold text-ink"
                  >
                    {item.q}
                    <Plus size={18} className={`shrink-0 text-faint transition-transform duration-300 ${open ? 'rotate-45 text-ink' : ''}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-muted">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-line px-6 py-24 text-center sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mx-auto mb-8 max-w-[16ch] font-serif text-[32px] font-medium leading-[1.12] tracking-[-0.02em] sm:text-[42px]">
            ¿Lista tu clínica para dejar el papel?
          </h2>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-ink px-7 py-4 text-[15px] font-bold tracking-tight text-white transition-colors hover:bg-black"
          >
            Empezar gratis <span>→</span>
          </button>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-7 text-[12.5px] font-semibold text-faint">
            <span>© 2026 ShiningCloud Dental</span>
            <span>Hecho en Valdivia, Chile</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
