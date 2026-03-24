import React from 'react';

export default function LegalText({ isDarkTheme = true }) {
    const textColor = isDarkTheme ? "text-slate-300" : "";
    const titleColor = isDarkTheme ? "text-amber-400" : "text-cyan-500";
    const bgContainer = isDarkTheme ? "" : "text-sm leading-relaxed";

    return (
        <div className={`space-y-6 ${textColor} ${bgContainer}`}>
            <section>
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>1. Aceptación de los Términos</h3>
                <p>Al suscribirse y utilizar ShiningCloud Dental, el Usuario acepta cumplir con estos términos. El servicio se presta "tal cual" y según disponibilidad, enfocado en optimizar la gestión de clínicas dentales en Chile y Latinoamérica.</p>
            </section>

            <section>
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>2. Naturaleza del Servicio</h3>
                <p>ShiningCloud es una herramienta de apoyo administrativo y clínico. <strong>El Proveedor no practica la odontología.</strong> El diagnóstico, plan de tratamiento y las decisiones clínicas son responsabilidad exclusiva del profesional usuario. El software asistido por IA (como el periodontograma por voz) es una ayuda técnica y no reemplaza el juicio clínico del dentista.</p>
            </section>

            <section>
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>3. Propiedad y Privacidad de los Datos (Ley 19.628)</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Propiedad:</strong> Los datos de salud y fichas clínicas cargados pertenecen íntegramente al Usuario (la clínica o el dentista titular). El Proveedor actúa únicamente como custodio y procesador tecnológico.</li>
                    <li><strong>Seguridad:</strong> Utilizamos protocolos de encriptación de grado bancario e infraestructura segura en la nube. Sin embargo, el Usuario es el único responsable de mantener la confidencialidad de sus claves de acceso y de cerrar su sesión en dispositivos públicos.</li>
                    <li><strong>Privacidad:</strong> Nos comprometemos a no vender, ceder ni perfilar comercialmente los datos de sus pacientes bajo ninguna circunstancia.</li>
                </ul>
            </section>

            <section>
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>4. Responsabilidades del Usuario</h3>
                <p>El Usuario se obliga a cumplir con la normativa sanitaria vigente (incluyendo la Ley 20.584 sobre Derechos y Deberes de los Pacientes en Chile). Además, asume la responsabilidad de realizar exportaciones o respaldos periódicos de su información como medida de precaución.</p>
            </section>

            <section>
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>5. Suscripción y Pagos</h3>
                <p>Los pagos se procesan de forma segura a través de <strong>Mercado Pago</strong> (o pasarelas certificadas similares). El servicio funciona bajo la modalidad de suscripción mensual automática. El no pago de la suscripción resultará en la limitación de la cuenta a un modo de "solo lectura" durante 30 días, tras los cuales la cuenta podría ser suspendida definitivamente.</p>
            </section>

            <section>
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>6. Limitación de Responsabilidad</h3>
                <p>En la máxima medida permitida por la ley, el Proveedor no será responsable por lucro cesante, pérdida de datos derivada de un mal manejo de contraseñas, ni por interrupciones del servicio originadas por proveedores de internet o de infraestructura en la nube. La responsabilidad máxima del Proveedor ante cualquier evento se limitará al equivalente a los últimos 3 meses de suscripción pagados por el Usuario.</p>
            </section>
        </div>
    );
}