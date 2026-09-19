import React, { useState } from 'react';
import { Cloud, ArrowRight, Stethoscope } from 'lucide-react';
import { formatRUT } from '../constants';

const SPECIALTIES = [
    'Odontología General',
    'Ortodoncia',
    'Endodoncia',
    'Implantología',
    'Periodoncia',
    'Cirugía Maxilofacial',
    'Rehabilitación Oral',
    'Odontopediatría',
    'Radiología Oral y Maxilofacial',
    'Otra especialidad',
];

export default function OnboardingModal({ onSave }) {
    const [form, setForm] = useState({ name: '', rut: '', specialty: '', phone: '', address: '' });

    const canSave = form.name.trim() && form.specialty;

    const inputClass = "w-full p-4 rounded-2xl bg-[#FBFAF8] border border-[#D9D2C7] outline-none font-bold text-[#241F1B] focus:border-[#46523C] transition-colors shadow-sm";
    const labelClass = "text-[11px] font-black uppercase tracking-widest text-[#5E554E] ml-1 mb-2 block";

    return (
        <div className="fixed inset-0 z-[300] bg-[#FBFAF8] flex items-start md:items-center justify-center p-4 overflow-y-auto">
            <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#46523C]/10 blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#D3A9A0]/15 blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500 py-8">

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#46523C] to-[#241F1B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#241F1B]/20 mb-4">
                        <Cloud className="text-white" size={28} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-[#241F1B] tracking-tight text-center">
                        Bienvenido/a a <span className="text-[#46523C]">ShiningCloud</span>
                    </h1>
                    <p className="text-[#5E554E] text-sm font-medium mt-2 text-center">
                        Cuéntanos sobre tu consulta para comenzar.
                    </p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-[#D9D2C7]/60 shadow-xl p-8 sm:p-10 space-y-5">

                    <div className="flex items-center gap-2 mb-1">
                        <Stethoscope size={14} className="text-[#46523C]" />
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">Datos Profesionales</p>
                    </div>

                    <div>
                        <label className={labelClass}>
                            Nombre del profesional o clínica <span className="text-[#D3A9A0]">*</span>
                        </label>
                        <input
                            className={inputClass}
                            placeholder="Ej: Dr/Dra. María González"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Especialidad <span className="text-[#D3A9A0]">*</span>
                        </label>
                        <select
                            className={`${inputClass} appearance-none`}
                            value={form.specialty}
                            onChange={e => setForm({ ...form, specialty: e.target.value })}
                        >
                            <option value="">Selecciona una especialidad...</option>
                            {SPECIALTIES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>
                            RUT profesional <span className="text-[#5E554E] font-normal normal-case">(opcional)</span>
                        </label>
                        <input
                            className={inputClass}
                            placeholder="12.345.678-9"
                            value={form.rut}
                            onChange={e => setForm({ ...form, rut: formatRUT(e.target.value) })}
                        />
                    </div>

                    <div className="border-t border-[#D9D2C7]/40 pt-5 space-y-4">
                        <p className={labelClass}>Opcionales — puedes completarlos después en Ajustes</p>

                        <div>
                            <label className={labelClass}>Teléfono / WhatsApp</label>
                            <input
                                className={inputClass}
                                placeholder="+56 9 1234 5678"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Dirección de la clínica</label>
                            <input
                                className={inputClass}
                                placeholder="Av. Ejemplo 123, Oficina 4"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            disabled={!canSave}
                            onClick={() => onSave(form)}
                            className={`w-full py-4 font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all ${
                                canSave
                                    ? 'bg-[#241F1B] text-white hover:bg-black shadow-md hover:-translate-y-0.5'
                                    : 'bg-[#D9D2C7]/40 text-[#8A7F74] cursor-not-allowed'
                            }`}
                        >
                            Comenzar <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
