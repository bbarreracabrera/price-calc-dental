import React, { useState, useMemo } from 'react';
import CariogramCalculator from './tools/CariogramCalculator';
import { Clock, ChevronDown } from 'lucide-react';
import { CARIOGRAM_FACTORS } from '../utils/cariogramScoring';

const RISK_COLORS = { low: '#5B6651', moderate: '#D9A86C', high: '#B92323' };
const RISK_LABELS = { low: 'Riesgo Bajo', moderate: 'Riesgo Moderado', high: 'Riesgo Alto' };

export default function CariogramTab({ patient, savePatientData, notify }) {
    const [showCalculator, setShowCalculator] = useState(false);
    const [showPreflight, setShowPreflight] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const history = useMemo(() => patient?.assessments?.cariogram || [], [patient]);

    const handleSave = async (assessment) => {
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
                    onClick={() => setShowPreflight(true)}
                    className="px-4 py-2 bg-[#312923] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    + Nueva evaluación
                </button>
            </div>

            {showPreflight ? (
                <PreflightCariogram
                    patient={patient}
                    onCancel={() => setShowPreflight(false)}
                    onConfirm={() => { setShowPreflight(false); setShowCalculator(true); }}
                />
            ) : history.length === 0 ? (
                <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-3xl p-10 text-center">
                    <Clock size={32} className="text-[#A3968B] mx-auto mb-3" />
                    <h3 className="font-black text-[#312923] mb-1">Sin evaluaciones previas</h3>
                    <p className="text-sm text-[#9A8F84] mb-4">
                        Realiza la primera evaluación Cariogram para iniciar el seguimiento del paciente
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
                                            Oportunidad: {a.computed?.chance}% · Bacterias: {a.computed?.bacteria}%
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{
                                                backgroundColor: `${RISK_COLORS[a.computed?.riskLevel]}20`,
                                                color: RISK_COLORS[a.computed?.riskLevel],
                                            }}
                                        >
                                            {RISK_LABELS[a.computed?.riskLevel]}
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
                                            {CARIOGRAM_FACTORS.map(f => {
                                                const val = a.inputs?.[f.key];
                                                const optLabel = f.options?.find(o => o.value === val)?.label;
                                                return (
                                                    <div key={f.key} className="bg-white rounded-xl p-2 border border-[#DFD2C4] text-center">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] leading-tight">{f.label}</p>
                                                        <p className="text-xs font-bold text-[#312923] mt-0.5">{optLabel ?? val ?? '—'}</p>
                                                    </div>
                                                );
                                            })}
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

function PreflightCariogram({ patient, onCancel, onConfirm }) {
    const name = patient?.personal?.legalName;
    const rut  = patient?.personal?.rut;
    return (
        <div className="bg-white rounded-3xl border border-[#DFD2C4] p-6">
            <h3 className="text-lg font-black text-[#312923] mb-2">Datos del paciente</h3>
            <p className="text-sm text-[#9A8F84] mb-4">
                La evaluación Cariogram comenzará con todos los factores en nivel mínimo.
                Ajusta cada parámetro según la exploración clínica.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <DataPreview label="Paciente" value={name} />
                <DataPreview label="RUT" value={rut} />
            </div>
            <div className="bg-[#FDFBF7] border-l-4 border-[#5B6651] rounded-r-xl p-3 mb-4">
                <p className="text-xs text-[#312923]">
                    Los 10 factores del Cariogram se iniciarán en el nivel 1 (mínimo riesgo).
                    Ajusta cada uno según la exploración clínica del paciente.
                </p>
            </div>
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
