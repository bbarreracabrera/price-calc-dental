import React, { useState, useEffect } from 'react';
import {
    Shield, DollarSign, Package, TrendingUp, Building2,
    CheckCircle, Clock, Truck, MessageCircle, Users, Zap,
    BarChart3, Globe, Star, AlertCircle, RefreshCw, Plus,
    ChevronRight, Beaker, FlaskConical, ArrowUpRight,
    CreditCard, Calendar, Activity, Target, Layers
} from 'lucide-react';
import { Card } from './UIComponents';

// ─── DATOS DEMO PARA CUANDO LAS TABLAS AÚN NO EXISTEN ───────────────────────
const DEMO_SUBS = [
    { clinic_name: 'Clínica Dental Providencia', clinic_email: 'providencia@dental.cl', monthly_fee: 10000, status: 'active', plan: 'Pro', joined: '2026-04-01', patients: 142 },
    { clinic_name: 'Centro Odontológico Maipú', clinic_email: 'maipu@dental.cl', monthly_fee: 10000, status: 'active', plan: 'Pro', joined: '2026-04-15', patients: 89 },
    { clinic_name: 'Dra. Valentina Rojas', clinic_email: 'vrojas@dental.cl', monthly_fee: 10000, status: 'trial', plan: 'Trial', joined: '2026-06-10', patients: 12 },
];

const DEMO_SUPPLY = [
    { id: 1, admin_email: 'providencia@dental.cl', status: 'pending', created_at: '2026-06-14T10:00:00', total_amount: 45000, order_details: { item_name: 'Resina A2 (Caja x10)', quantity: 2, phone_contact: '+56912345678' } },
    { id: 2, admin_email: 'maipu@dental.cl', status: 'shipped', created_at: '2026-06-12T09:00:00', total_amount: 28000, order_details: { item_name: 'Anestesia Articaína 4%', quantity: 5, phone_contact: '+56987654321' } },
    { id: 3, admin_email: 'vrojas@dental.cl', status: 'delivered', created_at: '2026-06-08T14:00:00', total_amount: 15000, order_details: { item_name: 'Guantes Nitrilo M (Caja)', quantity: 1, phone_contact: '+56911223344' } },
];

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

// ─── CATÁLOGO SUPPLY (PRODUCTOS DEMO) ─────────────────────────────────────────
const SUPPLY_CATALOG = [
    { category: 'Resinas y Composite', items: ['Resina Filtek Z350 A2', 'Resina Bulk Fill', 'Composite Enamel', 'Adhesivo Single Bond'] },
    { category: 'Anestesia', items: ['Articaína 4% con Epinefrina', 'Lidocaína 2%', 'Mepivacaína 3%'] },
    { category: 'Insumos Básicos', items: ['Guantes Nitrilo (M/L/XL)', 'Mascarillas 3 capas', 'Baberos desechables', 'Vasos desechables'] },
    { category: 'Endodoncia', items: ['Limas K-File', 'Hipoclorito 5.25%', 'EDTA 17%', 'Conos de Gutapercha'] },
];

export default function MasterPanel({ supabase, notify }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [supplyOrders, setSupplyOrders] = useState([]);
    const [saasSubscriptions, setSaasSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingDemo, setUsingDemo] = useState(false);
    const [showSupplyVision, setShowSupplyVision] = useState(false);
    const [showAddSub, setShowAddSub] = useState(false);
    const [newSub, setNewSub] = useState({ clinic_name: '', clinic_email: '', plan: 'starter', monthly_fee: 10000 });

    const [metrics, setMetrics] = useState({
        saasRevenue: 0,
        activeClinics: 0,
        trialClinics: 0,
        activeLabs: 0,
        supplyRevenue: 0,
        pendingOrders: 0,
        mrr: 0,
        arr: 0,
    });

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        let supplyData = [], saasData = [], labCount = 0, usedDemo = false;

        // 1. Supply Orders
        try {
            const { data, error } = await supabase.from('supply_orders').select('*').is('deleted_at', null).order('id', { ascending: false });
            if (error && error.code !== '42P01') throw error;
            supplyData = data || [];
        } catch { supplyData = []; }

        // 2. SaaS Subscriptions
        try {
            const { data, error } = await supabase.from('saas_subscriptions').select('*');
            if (error && error.code !== '42P01') throw error;
            saasData = data || [];
        } catch { saasData = []; }

        // 3. Lab Network
        try {
            const { data, error } = await supabase.from('lab_network').select('lab_id');
            if (error && error.code !== '42P01') throw error;
            labCount = data?.length || 0;
        } catch { labCount = 0; }

        // Si no hay datos reales, mostrar demo
        if (saasData.length === 0 && supplyData.length === 0) {
            saasData = DEMO_SUBS;
            supplyData = DEMO_SUPPLY;
            usedDemo = true;
        }

        setUsingDemo(usedDemo);
        setSupplyOrders(supplyData);
        setSaasSubscriptions(saasData);

        const activeSubs = saasData.filter(s => s.status === 'active');
        const trialSubs = saasData.filter(s => s.status === 'trial');
        const mrr = activeSubs.reduce((acc, s) => acc + Number(s.monthly_fee || 0), 0);
        const supplyRev = supplyData.filter(o => o.status === 'delivered').reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

        setMetrics({
            saasRevenue: mrr,
            activeClinics: activeSubs.length,
            trialClinics: trialSubs.length,
            activeLabs: labCount,
            supplyRevenue: supplyRev,
            pendingOrders: supplyData.filter(o => o.status === 'pending').length,
            mrr,
            arr: mrr * 12,
        });
        setLoading(false);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        if (usingDemo) { notify('Modo demo: conecta Supabase para actualizar pedidos reales.', 'info'); return; }
        try {
            const { error } = await supabase.from('supply_orders').update({ status: newStatus }).eq('id', orderId);
            if (error) throw error;
            notify('Estado actualizado correctamente.');
            fetchDashboardData();
        } catch { notify('Error al actualizar el pedido.'); }
    };

    const addSubscription = async () => {
        if (!newSub.clinic_name || !newSub.clinic_email) { notify('Completa nombre y email de la clínica.'); return; }
        if (usingDemo) { notify('Modo demo: conecta Supabase para agregar suscripciones reales.', 'info'); return; }
        try {
            const { error } = await supabase.from('saas_subscriptions').insert([{ ...newSub, status: 'active', joined: new Date().toISOString() }]);
            if (error) throw error;
            notify(`Clínica ${newSub.clinic_name} agregada.`);
            setShowAddSub(false);
            setNewSub({ clinic_name: '', clinic_email: '', plan: 'starter', monthly_fee: 10000 });
            fetchDashboardData();
        } catch { notify('Error al agregar la suscripción.'); }
    };

    const totalSupplyRevenue = supplyOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

    const TABS = [
        { id: 'overview', label: 'Resumen Global', icon: BarChart3 },
        { id: 'saas', label: 'Suscripciones', icon: CreditCard },
        { id: 'supply', label: 'ShiningCloud Supply', icon: Package },
        { id: 'plans', label: 'Planes & Precios', icon: Layers },
    ];

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-10">

            {/* ── ENCABEZADO ── */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-[#5B6651]"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Súper Administrador · ShiningCloud HQ</p>
                    </div>
                    <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Central de Mando</h2>
                    <p className="text-xs font-bold text-[#9A8F84] mt-1">Ecosistema ShiningCloud Dental + Supply</p>
                </div>
                <div className="flex items-center gap-3">
                    {usingDemo && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                            <AlertCircle size={13} className="text-amber-600"/>
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Modo Demo</span>
                        </div>
                    )}
                    <button onClick={fetchDashboardData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DFD2C4] bg-white text-[#9A8F84] text-[10px] font-black uppercase tracking-widest hover:bg-[#FDFBF7] transition-all">
                        <RefreshCw size={12}/> Actualizar
                    </button>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 shrink-0">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id ? 'bg-[#312923] text-white shadow-md' : 'bg-white text-[#9A8F84] border border-[#DFD2C4] hover:border-[#A3968B]'
                        }`}
                    >
                        <tab.icon size={13}/> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">

                {/* ══════════════════════════════════════════
                    RESUMEN GLOBAL
                ══════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">

                        {/* KPIs principales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-5 bg-gradient-to-br from-[#312923] to-[#1a1512] text-white border-none shadow-xl col-span-2">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2.5 bg-white/10 rounded-xl"><TrendingUp size={20} className="text-amber-400"/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">MRR</span>
                                </div>
                                <p className="text-xs font-bold text-white/60 mb-1">Ingresos Recurrentes Mensuales</p>
                                <h3 className="text-3xl font-black tracking-tighter">${(metrics.mrr + totalSupplyRevenue).toLocaleString('es-CL')}</h3>
                                <p className="text-[10px] font-bold text-white/40 mt-1">ARR proyectado: ${(metrics.arr).toLocaleString('es-CL')}</p>
                            </Card>

                            <Card className="p-5 bg-white border border-[#DFD2C4]/60 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2.5 bg-[#5B6651]/10 rounded-xl"><Building2 size={18} className="text-[#5B6651]"/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">Activas</span>
                                </div>
                                <p className="text-xs font-bold text-[#9A8F84] mb-1">Clínicas</p>
                                <h3 className="text-3xl font-black text-[#312923] tracking-tighter">{metrics.activeClinics}</h3>
                                {metrics.trialClinics > 0 && <p className="text-[10px] font-bold text-amber-600 mt-1">+{metrics.trialClinics} en trial</p>}
                            </Card>

                            <Card className="p-5 bg-white border border-[#DFD2C4]/60 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl"><Package size={18} className="text-blue-500"/></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-full">Supply</span>
                                </div>
                                <p className="text-xs font-bold text-[#9A8F84] mb-1">Pedidos Pendientes</p>
                                <h3 className="text-3xl font-black text-[#312923] tracking-tighter">{metrics.pendingOrders}</h3>
                                <p className="text-[10px] font-bold text-[#9A8F84] mt-1">Total Supply: ${totalSupplyRevenue.toLocaleString('es-CL')}</p>
                            </Card>
                        </div>

                        {/* Desglose por rama */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SaaS */}
                            <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DFD2C4]/50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-[#5B6651]/10 rounded-xl"><Zap size={16} className="text-[#5B6651]"/></div>
                                        <div>
                                            <h4 className="font-black text-[#312923] text-sm">ShiningCloud Dental</h4>
                                            <p className="text-[10px] font-bold text-[#9A8F84]">Software SaaS</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveTab('saas')} className="text-[10px] font-black text-[#5B6651] flex items-center gap-1 hover:underline">
                                        Ver detalle <ChevronRight size={11}/>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#9A8F84]">Ingresos mensuales</span>
                                        <span className="font-black text-[#312923]">${metrics.saasRevenue.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#9A8F84]">Clínicas activas</span>
                                        <span className="font-black text-[#312923]">{metrics.activeClinics}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#9A8F84]">Ticket promedio</span>
                                        <span className="font-black text-[#312923]">${metrics.activeClinics > 0 ? Math.round(metrics.saasRevenue / metrics.activeClinics).toLocaleString('es-CL') : 0}</span>
                                    </div>
                                    {/* Barra de progreso hacia meta */}
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Meta: 50 clínicas</span>
                                            <span className="text-[10px] font-black text-[#5B6651]">{Math.round((metrics.activeClinics / 50) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-[#DFD2C4]/40 rounded-full h-2">
                                            <div className="bg-[#5B6651] h-2 rounded-full transition-all" style={{ width: `${Math.min((metrics.activeClinics / 50) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Supply */}
                            <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DFD2C4]/50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-xl"><Package size={16} className="text-blue-500"/></div>
                                        <div>
                                            <h4 className="font-black text-[#312923] text-sm">ShiningCloud Supply</h4>
                                            <p className="text-[10px] font-bold text-[#9A8F84]">Distribución de Insumos</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveTab('supply')} className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline">
                                        Ver detalle <ChevronRight size={11}/>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#9A8F84]">Ingresos entregados</span>
                                        <span className="font-black text-[#312923]">${metrics.supplyRevenue.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#9A8F84]">Pedidos pendientes</span>
                                        <span className="font-black text-amber-600">{metrics.pendingOrders}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#9A8F84]">Total facturado</span>
                                        <span className="font-black text-[#312923]">${totalSupplyRevenue.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest">Meta: $500.000/mes</span>
                                            <span className="text-[10px] font-black text-blue-600">{Math.round((totalSupplyRevenue / 500000) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-[#DFD2C4]/40 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((totalSupplyRevenue / 500000) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Próximos hitos */}
                        <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                            <h4 className="font-black text-[#312923] mb-4 flex items-center gap-2"><Target size={16} className="text-[#5B6651]"/> Hoja de Ruta — Próximos Hitos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { milestone: '10 clínicas activas', desc: 'Validación de mercado', status: metrics.activeClinics >= 10 ? 'done' : 'pending', progress: Math.min(metrics.activeClinics / 10 * 100, 100) },
                                    { milestone: 'Lanzar Supply', desc: 'Primera venta de insumos', status: totalSupplyRevenue > 0 ? 'done' : 'pending', progress: totalSupplyRevenue > 0 ? 100 : 0 },
                                    { milestone: '$500K MRR', desc: 'Break-even operacional', status: metrics.mrr >= 500000 ? 'done' : 'pending', progress: Math.min(metrics.mrr / 500000 * 100, 100) },
                                ].map((h, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border ${h.status === 'done' ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FDFBF7] border-[#DFD2C4]/50'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {h.status === 'done'
                                                ? <CheckCircle size={14} className="text-emerald-500"/>
                                                : <Clock size={14} className="text-amber-500"/>
                                            }
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">{h.status === 'done' ? 'Completado' : 'En progreso'}</span>
                                        </div>
                                        <p className="font-black text-[#312923] text-sm mb-1">{h.milestone}</p>
                                        <p className="text-[10px] font-bold text-[#9A8F84] mb-2">{h.desc}</p>
                                        <div className="w-full bg-[#DFD2C4]/40 rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${h.status === 'done' ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${h.progress}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    SUSCRIPCIONES SAAS
                ══════════════════════════════════════════ */}
                {activeTab === 'saas' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-xl text-[#312923]">Clínicas Suscritas</h3>
                                <p className="text-xs font-bold text-[#9A8F84] mt-0.5">{saasSubscriptions.length} clínicas en el ecosistema</p>
                            </div>
                            <button onClick={() => setShowAddSub(!showAddSub)} className="flex items-center gap-2 px-4 py-2.5 bg-[#312923] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1a1512] transition-all shadow-md">
                                <Plus size={13}/> Agregar Clínica
                            </button>
                        </div>

                        {/* Formulario agregar clínica */}
                        {showAddSub && (
                            <Card className="p-6 bg-[#FDFBF7] border border-[#DFD2C4]/60 shadow-sm animate-in slide-in-from-top-2">
                                <h4 className="font-black text-[#312923] mb-4">Nueva Suscripción Manual</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1 block">Nombre de la Clínica</label>
                                        <input value={newSub.clinic_name} onChange={e => setNewSub({...newSub, clinic_name: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-[#DFD2C4] bg-white outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm"
                                            placeholder="Clínica Dental Ejemplo"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1 block">Email de Contacto</label>
                                        <input value={newSub.clinic_email} onChange={e => setNewSub({...newSub, clinic_email: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-[#DFD2C4] bg-white outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm"
                                            placeholder="clinica@ejemplo.cl"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1 block">Plan</label>
                                        <select value={newSub.plan} onChange={e => {
                                            const plan = PLANS.find(p => p.id === e.target.value);
                                            setNewSub({...newSub, plan: e.target.value, monthly_fee: plan?.price || 10000});
                                        }} className="w-full p-3 rounded-xl border border-[#DFD2C4] bg-white outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm">
                                            {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price.toLocaleString('es-CL')}/mes</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1 block">Tarifa Mensual (CLP)</label>
                                        <input type="number" value={newSub.monthly_fee} onChange={e => setNewSub({...newSub, monthly_fee: Number(e.target.value)})}
                                            className="w-full p-3 rounded-xl border border-[#DFD2C4] bg-white outline-none font-bold text-[#312923] focus:border-[#5B6651] text-sm"/>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={addSubscription} className="px-6 py-2.5 bg-[#5B6651] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#4a5442] transition-all">Guardar</button>
                                    <button onClick={() => setShowAddSub(false)} className="px-6 py-2.5 bg-white border border-[#DFD2C4] text-[#9A8F84] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#FDFBF7] transition-all">Cancelar</button>
                                </div>
                            </Card>
                        )}

                        {/* Lista de suscripciones */}
                        <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                            {saasSubscriptions.length === 0 ? (
                                <div className="text-center py-12 text-[#9A8F84]">
                                    <Building2 size={36} className="mx-auto mb-3 opacity-30"/>
                                    <p className="font-bold text-sm">No hay clínicas suscritas aún</p>
                                    <p className="text-xs mt-1">¡Agrega tu primera clínica para comenzar!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {saasSubscriptions.map((sub, i) => (
                                        <div key={i} className="flex flex-col md:flex-row justify-between md:items-center p-4 border border-[#DFD2C4]/60 rounded-2xl bg-[#FDFBF7] hover:border-[#A3968B] transition-all gap-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-[#5B6651]/10 flex items-center justify-center text-[#5B6651] font-black text-lg shrink-0">
                                                    {sub.clinic_name?.[0]?.toUpperCase() || 'C'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#312923]">{sub.clinic_name}</p>
                                                    <p className="text-xs font-bold text-[#9A8F84]">{sub.clinic_email}</p>
                                                    {sub.joined && <p className="text-[10px] font-bold text-[#9A8F84]">Desde: {new Date(sub.joined).toLocaleDateString('es-CL')}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {sub.patients !== undefined && (
                                                    <div className="text-center px-3 py-1.5 bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-xl">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">Pacientes</p>
                                                        <p className="font-black text-[#312923] text-sm">{sub.patients}</p>
                                                    </div>
                                                )}
                                                <div className="text-right">
                                                    <p className="font-black text-[#5B6651] text-lg">${Number(sub.monthly_fee).toLocaleString('es-CL')}<span className="text-[10px] font-bold text-[#9A8F84]">/mes</span></p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                                        sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                        sub.status === 'trial' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        'bg-red-50 text-red-600 border-red-200'
                                                    }`}>
                                                        {sub.status === 'active' ? '● Activa' : sub.status === 'trial' ? '◐ Trial' : '○ Inactiva'}
                                                    </span>
                                                </div>
                                                <button onClick={() => {
                                                    const msg = `Hola ${sub.clinic_name}! Soy Benjamín de ShiningCloud. ¿Cómo va todo con la plataforma?`;
                                                    window.open(`mailto:${sub.clinic_email}?subject=ShiningCloud Dental - Seguimiento&body=${encodeURIComponent(msg)}`, '_blank');
                                                }} className="p-2 bg-[#5B6651]/10 text-[#5B6651] rounded-xl hover:bg-[#5B6651]/20 transition-all">
                                                    <MessageCircle size={15}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Resumen financiero SaaS */}
                        <Card className="p-6 bg-gradient-to-br from-[#312923] to-[#1a1512] text-white border-none shadow-xl">
                            <h4 className="font-black text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-amber-400"/> Proyección Financiera SaaS</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'MRR Actual', value: `$${metrics.mrr.toLocaleString('es-CL')}` },
                                    { label: 'ARR Proyectado', value: `$${metrics.arr.toLocaleString('es-CL')}` },
                                    { label: 'Clínicas Activas', value: metrics.activeClinics },
                                    { label: 'En Trial', value: metrics.trialClinics },
                                ].map((kpi, i) => (
                                    <div key={i} className="bg-white/10 rounded-2xl p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{kpi.label}</p>
                                        <p className="font-black text-2xl text-white">{kpi.value}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    SHININGCLOUD SUPPLY
                ══════════════════════════════════════════ */}
                {activeTab === 'supply' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">

                        {/* Visión estratégica */}
                        <Card className="p-6 bg-gradient-to-br from-blue-900 to-blue-950 text-white border-none shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package size={18} className="text-blue-300"/>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Rama Independiente</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">ShiningCloud Supply</h3>
                                    <p className="text-sm font-bold text-blue-200 leading-relaxed max-w-xl">
                                        Distribuidora de insumos dentales que opera dentro del ecosistema ShiningCloud. 
                                        Las clínicas solicitan insumos directamente desde su panel de control, 
                                        y tú los despachas. <strong className="text-white">Sin intermediarios, sin catálogos físicos.</strong>
                                    </p>
                                </div>
                                <button onClick={() => setShowSupplyVision(!showSupplyVision)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all whitespace-nowrap">
                                    {showSupplyVision ? 'Ocultar' : 'Ver Modelo'} <ChevronRight size={11}/>
                                </button>
                            </div>
                        </Card>

                        {/* Modelo de negocio Supply */}
                        {showSupplyVision && (
                            <Card className="p-6 bg-white border border-blue-200 shadow-sm animate-in slide-in-from-top-2">
                                <h4 className="font-black text-[#312923] mb-4 flex items-center gap-2"><Target size={16} className="text-blue-600"/> Modelo de Negocio Supply</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {[
                                        { step: '1', title: 'Clínica Solicita', desc: 'El dentista ve que su stock de Resina A2 está bajo. Con un clic desde ShiningCloud, genera una orden de reposición.', icon: Building2, color: 'bg-blue-50 border-blue-200 text-blue-600' },
                                        { step: '2', title: 'Tú Coordinas', desc: 'Ves la orden aquí en el Panel Maestro. Contactas al proveedor o despachas desde tu stock. Marcas el pedido como "Enviado".', icon: Package, color: 'bg-amber-50 border-amber-200 text-amber-600' },
                                        { step: '3', title: 'Entrega y Cobro', desc: 'La clínica recibe los insumos. Marcas "Entregado". El cobro se gestiona por transferencia o MercadoPago.', icon: CheckCircle, color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
                                    ].map((s, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border ${s.color.split(' ').slice(0,2).join(' ')}`}>
                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm mb-3 ${s.color}`}>{s.step}</div>
                                            <h5 className="font-black text-[#312923] mb-1">{s.title}</h5>
                                            <p className="text-xs font-bold text-[#6B615A] leading-relaxed">{s.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl p-4">
                                    <h5 className="font-black text-[#312923] mb-3 text-sm">Catálogo Inicial Sugerido</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {SUPPLY_CATALOG.map((cat, i) => (
                                            <div key={i}>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#5B6651] mb-1">{cat.category}</p>
                                                {cat.items.map((item, j) => (
                                                    <p key={j} className="text-[11px] font-bold text-[#6B615A] py-0.5">· {item}</p>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Pedidos */}
                        <Card className="p-6 bg-white border border-[#DFD2C4]/60 shadow-sm">
                            <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#DFD2C4]/50">
                                <div>
                                    <h3 className="font-black text-xl text-[#312923] flex items-center gap-2"><Truck size={18} className="text-blue-500"/> Órdenes de Despacho</h3>
                                    <p className="text-xs font-bold text-[#9A8F84] mt-0.5">Pedidos generados por las clínicas del ecosistema</p>
                                </div>
                                <div className="flex gap-2">
                                    {['pending', 'shipped', 'delivered'].map(status => (
                                        <div key={status} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                            status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        }`}>
                                            {supplyOrders.filter(o => o.status === status).length} {status === 'pending' ? 'Pendientes' : status === 'shipped' ? 'Enviados' : 'Entregados'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-10 font-bold text-[#9A8F84]">Cargando órdenes...</div>
                            ) : supplyOrders.length === 0 ? (
                                <div className="text-center py-12 text-[#9A8F84]">
                                    <Package size={36} className="mx-auto mb-3 opacity-30"/>
                                    <p className="font-bold text-sm">No hay pedidos aún</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {supplyOrders.map(order => (
                                        <div key={order.id} className="p-5 border border-[#DFD2C4] rounded-2xl hover:border-[#A3968B] transition-all flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                                                        order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    }`}>
                                                        {order.status === 'pending' && <><Clock size={9}/> Pendiente</>}
                                                        {order.status === 'shipped' && <><Truck size={9}/> Enviado</>}
                                                        {order.status === 'delivered' && <><CheckCircle size={9}/> Entregado</>}
                                                    </span>
                                                    <span className="text-xs font-bold text-[#9A8F84]">{new Date(order.created_at).toLocaleDateString('es-CL')}</span>
                                                </div>
                                                <p className="font-black text-[#312923]">{order.admin_email}</p>
                                                <p className="text-sm font-bold text-[#5B6651]">{order.order_details?.quantity}x {order.order_details?.item_name}</p>
                                                <p className="text-sm font-black text-[#312923] mt-1">${Number(order.total_amount || 0).toLocaleString('es-CL')}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button onClick={() => {
                                                    const phone = order.order_details?.phone_contact || '';
                                                    if (!phone) { notify('Sin teléfono registrado.', 'info'); return; }
                                                    const msg = `Hola! Soy Benjamín de ShiningCloud Supply. Recibí tu pedido de ${order.order_details?.quantity}x ${order.order_details?.item_name}. ¿Coordinamos el envío?`;
                                                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                }} className="px-4 py-2 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#128C7E] transition-all flex items-center gap-1.5 shadow-sm">
                                                    <MessageCircle size={13}/> WhatsApp
                                                </button>
                                                {order.status === 'pending' && (
                                                    <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-sm">
                                                        Marcar Enviado
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="px-4 py-2 bg-[#5B6651] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#4a5442] transition-all shadow-sm">
                                                        Marcar Entregado
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    PLANES & PRECIOS
                ══════════════════════════════════════════ */}
                {activeTab === 'plans' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">
                        <div>
                            <h3 className="font-black text-xl text-[#312923]">Planes de Suscripción</h3>
                            <p className="text-xs font-bold text-[#9A8F84] mt-0.5">Estructura de precios actual de ShiningCloud Dental</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PLANS.map(plan => (
                                <Card key={plan.id} className={`p-6 border shadow-sm relative overflow-hidden ${plan.recommended ? 'border-[#312923] shadow-xl' : 'border-[#DFD2C4]/60'}`}>
                                    {plan.recommended && (
                                        <div className="absolute top-0 right-0 bg-[#312923] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl flex items-center gap-1">
                                            <Star size={9}/> Recomendado
                                        </div>
                                    )}
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${plan.badge}`}>
                                        {plan.name}
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-3xl font-black text-[#312923]">${plan.price.toLocaleString('es-CL')}</span>
                                        <span className="text-xs font-bold text-[#9A8F84]">/mes</span>
                                    </div>
                                    <p className="text-xs font-bold text-[#9A8F84] mb-4">{plan.target}</p>
                                    <div className="space-y-2 mb-6">
                                        {plan.features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <CheckCircle size={13} className="text-[#5B6651] shrink-0"/>
                                                <span className="text-xs font-bold text-[#6B615A]">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-[#DFD2C4]/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">
                                            {saasSubscriptions.filter(s => s.plan === plan.id || s.monthly_fee === plan.price).length} clínicas en este plan
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Card className="p-6 bg-[#FDFBF7] border border-[#DFD2C4]/60 shadow-sm">
                            <h4 className="font-black text-[#312923] mb-3 flex items-center gap-2"><Globe size={16} className="text-[#5B6651]"/> Nota Estratégica de Precios</h4>
                            <p className="text-sm font-bold text-[#6B615A] leading-relaxed">
                                El plan <strong>Starter a $10.000/mes</strong> es tu gancho de entrada al mercado. 
                                La estrategia de crecimiento es convertir a los usuarios Starter en Pro una vez que 
                                su clínica crezca y necesite más doctores o la integración con laboratorio. 
                                El plan <strong>Enterprise</strong> es para clínicas con múltiples sedes o redes odontológicas.
                            </p>
                        </Card>
                    </div>
                )}

            </div>
        </div>
    );
}
