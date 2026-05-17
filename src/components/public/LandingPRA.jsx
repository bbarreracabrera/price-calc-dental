import React from 'react';
import PRACalculator from '../tools/PRACalculator';
import {
    ArrowLeft, ExternalLink, Info,
    CheckCircle, AlertTriangle, AlertCircle,
} from 'lucide-react';

export default function LandingPRA() {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">

            {/* Header */}
            <header className="no-print bg-white border-b border-[#DFD2C4] sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-1.5 font-black text-lg">
                        <span className="text-[#312923]">ShiningCloud</span>
                        <span className="text-[#CBAAA2]">Dental</span>
                    </a>
                    <a
                        href="/"
                        className="flex items-center gap-1 text-sm text-[#9A8F84] hover:text-[#312923] transition-colors"
                    >
                        <ArrowLeft size={14} /> Volver
                    </a>
                </div>
            </header>

            {/* Hero */}
            <section className="no-print max-w-5xl mx-auto px-4 pt-12 pb-6 text-center">
                <div className="inline-block px-3 py-1 bg-white border border-[#DFD2C4] rounded-full text-[10px] font-black uppercase tracking-widest text-[#5B6651] mb-4">
                    Herramienta gratuita
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#312923] mb-3 tracking-tight">
                    Calculadora de Riesgo Periodontal
                </h1>
                <p className="text-[#9A8F84] max-w-2xl mx-auto text-base">
                    Evalúa el riesgo periodontal de tus pacientes con el modelo de Lang &amp; Tonetti.
                    100% gratis, sin registro, sin datos personales.
                </p>
            </section>

            {/* Calculator */}
            <section className="max-w-5xl mx-auto px-4 py-6">
                <PRACalculator mode="public" />
            </section>

            {/* CTA */}
            <section className="no-print max-w-5xl mx-auto px-4 py-12">
                <div className="bg-[#312923] rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                        ¿Te gustó esta herramienta?
                    </h2>
                    <p className="text-[#DFD2C4] mb-6 max-w-2xl mx-auto">
                        En ShiningCloud Dental esta calculadora se integra con la ficha de tus pacientes.
                        Los datos del periodontograma se cargan automáticamente, puedes comparar la
                        evolución entre visitas y guardar el historial completo de riesgo.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#312923] font-black rounded-2xl hover:bg-[#FDFBF7] transition-colors text-sm"
                    >
                        Conocer la app completa <ExternalLink size={16} />
                    </a>
                </div>
            </section>

            {/* ¿Cómo usar? */}
            <section className="no-print max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-3xl border border-[#DFD2C4] p-6 md:p-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#5B6651]/10 flex items-center justify-center shrink-0">
                            <Info size={20} className="text-[#5B6651]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#312923]">
                            ¿Cómo usar esta herramienta?
                        </h2>
                    </div>
                    <p className="text-sm text-[#9A8F84] mb-6 ml-[52px]">
                        Guía paso a paso para evaluar correctamente el riesgo periodontal
                    </p>

                    <div className="bg-[#FDFBF7] border-l-4 border-[#5B6651] rounded-r-2xl p-4 mb-6">
                        <p className="text-sm text-[#312923]">
                            <strong>Propósito:</strong> El Periodontal Risk Assessment (PRA) de
                            Lang &amp; Tonetti permite estratificar el riesgo individual de
                            recurrencia de la enfermedad periodontal durante la fase de
                            mantenimiento (SPT), orientando la frecuencia de las citas de control.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Step number={1} title="Registra los datos del paciente">
                            Introduce la edad, el número de dientes e implantes presentes
                            y los sitios por elemento. El sistema calculará automáticamente
                            el total de sitios explorables.
                        </Step>
                        <Step number={2} title="Completa los 6 parámetros clínicos">
                            Ingresa el número de sitios con sangrado al sondaje (BOP),
                            las bolsas residuales ≥5 mm, los dientes perdidos de un total
                            de 28 (excluir terceros molares), el porcentaje estimado de
                            pérdida ósea alveolar, y selecciona los factores sistémicos/
                            genéticos y el estado de tabaquismo.
                        </Step>
                        <Step number={3} title="Interpreta el diagrama hexagonal">
                            La araña muestra la posición de cada parámetro en una de las
                            4 zonas concéntricas. El área sombreada representa el perfil
                            de riesgo del paciente. Cuanto más extendida y hacia el exterior
                            sea el área coloreada, mayor es el riesgo global.
                        </Step>
                        <Step number={4} title="Verifica la clasificación de riesgo">
                            El sistema clasifica automáticamente al paciente en Riesgo Bajo,
                            Moderado o Alto según los criterios de Lang &amp; Tonetti. Esta
                            clasificación determina el intervalo óptimo entre citas de
                            mantenimiento periodontal.
                        </Step>
                        <Step number={5} title="Establece el protocolo de mantenimiento">
                            Ajusta la frecuencia de las visitas de SPT en función del
                            riesgo asignado. Reevalúa el riesgo en cada cita de
                            mantenimiento, ya que puede cambiar con el tiempo.
                        </Step>
                    </div>
                </div>
            </section>

            {/* Parámetros y umbrales */}
            <section className="no-print max-w-4xl mx-auto px-4 pb-12">
                <div className="bg-white rounded-3xl border border-[#DFD2C4] p-6 md:p-10">
                    <h2 className="text-2xl font-black text-[#312923] mb-2">
                        Parámetros evaluados y umbrales de riesgo
                    </h2>
                    <p className="text-sm text-[#9A8F84] mb-6">
                        Los seis parámetros del PRA se valoran de forma conjunta. Cada uno
                        se ubica en una de las cuatro zonas concéntricas del hexágono.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-[#DFD2C4]">
                                    <th className="text-left py-3 pr-4 text-xs font-bold uppercase tracking-widest text-[#9A8F84]">
                                        Parámetro
                                    </th>
                                    {[
                                        { color: '#5B6651', label: 'Bajo' },
                                        { color: '#D9A86C', label: 'Moderado' },
                                        { color: '#B87C50', label: 'Alto' },
                                        { color: '#B92323', label: 'Muy alto' },
                                    ].map(({ color, label }) => (
                                        <th key={label} className="text-left py-3 px-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
                                                <span className="text-xs font-bold uppercase tracking-widest text-[#9A8F84]">{label}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {PARAMETERS.map((p, i) => (
                                    <tr key={i} className="border-b border-[#DFD2C4]/50">
                                        <td className="py-4 pr-4">
                                            <p className="font-bold text-[#312923]">{p.name}</p>
                                            <p className="text-xs text-[#9A8F84] mt-0.5">{p.desc}</p>
                                        </td>
                                        <td className="py-4 px-2 text-[#312923]">{p.z1}</td>
                                        <td className="py-4 px-2 text-[#312923]">{p.z2}</td>
                                        <td className="py-4 px-2 text-[#312923]">{p.z3}</td>
                                        <td className="py-4 px-2 text-[#312923]">{p.z4}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Clasificación de riesgo */}
            <section className="no-print max-w-4xl mx-auto px-4 pb-12">
                <h2 className="text-2xl font-black text-[#312923] mb-2">
                    Clasificación de riesgo
                </h2>
                <p className="text-sm text-[#9A8F84] mb-6">
                    Según Sanz-Sánchez &amp; Bascones-Martínez (2017)
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                    <RiskCard
                        color="#5B6651"
                        icon={<CheckCircle size={20} />}
                        title="Riesgo Bajo"
                        interval="Control cada 12 meses"
                        criteria={[
                            'Los 6 parámetros en zona 1',
                            'Máximo 1 parámetro en zona 2',
                            'Ningún parámetro en zona 3-4',
                        ]}
                    />
                    <RiskCard
                        color="#D9A86C"
                        icon={<AlertTriangle size={20} />}
                        title="Riesgo Moderado"
                        interval="Control cada 6 meses"
                        criteria={[
                            'Al menos 2 parámetros en zona 2',
                            'Máximo 1 parámetro en zona 3-4',
                        ]}
                    />
                    <RiskCard
                        color="#B92323"
                        icon={<AlertCircle size={20} />}
                        title="Riesgo Alto"
                        interval="Control cada 3-4 meses"
                        criteria={[
                            'Al menos 2 parámetros en zona 3-4',
                            'Cualquier parámetro en zona 4',
                        ]}
                    />
                </div>

                <div className="mt-6 bg-[#FDFBF7] border-l-4 border-[#A3968B] rounded-r-2xl p-4">
                    <p className="text-sm text-[#312923]">
                        <strong>Importante:</strong> El riesgo debe reevaluarse en cada cita
                        de mantenimiento. Estudios longitudinales (Axelsson &amp; Lindhe, 2004)
                        demuestran que pacientes sin mantenimiento regular presentan pérdida
                        de inserción de hasta <strong>1 mm/año</strong>, frente a{' '}
                        <strong>0,03 mm/año</strong> en pacientes bien controlados.
                    </p>
                </div>
            </section>

            {/* Protocolo SPT */}
            <section className="no-print max-w-4xl mx-auto px-4 pb-12">
                <div className="bg-white rounded-3xl border border-[#DFD2C4] p-6 md:p-10">
                    <h2 className="text-2xl font-black text-[#312923] mb-2">
                        Protocolo de la visita de mantenimiento (SPT)
                    </h2>
                    <p className="text-sm text-[#9A8F84] mb-6">
                        Duración aproximada: 1 hora, estructurada en 4 etapas
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <ProtocolCard
                            step="①"
                            title="Examen y reevaluación"
                            duration="10-15 min"
                            description="Exploración periodontal y dental completa. Actualización de historia médica y medicación. Valoración de todos los factores de riesgo."
                        />
                        <ProtocolCard
                            step="②"
                            title="Motivación e instrumentación"
                            duration="30-40 min"
                            description="Refuerzo de higiene oral personalizado. Raspado y alisado radicular en zonas con inflamación o profundidad de bolsa aumentada."
                        />
                        <ProtocolCard
                            step="③"
                            title="Tratamiento de zonas reinfectadas"
                            description="Zonas con supuración o furcas requieren tratamiento adicional. Valorar antimicrobianos locales o sistémicos, o cirugía si está indicada."
                        />
                        <ProtocolCard
                            step="④"
                            title="Pulido, flúor y próxima cita"
                            description="Pulido de depósitos blandos. Fluoraciones en pacientes con recesiones. Programar próxima visita según el riesgo reclasificado."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="no-print max-w-4xl mx-auto px-4 pb-10 text-center text-xs text-[#A3968B]">
                Basado en Lang NP, Tonetti MS (2003). Periodontal risk assessment for patients in
                supportive periodontal therapy. <em>Oral Health Prev Dent.</em>
            </footer>
        </div>
    );
}

// ---- datos ----

const PARAMETERS = [
    {
        name: 'BOP%',
        desc: 'Sangrado al sondaje. Refleja inflamación gingival activa.',
        z1: '0–9%', z2: '10–24%', z3: '25–99%', z4: '100%',
    },
    {
        name: 'PD≥5mm',
        desc: 'Bolsas residuales. Sitios de recolonización bacteriana.',
        z1: '0 sitios', z2: '1–4 sitios', z3: '5–8 sitios', z4: '>8 sitios',
    },
    {
        name: 'Dientes perdidos',
        desc: 'De 28 dientes (excluir 3°M). Refleja historia de enfermedad.',
        z1: '0–4', z2: '5–8', z3: '9–12', z4: '>12',
    },
    {
        name: 'BL/Edad',
        desc: '% pérdida ósea ÷ edad. Predictor de futura pérdida de inserción.',
        z1: '<0,5', z2: '0,5–1,0', z3: '1,0–2,0', z4: '>2,0',
    },
    {
        name: 'Factores sistémicos',
        desc: 'Diabetes, IL-1+, otras condiciones sistémicas asociadas.',
        z1: 'Ninguno', z2: '1 menor', z3: 'DM ctrl / IL-1+', z4: 'DM no ctrl',
    },
    {
        name: 'Tabaquismo',
        desc: 'Factor dosis-dependiente que altera la respuesta inmunológica.',
        z1: 'No / Ex >5a', z2: 'Ex <5a / <10 cig', z3: '10–19 cig/día', z4: '≥20 cig/día',
    },
];

// ---- subcomponentes ----

function Step({ number, title, children }) {
    return (
        <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#5B6651] text-white font-black text-sm flex items-center justify-center">
                {number}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-[#312923] mb-1">{title}</h3>
                <p className="text-sm text-[#9A8F84] leading-relaxed">{children}</p>
            </div>
        </div>
    );
}

function RiskCard({ color, icon, title, interval, criteria }) {
    return (
        <div
            className="rounded-2xl p-5 border-l-4"
            style={{ borderLeftColor: color, backgroundColor: `${color}08` }}
        >
            <div className="flex items-center gap-2 mb-3" style={{ color }}>
                {icon}
                <h3 className="font-black">{title}</h3>
            </div>
            <ul className="space-y-1 mb-4 text-sm text-[#312923]">
                {criteria.map((c, i) => (
                    <li key={i}>• {c}</li>
                ))}
            </ul>
            <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: `${color}20`, color }}
            >
                {interval}
            </div>
        </div>
    );
}

function ProtocolCard({ step, title, duration, description }) {
    return (
        <div className="bg-[#FDFBF7] rounded-2xl p-5 border border-[#DFD2C4]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-black text-[#5B6651]">{step}</span>
                <div>
                    <h4 className="font-bold text-[#312923]">{title}</h4>
                    {duration && <p className="text-xs text-[#9A8F84]">{duration}</p>}
                </div>
            </div>
            <p className="text-sm text-[#9A8F84] leading-relaxed">{description}</p>
        </div>
    );
}
