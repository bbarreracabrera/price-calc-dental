import React, { useState, useEffect } from 'react';
import { Star, Zap, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

/**
 * Banner de suscripción Lab Pro.
 * Muestra el plan actual del laboratorio y CTA para upgrade.
 */
export default function LabSubscriptionBanner({ supabase, labEmail }) {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    // URL del plan Lab Pro en MercadoPago (Preapproval Plan)
    // Reemplazar con el ID real del plan creado en MP Dashboard
    const MP_LAB_PRO_URL = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=LAB_PRO_PLAN_ID";

    useEffect(() => {
        if (!labEmail) return;
        supabase
            .from('lab_subscriptions')
            .select('plan_type, status, monthly_fee, next_billing_date, trial_ends_at')
            .eq('lab_email', labEmail)
            .maybeSingle()
            .then(({ data }) => {
                setSubscription(data);
                setLoading(false);
            });
    }, [labEmail]);

    if (loading) return null;

    const isPro = subscription?.plan_type === 'pro' && subscription?.status === 'active';
    const isTrial = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();

    // Si ya es Pro, mostrar badge discreto
    if (isPro) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <Star size={14} className="text-emerald-600 fill-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Lab Pro Activo</span>
                {subscription?.next_billing_date && (
                    <span className="text-[9px] text-emerald-500 font-bold ml-2">
                        · Próximo cobro: {new Date(subscription.next_billing_date).toLocaleDateString('es-CL')}
                    </span>
                )}
            </div>
        );
    }

    // Si está en trial
    if (isTrial) {
        const daysLeft = Math.ceil(
            (new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Trial Pro — {daysLeft} días restantes</span>
                        </div>
                        <p className="text-xs text-amber-600 font-medium">Estás probando Lab Pro. Activa tu suscripción para no perder el acceso.</p>
                    </div>
                    <a
                        href={MP_LAB_PRO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors"
                    >
                        Activar <ArrowRight size={12} />
                    </a>
                </div>
            </div>
        );
    }

    // Plan Free — mostrar CTA para upgrade
    return (
        <div className="bg-[#312923] rounded-[2rem] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Star size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Lock size={14} className="text-[#CBAAA2]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#CBAAA2]">Plan Gratuito</span>
                    </div>
                    <h3 className="text-lg font-black">Desbloquea Lab Pro por $12.990/mes</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {[
                            'Trabajos externos (sin clínica conectada)',
                            'Facturación SII',
                            'Análisis de revenue',
                            'Multi-técnico',
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                                <CheckCircle2 size={10} className="text-[#CBAAA2]" /> {f}
                            </div>
                        ))}
                    </div>
                </div>
                <a
                    href={MP_LAB_PRO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-[#312923] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FDFBF7] transition-colors shadow-lg"
                >
                    <Star size={14} className="fill-[#312923]" />
                    Upgrade a Pro
                </a>
            </div>
        </div>
    );
}
