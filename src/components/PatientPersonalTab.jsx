import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, User, Briefcase, FileText, HeartPulse } from 'lucide-react';
import { InputField } from './UIComponents';
import { formatRUT } from '../constants';

export default function PatientPersonalTab({ 
    getPatient, selectedPatientId, savePatientData, sendWhatsApp 
}) {
    const patient = getPatient(selectedPatientId);
    const personal = patient.personal || {};

    // Función unificada para guardar datos y mantener el código limpio
    const handleChange = (field, value) => {
        savePatientData(selectedPatientId, {
            ...patient,
            personal: { ...personal, [field]: value }
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in max-w-5xl mx-auto py-4">
            
            {/* --- SECCIÓN: IDENTIFICACIÓN --- */}
            <section>
                <h3 className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em] border-b border-[#DFD2C4]/50 pb-2 mb-6">
                    Identificación del Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField 
                        icon={User}
                        label="Nombre Completo" 
                        value={personal.legalName || ''} 
                        onChange={e => handleChange('legalName', e.target.value)} 
                    />
                    <InputField 
                        icon={FileText}
                        label="RUT / DNI" 
                        value={personal.rut || ''} 
                        onChange={e => handleChange('rut', formatRUT(e.target.value))} 
                    />
                    <InputField 
                        label="Fecha de Nacimiento" 
                        type="date" 
                        value={personal.birthDate || ''} 
                        onChange={e => handleChange('birthDate', e.target.value)} 
                    />
                    <InputField 
                        icon={Briefcase}
                        label="Ocupación" 
                        value={personal.occupation || ''} 
                        onChange={e => handleChange('occupation', e.target.value)} 
                    />
                </div>
            </section>

            {/* --- SECCIÓN: CONTACTO --- */}
            <section>
                <h3 className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em] border-b border-[#DFD2C4]/50 pb-2 mb-6">
                    Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField 
                        icon={Mail} 
                        label="Correo Electrónico" 
                        value={personal.email || ''} 
                        onChange={e => handleChange('email', e.target.value)} 
                    />
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <InputField 
                                icon={Phone} 
                                label="Teléfono Móvil" 
                                value={personal.phone || ''} 
                                onChange={e => handleChange('phone', e.target.value)} 
                            />
                        </div>
                        {/* Botón WhatsApp Estilo Boutique */}
                        {personal.phone && (
                            <button 
                                onClick={() => sendWhatsApp(personal.phone, "Hola, me comunico de ShiningCloud Dental.")} 
                                className="h-[52px] px-5 bg-[#5B6651]/10 text-[#5B6651] border border-[#5B6651]/20 rounded-2xl hover:bg-[#5B6651] hover:text-white transition-all flex items-center justify-center shadow-sm group"
                                title="Contactar por WhatsApp"
                            >
                                <MessageCircle size={22} className="group-hover:scale-110 transition-transform"/>
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN: UBICACIÓN --- */}
            <section>
                <h3 className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em] border-b border-[#DFD2C4]/50 pb-2 mb-6">
                    Ubicación y Residencia
                </h3>
                <div className="space-y-5">
                    <InputField 
                        icon={MapPin} 
                        label="Dirección Completa" 
                        value={personal.address || ''} 
                        onChange={e => handleChange('address', e.target.value)} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                            label="Ciudad" 
                            value={personal.city || ''} 
                            onChange={e => handleChange('city', e.target.value)} 
                        />
                        <InputField 
                            label="Comuna / Distrito" 
                            value={personal.commune || ''} 
                            onChange={e => handleChange('commune', e.target.value)} 
                        />
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN: ADMINISTRACIÓN --- */}
            <section>
                <h3 className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em] border-b border-[#DFD2C4]/50 pb-2 mb-6">
                    Datos Administrativos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField 
                        icon={HeartPulse}
                        label="Previsión Médica / Seguro" 
                        value={personal.convention || ''} 
                        onChange={e => handleChange('convention', e.target.value)} 
                    />
                    <InputField 
                        icon={User}
                        label="Apoderado (En caso de menores)" 
                        value={personal.guardian || ''} 
                        onChange={e => handleChange('guardian', e.target.value)} 
                    />
                </div>
            </section>
            
        </div>
    );
}