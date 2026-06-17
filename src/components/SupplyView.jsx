import React, { useState } from 'react';
import { Package, TrendingUp, ShoppingCart, AlertTriangle, Plus, Filter, Download } from 'lucide-react';
import { Card } from './UIComponents';
import { SUPPLY_CATEGORIES, DEFAULT_SUPPLY_CATALOG, getSupplyStats } from '../utils/supplyManager';

export default function SupplyView({ orders = [], catalog = DEFAULT_SUPPLY_CATALOG, onOrderCreate }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = getSupplyStats(orders, catalog);

  const filteredCatalog = catalog.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in pb-10">
      {/* --- ENCABEZADO --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#DFD2C4]/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-[#A3968B]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">ShiningCloud Supply</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter">Gestión de Insumos</h1>
        </div>
        <button
          onClick={() => onOrderCreate && onOrderCreate()}
          className="px-6 py-3 rounded-xl bg-[#5B6651] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#4a5442] transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={16} /> Nueva Orden
        </button>
      </div>

      {/* --- MÉTRICAS PRINCIPALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#5B6651]/10 rounded-2xl text-[#5B6651]">
              <ShoppingCart size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">Órdenes</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">{stats.monthlyOrders}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Este Mes</p>
        </Card>

        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#CBAAA2]/20 rounded-2xl text-[#CBAAA2]">
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">Ventas</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">${stats.monthlySales.toLocaleString()}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Ventas Mensuales</p>
        </Card>

        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#5B6651]/10 rounded-2xl text-[#5B6651]">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">Comisión</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">${stats.monthlyCommission.toLocaleString()}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Comisión (15%)</p>
        </Card>

        <Card className={`rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm p-6 ${stats.inventory.lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <div className="flex justify-between mb-4 items-start">
            <div className={`p-3 rounded-2xl ${stats.inventory.lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-[#FDFBF7] text-[#A3968B]'}`}>
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-white px-3 py-1 rounded-full">Stock Bajo</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">{stats.inventory.lowStockCount}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Productos Críticos</p>
        </Card>
      </div>

      {/* --- CATÁLOGO Y FILTROS --- */}
      <Card className="p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#DFD2C4]/50">
          <h3 className="font-black text-[#312923] text-xl tracking-tight">Catálogo de Productos</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[#DFD2C4]/50 text-[11px] font-bold focus:outline-none focus:border-[#5B6651]"
            />
            <button className="px-4 py-2 rounded-xl bg-[#FDFBF7] border border-[#DFD2C4] text-[10px] font-black uppercase tracking-widest hover:bg-[#DFD2C4]/20 transition-all flex items-center gap-2">
              <Filter size={14} /> Filtrar
            </button>
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#312923] text-white'
                : 'bg-[#FDFBF7] text-[#6B615A] border border-[#DFD2C4]/50 hover:border-[#5B6651]'
            }`}
          >
            Todos
          </button>
          {SUPPLY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-[#312923] text-white'
                  : 'bg-[#FDFBF7] text-[#6B615A] border border-[#DFD2C4]/50 hover:border-[#5B6651]'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Tabla de Productos */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#DFD2C4]/50">
                <th className="text-left py-3 px-4 font-black text-[#312923]">Producto</th>
                <th className="text-left py-3 px-4 font-black text-[#312923]">Categoría</th>
                <th className="text-right py-3 px-4 font-black text-[#312923]">Precio</th>
                <th className="text-right py-3 px-4 font-black text-[#312923]">Stock</th>
                <th className="text-center py-3 px-4 font-black text-[#312923]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.map(item => {
                const isLowStock = item.stock <= item.minStock;
                return (
                  <tr key={item.id} className={`border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-4 font-bold text-[#312923]">{item.name}</td>
                    <td className="py-3 px-4 text-[#9A8F84]">
                      {SUPPLY_CATEGORIES.find(c => c.id === item.category)?.name}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#5B6651]">${item.price.toLocaleString()}</td>
                    <td className={`py-3 px-4 text-right font-black ${isLowStock ? 'text-red-600' : 'text-[#312923]'}`}>
                      {item.stock} {isLowStock && <span className="text-red-600 ml-1">⚠️</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="px-3 py-1 rounded-lg bg-[#5B6651] text-white text-[9px] font-black hover:bg-[#4a5442] transition-all">
                        Comprar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- PRODUCTOS TOP --- */}
      <Card className="p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm bg-white">
        <h3 className="font-black text-[#312923] text-xl tracking-tight mb-4">Productos Más Vendidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stats.topProducts.map(product => (
            <div key={product.id} className="p-4 rounded-xl bg-[#FDFBF7] border border-[#DFD2C4]/50 text-center">
              <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mb-2">{product.name}</p>
              <p className="text-2xl font-black text-[#312923]">{product.stock}</p>
              <p className="text-[9px] font-bold text-[#A3968B] mt-2">Unidades en Stock</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
