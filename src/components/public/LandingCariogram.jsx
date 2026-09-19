import React from 'react';
import CariogramCalculator from '../tools/CariogramCalculator';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function LandingCariogram() {
    return (
        <div className="min-h-screen bg-[#FBFAF8]">

            {/* Header */}
            <header className="no-print bg-white border-b border-[#D9D2C7] sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-1.5 font-black text-lg">
                        <span className="text-[#241F1B]">ShiningCloud</span>
                        <span className="text-[#D3A9A0]">Dental</span>
                    </a>
                    <a
                        href="/"
                        className="flex items-center gap-1 text-sm text-[#5E554E] hover:text-[#241F1B] transition-colors"
                    >
                        <ArrowLeft size={14} /> Volver
                    </a>
                </div>
            </header>

            {/* Hero */}
            <section className="no-print max-w-5xl mx-auto px-4 pt-12 pb-6 text-center">
                <div className="inline-block px-3 py-1 bg-white border border-[#D9D2C7] rounded-full text-[11px] font-black uppercase tracking-widest text-[#46523C] mb-4">
                    Herramienta gratuita
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#241F1B] mb-3 tracking-tight">
                    Calculadora de Riesgo de Caries
                </h1>
                <p className="text-[#5E554E] max-w-2xl mx-auto text-base">
                    Evalúa el riesgo cariogénico de tus pacientes con el modelo Cariogram de Bratthall.
                    100% gratis, sin registro, sin datos personales.
                </p>
            </section>

            {/* Calculator */}
            <section className="max-w-5xl mx-auto px-4 py-6">
                <CariogramCalculator mode="public" />
            </section>

            {/* CTA */}
            <section className="no-print max-w-5xl mx-auto px-4 py-12">
                <div className="bg-[#241F1B] rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                        ¿Te gustó esta herramienta?
                    </h2>
                    <p className="text-[#D9D2C7] mb-6 max-w-2xl mx-auto">
                        En ShiningCloud Dental el Cariogram se conecta con la ficha del paciente.
                        Compara la evolución entre visitas, comparte el resultado y planifica el
                        seguimiento con intervalo personalizado.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#241F1B] font-black rounded-2xl hover:bg-[#FBFAF8] transition-colors text-sm"
                    >
                        Conocer la app completa <ExternalLink size={16} />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="no-print max-w-5xl mx-auto px-4 pb-10 text-center text-xs text-[#8A7F74]">
                Basado en Bratthall D, Hänsel Petersson G. Cariogram — a multifactorial risk
                assessment model. <em>Community Dent Oral Epidemiol.</em> 2005;33(4):256-264.
            </footer>
        </div>
    );
}
