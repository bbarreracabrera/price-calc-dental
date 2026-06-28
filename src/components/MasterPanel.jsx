import { useState, useEffect } from 'react';
import {
    Shield, DollarSign, Package, TrendingUp, Building2,
    CheckCircle, Clock, Truck, MessageCircle, Users, Zap,
    BarChart3, Globe, Star, AlertCircle, RefreshCw, Plus,
    ChevronRight, Beaker, FlaskConical, ArrowUpRight,
    CreditCard, Calendar, Activity, Target, Layers, Download,
    Send, Phone, Mail, Eye, EyeOff
} from 'lucide-react';
import { Card } from './UIComponents';

// ─── CONFIGURACIÓN DE ADMINISTRADOR ──────────────────────────────────────────
const ADMIN_EMAIL = 'bbarreracabrera@gmail.com'; // Tu email como dueño de ShiningCloud Supply

// ─── PLANES DE SUSCRIPCIÓN ────────────────────────────────────────────────────
const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 10000,
        color: 'from-[#5B6651] to-[#4a5442]',
        badge: 'bg-[#5B6651]/10 text-[#5B6651]',
        features: ['Hasta 200 pacientes', 'Agenda ilimitada', 'Odontograma + Voz', 'Soporte por WhatsApp'],
        target: 'Dentista independiente'
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 19900,
        color: 'from-[#312923] to-[#1a1512]',
        badge: 'bg-amber-100 text-amber-700',
        features: ['Pacientes ilimitados', 'Multi-doctor (hasta 3)', 'Laboratorio Digital', 'Finanzas + Rentabilidad', 'Recordatorios automáticos', 'Soporte prioritario'],
        target: 'Clínica pequeña/mediana',
        recommended: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 39900,
        color: 'from-blue-800 to-blue-950',
        badge: 'bg-blue-100 text-blue-700',
        features: ['Todo lo de Pro', 'Doctores ilimitados', 'Multi-sede', 'API personalizada', 'Onboarding dedicado', 'SLA garantizado'],
        target: 'Clínica grande / Red de clínicas'
    }
];

export default function MasterPanel({ supabase, notify, session }) {
    const [activeTab, setActiveTab] = useState('orders');
    const [supplyOrders, setSupplyOrders] = useState([]);
    const [saasSubscriptions, setSaasSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [providerList, setProviderList] = useState([
        { id: 1, name: 'Tienda Dental Centro', phone: '+56912345678', email: 'ventas@dentalcentro.cl' },
        { id: 2, name: 'Insumos Odontológicos Premium', phone: '+56987654321', email: 'pedidos@insumodental.cl' },
        { id: 3, name: 'Distribuidora Dental Sur', phone: '+56911223344', email: 'admin@dentalsur.cl' },
    ]);

    const isAdmin = session?.user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (isAdmin) fetchDashboardData();
        else setLoading(false);
    }, [session]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Obtener todas las órdenes de suministros
            const { data: orders, error: ordersError } = await supabase
                .from('supply_orders')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (ordersError && ordersError.code !== '42P01') throw ordersError;

            // Obtener todas las suscripciones
            const { data: subs, error: subsError } = await supabase
                .from('saas_subscriptions')
                .select('*');

            if (subsError && subsError.code !== '42P01') throw subsError;

            setSupplyOrders(orders || []);
            setSaasSubscriptions(subs || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            notify('Error al cargar los datos del panel.');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('supply_orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;
            notify(`Pedido marcado como ${newStatus}.`);
            fetchDashboardData();
        } catch (err) {
            console.error('Error updating order:', err);
            notify('Error al actualizar el pedido.');
        }
    };

    const exportOrderAsCSV = (order) => {
        const csv = `Orden de Compra\nID: ${order.id}\nFecha: ${new Date(order.created_at).toLocaleDateString('es-CL')}\nClínica: ${order.admin_email}\nEstado: ${order.status}\nMonto Total: $${Number(order.total_amount).toLocaleString('es-CL')}\nDetalles:\n${JSON.stringify(order.order_details, null, 2)}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orden_${order.id}.csv`;
        a.click();
        notify('Orden exportada correctamente.');
    };

    const sendToProvider = (order, provider) => {
        const message = `Nuevo pedido de suministros:\n\nClínica: ${order.admin_email}\nID Orden: ${order.id}\nMonto: $${Number(order.total_amount).toLocaleString('es-CL')}\nProducto: ${order.order_details?.item_name}\nCantidad: ${order.order_details?.quantity}\n\nPor favor confirmar disponibilidad y envío.`;
        
        const whatsappUrl = `https://wa.me/${provider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        notify('Abriendo WhatsApp con el proveedor...');
    };

    const getClinicInfo = (adminEmail) => {
        return saasSubscriptions.find(s => s.clinic_email === adminEmail);
    };

    const metrics = {
        totalOrders: supplyOrders.length,
        pendingOrders: supplyOrders.filter(o => o.status === 'pending').length,
        shippedOrders: supplyOrders.filter(o => o.status === 'shipped').length,
        deliveredOrders: supplyOrders.filter(o => o.status === 'delivered').length,
        totalRevenue: supplyOrders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + Number(o.total_amount || 0), 0),
        activeClinics: saasSubscriptions.filter(s => s.status === 'active').length,
    };

    const TABS = [
        { id: 'orders', label: 'Órdenes de Suministros', icon: Package },
        { id: 'clinics', label: 'Clínicas Suscritas', icon: Building2 },
        { id: 'providers', label: 'Proveedores', icon: Truck },
    ];

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E8]">
                <Shield size={48} className="text-[#9A8F84] mb-4" />
                <h2 className="text-2xl font-black text-[#312923] mb-2">Acceso Restringido</h2>
                <p className="text-[#9A8F84] text-center max-w-xs">Este panel está reservado exclusivamente para el administrador de ShiningCloud Supply.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin"><RefreshCw size={32} className="text-[#5B6651]" /></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E8] p-4 md:p-6 gap-4">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">ShiningCloud Supply · Centro de Operaciones</p>
                    <h1 className="text-3xl md:text-4xl font-black text-[#312923] tracking-tighter">Panel Maestro</h1>
                    <p className="text-xs font-bold text-[#9A8F84] mt-1">Gestión de órdenes y clínicas suscritas</p>
                </div>
                <button onClick={fetchDashboardData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] transition-all">
                    <RefreshCw size={12} /> Actualizar
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-[#312923] text-white shadow-md'
                                : 'bg-white text-[#9A8F84] border border-[#DFD2C4] hover:border-[#A3968B]'
                        }`}
                    >
                        <tab.icon size={13} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <Card className="p-4 bg-white border border-[#DFD2C4]/60 shadow-sm">
                        <p className="text-[10px] font-bold text-[#9A8F84] mb-1">Total Órdenes</p>
                        <h3 className="text-2xl md:text-3xl font-black text-[#312923]">{metrics.totalOrders}</h3>
                        <p className="text-[9px] font-bold text-amber-600 mt-1">{metrics.pendingOrders} pendientes</p>
                    </Card>

                    <Card className="p-4 bg-white border border-[#DFD2C4]/60 shadow-sm">
                        <p className="text-[10px] font-bold text-[#9A8F84] mb-1">Clínicas Activas</p>
                        <h3 className="text-2xl md:text-3xl font-black text-[#312923]">{metrics.activeClinics}</h3>
                        <p className="text-[9px] font-bold text-emerald-600 mt-1">{saasSubscriptions.length} total</p>
                    </Card>

                    <Card className="p-4 bg-white border border-[#DFD2C4]/60 shadow-sm">
                        <p className="text-[10px] font-bold text-[#9A8F84] mb-1">Ingresos Supply</p>
                        <h3 className="text-2xl md:text-3xl font-black text-[#312923]">${(metrics.totalRevenue / 1000).toFixed(0)}K</h3>
                        <p className="text-[9px] font-bold text-blue-600 mt-1">{metrics.deliveredOrders} entregas</p>
                    </Card>

                    <Card className="p-4 bg-white border border-[#DFD2C4]/60 shadow-sm">
                        <p className="text-[10px] font-bold text-[#9A8F84] mb-1">En Tránsito</p>
                        <h3 className="text-2xl md:text-3xl font-black text-[#312923]">{metrics.shippedOrders}</h3>
                        <p className="text-[9px] font-bold text-purple-600 mt-1">órdenes</p>
                    </Card>
                </div>

                {/* ÓRDENES */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <h3 className="font-black text-xl text-[#312923]">Órdenes de Suministros</h3>
                        {supplyOrders.length === 0 ? (
                            <Card className="p-12 text-center bg-white border border-[#DFD2C4]/60">
                                <Package size={36} className="mx-auto mb-3 text-[#9A8F84] opacity-30" />
                                <p className="font-bold text-[#9A8F84]">No hay órdenes aún</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {supplyOrders.map(order => (
                                    <Card key={order.id} className="p-4 bg-white border border-[#DFD2C4]/60 hover:border-[#A3968B] transition-all cursor-pointer" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}>
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-black text-[#312923]">Orden #{order.id}</p>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                        order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    }`}>
                                                        {order.status === 'pending' ? 'Pendiente' : order.status === 'shipped' ? 'Enviado' : 'Entregado'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-[#9A8F84]">Clínica: {order.admin_email}</p>
                                                <p className="text-xs font-bold text-[#9A8F84]">Producto: {order.order_details?.item_name} (x{order.order_details?.quantity})</p>
                                                <p className="text-[10px] font-bold text-[#9A8F84] mt-1">{new Date(order.created_at).toLocaleDateString('es-CL')}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <p className="font-black text-[#312923] text-lg">${Number(order.total_amount).toLocaleString('es-CL')}</p>
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); exportOrderAsCSV(order); }} className="p-2 bg-[#5B6651]/10 text-[#5B6651] rounded-lg hover:bg-[#5B6651]/20 transition-all" title="Descargar orden">
                                                        <Download size={14} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShowProviderModal(true); }} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all" title="Enviar a proveedor">
                                                        <Send size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CLÍNICAS */}
                {activeTab === 'clinics' && (
                    <div className="space-y-4">
                        <h3 className="font-black text-xl text-[#312923]">Clínicas Suscritas</h3>
                        {saasSubscriptions.length === 0 ? (
                            <Card className="p-12 text-center bg-white border border-[#DFD2C4]/60">
                                <Building2 size={36} className="mx-auto mb-3 text-[#9A8F84] opacity-30" />
                                <p className="font-bold text-[#9A8F84]">No hay clínicas suscritas</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {saasSubscriptions.map((sub, i) => (
                                    <Card key={i} className="p-4 bg-white border border-[#DFD2C4]/60">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                                            <div className="flex-1">
                                                <p className="font-black text-[#312923]">{sub.clinic_name}</p>
                                                <p className="text-xs font-bold text-[#9A8F84]">{sub.clinic_email}</p>
                                                <p className="text-[10px] font-bold text-[#9A8F84] mt-1">Plan: {sub.plan} • ${Number(sub.monthly_fee).toLocaleString('es-CL')}/mes</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                    sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                    {sub.status === 'active' ? 'Activa' : 'Trial'}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* PROVEEDORES */}
                {activeTab === 'providers' && (
                    <div className="space-y-4">
                        <h3 className="font-black text-xl text-[#312923]">Proveedores Convenio</h3>
                        <div className="space-y-3">
                            {providerList.map(provider => (
                                <Card key={provider.id} className="p-4 bg-white border border-[#DFD2C4]/60">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                                        <div className="flex-1">
                                            <p className="font-black text-[#312923]">{provider.name}</p>
                                            <div className="flex flex-col gap-1 mt-2">
                                                <a href={`tel:${provider.phone}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                                    <Phone size={12} /> {provider.phone}
                                                </a>
                                                <a href={`mailto:${provider.email}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                                    <Mail size={12} /> {provider.email}
                                                </a>
                                            </div>
                                        </div>
                                        <button onClick={() => window.open(`https://wa.me/${provider.phone.replace(/[^0-9]/g, '')}`, '_blank')} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-600 transition-all">
                                            WhatsApp
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE DETALLES DE ORDEN */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-2xl p-6 bg-white rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-black text-xl text-[#312923]">Orden #{selectedOrder.id}</h3>
                                <p className="text-xs font-bold text-[#9A8F84]">{new Date(selectedOrder.created_at).toLocaleDateString('es-CL')}</p>
                            </div>
                            <button onClick={() => setShowOrderDetails(false)} className="text-[#9A8F84] hover:text-[#312923]">✕</button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#9A8F84]">Clínica</p>
                                    <p className="font-bold text-[#312923]">{selectedOrder.admin_email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#9A8F84]">Estado</p>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-block ${
                                        selectedOrder.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                        selectedOrder.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    }`}>
                                        {selectedOrder.status === 'pending' ? 'Pendiente' : selectedOrder.status === 'shipped' ? 'Enviado' : 'Entregado'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#9A8F84]">Producto</p>
                                    <p className="font-bold text-[#312923]">{selectedOrder.order_details?.item_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#9A8F84]">Cantidad</p>
                                    <p className="font-bold text-[#312923]">{selectedOrder.order_details?.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#9A8F84]">Monto Total</p>
                                    <p className="font-black text-lg text-[#312923]">${Number(selectedOrder.total_amount).toLocaleString('es-CL')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#9A8F84]">Contacto</p>
                                    <a href={`tel:${selectedOrder.order_details?.phone_contact}`} className="font-bold text-blue-600 hover:underline">{selectedOrder.order_details?.phone_contact}</a>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            {selectedOrder.status !== 'shipped' && (
                                <button onClick={() => { updateOrderStatus(selectedOrder.id, 'shipped'); setShowOrderDetails(false); }} className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-600 transition-all">
                                    Marcar Enviado
                                </button>
                            )}
                            {selectedOrder.status !== 'delivered' && (
                                <button onClick={() => { updateOrderStatus(selectedOrder.id, 'delivered'); setShowOrderDetails(false); }} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-600 transition-all">
                                    Marcar Entregado
                                </button>
                            )}
                            <button onClick={() => exportOrderAsCSV(selectedOrder)} className="px-4 py-2 bg-[#5B6651] text-white text-[10px] font-black uppercase rounded-lg hover:bg-[#4a5442] transition-all">
                                Descargar
                            </button>
                            <button onClick={() => setShowOrderDetails(false)} className="px-4 py-2 bg-[#DFD2C4]/30 text-[#312923] text-[10px] font-black uppercase rounded-lg hover:bg-[#DFD2C4]/50 transition-all">
                                Cerrar
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* MODAL DE ENVÍO A PROVEEDOR */}
            {showProviderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6 bg-white rounded-2xl">
                        <h3 className="font-black text-xl text-[#312923] mb-4">Enviar a Proveedor</h3>
                        <p className="text-sm font-bold text-[#9A8F84] mb-4">Selecciona el proveedor para enviar los detalles de la orden:</p>
                        <div className="space-y-2 mb-6">
                            {providerList.map(provider => (
                                <button key={provider.id} onClick={() => { sendToProvider(selectedOrder, provider); setShowProviderModal(false); }} className="w-full p-3 text-left border border-[#DFD2C4] rounded-lg hover:bg-[#FDFBF7] transition-all">
                                    <p className="font-bold text-[#312923]">{provider.name}</p>
                                    <p className="text-xs font-bold text-[#9A8F84]">{provider.phone}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowProviderModal(false)} className="w-full px-4 py-2 bg-[#DFD2C4]/30 text-[#312923] text-[10px] font-black uppercase rounded-lg hover:bg-[#DFD2C4]/50 transition-all">
                            Cancelar
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
}
