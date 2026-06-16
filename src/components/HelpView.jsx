import React from 'react';
import { 
    BookOpen, Calculator, Wallet, Users, FileSpreadsheet, 
    CheckCircle2, ArrowRight, MessageCircle, Info, Mic, 
    ShieldCheck, FlaskConical, Stethoscope, Mail
} from 'lucide-react';
import { Card } from './UIComponents';

export default function HelpView() {
    const contactWhatsApp = "56932745439";
    const contactEmail = "b.barreracabrera.dent@gmail.com";

    const handleWhatsApp = () => {
        const msg = encodeURIComponent("Hola, necesito ayuda con ShiningCloud Dental.");
        window.open(`https://wa.me/${contactWhatsApp}?text=${msg}`, '_blank');
    };

    const handleEmail = () => {
        window.location.href = `mailto:${contactEmail}?subject=Soporte ShiningCloud Dental`;
    };

    const features = [
        {
            title: "Odontograma por Voz",
            icon: Mic,
            color: "text-red-600",
            bg: "bg-red-50",
            content: [
                "Dicta hallazgos sin soltar tus instrumentos.",
                "Usa comandos como 'Pieza 16 caries oclusal'.",
                "Ahorra hasta 10 minutos por cada diagnóstico."
            ]
        },
        {
            title: "Importación Inteligente",
            icon: FileSpreadsheet,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            content: [
                "Sube tu Excel de Dentalink o Reservo directamente.",
                "Mapeo automático de nombres, RUT y contactos.",
                "Migra toda tu clínica en menos de 1 minuto."
            ]
        },
        {
            title: "Análisis Financiero",
            icon: Calculator,
            color: "text-blue-600",
            bg: "bg-blue-50",
            content: [
                "Calcula la rentabilidad real de cada tratamiento.",
                "Gestión automática de comisiones para doctores.",
                "Exporta reportes listos para tu contador."
            ]
        },
        {
            title: "Retención CRM",
            icon: Users,
            color: "text-amber-600",
            bg: "bg-amber-50",
            content: [
                "Identifica pacientes que no han vuelto en 6 meses.",
                "Envía recordatorios masivos por WhatsApp.",
                "Aumenta la recurrencia de tu clínica sin esfuerzo."
            ]
        },
        {
            title: "Laboratorio Digital",
            icon: FlaskConical,
            color: "text-purple-600",
            bg: "bg-purple-50",
            content: [
                "Envía órdenes de trabajo con archivos STL y fotos.",
                "Seguimiento en tiempo real del estado de prótesis.",
                "Comunicación segura y centralizada con técnicos."
            ]
        },
        {
            title: "Recetas y Consentimientos",
            icon: Stethoscope,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            content: [
                "Genera recetas profesionales en PDF en segundos.",
                "Firma digital de consentimientos informados.",
                "Historial clínico 100% digital y legal."
            ]
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4">
            
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={14}/> Centro de Capacitación ShiningCloud
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-[#312923] tracking-tighter">
                    Todo lo que puedes <span className="text-[#5B6651]">lograr</span>
                </h1>
                <p className="text-[#9A8F84] font-medium max-w-2xl mx-auto text-lg">
                    Descubre las herramientas diseñadas para hacer tu clínica más rápida, rentable y accesible.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => (
                    <Card key={i} className="p-8 border-[#DFD2C4]/50 hover:border-[#5B6651]/40 transition-all hover:shadow-2xl group bg-white rounded-[2.5rem]">
                        <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                            <f.icon size={28} />
                        </div>
                        <h3 className="text-xl font-black text-[#312923] mb-4">{f.title}</h3>
                        <ul className="space-y-4">
                            {f.content.map((item, j) => (
                                <li key={j} className="flex gap-3 text-sm text-[#6B615A] font-medium leading-relaxed">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#5B6651] shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </Card>
                ))}
            </div>

            {/* Support Section */}
            <div className="bg-[#312923] rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <BookOpen size={300} />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">¿Necesitas ayuda <br/><span className="text-[#CBAAA2]">personalizada?</span></h2>
                        <p className="text-[#A3968B] text-lg font-medium leading-relaxed">
                            Estamos aquí para apoyarte en el crecimiento de tu clínica. Contacta directamente con nuestro equipo técnico y comercial.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button 
                                onClick={handleWhatsApp}
                                className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                <MessageCircle size={18} /> WhatsApp Directo
                            </button>
                            <button 
                                onClick={handleEmail}
                                className="px-8 py-4 bg-white text-[#312923] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#FDFBF7] transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                <Mail size={18} /> Enviar Email
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CBAAA2]">Contacto Directo</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><MessageCircle size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#A3968B]">WhatsApp</p>
                                    <p className="font-bold">+56 9 3274 5439</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Mail size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#A3968B]">Email</p>
                                    <p className="font-bold">b.barreracabrera.dent@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer help */}
            <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9A8F84]">
                    ShiningCloud Dental © 2026 • Desarrollado para odontólogos, por odontólogos.
                </p>
            </div>
        </div>
    );
}
