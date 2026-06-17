/**
 * Supply Manager - Gestión de Insumos Dentales Integrada
 * 
 * Este módulo maneja el catálogo de productos, ventas y comisiones
 * de ShiningCloud Supply como rama integrada (MVP).
 * 
 * Escalable a plataforma independiente en el futuro.
 */

export const SUPPLY_CATEGORIES = [
  { id: 'instruments', name: 'Instrumentos', icon: '🔧' },
  { id: 'materials', name: 'Materiales', icon: '⚗️' },
  { id: 'consumables', name: 'Consumibles', icon: '📦' },
  { id: 'equipment', name: 'Equipamiento', icon: '🏥' },
  { id: 'protection', name: 'Protección', icon: '🛡️' }
];

export const DEFAULT_SUPPLY_CATALOG = [
  { id: 'sup_001', name: 'Resina Composite A2', category: 'materials', price: 45000, stock: 50, minStock: 10 },
  { id: 'sup_002', name: 'Ionómero de Vidrio', category: 'materials', price: 35000, stock: 30, minStock: 5 },
  { id: 'sup_003', name: 'Gutapercha Puntas', category: 'materials', price: 25000, stock: 100, minStock: 20 },
  { id: 'sup_004', name: 'Mascarillas N95 (Caja)', category: 'protection', price: 15000, stock: 200, minStock: 50 },
  { id: 'sup_005', name: 'Guantes Nitrilo (100 pares)', category: 'protection', price: 12000, stock: 150, minStock: 30 },
  { id: 'sup_006', name: 'Burs Diamantados Set', category: 'instruments', price: 85000, stock: 20, minStock: 5 },
];

/**
 * Calcula el total de ventas de Supply en un período
 */
export const calculateSupplySales = (orders = []) => {
  return orders.reduce((sum, order) => sum + (order.total || 0), 0);
};

/**
 * Calcula la comisión de ShiningCloud por ventas de Supply
 * Comisión estándar: 15% de cada venta
 */
export const calculateSupplyCommission = (totalSales, commissionRate = 0.15) => {
  return Math.round(totalSales * commissionRate);
};

/**
 * Genera un reporte de inventario de Supply
 */
export const generateSupplyInventoryReport = (catalog = []) => {
  const lowStock = catalog.filter(item => item.stock <= item.minStock);
  const totalValue = catalog.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const totalItems = catalog.reduce((sum, item) => sum + item.stock, 0);

  return {
    totalItems,
    totalValue,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
    categories: SUPPLY_CATEGORIES.map(cat => ({
      ...cat,
      itemCount: catalog.filter(item => item.category === cat.id).length
    }))
  };
};

/**
 * Procesa una orden de Supply
 */
export const createSupplyOrder = (items = [], clinicId, dentistId) => {
  const orderId = `ORD-${Date.now()}`;
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    id: orderId,
    clinicId,
    dentistId,
    items,
    total,
    commission: calculateSupplyCommission(total),
    status: 'pending',
    createdAt: new Date().toISOString(),
    deliveryDate: null
  };
};

/**
 * Calcula estadísticas de Supply para el Panel Maestro
 */
export const getSupplyStats = (orders = [], catalog = []) => {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
  });

  const monthlySales = calculateSupplySales(monthlyOrders);
  const monthlyCommission = calculateSupplyCommission(monthlySales);

  const inventory = generateSupplyInventoryReport(catalog);

  return {
    totalOrders: orders.length,
    monthlyOrders: monthlyOrders.length,
    monthlySales,
    monthlyCommission,
    totalCommission: calculateSupplyCommission(calculateSupplySales(orders)),
    inventory,
    topProducts: catalog
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5)
  };
};

/**
 * Valida disponibilidad de productos
 */
export const validateSupplyAvailability = (items = [], catalog = []) => {
  const errors = [];

  items.forEach(item => {
    const catalogItem = catalog.find(c => c.id === item.id);
    if (!catalogItem) {
      errors.push(`Producto ${item.id} no existe en catálogo`);
    } else if (catalogItem.stock < item.quantity) {
      errors.push(`Stock insuficiente para ${catalogItem.name}. Disponible: ${catalogItem.stock}, Solicitado: ${item.quantity}`);
    }
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Descuenta stock tras una orden confirmada
 */
export const updateCatalogStock = (items = [], catalog = []) => {
  return catalog.map(catalogItem => {
    const orderItem = items.find(item => item.id === catalogItem.id);
    if (orderItem) {
      return { ...catalogItem, stock: catalogItem.stock - orderItem.quantity };
    }
    return catalogItem;
  });
};
