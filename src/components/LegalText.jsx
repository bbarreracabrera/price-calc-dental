import React from 'react';

export default function LegalText() {
    // Creamos un sub-componente interno para mantener el diseño consistente en cada bloque
    const LegalSection = ({ num, title, children }) => (
        <section className="relative pl-6 md:pl-8 border-l border-[#DFD2C4]/60 hover:border-[#A3968B] transition-colors group">
            {/* Punto decorativo en la línea */}
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#DFD2C4] group-hover:bg-[#CBAAA2] transition-colors"></div>
            
            <h3 className="text-lg font-black text-[#312923] mb-3 flex items-center gap-3 tracking-tight">
                <span className="text-[10px] font-black bg-[#FDFBF7] text-[#9A8F84] px-2.5 py-1 rounded-md border border-[#DFD2C4]/50 tracking-widest shadow-sm">
                    {num}
                </span>
                {title}
            </h3>
            <div className="text-sm font-medium text-[#6B615A] leading-relaxed space-y-4">
                {children}
            </div>
        </section>
    );

    return (
        <div className="space-y-10 max-w-4xl mx-auto py-4">
            <LegalSection num="01" title="Aceptación de los Términos">
                <p>Al suscribirse y utilizar ShiningCloud Dental, el Usuario acepta cumplir con estos términos. El servicio se presta "tal cual" y según disponibilidad, enfocado en optimizar la gestión administrativa y operativa de clínicas dentales en Chile y Latinoamérica.</p>
            </LegalSection>

            <LegalSection num="02" title="Naturaleza del Servicio">
                <p>ShiningCloud es una herramienta de apoyo administrativo y clínico. <strong className="text-[#312923] font-black">El Proveedor no practica la odontología.</strong> El diagnóstico, plan de tratamiento y las decisiones clínicas son responsabilidad exclusiva del profesional usuario.</p>
                <div className="bg-[#FDFBF7] border border-[#DFD2C4]/50 p-4 rounded-2xl text-xs">
                    <span className="font-black text-[#A3968B] uppercase tracking-widest block mb-1">Nota sobre IA:</span>
                    El software asistido por Inteligencia Artificial (como el periodontograma por voz) es una ayuda técnica diseñada para agilizar el registro, pero en ningún caso reemplaza el criterio, revisión y juicio clínico del dentista tratante.
                </div>
            </LegalSection>

            <LegalSection num="03" title="Propiedad y Privacidad de Datos (Ley 19.628)">
                <ul className="space-y-4">
                    <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5B6651] mt-2 shrink-0"></div>
                        <div>
                            <strong className="text-[#312923] font-black block mb-0.5">Propiedad Absoluta:</strong> 
                            Los datos de salud y fichas clínicas cargados pertenecen íntegramente al Usuario (la clínica o el dentista titular). El Proveedor actúa únicamente como custodio y procesador tecnológico.
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5B6651] mt-2 shrink-0"></div>
                        <div>
                            <strong className="text-[#312923] font-black block mb-0.5">Seguridad e Infraestructura:</strong> 
                            Utilizamos protocolos de encriptación de grado bancario e infraestructura segura en la nube. Sin embargo, el Usuario es el único responsable de mantener la confidencialidad de sus claves de acceso y de cerrar su sesión en dispositivos públicos o compartidos.
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5B6651] mt-2 shrink-0"></div>
                        <div>
                            <strong className="text-[#312923] font-black block mb-0.5">Privacidad Estricta:</strong> 
                            Nos comprometemos legal y éticamente a no vender, ceder ni perfilar comercialmente los datos de sus pacientes bajo ninguna circunstancia.
                        </div>
                    </li>
                </ul>
            </LegalSection>

            <LegalSection num="04" title="Responsabilidades del Usuario">
                <p>El Usuario se obliga a cumplir con la normativa sanitaria vigente (incluyendo la <strong className="text-[#312923]">Ley 20.584</strong> sobre Derechos y Deberes de los Pacientes en Chile). Además, asume la responsabilidad de realizar exportaciones o respaldos periódicos de su información financiera y clínica (a través de los formatos Excel/PDF provistos) como medida de precaución estándar.</p>
            </LegalSection>

            <LegalSection num="05" title="Suscripción y Pagos">
                <p>Los pagos se procesan de forma segura a través de <strong className="text-[#312923] font-black">Mercado Pago</strong> (o pasarelas certificadas similares). El servicio funciona bajo la modalidad de suscripción mensual automática.</p>
                <p>El no pago de la suscripción resultará en la limitación de la cuenta a un modo de "solo lectura" durante 30 días. Durante este periodo no se perderá información, pero no se podrán ingresar nuevos datos. Tras este plazo de gracia, la cuenta podría ser suspendida definitivamente.</p>
            </LegalSection>

            <LegalSection num="06" title="Limitación de Responsabilidad">
                <p>En la máxima medida permitida por la ley, el Proveedor no será responsable por lucro cesante, pérdida de datos derivada de un mal manejo de contraseñas por parte del equipo de la clínica, ni por interrupciones del servicio originadas por cortes de proveedores de internet o de infraestructura general en la nube.</p>
                <p>La responsabilidad máxima del Proveedor ante cualquier evento se limitará al equivalente a los últimos 3 meses de suscripción pagados por el Usuario.</p>
            </LegalSection>
        </div>
    );
}