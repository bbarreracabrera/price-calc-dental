import React, { useState, useEffect } from 'react';
import { Crown, DollarSign, Package, FlaskConical, TrendingUp, Building2, ChevronRight, CheckCircle, Clock, Truck, MessageCircle } from 'lucide-react';
import { Card } from './UIComponents'; 

export default function MasterPanel({ supabase, notify }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [supplyOrders, setSupplyOrders] = useState([]);
    const [saasSubscriptions, setSaasSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado real, iniciamos en 0
    const [metrics, setMetrics] = useState({
        saasRevenue: 0, 
        activeClinics: 0,
        activeLabs: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Función unificada que consulta la realidad de tu base de datos
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Obtener Órdenes de Supply
            const { data: supplyData, error: supplyError } = await supabase
                .from('supply_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (supplyError) throw supplyError;
            setSupplyOrders(supplyData || []);

            // 2. Obtener Suscripciones SaaS
            const { data: saasData, error: saasError } = await supabase
                .from('saas_subscriptions')
                .select('*');
            
            if (saasError) console.error("Aviso SaaS:", saasError);
            setSaasSubscriptions(saasData || []);

            // 3. Obtener Red de Laboratorios
            const { data: labData, error: labError } = await supabase
                .from('lab_network')
                .select('lab_id'); // Solo necesitamos contar cuántos hay por ahora
            
            if (labError) console.error("Aviso Labs:", labError);

            // 4. Calcular Métricas Reales
            const activeClinicsCount = saasData ? saasData.filter(s => s.status === 'active').length : 0;
            const totalSaasRev = saasData ? saasData.reduce((acc, sub) => acc + Number(sub.monthly_fee || 0), 0) : 0;
            const activeLabsCount = labData ? labData.length : 0;

            setMetrics({
                saasRevenue: totalSaasRev,
                activeClinics: activeClinicsCount,
                activeLabs: activeLabsCount
            });

        } catch (error) {
            console.error("Error obteniendo datos maestros:", error);
            notify("Error al cargar los datos del ecosistema.");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('supply_orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            notify("✅ Estado del pedido actualizado.");
            fetchDashboardData(); // Recargar todo para actualizar finanzas
        } catch (error) {
            console.error("Error actualizando pedido:", error);
            notify("Error al actualizar el pedido.");
        }
    };

    // Calculamos el dinero que ha entrado por venta de insumos
    const totalSupplyRevenue = supplyOrders.reduce((acc, order) => acc + Number(order.total_amount || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col pb-10">
            {/* ENCABEZADO PANEL MAESTRO */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Crown size={16} className="text-amber-500"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Nivel Acceso: Súper Administrador</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Central de Mando B2B</h2>
                </div>
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#312923] text-white shadow-md' : 'bg-white text-[#9A8F84] border border-[#DFD2C4] hover:border-[#A3968B]'}`}>
                    Resumen Global
                </button>
                <button onClick={() => setActiveTab('supply')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'supply' ? 'bg-[#312923] text-white shadow-md' : 'bg-white text-[#9A8F84] border border-[#DFD2C4] hover:border-[#A3968B]'}`}>
                    Ventas Supply
                </button>
                <button onClick={() => setActiveTab('saas')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'saas' ? 'bg-[#312923] text-white shadow-md' : 'bg-white text-[#9A8F84] border border-[#DFD2C4] hover:border-[#A3968B]'}`}>
                    Suscripciones SaaS
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                
                {/* --- VISTA: RESUMEN GLOBAL --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 bg-gradient-to-br from-[#312923] to-[#1a1512] text-white border-none shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/10 rounded-2xl"><TrendingUp size={24} className="text-amber-400"/></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">Proyección Mensual</span>
                                </div>
                                <p className="text-sm font-bold text-white/60 mb-1">Ingresos Totales (SaaS + Supply)</p>
                                <h3 className="text-4xl font-black tracking-tighter">
                                    ${(metrics.saasRevenue + totalSupplyRevenue).toLocaleString('es-CL')}
                                </h3>
                            </Card>

                            <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#5B6651]/10 rounded-2xl"><Building2 size={24} className="text-[#5B6651]"/></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-[#5B6651]/10 text-[#5B6651] px-3 py-1 rounded-full">Activas</span>
                                </div>
                                <p className="text-sm font-bold text-[#9A8F84] mb-1">Clínicas en Ecosistema</p>
                                <h3 className="text-4xl font-black text-[#312923] tracking-tighter">{metrics.activeClinics}</h3>
                            </Card>

                            <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl"><Package size={24} className="text-blue-500"/></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full">En Proceso</span>
                                </div>
                                <p className="text-sm font-bold text-[#9A8F84] mb-1">Pedidos Supply Pendientes</p>
                                <h3 className="text-4xl font-black text-[#312923] tracking-tighter">
                                    {supplyOrders.filter(o => o.status === 'pending').length}
                                </h3>
                            </Card>
                        </div>
                    </div>
                )}

                {/* --- VISTA: SUPPLY (LOGÍSTICA B2B) --- */}
                {activeTab === 'supply' && (
                    <Card className="p-8 bg-white border border-[#DFD2C4]/60 shadow-sm animate-in slide-in-from-bottom">
                        <div className="flex justify-between items-center mb-6 border-b border-[#DFD2C4]/50 pb-4">
                            <div>
                                <h3 className="font-black text-xl text-[#312923] flex items-center gap-2"><Package className="text-blue-500"/> Logística y Despachos</h3>
                                <p className="text-xs text-[#9A8F84] font-bold mt-1">Órdenes de reposición generadas por las clínicas.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-10 font-bold text-[#9A8F84]">Cargando órdenes...</div>
                        ) : supplyOrders.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-[#DFD2C4] rounded-3xl bg-[#FDFBF7]">
                                <p className="text-lg font-black text-[#A3968B]">Aún no hay pedidos.</p>
                                <p className="text-sm font-bold text-[#9A8F84] mt-2">Las órdenes aparecerán aquí cuando las clínicas presionen "Reabastecer".</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {supplyOrders.map(order => (
                                    <div key={order.id} className="p-5 border border-[#DFD2C4] rounded-2xl hover:border-[#A3968B] transition-all flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                    order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                }`}>
                                                    {order.status === 'pending' && <span className="flex items-center gap-1"><Clock size={10}/> Pendiente</span>}
                                                    {order.status === 'shipped' && <span className="flex items-center gap-1"><Truck size={10}/> Enviado</span>}
                                                    {order.status === 'delivered' && <span className="flex items-center gap-1"><CheckCircle size={10}/> Entregado</span>}
                                                </span>
                                                <span className="text-xs font-bold text-[#9A8F84]">{new Date(order.created_at).toLocaleDateString('es-CL')}</span>
                                            </div>
                                            <p className="font-black text-[#312923] text-lg">{order.admin_email}</p>
                                            <p className="text-sm font-bold text-[#5B6651] mb-1">
                                                {order.order_details?.quantity}x {order.order_details?.item_name}
                                            </p>
                                            {order.order_details?.phone_contact && (
                                                <p className="text-xs font-bold text-[#9A8F84]">📞 {order.order_details.phone_contact}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 bg-[#FDFBF7] p-2 rounded-xl border border-[#DFD2C4]/50">
                                            
                                            {/* BOTÓN DE WHATSAPP DIRECTO */}
                                            <button 
                                                onClick={() => {
                                                    const phone = order.order_details?.phone_contact || '';
                                                    if (!phone) {
                                                        notify("⚠️ Esta orden no tiene teléfono registrado.");
                                                        return;
                                                    }
                                                    const msg = `Hola! Soy Benjamín de ShiningCloud Supply. Recibí tu pedido de ${order.order_details?.quantity}x ${order.order_details?.item_name}. ¿Coordinamos el pago y envío?`;
                                                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                }}
                                                className="px-4 py-2 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#128C7E] transition-all flex items-center gap-1 shadow-sm"
                                            >
                                                <MessageCircle size={14}/> Contactar
                                            </button>

                                            {order.status === 'pending' && (
                                                <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="px-4 py-2 bg-[#312923] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all shadow-sm">
                                                    Marcar Enviado
                                                </button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="px-4 py-2 bg-[#5B6651] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#4a5442] transition-all shadow-sm">
                                                    Marcar Entregado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* --- VISTA: SAAS (Suscripciones) --- */}
                {activeTab === 'saas' && (
                    <Card className="p-8 bg-white border border-[#DFD2C4]/60 shadow-sm animate-in slide-in-from-bottom">
                        {saasSubscriptions.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-[#DFD2C4] rounded-3xl bg-[#FDFBF7]">
                                <Building2 size={48} className="mx-auto text-[#DFD2C4] mb-4"/>
                                <h3 className="font-black text-2xl text-[#312923]">Sin suscripciones activas</h3>
                                <p className="text-sm font-bold text-[#9A8F84] mt-2 max-w-md mx-auto">
                                    Aquí aparecerán las clínicas a medida que se integren y comiencen a pagar su mensualidad por el uso de ShiningCloud.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="font-black text-xl text-[#312923] mb-4">Clínicas Suscritas</h3>
                                {saasSubscriptions.map(sub => (
                                    <div key={sub.clinic_email} className="flex justify-between items-center p-4 border border-[#DFD2C4] rounded-xl bg-[#FDFBF7]">
                                        <div>
                                            <p className="font-black text-[#312923]">{sub.clinic_name}</p>
                                            <p className="text-xs font-bold text-[#9A8F84]">{sub.clinic_email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-[#5B6651]">${Number(sub.monthly_fee).toLocaleString('es-CL')}/mes</p>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                {sub.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

            </div>
        </div>
    );
}