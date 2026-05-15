import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Phone, MapPin, MessageCircle, User, Briefcase, FileText, HeartPulse, Save, CheckCircle2 } from 'lucide-react';
import { InputField } from './UIComponents';
import { formatRUT } from '../constants';

export default function PatientPersonalTab({ 
    getPatient, selectedPatientId, savePatientData, sendWhatsApp, config 
}) {
    const patient = getPatient(selectedPatientId);
    const personal = patient.personal || {};

    // ESTADO LOCAL: Permite escribir a la velocidad de la luz sin lag
    const [localData, setLocalData] = useState({
        legalName: personal.legalName || '',
        rut: personal.rut || '',
        birthDate: personal.birthDate || '',
        occupation: personal.occupation || '',
        email: personal.email || '',
        phone: personal.phone || '',
        address: personal.address || '',
        city: personal.city || '',
        commune: personal.commune || '',
        convention: personal.convention || '',
        guardian: personal.guardian || ''
    });

    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved
    const saveTimeoutRef = useRef(null);
    const localDataRef = useRef(localData);

    useEffect(() => { localDataRef.current = localData; }, [localData]);

    // SINCRONIZACIÓN: Si cambiamos de paciente en el menú, actualizamos los datos locales
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setLocalData({
            legalName: patient.personal?.legalName || '',
            rut: patient.personal?.rut || '',
            birthDate: patient.personal?.birthDate || '',
            occupation: patient.personal?.occupation || '',
            email: patient.personal?.email || '',
            phone: patient.personal?.phone || '',
            address: patient.personal?.address || '',
            city: patient.personal?.city || '',
            commune: patient.personal?.commune || '',
            convention: patient.personal?.convention || '',
            guardian: patient.personal?.guardian || ''
        });
        setSaveStatus('idle');
    }, [selectedPatientId, patient.personal]);

    // CAMBIO LOCAL: Actualiza pantalla y programa guardado con debounce
    const handleChange = useCallback((field, value) => {
        setLocalData(prev => {
            const next = { ...prev, [field]: value };
            localDataRef.current = next;

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            setSaveStatus('saving');
            saveTimeoutRef.current = setTimeout(() => {
                savePatientData(selectedPatientId, {
                    ...patient,
                    personal: { ...patient.personal, ...localDataRef.current }
                });
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }, 500);

            return next;
        });
    }, [selectedPatientId, patient, savePatientData]);

    const handleSaveToDB = () => {};

    return (
        <div className="space-y-10 animate-in fade-in max-w-5xl mx-auto py-4">
            
            {/* --- BARRA DE ESTADO DE GUARDADO --- */}
            <div className="flex justify-end h-6 -mb-6">
                {saveStatus === 'saving' && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1 animate-pulse"><Save size={14}/> Guardando...</span>}
                {saveStatus === 'saved' && <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14}/> Sincronizado</span>}
            </div>

            {/* --- SECCIÓN: IDENTIFICACIÓN --- */}
            <section>
                <h3 className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em] border-b border-[#DFD2C4]/50 pb-2 mb-6">
                    Identificación del Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField 
                        icon={User}
                        label="Nombre Completo" 
                        value={localData.legalName} 
                        onChange={e => handleChange('legalName', e.target.value)} 
                        onBlur={handleSaveToDB}
                    />
                    <InputField 
                        icon={FileText}
                        label="RUT / DNI" 
                        value={localData.rut} 
                        onChange={e => handleChange('rut', formatRUT(e.target.value))} 
                        onBlur={handleSaveToDB}
                    />
                    <InputField 
                        label="Fecha de Nacimiento" 
                        type="date" 
                        value={localData.birthDate} 
                        onChange={e => handleChange('birthDate', e.target.value)} 
                        onBlur={handleSaveToDB}
                    />
                    <InputField 
                        icon={Briefcase}
                        label="Ocupación" 
                        value={localData.occupation} 
                        onChange={e => handleChange('occupation', e.target.value)} 
                        onBlur={handleSaveToDB}
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
                        value={localData.email} 
                        onChange={e => handleChange('email', e.target.value)} 
                        onBlur={handleSaveToDB}
                    />
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <InputField 
                                icon={Phone} 
                                label="Teléfono Móvil" 
                                value={localData.phone} 
                                onChange={e => handleChange('phone', e.target.value)} 
                                onBlur={handleSaveToDB}
                            />
                        </div>
                        {/* Botón WhatsApp Estilo Boutique con Variables */}
                        {localData.phone && (
                            <button 
                                onClick={() => {
                                    // 1. Extraemos los nombres reales
                                    const clinicName = config?.name || 'la clínica';
                                    const patientName = localData.legalName.split(' ')[0] || 'paciente';
                                    
                                    // 2. Traemos la plantilla desde la configuración
                                    let message = config?.wpGreeting || `Hola {paciente}, nos comunicamos de {clinica}...`;
                                    
                                    // 3. Magia: Reemplazamos las variables por los datos reales
                                    message = message.replace(/{paciente}/g, patientName).replace(/{clinica}/g, clinicName);
                                    
                                    // 4. Enviamos a la función constructora de la URL
                                    sendWhatsApp(localData.phone, message);
                                }} 
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
                        value={localData.address} 
                        onChange={e => handleChange('address', e.target.value)} 
                        onBlur={handleSaveToDB}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                            label="Ciudad" 
                            value={localData.city} 
                            onChange={e => handleChange('city', e.target.value)} 
                            onBlur={handleSaveToDB}
                        />
                        <InputField 
                            label="Comuna / Distrito" 
                            value={localData.commune} 
                            onChange={e => handleChange('commune', e.target.value)} 
                            onBlur={handleSaveToDB}
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
                        value={localData.convention} 
                        onChange={e => handleChange('convention', e.target.value)} 
                        onBlur={handleSaveToDB}
                    />
                    <InputField 
                        icon={User}
                        label="Apoderado (En caso de menores)" 
                        value={localData.guardian} 
                        onChange={e => handleChange('guardian', e.target.value)} 
                        onBlur={handleSaveToDB}
                    />
                </div>
            </section>
            
        </div>
    );
}