import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#312923] font-sans">
            <div className="max-w-2xl mx-auto px-6 py-12">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#9A8F84] hover:text-[#312923] mb-10 transition-colors"
                >
                    <ArrowLeft size={14}/> Volver
                </a>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#5B6651]/10 rounded-2xl flex items-center justify-center">
                        <Shield size={20} className="text-[#5B6651]"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter">Política de Privacidad</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] mt-0.5">ShiningCloud Dental · Vigente desde Enero 2025</p>
                    </div>
                </div>

                <div className="space-y-8 text-sm leading-relaxed text-[#4a3f38]">

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">1. Responsable del Tratamiento</h2>
                        <p>
                            ShiningCloud Dental es la plataforma de gestión clínica. Cada clínica que utiliza esta plataforma es responsable
                            del tratamiento de los datos de sus propios pacientes, en conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada de Chile.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">2. Datos que Recopilamos</h2>
                        <ul className="list-disc list-inside space-y-1 text-[#5a4f48]">
                            <li>Nombre completo y RUT (cuando se proporcione)</li>
                            <li>Número de teléfono y correo electrónico</li>
                            <li>Motivo de consulta o tratamiento solicitado</li>
                            <li>Fecha y hora de la cita agendada</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">3. Finalidad del Tratamiento</h2>
                        <p>
                            Sus datos se utilizan exclusivamente para coordinar su atención dental: confirmación de citas, recordatorios,
                            gestión del historial clínico y comunicación relacionada con su tratamiento. No se utilizan con fines comerciales
                            ni se ceden a terceros sin su consentimiento explícito.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">4. Base Legal</h2>
                        <p>
                            El tratamiento se realiza sobre la base de su consentimiento expreso (Art. 4° Ley 19.628) y, en el caso de la
                            ficha clínica, en cumplimiento de la obligación legal establecida en la Ley N° 20.584 sobre derechos y deberes
                            de los pacientes.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">5. Conservación de Datos</h2>
                        <p>
                            Los registros clínicos se conservan por un mínimo de <strong>15 años</strong> desde la última atención,
                            según lo exigido por la Ley N° 20.584. Los datos de contacto se mantienen mientras exista una relación
                            activa de atención o hasta que usted solicite su eliminación.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">6. Sus Derechos</h2>
                        <p className="mb-2">En conformidad con la Ley 19.628, usted tiene derecho a:</p>
                        <ul className="list-disc list-inside space-y-1 text-[#5a4f48]">
                            <li><strong>Acceder</strong> a sus datos personales almacenados</li>
                            <li><strong>Rectificar</strong> información incorrecta o desactualizada</li>
                            <li><strong>Cancelar</strong> datos que ya no sean necesarios para la finalidad declarada</li>
                            <li><strong>Oponerse</strong> al tratamiento en los casos que la ley permite</li>
                        </ul>
                        <p className="mt-2">Para ejercer estos derechos, contáctenos directamente en su clínica.</p>
                    </section>

                    <section>
                        <h2 className="font-black text-[#312923] text-base mb-2">7. Seguridad</h2>
                        <p>
                            Sus datos se almacenan en servidores con cifrado en tránsito (TLS) y en reposo. Los datos clínicos
                            guardados localmente en su dispositivo están protegidos con cifrado AES-256. Implementamos controles
                            de acceso por rol para que solo el personal autorizado de su clínica pueda ver su información.
                        </p>
                    </section>

                </div>

                <div className="mt-12 pt-6 border-t border-[#DFD2C4]/50 text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">
                    ShiningCloud Dental · Chile · Ley 19.628 · Ley 20.584
                </div>
            </div>
        </div>
    );
}
