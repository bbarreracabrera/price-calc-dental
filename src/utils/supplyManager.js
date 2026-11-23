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

// Reintroducido: lo usa SupplyView.jsx. Fix del audit: no mutar el
// catálogo con sort() in place; topProducts ordenado por stock en copia.
export const getSupplyStats = (orders = [], catalog = []) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
  });

  const monthlySales = calculateSupplySales(monthlyOrders);
  const monthlyCommission = calculateSupplyCommission(monthlySales);

  return {
    totalOrders: orders.length,
    monthlyOrders: monthlyOrders.length,
    monthlySales,
    monthlyCommission,
    totalCommission: calculateSupplyCommission(calculateSupplySales(orders)),
    inventory: generateSupplyInventoryReport(catalog),
    topProducts: [...catalog].sort((a, b) => b.stock - a.stock).slice(0, 5)
  };
};
