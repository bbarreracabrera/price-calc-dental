import React from 'react';
import { 
    BookOpen, Calculator, Wallet, Users, FileSpreadsheet, 
    CheckCircle2, ArrowRight, MessageCircle, Info
} from 'lucide-react';
import { Card } from './UIComponents';

export default function HelpView() {
    const tutorials = [
        {
            title: "Análisis Financiero Avanzado",
            icon: Calculator,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            content: [
                "Entiende qué tratamientos son los más rentables para tu clínica.",
                "Visualiza el 'Ticket Promedio' por especialidad.",
                "Toma decisiones basadas en datos reales de tu recaudación."
            ]
        },
        {
            title: "Gestión de Honorarios",
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            content: [
                "Cálculo automático de comisiones para tus colegas.",
                "Diferencia entre producción real y pagos realizados.",
                "Evita errores manuales en el pago de sueldos."
            ]
        },
        {
            title: "Categorización de Gastos",
            icon: Wallet,
            color: "text-amber-600",
            bg: "bg-amber-50",
            content: [
                "Clasifica tus egresos en Insumos, Laboratorio, Sueldos, etc.",
                "Mantén un flujo de caja ordenado para tu contador.",
                "Exporta reportes en Excel listos para declarar."
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B6651]/10 text-[#5B6651] rounded-full text-[10px] font-black uppercase tracking-widest">
                    <BookOpen size={14}/> Centro de Aprendizaje
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter">
                    Domina <span className="text-[#5B6651]">ShiningCloud</span>
                </h1>
                <p className="text-[#9A8F84] font-medium max-w-lg mx-auto">
                    Aprende a usar las herramientas avanzadas que harán tu clínica más rentable y organizada.
                </p>
            </div>

            {/* Tutorial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tutorials.map((t, i) => (
                    <Card key={i} className="p-6 border-[#DFD2C4]/50 hover:border-[#5B6651]/30 transition-all hover:shadow-xl group">
                        <div className={`w-12 h-12 ${t.bg} ${t.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <t.icon size={24} />
                        </div>
                        <h3 className="text-lg font-black text-[#312923] mb-4">{t.title}</h3>
                        <ul className="space-y-3">
                            {t.content.map((item, j) => (
                                <li key={j} className="flex gap-2 text-xs text-[#6B615A] font-medium leading-relaxed">
                                    <CheckCircle2 size={14} className="text-[#5B6651] shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </Card>
                ))}
            </div>

            {/* Detailed Guide Section */}
            <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-[3rem] p-8 md:p-12 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <FileSpreadsheet size={200} className="text-[#312923]" />
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-2xl font-black text-[#312923] flex items-center gap-3">
                        <Info className="text-[#CBAAA2]" /> Guía de Optimización Financiera
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-[#9A8F84]">Paso 1: Análisis</h4>
                            <p className="text-sm text-[#6B615A] leading-relaxed">
                                Entra al <b>Centro Financiero</b> y activa el <b>Análisis de Rentabilidad</b>. Busca los tratamientos con el ticket promedio más alto; esos son tus "servicios estrella".
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-[#9A8F84]">Paso 2: Orden</h4>
                            <p className="text-sm text-[#6B615A] leading-relaxed">
                                Clasifica cada gasto. Al final del mes, usa el botón <b>Exportar Excel</b>. Tendrás un reporte profesional listo para tu contador en un segundo.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[#DFD2C4]/50 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full border border-[#DFD2C4] flex items-center justify-center shadow-sm">
                                <MessageCircle size={20} className="text-[#25D366]" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#312923]">¿Necesitas ayuda personalizada?</p>
                                <p className="text-[10px] text-[#9A8F84] font-bold uppercase tracking-widest">Soporte técnico vía WhatsApp</p>
                            </div>
                        </div>
                        <button className="px-8 py-4 bg-[#312923] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
                            Contactar Soporte <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
