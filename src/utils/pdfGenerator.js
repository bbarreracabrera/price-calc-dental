// src/utils/pdfGenerator.js
// ----------------------------------------------------------------------------
// Este archivo quedó como puente. La implementación vive ahora en src/pdf/,
// donde los seis documentos comparten membrete, folio, paginación y auditoría.
//
// Se mantiene para no tener que editar App.jsx ni los componentes que ya
// importan desde aquí. Cuando migres esos imports a `src/pdf`, este archivo se
// puede borrar.
// ----------------------------------------------------------------------------
export { generatePDF, generarDocumento } from '../pdf/index.js';
