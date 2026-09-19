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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D9D2C7]/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-[#8A7F74]" />
            <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">ShiningCloud Supply</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#241F1B] tracking-tighter">Gestión de Insumos</h1>
        </div>
        <div className="flex gap-3">
            <button
                onClick={() => setShowCartModal(true)}
                className="relative px-6 py-3 rounded-xl bg-white border border-[#D9D2C7] text-[#241F1B] text-[11px] font-black uppercase tracking-widest hover:bg-[#FBFAF8] transition-all flex items-center gap-2 shadow-sm"
            >
                <ShoppingCart size={16} /> 
                Carrito 
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D3A9A0] text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce">
                        {cart.length}
                    </span>
                )}
            </button>
            <button
                onClick={() => onOrderCreate && onOrderCreate()}
                className="px-6 py-3 rounded-xl bg-[#46523C] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#36402F] transition-all flex items-center gap-2 shadow-lg"
            >
                <Plus size={16} /> Nueva Orden Libre
            </button>
        </div>
      </div>

      {/* --- MÉTRICAS PRINCIPALES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#D9D2C7]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#46523C]/10 rounded-xl sm:rounded-2xl text-[#46523C]">
              <ShoppingCart size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] sm:text-[11px] font-black uppercase tracking-widest text-[#5E554E] bg-[#FBFAF8] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Órdenes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#241F1B] tracking-tighter">{stats.monthlyOrders}</h2>
          <p className="text-[11px] sm:text-[11px] font-bold text-[#8A7F74] mt-1 sm:mt-2">Este Mes</p>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#D9D2C7]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#D3A9A0]/20 rounded-xl sm:rounded-2xl text-[#D3A9A0]">
              <TrendingUp size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] sm:text-[11px] font-black uppercase tracking-widest text-[#5E554E] bg-[#FBFAF8] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Ventas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#241F1B] tracking-tighter">${stats.monthlySales.toLocaleString()}</h2>
          <p className="text-[11px] sm:text-[11px] font-bold text-[#8A7F74] mt-1 sm:mt-2">Ventas Mensuales</p>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#D9D2C7]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#46523C]/10 rounded-xl sm:rounded-2xl text-[#46523C]">
              <Package size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] sm:text-[11px] font-black uppercase tracking-widest text-[#5E554E] bg-[#FBFAF8] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Comisión</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#241F1B] tracking-tighter">${stats.monthlyCommission.toLocaleString()}</h2>
          <p className="text-[11px] sm:text-[11px] font-bold text-[#8A7F74] mt-1 sm:mt-2">Comisión (15%)</p>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#D9D2C7]/50 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex justify-between mb-3 sm:mb-4 items-start">
            <div className="p-2 sm:p-3 bg-[#FBFAF8] rounded-xl sm:rounded-2xl text-[#8A7F74]">
              <AlertTriangle size={18} sm:size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] sm:text-[11px] font-black uppercase tracking-widest text-[#5E554E] bg-[#FBFAF8] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Stock Bajo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#241F1B] tracking-tighter">{stats.inventory.lowStockCount}</h2>
          <p className="text-[11px] sm:text-[11px] font-bold text-[#8A7F74] mt-1 sm:mt-2">Productos Críticos</p>
        </Card>
      </div>

      {/* --- CATÁLOGO Y FILTROS --- */}
      <Card className="p-6 rounded-[2rem] border border-[#D9D2C7]/50 shadow-sm bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#D9D2C7]/50">
          <h3 className="font-black text-[#241F1B] text-xl tracking-tight">Catálogo de Productos</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 md:w-64 px-4 py-2 rounded-xl border border-[#D9D2C7]/50 text-[11px] font-bold focus:outline-none focus:border-[#46523C]"
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#241F1B] text-white'
                : 'bg-[#FBFAF8] text-[#5E554E] border border-[#D9D2C7]/50 hover:border-[#46523C]'
            }`}
          >
            Todos
          </button>
          {SUPPLY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-[#241F1B] text-white'
                  : 'bg-[#FBFAF8] text-[#5E554E] border border-[#D9D2C7]/50 hover:border-[#46523C]'
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
              <tr className="border-b border-[#D9D2C7]/50">
                <th className="text-left py-3 px-4 font-black text-[#241F1B]">Producto</th>
                <th className="text-left py-3 px-4 font-black text-[#241F1B] hidden sm:table-cell">Categoría</th>
                <th className="text-right py-3 px-4 font-black text-[#241F1B]">Precio</th>
                <th className="text-right py-3 px-4 font-black text-[#241F1B] hidden sm:table-cell">Stock</th>
                <th className="text-center py-3 px-4 font-black text-[#241F1B]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <tr key={item.id} className="border-b border-[#D9D2C7]/30 hover:bg-[#FBFAF8] transition-colors">
                    <td className="py-3 px-4">
                        <div className="font-bold text-[#241F1B]">{item.name}</div>
                        <div className="sm:hidden text-[11px] text-[#5E554E]">{SUPPLY_CATEGORIES.find(c => c.id === item.category)?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-[#5E554E] hidden sm:table-cell">
                      {SUPPLY_CATEGORIES.find(c => c.id === item.category)?.name}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#46523C]">${item.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-black text-[#241F1B] hidden sm:table-cell">{item.stock}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => addToCart(item)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 mx-auto ${
                            inCart 
                            ? 'bg-[#D3A9A0] text-white hover:bg-[#b8958d]' 
                            : 'bg-[#46523C] text-white hover:bg-[#36402F]'
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
              <Card className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-[#D9D2C7]/50 overflow-hidden">
                  <div className="p-6 border-b border-[#D9D2C7]/50 flex justify-between items-center bg-[#FBFAF8]">
                      <div>
                        <h3 className="font-black text-[#241F1B] text-2xl tracking-tighter">Resumen de Pedido</h3>
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">Revisa tus insumos antes de confirmar</p>
                      </div>
                      <button onClick={() => setShowCartModal(false)} className="p-2 rounded-full hover:bg-[#D9D2C7]/20 text-[#8A7F74] transition-colors"><X size={20}/></button>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {cart.length === 0 ? (
                          <div className="text-center py-12">
                              <ShoppingCart size={48} className="mx-auto text-[#D9D2C7] mb-4 opacity-50" />
                              <p className="text-[#5E554E] font-bold text-sm">Tu carrito está vacío</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {cart.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#FBFAF8] border border-[#D9D2C7]/40">
                                      <div className="flex-1">
                                          <p className="font-bold text-[#241F1B] text-sm">{item.name}</p>
                                          <p className="text-[11px] font-black text-[#46523C] uppercase tracking-widest">${item.price.toLocaleString()} c/u</p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="flex items-center bg-white border border-[#D9D2C7] rounded-xl px-2">
                                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-[#8A7F74] hover:text-[#241F1B] transition-colors font-black text-lg">-</button>
                                              <span className="w-8 text-center font-black text-xs text-[#241F1B]">{item.quantity}</span>
                                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-[#8A7F74] hover:text-[#241F1B] transition-colors font-black text-lg">+</button>
                                          </div>
                                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {cart.length > 0 && (
                      <div className="p-6 bg-[#FBFAF8] border-t border-[#D9D2C7]/50">
                          <div className="flex justify-between items-center mb-6">
                              <span className="text-xs font-black uppercase tracking-widest text-[#5E554E]">Total estimado</span>
                              <span className="text-3xl font-black text-[#241F1B] tracking-tighter">${cartTotal.toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={handleConfirmOrder}
                            className="w-full py-4 rounded-2xl bg-[#241F1B] text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-[#241F1B]/20 flex items-center justify-center gap-2"
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
