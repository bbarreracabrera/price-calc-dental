// src/components/perioPdfExport.js
// ----------------------------------------------------------------------------
// Puente hacia src/pdf/.
//
// El periodontograma ya no se redibuja a mano en el PDF: PerioTab.jsx captura
// con html2canvas cada arcada tal como se ve en pantalla (mismos dientes,
// mismo gráfico de líneas, misma tabla) y entrega esas imágenes en
// `capturas`. Este puente solo las reenvía. Ver src/pdf/documents/perio.js
// para el porqué del cambio.
// ----------------------------------------------------------------------------
import { generarDocumento } from '../pdf/index.js';

export function generatePerioPDF({
  patient,
  stats,
  perioDentition = 'adulto',
  capturas = [],
  config = {},
  session,
  logAction,
  notify,
}) {
  return generarDocumento(
    'perio',
    {
      paciente: patient,
      stats,
      denticion: perioDentition,
      capturas,
    },
    { config, session, logAction, notify, selectedPatientId: patient?.id },
  );
}

export default generatePerioPDF;
