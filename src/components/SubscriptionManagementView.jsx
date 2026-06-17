import React, { useState } from 'react';
import { CreditCard, Users, TrendingUp, AlertCircle, CheckCircle, Clock, Zap, Plus } from 'lucide-react';
import { Card } from './UIComponents';

const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 10000,
    users: 1,
    features: ['Ficha Clínica Básica', 'Agenda', 'Reportes Simples'],
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 25000,
    users: 5,
    features: ['Todo Starter +', 'Odontograma Avanzado', 'Análisis Financiero', 'Supply Integrado'],
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 50000,
    users: 'Ilimitados',
    features: ['Todo Professional +', 'API Acceso', 'Soporte Prioritario', 'Integraciones Personalizadas'],
    color: 'bg-purple-50 border-purple-200'
  }
];

export default function SubscriptionManagementView({ subscriptions = [], clinics = [] }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Estadísticas de suscripciones
  const stats = {
    totalClinics: clinics.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    monthlyRecurring: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.plan.price, 0),
    churnRate: subscriptions.filter(s => s.status === 'cancelled').length / Math.max(subscriptions.length, 1),
    upgrades: subscriptions.filter(s => s.upgradedFrom).length
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Activa' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Prueba' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pausada' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' }
    };
    return badges[status] || badges.active;
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-10">
      {/* --- ENCABEZADO --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#DFD2C4]/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-[#A3968B]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">SaaS Management</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#312923] tracking-tighter">Gestión de Suscripciones</h1>
        </div>
        <button className="px-6 py-3 rounded-xl bg-[#5B6651] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#4a5442] transition-all flex items-center gap-2 shadow-lg">
          <Plus size={16} /> Nueva Clínica
        </button>
      </div>

      {/* --- MÉTRICAS PRINCIPALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#5B6651]/10 rounded-2xl text-[#5B6651]">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">Clínicas</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">{stats.totalClinics}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Clínicas Registradas</p>
        </Card>

        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#5B6651]/10 rounded-2xl text-[#5B6651]">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">Activas</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">{stats.activeSubscriptions}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Suscripciones Activas</p>
        </Card>

        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#CBAAA2]/20 rounded-2xl text-[#CBAAA2]">
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">MRR</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">${stats.monthlyRecurring.toLocaleString()}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Ingresos Mensuales Recurrentes</p>
        </Card>

        <Card className="rounded-[2rem] border border-[#DFD2C4]/50 bg-white shadow-sm p-6">
          <div className="flex justify-between mb-4 items-start">
            <div className="p-3 bg-[#FDFBF7] rounded-2xl text-[#A3968B]">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] bg-[#FDFBF7] px-3 py-1 rounded-full">Upgrades</span>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">{stats.upgrades}</h2>
          <p className="text-[11px] font-bold text-[#A3968B] mt-2">Mejoras de Plan</p>
        </Card>
      </div>

      {/* --- PLANES DISPONIBLES --- */}
      <Card className="p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm bg-white">
        <h3 className="font-black text-[#312923] text-xl tracking-tight mb-6">Planes de Suscripción</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map(plan => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${plan.color} ${
                selectedPlan === plan.id ? 'ring-2 ring-[#5B6651]' : ''
              }`}
            >
              <h4 className="font-black text-[#312923] text-lg mb-2">{plan.name}</h4>
              <div className="mb-4">
                <p className="text-3xl font-black text-[#312923]">${plan.price.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-1">/mes</p>
              </div>
              <div className="mb-4 pb-4 border-b border-current/10">
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">
                  {typeof plan.users === 'number' ? `Hasta ${plan.users} usuario(s)` : plan.users}
                </p>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-[10px] font-bold text-[#6B615A] flex items-start gap-2">
                    <CheckCircle size={12} className="mt-0.5 shrink-0 text-[#5B6651]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* --- SUSCRIPCIONES ACTIVAS --- */}
      <Card className="p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm bg-white">
        <h3 className="font-black text-[#312923] text-xl tracking-tight mb-6">Suscripciones Activas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#DFD2C4]/50">
                <th className="text-left py-3 px-4 font-black text-[#312923]">Clínica</th>
                <th className="text-left py-3 px-4 font-black text-[#312923]">Plan</th>
                <th className="text-left py-3 px-4 font-black text-[#312923]">Estado</th>
                <th className="text-right py-3 px-4 font-black text-[#312923]">Precio/Mes</th>
                <th className="text-left py-3 px-4 font-black text-[#312923]">Próxima Renovación</th>
                <th className="text-center py-3 px-4 font-black text-[#312923]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center">
                    <p className="text-[10px] font-bold text-[#9A8F84]">No hay suscripciones registradas aún</p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub, idx) => {
                  const badge = getStatusBadge(sub.status);
                  return (
                    <tr key={idx} className="border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#312923]">{sub.clinicName}</td>
                      <td className="py-3 px-4 text-[#9A8F84]">{sub.plan.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#5B6651]">${sub.plan.price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-[#9A8F84]">{new Date(sub.renewalDate).toLocaleDateString('es-CL')}</td>
                      <td className="py-3 px-4 text-center">
                        <button className="px-3 py-1 rounded-lg bg-[#FDFBF7] border border-[#DFD2C4] text-[9px] font-black hover:bg-[#DFD2C4]/20 transition-all">
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
