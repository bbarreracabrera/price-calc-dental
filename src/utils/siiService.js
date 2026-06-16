/**
 * ============================================================
 * SERVICIO DE EMISIÓN DE BOLETAS ELECTRÓNICAS - SII CHILE
 * ShiningCloud Dental
 * ============================================================
 * 
 * ESTADO: ⏳ PENDIENTE DE ACTIVACIÓN
 * 
 * PROVEEDOR RECOMENDADO: OpenFactura (Haulmer)
 * - Web: https://www.haulmer.com/openfactura/
 * - Precio: desde $9.990 CLP/mes
 * - API REST con excelente documentación
 * - Soporte en español
 * - Integración en 1-2 días de desarrollo
 * 
 * ALTERNATIVA: Acepta.cl
 * - Web: https://www.acepta.com/
 * - Precio: similar a OpenFactura
 * - Más antiguo en el mercado, mayor soporte
 * 
 * INSTRUCCIONES DE ACTIVACIÓN:
 * 1. Contratar plan en https://www.haulmer.com/openfactura/
 * 2. Obtener API Key desde el panel de OpenFactura
 * 3. Agregar al archivo .env:
 *    VITE_OPENFACTURA_API_KEY=tu_api_key_aqui
 *    VITE_OPENFACTURA_ENV=sandbox  (cambiar a 'production' cuando estés listo)
 * 4. Descomentar las funciones de emisión en este archivo
 * 5. Configurar RUT y datos de la clínica en el Panel Maestro
 * ============================================================
 */

// ============================================================
// CONFIGURACIÓN
// ============================================================
const OPENFACTURA_BASE_URL = {
    sandbox:    'https://api.haulmer.com/v2/dte/sandbox',
    production: 'https://api.haulmer.com/v2/dte',
};

// ============================================================
// TIPOS DE DOCUMENTO SII
// ============================================================
export const DTE_TYPES = {
    BOLETA_ELECTRONICA:         39,
    BOLETA_EXENTA_ELECTRONICA:  41,
    FACTURA_ELECTRONICA:        33,
    FACTURA_EXENTA_ELECTRONICA: 34,
    NOTA_CREDITO:               61,
    NOTA_DEBITO:                56,
};

// ============================================================
// CONSTRUCTOR DE DOCUMENTO DTE
// Convierte los datos de la app al formato requerido por OpenFactura
// ============================================================
export const buildDTEPayload = ({
    tipo = DTE_TYPES.BOLETA_ELECTRONICA,
    emisorRut,
    emisorRazonSocial,
    emisorGiro,
    emisorDireccion,
    emisorComuna,
    receptorRut = '66666666-6',   // RUT genérico para boletas sin receptor específico
    receptorNombre = 'Sin Nombre',
    receptorEmail = null,
    items = [],                    // [{ nombre, cantidad, precioUnitario, descuento? }]
    formaPago = 'Efectivo',
    observaciones = '',
}) => {
    const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100)), 0);
    const iva = tipo === DTE_TYPES.BOLETA_ELECTRONICA ? Math.round(subtotal * 0.19) : 0;
    const total = Math.round(subtotal + iva);

    return {
        Encabezado: {
            IdDoc: {
                TipoDTE: tipo,
                FchEmis: new Date().toISOString().split('T')[0],
                FmaPago: formaPago === 'Crédito' ? 2 : 1,
            },
            Emisor: {
                RUTEmisor: emisorRut,
                RznSoc: emisorRazonSocial,
                GiroEmis: emisorGiro || 'Servicios Odontológicos',
                DirOrigen: emisorDireccion || '',
                CmnaOrigen: emisorComuna || '',
            },
            Receptor: {
                RUTRecep: receptorRut,
                RznSocRecep: receptorNombre,
                ...(receptorEmail ? { CorreoRecep: receptorEmail } : {}),
            },
            Totales: {
                MntNeto: tipo === DTE_TYPES.BOLETA_ELECTRONICA ? subtotal : total,
                TasaIVA: tipo === DTE_TYPES.BOLETA_ELECTRONICA ? 19 : 0,
                IVA: iva,
                MntTotal: total,
            },
        },
        Detalle: items.map((item, idx) => ({
            NroLinDet: idx + 1,
            NmbItem: item.nombre,
            QtyItem: item.cantidad,
            PrcItem: item.precioUnitario,
            ...(item.descuento ? { DescuentoPct: item.descuento } : {}),
            MontoItem: Math.round(item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100)),
        })),
        ...(observaciones ? {
            Referencia: [{
                NroLinRef: 1,
                TpoDocRef: 'SET',
                FolioRef: 'N/A',
                FchRef: new Date().toISOString().split('T')[0],
                RazonRef: observaciones,
            }]
        } : {}),
    };
};

// ============================================================
// EMISIÓN DE BOLETA ELECTRÓNICA
// ⏳ PENDIENTE: Descomentar cuando tengas la API key de OpenFactura
// ============================================================
export const emitirBoleta = async (payload) => {
    // TODO: Activar cuando se obtenga la API key de OpenFactura
    // const API_KEY = import.meta.env.VITE_OPENFACTURA_API_KEY;
    // const ENV = import.meta.env.VITE_OPENFACTURA_ENV || 'sandbox';
    // 
    // if (!API_KEY) {
    //     console.warn('[SIIService] OpenFactura API no configurada. Agrega VITE_OPENFACTURA_API_KEY al .env');
    //     return { success: false, reason: 'not_configured' };
    // }
    // 
    // const res = await fetch(`${OPENFACTURA_BASE_URL[ENV]}/document`, {
    //     method: 'POST',
    //     headers: {
    //         'apikey': API_KEY,
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(payload),
    // });
    // 
    // const data = await res.json();
    // 
    // if (!res.ok) {
    //     return { success: false, error: data.message || 'Error al emitir boleta', data };
    // }
    // 
    // return {
    //     success: true,
    //     folio: data.folio,
    //     pdfUrl: data.urlPdf,
    //     xmlUrl: data.urlXml,
    //     ted: data.ted,
    //     data,
    // };

    // MODO SIMULACIÓN: Retorna datos de prueba mientras no hay API key
    console.info('[SIIService] Boleta en modo simulación. Activa con VITE_OPENFACTURA_API_KEY');
    return {
        success: false,
        reason: 'not_configured',
        simulation: true,
        message: 'Para emitir boletas reales, activa la integración con OpenFactura en el Panel Maestro.',
    };
};

// ============================================================
// CONSULTA DE ESTADO DE UN DTE
// ============================================================
export const consultarEstadoDTE = async (folio, tipoDTE) => {
    // TODO: Activar cuando se obtenga la API key de OpenFactura
    // const API_KEY = import.meta.env.VITE_OPENFACTURA_API_KEY;
    // const ENV = import.meta.env.VITE_OPENFACTURA_ENV || 'sandbox';
    // 
    // const res = await fetch(`${OPENFACTURA_BASE_URL[ENV]}/document/status?folio=${folio}&tipoDTE=${tipoDTE}`, {
    //     headers: { 'apikey': API_KEY }
    // });
    // const data = await res.json();
    // return { success: res.ok, data };

    return { success: false, reason: 'not_configured' };
};

// ============================================================
// HELPER: CONSTRUIR ITEMS DESDE UN PRESUPUESTO DE LA APP
// ============================================================
export const buildItemsFromQuote = (quoteItems = []) => {
    return quoteItems.map(item => ({
        nombre: item.name || item.treatment || 'Tratamiento dental',
        cantidad: item.quantity || item.qty || 1,
        precioUnitario: Math.round((item.price || item.unitPrice || 0) / 1.19), // Precio neto sin IVA
        descuento: item.discount || 0,
    }));
};

// ============================================================
// HELPER: CONSTRUIR ITEMS DESDE EVOLUCIONES CLÍNICAS
// ============================================================
export const buildItemsFromEvolutions = (evolutions = [], catalog = []) => {
    return evolutions
        .filter(ev => ev.treatment && ev.date)
        .map(ev => {
            const catalogItem = catalog.find(c => c.name === ev.treatment);
            return {
                nombre: ev.treatment,
                cantidad: 1,
                precioUnitario: Math.round((catalogItem?.price || 0) / 1.19),
                descuento: 0,
            };
        })
        .filter(item => item.precioUnitario > 0);
};

// ============================================================
// CHECKLIST DE ACTIVACIÓN
// Muestra en el Panel Maestro qué falta para activar el servicio
// ============================================================
export const getSIIActivationStatus = () => {
    const apiKey = import.meta.env.VITE_OPENFACTURA_API_KEY;
    const env = import.meta.env.VITE_OPENFACTURA_ENV;

    return {
        isConfigured: !!apiKey,
        isSandbox: env === 'sandbox' || !env,
        isProduction: env === 'production',
        checklist: [
            {
                id: 'plan',
                label: 'Contratar plan OpenFactura',
                done: !!apiKey,
                url: 'https://www.haulmer.com/openfactura/',
                description: 'Desde $9.990 CLP/mes. Incluye emisión ilimitada de boletas.',
            },
            {
                id: 'apikey',
                label: 'Configurar API Key en .env',
                done: !!apiKey,
                description: 'Agrega VITE_OPENFACTURA_API_KEY=tu_key al archivo .env',
            },
            {
                id: 'rut',
                label: 'Configurar RUT de la clínica en Panel Maestro',
                done: false,
                description: 'Necesario para emitir documentos tributarios válidos.',
            },
            {
                id: 'production',
                label: 'Cambiar a modo Producción',
                done: env === 'production',
                description: 'Cambia VITE_OPENFACTURA_ENV=production cuando estés listo.',
            },
        ],
    };
};
