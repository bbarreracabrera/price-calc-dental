import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const generatePDF = (type, data = null, context) => {
    const { 
        themeMode, config, selectedPatientId, getPatient, sessionData, 
        patientRecords, prescription, notify, logAction 
    } = context;

    try {
        const doc = new jsPDF();
        
        // --- PALETA DE COLORES BOUTIQUE (RGB) ---
        const ESPRESSO = [49, 41, 35];     // Texto principal y Headers
        const OLIVE = [91, 102, 81];       // Acentos y Totales
        const TAUPE = [163, 150, 139];     // Textos secundarios y líneas sutiles
        const LIGHT_TAUPE = [223, 210, 196]; // Bordes de cajas
        const VANILLA = [253, 251, 247];   // Fondos de cajas

        // 1. BARRA SUPERIOR ELEGANTE
        doc.setFillColor(...ESPRESSO); 
        doc.rect(0, 0, 210, 4, 'F'); 

        // 2. LOGO DE LA CLÍNICA
        if (config.logo) {
            try { doc.addImage(config.logo, 'PNG', 15, 12, 25, 25, '', 'FAST'); } 
            catch (e) { console.warn("Logo incompatible"); }
        }

        // 3. INFORMACIÓN DE LA CLÍNICA (Header derecho)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...ESPRESSO);
        doc.text(config.name?.toUpperCase() || "CLÍNICA DENTAL", 195, 18, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TAUPE);
        doc.text(`RUT: ${config.rut || 'No registrado'}`, 195, 23, { align: 'right'});
        doc.text(`Registro MINSAL: ${config.rnpi || 'No registrado'}`, 195, 27, { align: 'right' });
        if (config.university) doc.text(`${config.university}`, 195, 31, { align: 'right' });
        doc.text(`${config.address || 'Dirección no registrada'}`, 195, 35, { align: 'right' });

        // Línea divisoria muy fina
        doc.setDrawColor(...LIGHT_TAUPE);
        doc.setLineWidth(0.5);
        doc.line(15, 42, 195, 42);

        // 4. EXTRACCIÓN DE DATOS DEL PACIENTE
        const pData = (type === 'consent') ? getPatient(selectedPatientId) : (data || (sessionData.patientId ? patientRecords[sessionData.patientId] : null));
        const pName = pData?.personal?.legalName || (sessionData.patientName || 'Paciente No Registrado');
        // Soporte para RUT si lo guardaste en documentId o rut
        const pRut = pData?.personal?.rut || pData?.personal?.documentId || '---';
        const pAge = pData?.personal?.age ? `${pData.personal.age} años` : '---';
        const currentDate = new Date().toLocaleDateString('es-CL');

        // 5. CAJA DE DATOS DEL PACIENTE (Fondo Vainilla elegante)
        doc.setFillColor(...VANILLA);
        doc.setDrawColor(...LIGHT_TAUPE);
        doc.roundedRect(15, 47, 180, 20, 2, 2, 'FD'); // Rectángulo con bordes redondeados

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TAUPE);
        doc.text("PACIENTE", 20, 54);
        doc.text("RUT", 110, 54);
        doc.text("EDAD", 145, 54);
        doc.text("FECHA", 168, 54);

        doc.setFontSize(11);
        doc.setTextColor(...ESPRESSO);
        doc.text(pName.toUpperCase(), 20, 61);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(pRut, 110, 61);
        doc.text(pAge, 145, 61);
        doc.text(currentDate, 168, 61);

        // ==========================================
        // 6A. RECETA MÉDICA (Rx)
        // ==========================================
        if (type === 'rx') {
            if (prescription.length === 0) { notify("La receta está vacía."); return; }
            
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...ESPRESSO);
            doc.text("RECETA MÉDICA", 15, 85);

            // Símbolo "Rx" estilizado
            doc.setFont("times", "italic");
            doc.setFontSize(26);
            doc.setTextColor(...OLIVE);
            doc.text("Rx.", 15, 98);

            // Tabla de medicamentos minimalista (sin caja, solo líneas divisorias suaves)
            autoTable(doc, {
                startY: 105,
                head: [['FÁRMACO / PRESENTACIÓN', 'INDICACIONES Y POSOLOGÍA']],
                body: prescription.map(p => [p.name.toUpperCase(), p.dosage]),
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 6, textColor: [60,60,60] },
                headStyles: { fontStyle: 'bold', textColor: ESPRESSO, borderBottom: { width: 0.5, color: LIGHT_TAUPE } },
                columnStyles: { 0: { fontStyle: 'bold', textColor: ESPRESSO, width: 85 } },
                bodyStyles: { borderBottom: { width: 0.1, color: [230, 230, 230] } }
            });

            // Bloque de Firma a la derecha
            const finalY = doc.lastAutoTable.finalY + 40;
            doc.setDrawColor(...TAUPE);
            doc.setLineWidth(0.5);
            doc.line(130, finalY, 185, finalY);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...ESPRESSO);
            doc.text("FIRMA Y TIMBRE DEL PROFESIONAL", 157.5, finalY + 5, { align: 'center' });
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...TAUPE);
            doc.text(config.name || '', 157.5, finalY + 9, { align: 'center' });
        } 
        
        // ==========================================
        // 6B. PRESUPUESTO
        // ==========================================
        else if (type === 'quote') {
            const qItems = data || []; 
            const totalQ = qItems.reduce((sum, item) => sum + Number(item.price), 0);
            
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...ESPRESSO);
            doc.text("PRESUPUESTO CLÍNICO", 15, 85); 

            autoTable(doc, { 
                startY: 95, 
                head: [['TRATAMIENTO', 'PIEZA', 'VALOR']], 
                body: qItems.map(it => [it.name, it.tooth ? `Diente ${it.tooth}` : '-', `$${Number(it.price).toLocaleString('es-CL')}`]),
                foot: [['', 'TOTAL A PAGAR:', `$${totalQ.toLocaleString('es-CL')}`]],
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 6 },
                headStyles: { fillColor: ESPRESSO, textColor: [255,255,255], fontStyle: 'bold', halign: 'left' },
                footStyles: { fillColor: VANILLA, textColor: OLIVE, fontStyle: 'bold', fontSize: 12 },
                alternateRowStyles: { fillColor: [250, 249, 246] },
                columnStyles: { 
                    0: { halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'right', fontStyle: 'bold' }
                }
            }); 

            const finalY = doc.lastAutoTable.finalY + 15;
            if (finalY < 240) {
                // Caja de Términos y Condiciones
                doc.setFillColor(...VANILLA);
                doc.setDrawColor(...LIGHT_TAUPE);
                doc.roundedRect(15, finalY, 180, 22, 2, 2, 'FD');
                
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...ESPRESSO);
                doc.text("Condiciones del Presupuesto:", 20, finalY + 7);
                
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...TAUPE);
                doc.text("1. Este presupuesto tiene una validez estricta de 30 días corridos desde su emisión.", 20, finalY + 12);
                doc.text("2. Los valores pueden variar si se descubren hallazgos clínicos imprevistos durante el tratamiento.", 20, finalY + 17);

                // Firmas
                doc.setDrawColor(...TAUPE);
                doc.setLineWidth(0.5);
                doc.line(30, finalY + 50, 85, finalY + 50); 
                doc.line(125, finalY + 50, 180, finalY + 50); 
                
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...ESPRESSO);
                doc.text("Firma Profesional", 57.5, finalY + 55, { align: 'center' });
                doc.text("Firma Paciente / Apoderado", 152.5, finalY + 55, { align: 'center' });
            }
        }
        
        // ==========================================
        // 6C. CONSENTIMIENTO INFORMADO
        // ==========================================
        else if (type === 'consent' && data) { 
            doc.setFontSize(16); 
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...ESPRESSO);
            doc.text(data.type.toUpperCase(), 105, 85, { align: 'center' }); 
            
            doc.setFontSize(10); 
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);
            
            // Texto Justificado (Mucho más profesional)
            const splitText = doc.splitTextToSize(data.text || '', 170);
            doc.text(splitText, 20, 100, { align: 'justify', maxWidth: 170 }); 
            
            if(data.signature) { 
                try { doc.addImage(data.signature, 'PNG', 80, 220, 50, 30); } 
                catch(e) { console.warn("Error en firma digital"); } 
                
                doc.setDrawColor(...TAUPE);
                doc.line(75, 255, 135, 255);
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.text("Firma del Paciente", 105, 260, { align: 'center' });
            } 
        }

        // ==========================================
        // 7. MARCA DE AGUA INFERIOR
        // ==========================================
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(180, 180, 180);
        doc.text(`Documento clínico oficial generado por ShiningCloud Dental el ${new Date().toLocaleString('es-CL')}`, 105, 285, { align: 'center' });

        // GUARDADO DEL DOCUMENTO
        const cleanName = pName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${type}_${cleanName}.pdf`); 
        notify("Documento PDF generado con éxito"); 
        logAction('GENERATE_PDF', { type }, selectedPatientId);

    } catch (e) { 
        console.error(e); 
        alert("Error al generar el documento PDF. Revisa los datos ingresados."); 
    }
};