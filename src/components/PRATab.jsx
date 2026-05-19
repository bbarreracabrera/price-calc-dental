import React, { useState, useMemo } from 'react';
import PRACalculator from './tools/PRACalculator';
import { Clock, ChevronDown } from 'lucide-react';

const RISK_COLORS = { low: '#5B6651', moderate: '#D9A86C', high: '#B92323' };
const RISK_LABELS = { low: 'Riesgo Bajo', moderate: 'Riesgo Moderado', high: 'Riesgo Alto' };

export default function PRATab({ patient, savePatientData, notify }) {
    const [showCalculator, setShowCalculator] = useState(false);
    const [showPreflight, setShowPreflight] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const precomputedData = useMemo(() => {
        const personal  = patient?.personal  || {};
        const clinical  = patient?.clinical  || {};
        const anamnesis = patient?.anamnesis || {};

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

        let teethLost = 0;
        if (clinical.odontogram) {
            for (const toothId in clinical.odontogram) {
                const tooth = clinical.odontogram[toothId];
                if (tooth?.status === 'missing' || tooth?.missing) teethLost++;
            }
        }

        let tabaquismo = 1;
        if (anamnesis.smoking === 'active' || anamnesis.tabaquismo) tabaquismo = 3;

        return {
            age,
            teethCount: teethWithPerio || 28,
            bopPositive,
            teethLost,
            tabaquismo,
            ppdSites:  0,
            boneloss:  0,
            sistemico: anamnesis.diabetes ? 3 : 1,
        };
    }, [patient]);

    const history = useMemo(() => patient?.assessments?.pra || [], [patient]);

    const handleSave = async (assessment) => {
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
                    onClick={() => setShowPreflight(true)}
                    className="px-4 py-2 bg-[#312923] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    + Nueva evaluación
                </button>
            </div>

            {showPreflight ? (
                <PreflightPRA
                    data={precomputedData}
                    onCancel={() => setShowPreflight(false)}
                    onConfirm={() => { setShowPreflight(false); setShowCalculator(true); }}
                />
            ) : history.length === 0 ? (
                <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-3xl p-10 text-center">
                    <Clock size={32} className="text-[#A3968B] mx-auto mb-3" />
                    <h3 className="font-black text-[#312923] mb-1">Sin evaluaciones previas</h3>
                    <p className="text-sm text-[#9A8F84] mb-4">
                        Realiza la primera evaluación PRA para iniciar el seguimiento del paciente
                    </p>
                    <button
                        onClick={() => setShowPreflight(true)}
                        className="px-4 py-2 bg-[#5B6651] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Iniciar primera evaluación
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {[...history].reverse().map((a, i) => {
                        const isExpanded = expandedId === a.date;
                        return (
                            <div key={i} className="bg-white border border-[#DFD2C4] rounded-2xl overflow-hidden">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FDFBF7]"
                                    onClick={() => setExpandedId(isExpanded ? null : a.date)}
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
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{
                                                backgroundColor: `${RISK_COLORS[a.computed?.risk]}20`,
                                                color: RISK_COLORS[a.computed?.risk],
                                            }}
                                        >
                                            {RISK_LABELS[a.computed?.risk]}
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-[#9A8F84] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-[#DFD2C4] bg-[#FDFBF7] p-4">
                                        <p className="text-xs uppercase tracking-widest text-[#9A8F84] mb-2 font-bold">
                                            Detalle de la evaluación
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {[
                                                { label: 'Edad', val: a.inputs?.edad ? `${a.inputs.edad} años` : '—' },
                                                { label: 'BOP%', val: a.computed?.bopPct != null ? `${a.computed.bopPct.toFixed(0)}%` : '—' },
                                                { label: 'PPD≥5mm', val: a.inputs?.ppdSites ?? '—' },
                                                { label: 'D. perdidos', val: a.inputs?.teethLost ?? '—' },
                                                { label: 'BL/Edad', val: a.computed?.blRatio?.toFixed(2) ?? '—' },
                                                { label: 'Tabaquismo', val: ['–','No/Ex>5a','Ex<5a','10-19','≥20'][a.inputs?.tabaquismo] ?? '—' },
                                            ].map(({ label, val }) => (
                                                <div key={label} className="bg-white rounded-xl p-2 border border-[#DFD2C4] text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">{label}</p>
                                                    <p className="text-sm font-bold text-[#312923]">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PreflightPRA({ data, onCancel, onConfirm }) {
    return (
        <div className="bg-white rounded-3xl border border-[#DFD2C4] p-6">
            <h3 className="text-lg font-black text-[#312923] mb-2">Datos precargados desde la ficha</h3>
            <p className="text-sm text-[#9A8F84] mb-4">
                Confirma los datos antes de iniciar la evaluación. Podrás ajustarlos en el siguiente paso.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <DataPreview label="Edad" value={data.age} unit="años" />
                <DataPreview label="Dientes presentes" value={data.teethCount} />
                <DataPreview label="Sitios BOP positivos" value={data.bopPositive} />
                <DataPreview label="Dientes perdidos" value={data.teethLost} />
                <DataPreview label="Tabaquismo" value={data.tabaquismo > 1 ? 'Sí' : 'No'} />
                <DataPreview label="Sistémico" value={data.sistemico > 1 ? 'Sí' : 'No'} />
            </div>
            {(data.age === 0 || data.teethCount === 0) && (
                <div className="bg-[#FDFBF7] border-l-4 border-[#D9A86C] rounded-r-xl p-3 mb-4">
                    <p className="text-xs text-[#312923]">
                        ⚠️ Algunos datos están vacíos. Deberás ingresarlos manualmente en la calculadora.
                    </p>
                </div>
            )}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 border border-[#DFD2C4] text-[#312923] font-bold rounded-xl hover:bg-[#FDFBF7] transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 bg-[#312923] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}

function DataPreview({ label, value, unit }) {
    return (
        <div className="bg-[#FDFBF7] rounded-xl p-3 border border-[#DFD2C4]">
            <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-bold">{label}</p>
            <p className="text-lg font-black text-[#312923]">
                {value || '—'}
                {unit && value ? <span className="text-xs font-normal text-[#9A8F84] ml-1">{unit}</span> : null}
            </p>
        </div>
    );
}
