import React, { useState, useMemo } from 'react';
import CariogramCalculator from './tools/CariogramCalculator';
import { Clock } from 'lucide-react';

const RISK_COLORS = { low: '#5B6651', moderate: '#D9A86C', high: '#B92323' };
const RISK_LABELS = { low: 'Riesgo Bajo', moderate: 'Riesgo Moderado', high: 'Riesgo Alto' };

export default function CariogramTab({ patient, savePatientData, notify }) {
    const [showCalculator, setShowCalculator] = useState(false);

    const history = useMemo(() => patient?.assessments?.cariogram || [], [patient]);

    const handleSave = async (assessment) => {
        console.log('[CariogramTab] Guardando evaluación:', { patientId: patient.id, patient, assessment });
        const newHistory = [...(patient?.assessments?.cariogram || []), assessment];
        const newData = {
            ...patient,
            assessments: { ...(patient.assessments || {}), cariogram: newHistory },
        };
        try {
            await savePatientData(patient.id, newData, { skipLog: true });
            notify('Evaluación Cariogram guardada en la ficha', 'success');
            setShowCalculator(false);
        } catch {
            notify('Error al guardar evaluación', 'error');
        }
    };

    if (showCalculator) {
        return (
            <CariogramCalculator
                mode="private"
                patientData={{
                    legalName: patient?.personal?.legalName,
                    rut: patient?.personal?.rut,
                }}
                onSave={handleSave}
                onClose={() => setShowCalculator(false)}
            />
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-[#312923]">Evaluación de Riesgo de Caries</h2>
                    <p className="text-sm text-[#9A8F84]">Cariogram (Bratthall) — Modelo multifactorial</p>
                </div>
                <button
                    onClick={() => setShowCalculator(true)}
                    className="px-4 py-2 bg-[#312923] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    + Nueva evaluación
                </button>
            </div>

            {history.length === 0 ? (
                <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-3xl p-10 text-center">
                    <Clock size={32} className="text-[#A3968B] mx-auto mb-3" />
                    <h3 className="font-black text-[#312923] mb-1">Sin evaluaciones previas</h3>
                    <p className="text-sm text-[#9A8F84] mb-4">
                        Realiza la primera evaluación Cariogram para iniciar el seguimiento del paciente
                    </p>
                    <button
                        onClick={() => setShowCalculator(true)}
                        className="px-4 py-2 bg-[#5B6651] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Iniciar primera evaluación
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {[...history].reverse().map((a, i) => (
                        <div
                            key={i}
                            className="bg-white border border-[#DFD2C4] rounded-2xl p-4 flex items-center justify-between"
                        >
                            <div>
                                <p className="font-bold text-sm text-[#312923]">
                                    {new Date(a.date).toLocaleDateString('es-CL', {
                                        day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                </p>
                                <p className="text-xs text-[#9A8F84] mt-0.5">
                                    Oportunidad: {a.computed?.chance}% · Bacterias: {a.computed?.bacteria}%
                                </p>
                            </div>
                            <div
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{
                                    backgroundColor: `${RISK_COLORS[a.computed?.riskLevel]}20`,
                                    color: RISK_COLORS[a.computed?.riskLevel],
                                }}
                            >
                                {RISK_LABELS[a.computed?.riskLevel]}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
