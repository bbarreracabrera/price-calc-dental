import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const generatePDF = (type, data = null, context) => {
    const { 
        themeMode, config, selectedPatientId, getPatient, sessionData, 
        patientRecords, prescription, notify, logAction 
    } = context;

    try {
        const doc = new jsPDF();
        const primaryColor = themeMode === 'light' ? [217, 119, 6] : (themeMode === 'blue' ? [6, 182, 212] : [212, 175, 55]);
        
        doc.setFillColor(...primaryColor); 
        doc.rect(0, 0, 210, 3, 'F'); 

        if (config.logo) {
            try { doc.addImage(config.logo, 'PNG', 15, 10, 20, 20); } 
            catch (e) { console.warn("Logo incompatible"); }
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(config.name?.toUpperCase() || "DOCTOR", 200, 15, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`RUT: ${config.rut || '---'}`, 200, 20, { align: 'right'});
        doc.text(`Registro Super. de Salud: ${config.rnpi || '---'}`, 200, 24, { align: 'right' });
        doc.text(`${config.university || ''}`, 200, 28, { align: 'right' });
        doc.text(`${config.address || ''}`, 200, 32, { align: 'right' });

        const pData = (type === 'consent') ? getPatient(selectedPatientId) : (data || (sessionData.patientId ? patientRecords[sessionData.patientId] : null));
        const pName = pData?.personal?.legalName || (sessionData.patientName || 'Paciente...');
        const pRut = pData?.personal?.documentId || '---';
        const pAge = pData?.personal?.age ? `${pData.personal.age} años` : '';

        doc.setDrawColor(200);
        doc.line(15, 38, 195, 38); 

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("PACIENTE:", 15, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`${pName.toUpperCase()}`, 40, 45);
        doc.text(`RUT: ${pRut}`, 140, 45);
        doc.text(`EDAD: ${pAge}`, 15, 50);
        doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 140, 50);

        if (type === 'rx') {
            if (prescription.length === 0) { notify("Receta vacía"); return; }
            
            doc.setFontSize(16);
            doc.setFont("times", "italic", "bold");
            doc.text("RP:", 15, 65);

            autoTable(doc, {
                startY: 70,
                head: [['FÁRMACO (DCI / PRESENTACIÓN)', 'INDICACIONES (POSOLOGÍA)']],
                body: prescription.map(p => [p.name.toUpperCase(), p.dosage]),
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fontStyle: 'bold', textColor: primaryColor, borderBottom: { width: 0.5, color: primaryColor } },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
            });

            const finalY = doc.lastAutoTable.finalY + 30;
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.line(70, finalY + 20, 140, finalY + 20);
            doc.setFontSize(8);
            doc.text("FIRMA Y TIMBRE PROFESIONAL", 105, finalY + 25, { align: 'center' });
        } 
        else if (type === 'quote') {
            const qItems = data || []; 
            const totalQ = qItems.reduce((sum, item) => sum + Number(item.price), 0);
            
            doc.setFontSize(18);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("PRESUPUESTO DENTAL", 15, 65); 

            autoTable(doc, { 
                startY: 70, 
                head: [['TRATAMIENTO', 'DIENTE', 'VALOR']], 
                body: qItems.map(it => [it.name, it.tooth || '-', `$${Number(it.price).toLocaleString('es-CL')}`]),
                foot: [['', 'TOTAL A PAGAR:', `$${totalQ.toLocaleString('es-CL')}`]],
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold' },
                footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 252, 252] }
            }); 

            const finalY = doc.lastAutoTable.finalY + 15;
            if (finalY < 230) {
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text("Términos y Condiciones:", 15, finalY);
                doc.text("1. Este presupuesto tiene una validez de 30 días.", 15, finalY + 6);
                doc.text("2. Los valores pueden variar según hallazgos clínicos durante el tratamiento.", 15, finalY + 11);

                doc.setDrawColor(150);
                doc.line(30, finalY + 40, 85, finalY + 40); 
                doc.line(125, finalY + 40, 180, finalY + 40); 
                doc.text("Firma Profesional", 45, finalY + 45);
                doc.text("Firma Paciente", 145, finalY + 45);
            }
        }
        else if (type === 'consent' && data) { 
            doc.setFontSize(14); doc.text(data.type, 105, 70, { align: 'center' }); 
            doc.setFontSize(10); doc.text(doc.splitTextToSize(data.text || '', 170), 20, 90); 
            if(data.signature) { try { doc.addImage(data.signature, 'PNG', 80, 200, 50, 30); } catch(e) { console.warn("Firma error"); } } 
        }

        doc.setFontSize(7);
        doc.setTextColor(180);
        doc.text(`Documento generado por ShiningCloud - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        doc.save(`${type}_${pName}.pdf`); 
        notify("PDF Generado con éxito"); 
        logAction('GENERATE_PDF', { type }, selectedPatientId);

    } catch (e) { 
        console.error(e); 
        alert("Error generando PDF."); 
    }
};