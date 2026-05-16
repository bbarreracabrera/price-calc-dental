import React from 'react';
import PRACalculator from '../tools/PRACalculator';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function LandingPRA() {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">

            {/* Header */}
            <header className="bg-white border-b border-[#DFD2C4] sticky top-0 z-10">
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
            <section className="max-w-5xl mx-auto px-4 pt-12 pb-6 text-center">
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
            <section className="max-w-5xl mx-auto px-4 py-12">
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

            {/* Footer */}
            <footer className="max-w-5xl mx-auto px-4 pb-10 text-center text-xs text-[#A3968B]">
                Basado en Lang NP, Tonetti MS (2003). Periodontal risk assessment for patients in
                supportive periodontal therapy. <em>Oral Health Prev Dent.</em>
            </footer>
        </div>
    );
}
