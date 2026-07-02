import React, { useState } from 'react';
import { Package, TrendingUp, ShoppingCart, AlertTriangle, Plus, Filter, Download, Trash2, X, CheckCircle, Minus } from 'lucide-react';
import { Card } from './UIComponents';
import { SUPPLY_CATEGORIES, DEFAULT_SUPPLY_CATALOG, getSupplyStats } from '../utils/supplyManager';

export default function SupplyView({ orders = [], catalog = DEFAULT_SUPPLY_CATALOG, onOrderCreate, notify }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  const stats = getSupplyStats(orders, catalog);

  const filteredCatalog = catalog.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    notify(`Agregado: ${product.name}`);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirmOrder = () => {
    if (cart.length === 0) return;
    
    const newOrder = {
      id: Date.now().toString(),
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: cartTotal,
      status: 'pendiente',
      date: new Date().toISOString(),
    };

    if (onOrderCreate) {
      onOrderCreate(newOrder);
      setCart([]);
      setShowCartModal(false);
      notify('Orden enviada correctamente');
    }
  };



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
        <div className="flex gap-3">
            <button
                onClick={() => setShowCartModal(true)}
                className="relative px-6 py-3 rounded-xl bg-white border border-[#DFD2C4] text-[#312923] text-[11px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] transition-all flex items-center gap-2 shadow-sm"
            >
                <ShoppingCart size={16} /> 
                Carrito 
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#CBAAA2] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                        {cart.length}
                    </span>
                )}
            </button>
            <button
                onClick={() => onOrderCreate && onOrderCreate()}
                className="px-6 py-3 rounded-xl bg-[#5B6651] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#4a5442] transition-all flex items-center gap-2 shadow-lg"
            >
                <Plus size={16} /> Nueva Orden Libre
            </button>
        </div>
      </div>

      {/* --- MÉTRICAS PRINCIPALES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#5B6651]/10 rounded-xl sm:rounded-2xl text-[#5B6651]">
              <ShoppingCart size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Órdenes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#312923] tracking-tighter">{stats.monthlyOrders}</h2>
          <p className="text-[9px] sm:text-[11px] font-bold text-[#A3968B] mt-1 sm:mt-2">Este Mes</p>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#CBAAA2]/20 rounded-xl sm:rounded-2xl text-[#CBAAA2]">
              <TrendingUp size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Ventas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#312923] tracking-tighter">${stats.monthlySales.toLocaleString()}</h2>
          <p className="text-[9px] sm:text-[11px] font-bold text-[#A3968B] mt-1 sm:mt-2">Ventas Mensuales</p>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#5B6651]/10 rounded-xl sm:rounded-2xl text-[#5B6651]">
              <Package size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Comisión</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#312923] tracking-tighter">${stats.monthlyCommission.toLocaleString()}</h2>
          <p className="text-[9px] sm:text-[11px] font-bold text-[#A3968B] mt-1 sm:mt-2">Comisión (15%)</p>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#FDFBF7] rounded-xl sm:rounded-2xl text-[#A3968B]">
              <AlertTriangle size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Stock Bajo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#312923] tracking-tighter">{stats.inventory.lowStockCount}</h2>
          <p className="text-[9px] sm:text-[11px] font-bold text-[#A3968B] mt-1 sm:mt-2">Productos Críticos</p>
        </Card>
      </div>

      {/* --- CATÁLOGO Y FILTROS --- */}
      <Card className="p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#DFD2C4]/50">
          <h3 className="font-black text-[#312923] text-xl tracking-tight">Catálogo de Productos</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 md:w-64 px-4 py-2 rounded-xl border border-[#DFD2C4]/50 text-[11px] font-bold focus:outline-none focus:border-[#5B6651]"
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
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
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1 ${
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
                <th className="text-left py-3 px-4 font-black text-[#312923] hidden sm:table-cell">Categoría</th>
                <th className="text-right py-3 px-4 font-black text-[#312923]">Precio</th>
                <th className="text-right py-3 px-4 font-black text-[#312923] hidden sm:table-cell">Stock</th>
                <th className="text-center py-3 px-4 font-black text-[#312923]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <tr key={item.id} className="border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-3 px-4">
                        <div className="font-bold text-[#312923]">{item.name}</div>
                        <div className="sm:hidden text-[9px] text-[#9A8F84]">{SUPPLY_CATEGORIES.find(c => c.id === item.category)?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-[#9A8F84] hidden sm:table-cell">
                      {SUPPLY_CATEGORIES.find(c => c.id === item.category)?.name}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#5B6651]">${item.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-black text-[#312923] hidden sm:table-cell">{item.stock}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => addToCart(item)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 mx-auto ${
                            inCart 
                            ? 'bg-[#CBAAA2] text-white hover:bg-[#b8958d]' 
                            : 'bg-[#5B6651] text-white hover:bg-[#4a5442]'
                        }`}
                      >
                        {inCart ? <><Plus size={10}/> Añadir más</> : 'Comprar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODAL DE CARRITO --- */}
      {showCartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2421]/60 backdrop-blur-sm animate-in fade-in duration-200">
              <Card className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-[#DFD2C4]/50 overflow-hidden">
                  <div className="p-6 border-b border-[#DFD2C4]/50 flex justify-between items-center bg-[#FDFBF7]">
                      <div>
                        <h3 className="font-black text-[#312923] text-2xl tracking-tighter">Resumen de Pedido</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Revisa tus insumos antes de confirmar</p>
                      </div>
                      <button onClick={() => setShowCartModal(false)} className="p-2 rounded-full hover:bg-[#DFD2C4]/20 text-[#A3968B] transition-colors"><X size={20}/></button>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {cart.length === 0 ? (
                          <div className="text-center py-12">
                              <ShoppingCart size={48} className="mx-auto text-[#DFD2C4] mb-4 opacity-50" />
                              <p className="text-[#9A8F84] font-bold text-sm">Tu carrito está vacío</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {cart.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4]/40">
                                      <div className="flex-1">
                                          <p className="font-bold text-[#312923] text-sm">{item.name}</p>
                                          <p className="text-[10px] font-black text-[#5B6651] uppercase tracking-widest">${item.price.toLocaleString()} c/u</p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="flex items-center bg-white border border-[#DFD2C4] rounded-xl px-2">
                                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-[#A3968B] hover:text-[#312923] transition-colors font-black text-lg">-</button>
                                              <span className="w-8 text-center font-black text-xs text-[#312923]">{item.quantity}</span>
                                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-[#A3968B] hover:text-[#312923] transition-colors font-black text-lg">+</button>
                                          </div>
                                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {cart.length > 0 && (
                      <div className="p-6 bg-[#FDFBF7] border-t border-[#DFD2C4]/50">
                          <div className="flex justify-between items-center mb-6">
                              <span className="text-xs font-black uppercase tracking-widest text-[#9A8F84]">Total estimado</span>
                              <span className="text-3xl font-black text-[#312923] tracking-tighter">${cartTotal.toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={handleConfirmOrder}
                            className="w-full py-4 rounded-2xl bg-[#312923] text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-[#312923]/20 flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18}/> Confirmar Orden de Insumos
                          </button>
                      </div>
                  )}
              </Card>
          </div>
      )}
    </div>
  );
}
