// src/pdf/index.js
// ============================================================================
// PUNTO DE ENTRADA ÚNICO DE LOS DOCUMENTOS
// ----------------------------------------------------------------------------
// Todo PDF de la aplicación sale de aquí. Eso garantiza que los seis lleven lo
// mismo sin que nadie tenga que acordarse: folio, membrete de la clínica,
// paginación real, marca de trazabilidad con el usuario que lo emitió, hash
// SHA-256 del archivo y registro en audit_logs.
//
// Antes el periodontograma no tenía nada de eso porque vivía en su propio
// archivo, y la receta y el presupuesto no numeraban páginas.
// ============================================================================

import { crearDocumento, dibujarPie, cerrarDocumento, generarFolio, nombreArchivo } from './layout.js';
import { construirPresupuesto } from './documents/quote.js';
import { construirReceta } from './documents/prescription.js';
import { construirConsentimiento } from './documents/consent.js';
import { construirFichaClinica } from './documents/record.js';
import { construirPeriodontograma } from './documents/perio.js';

const NOTAS_PIE = {
  presupuesto:  'Presupuesto referencial. No constituye documento tributario.',
  receta:       'Receta profesional conforme al artículo 101 del Código Sanitario.',
  consentimiento: 'Firma electrónica simple, Ley 19.799.',
  ficha:        'Ficha clínica — dato sensible. Decreto 41/2012 MINSAL, artículos 6 y 10.',
  perio:        'Registro clínico periodontal. Forma parte de la ficha del paciente.',
};

const TITULOS_ARCHIVO = {
  presupuesto: 'presupuesto',
  receta: 'receta',
  consentimiento: 'consentimiento',
  ficha: 'ficha_clinica',
  perio: 'periodontograma',
};

/**
 * @param {'presupuesto'|'receta'|'consentimiento'|'ficha'|'perio'} tipo
 * @param {object} datos      contenido propio del documento
 * @param {object} contexto   { config, session, notify, logAction, selectedPatientId }
 */
export async function generarDocumento(tipo, datos = {}, contexto = {}) {
  const { config = {}, session, notify, logAction, selectedPatientId } = contexto;
  const formato = config.paperFormat === 'carta' ? 'carta' : 'a4';
  const folio = generarFolio(tipo);
  const paciente = datos.paciente || null;

  try {
    let doc, g;

    if (tipo === 'perio') {
      ({ doc, g } = crearDocumento({ formato, orientacion: 'l' }));
      if (!(datos.capturas || []).length) { notify?.('No hay periodontograma visible para exportar.'); return null; }
      construirPeriodontograma({
        doc, g, config, folio,
        paciente,
        stats: datos.stats || {},
        capturas: datos.capturas,
      });
    } else {
      ({ doc, g } = crearDocumento({ formato }));

      if (tipo === 'presupuesto') {
        if (!(datos.items || []).length) { notify?.('El presupuesto no tiene prestaciones.'); return null; }
        construirPresupuesto({ doc, g, config, folio, paciente, items: datos.items, opciones: datos.opciones });
      } else if (tipo === 'receta') {
        if (!(datos.medicamentos || []).length) { notify?.('La receta está vacía.'); return null; }
        construirReceta({ doc, g, config, folio, paciente, medicamentos: datos.medicamentos, opciones: datos.opciones });
      } else if (tipo === 'consentimiento') {
        construirConsentimiento({ doc, g, config, folio, paciente, consentimiento: datos.consentimiento || {} });
      } else if (tipo === 'ficha') {
        construirFichaClinica({ doc, g, config, folio, paciente, opciones: datos.opciones });
      } else {
        throw new Error(`Tipo de documento desconocido: ${tipo}`);
      }
    }

    dibujarPie(doc, g, {
      folio,
      config,
      usuario: session?.user?.email,
      nota: NOTAS_PIE[tipo],
    });

    return await cerrarDocumento(doc, {
      tipo,
      folio,
      nombreArchivo: nombreArchivo(TITULOS_ARCHIVO[tipo] || tipo, paciente, folio),
      contexto: { logAction, selectedPatientId, notify },
    });
  } catch (e) {
    console.error('[pdf]', tipo, e);
    notify?.('No se pudo generar el documento. Revisa los datos ingresados.');
    return null;
  }
}

// ---------------------------------------------------------------------------
// COMPATIBILIDAD
// ---------------------------------------------------------------------------
// Firma idéntica a la del generador viejo, para que los componentes que todavía
// llaman generatePDF('quote', items) sigan funcionando sin tocarlos. Los
// nombres nuevos son los de arriba.
// ---------------------------------------------------------------------------

export async function generatePDF(type, data = null, context = {}) {
  const { getPatient, selectedPatientId, sessionData, patientRecords, prescription } = context;

  const pacienteActual = () => {
    if (selectedPatientId && getPatient) return getPatient(selectedPatientId);
    if (sessionData?.patientId && patientRecords) return patientRecords[sessionData.patientId];
    return null;
  };

  switch (type) {
    case 'quote':
      return generarDocumento('presupuesto', {
        paciente: pacienteActual(),
        items: Array.isArray(data) ? data : (data?.items || []),
        opciones: Array.isArray(data) ? {} : (data?.opciones || {}),
      }, context);

    case 'rx':
      return generarDocumento('receta', {
        paciente: (data && data.personal) ? data : pacienteActual(),
        medicamentos: prescription || [],
      }, context);

    case 'consent':
      return generarDocumento('consentimiento', {
        paciente: pacienteActual(),
        consentimiento: data || {},
      }, context);

    case 'ficha':
    case 'record':
      return generarDocumento('ficha', {
        paciente: (data && data.personal) ? data : pacienteActual(),
      }, context);

    default:
      console.warn('[pdf] tipo desconocido:', type);
      return null;
  }
}

export { generarFolio };
