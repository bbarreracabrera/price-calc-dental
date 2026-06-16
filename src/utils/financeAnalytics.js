/**
 * Utilidades para análisis financiero avanzado en ShiningCloud Dental
 */

/**
 * Calcula la rentabilidad por tratamiento
 */
export const getTreatmentProfitability = (incomeRecords, expenseRecords) => {
    const stats = {};

    incomeRecords.forEach(record => {
        const treatment = record.treatment || 'Otros';
        if (!stats[treatment]) stats[treatment] = { income: 0, count: 0 };
        
        const amount = (record.payments || []).reduce((s, p) => s + p.amount, 0) + (record.paid && !record.payments ? record.paid : 0);
        stats[treatment].income += amount;
        stats[treatment].count += 1;
    });

    // Podríamos cruzar con gastos específicos si estuvieran tageados por tratamiento
    return Object.entries(stats).map(([name, data]) => ({
        name,
        income: data.income,
        count: data.count,
        avgTicket: data.income / data.count
    })).sort((a, b) => b.income - a.income);
};

/**
 * Categorías de gastos profesionales para contabilidad chilena
 */
export const EXPENSE_CATEGORIES = [
    { key: 'Insumos', label: 'Insumos Dentales', icon: 'Box' },
    { key: 'Laboratorio', label: 'Laboratorio Dental', icon: 'FlaskConical' },
    { key: 'Sueldos', label: 'Honorarios y Sueldos', icon: 'Users' },
    { key: 'Arriendo', label: 'Arriendo / Gastos Comunes', icon: 'Building2' },
    { key: 'Marketing', label: 'Marketing y Publicidad', icon: 'Megaphone' },
    { key: 'Servicios', label: 'Luz, Agua, Internet', icon: 'Zap' },
    { key: 'Otros', label: 'Otros Gastos', icon: 'MoreHorizontal' }
];

/**
 * Formateador de moneda CLP
 */
export const formatCLP = (amount) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(amount);
};
