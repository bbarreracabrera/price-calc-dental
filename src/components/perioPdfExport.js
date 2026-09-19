// src/components/perioPdfExport.js
// ----------------------------------------------------------------------------
// Puente hacia src/pdf/. El generador viejo leía `patient.name` y `patient.rut`,
// campos que no existen en el objeto paciente — viven en `patient.personal` —,
// así que el periodontograma salía siempre sin nombre y sin RUT. Además era el
// único documento sin membrete de la clínica, sin paginación uniforme y sin
// registro en audit_logs.
//
// La firma se mantiene para no tocar PerioTab.jsx, pero ahora acepta también
// `config`, `session`, `logAction` y `notify`: pásalos y el documento sale con
// la identidad de la clínica y queda auditado. Sin ellos funciona igual, solo
// que con el membrete vacío.
// ----------------------------------------------------------------------------
import { generarDocumento } from '../pdf/index.js';

export function generatePerioPDF({
  patient,
  stats,
  perioDentition = 'adulto',
  teethUpper = [],
  teethLower = [],
  teethUpperPed = [],
  teethLowerPed = [],
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
      teethUpper, teethLower, teethUpperPed, teethLowerPed,
    },
    { config, session, logAction, notify, selectedPatientId: patient?.id },
  );
}

export default generatePerioPDF;
