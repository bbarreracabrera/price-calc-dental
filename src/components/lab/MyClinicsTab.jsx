import React, { useMemo } from 'react';
import { TrendingUp, MessageCircle, Building2 } from 'lucide-react';

export default function MyClinicsTab({ jobs }) {
    const clinicStats = useMemo(() => {
        const stats = {};

        jobs.forEach(job => {
            const clinic = job.admin_email;
            if (!clinic) return;

            if (!stats[clinic]) {
                stats[clinic] = { email: clinic, total: 0, en_curso: 0, completados: 0, despachados: 0 };
            }

            stats[clinic].total++;

            if (job.status === 'despachado') {
                stats[clinic].despachados++;
            } else if (job.status === 'listo') {
                stats[clinic].completados++;
            } else {
                stats[clinic].en_curso++;
            }
        });

        return Object.values(stats).sort((a, b) => b.total - a.total);
    }, [jobs]);

    if (clinicStats.length === 0) {
        return (
            <div className="bg-white border border-[#DFD2C4] rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-400 mx-auto mb-4">
                    <TrendingUp size={32} />
                </div>
                <h3 className="font-black text-[#312923] text-lg mb-2">Aún no tienes clínicas conectadas</h3>
                <p className="text-sm text-[#9A8F84] max-w-md mx-auto leading-relaxed">
                    Cuando una clínica te invite a su red, aparecerá aquí con
                    estadísticas de los trabajos asignados.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-black ml-1">
                {clinicStats.length} {clinicStats.length === 1 ? 'clínica conectada' : 'clínicas conectadas'}
            </p>
            {clinicStats.map(clinic => (
                <ClinicCard key={clinic.email} clinic={clinic} />
            ))}
        </div>
    );
}

function ClinicCard({ clinic }) {
    return (
        <div className="bg-white border border-[#DFD2C4] rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-[#FDFBF7] border border-[#DFD2C4] rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-[#A3968B]" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-[#312923] truncate text-sm">{clinic.email}</h3>
                        <p className="text-[10px] text-[#9A8F84] uppercase tracking-widest font-bold mt-0.5">
                            Cliente activo · {clinic.total} trabajo{clinic.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <a
                    href={`mailto:${clinic.email}`}
                    className="p-2 text-[#9A8F84] hover:text-[#5B6651] hover:bg-[#FDFBF7] rounded-xl transition-colors shrink-0"
                    title="Contactar por email"
                >
                    <MessageCircle size={18} />
                </a>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#DFD2C4]/50">
                <StatPill label="Total"       value={clinic.total}       color="text-[#312923]" />
                <StatPill label="En curso"    value={clinic.en_curso}    color="text-amber-600" />
                <StatPill label="Listos"      value={clinic.completados} color="text-[#5B6651]" />
                <StatPill label="Despachados" value={clinic.despachados} color="text-[#A3968B]" />
            </div>
        </div>
    );
}

function StatPill({ label, value, color }) {
    return (
        <div className="text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[9px] uppercase tracking-widest font-black text-[#9A8F84] mt-0.5 leading-tight">{label}</p>
        </div>
    );
}
