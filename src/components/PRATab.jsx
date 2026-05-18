import React, { useState, useMemo } from 'react';
import PRACalculator from './tools/PRACalculator';
import { Clock } from 'lucide-react';

const RISK_COLORS = { low: '#5B6651', moderate: '#D9A86C', high: '#B92323' };
const RISK_LABELS = { low: 'Riesgo Bajo', moderate: 'Riesgo Moderado', high: 'Riesgo Alto' };

export default function PRATab({ patient, savePatientData, notify }) {
    const [showCalculator, setShowCalculator] = useState(false);

    const precomputedData = useMemo(() => {
        const personal  = patient?.personal  || {};
        const clinical  = patient?.clinical  || {};
        const anamnesis = patient?.anamnesis || {};

        // Edad desde fecha de nacimiento
        let age = 0;
        if (personal.birthDate) {
            const birth = new Date(personal.birthDate);
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            if (
                today.getMonth() < birth.getMonth() ||
                (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
            ) age--;
        }

        // BOP desde periodontograma
        let bopPositive = 0;
        let teethWithPerio = 0;
        if (clinical.perio) {
            for (const toothId in clinical.perio) {
                const p = clinical.perio[toothId];
                bopPositive += (p.bop_v || []).filter(Boolean).length;
                bopPositive += (p.bop_l || []).filter(Boolean).length;
                teethWithPerio++;
            }
        }

        // Dientes perdidos desde odontograma
        let teethLost = 0;
        if (clinical.odontogram) {
            for (const toothId in clinical.odontogram) {
                const tooth = clinical.odontogram[toothId];
                if (tooth?.status === 'missing' || tooth?.missing) teethLost++;
            }
        }

        // Tabaquismo desde anamnesis
        let tabaquismo = 1;
        if (anamnesis.smoking === 'active' || anamnesis.tabaquismo) tabaquismo = 3;

        return {
            age,
            teethCount: teethWithPerio || 28,
            bopPositive,
            teethLost,
            tabaquismo,
            ppdSites:   0,
            boneloss:   0,
            sistemico:  anamnesis.diabetes ? 3 : 1,
        };
    }, [patient]);

    const history = useMemo(() => patient?.assessments?.pra || [], [patient]);

    const handleSave = async (assessment) => {
        console.log('[PRATab] Guardando evaluación:', { patientId: patient.id, patient, assessment });
        const newHistory = [...(patient?.assessments?.pra || []), assessment];
        const newData = {
            ...patient,
            assessments: { ...(patient.assessments || {}), pra: newHistory },
        };
        try {
            await savePatientData(patient.id, newData, { skipLog: true });
            notify('Evaluación PRA guardada en la ficha', 'success');
            setShowCalculator(false);
        } catch {
            notify('Error al guardar evaluación', 'error');
        }
    };

    if (showCalculator) {
        return (
            <PRACalculator
                mode="private"
                patientData={{
                    ...precomputedData,
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
                    <h2 className="text-xl font-black text-[#312923]">Evaluación de Riesgo Periodontal</h2>
                    <p className="text-sm text-[#9A8F84]">Lang &amp; Tonetti — Datos precargados desde la ficha</p>
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
                        Realiza la primera evaluación PRA para iniciar el seguimiento del paciente
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
                                    BOP {a.computed?.bopPct?.toFixed(0)}% · D. perdidos {a.inputs?.teethLost}
                                </p>
                            </div>
                            <div
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{
                                    backgroundColor: `${RISK_COLORS[a.computed?.risk]}20`,
                                    color: RISK_COLORS[a.computed?.risk],
                                }}
                            >
                                {RISK_LABELS[a.computed?.risk]}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
