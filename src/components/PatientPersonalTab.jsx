import React from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Card, InputField } from './UIComponents';
import { formatRUT } from '../constants';

export default function PatientPersonalTab({ 
    themeMode, getPatient, selectedPatientId, savePatientData, sendWhatsApp 
}) {
    const patient = getPatient(selectedPatientId);

    return (
        <Card theme={themeMode} className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4">
                <InputField theme={themeMode} label="Nombre Completo" value={patient.personal.legalName || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, legalName: e.target.value}})} />
                <InputField theme={themeMode} label="RUT / DNI" value={patient.personal?.rut || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, rut: formatRUT(e.target.value)}})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField theme={themeMode} label="Email" icon={Mail} value={patient.personal.email || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, email: e.target.value}})} />
                <div className="flex items-end gap-2">
                    <InputField theme={themeMode} label="Teléfono" icon={Phone} value={patient.personal.phone || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, phone: e.target.value}})} />
                    {patient.personal.phone && (
                        <button onClick={()=>sendWhatsApp(patient.personal.phone, "Hola, me comunico de ShiningCloud Dental.")} className="p-3 bg-emerald-500 rounded-xl text-white mb-[2px] hover:bg-emerald-600 transition-colors">
                            <MessageCircle size={18}/>
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField theme={themeMode} label="Fecha Nacimiento" type="date" value={patient.personal.birthDate || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, birthDate: e.target.value}})} />
                <InputField theme={themeMode} label="Ocupación" value={patient.personal.occupation || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, occupation: e.target.value}})} />
            </div>
            <InputField theme={themeMode} label="Dirección" icon={MapPin} value={patient.personal.address || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, address: e.target.value}})} />
            <div className="grid grid-cols-2 gap-4">
                <InputField theme={themeMode} label="Ciudad" value={patient.personal.city || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, city: e.target.value}})} />
                <InputField theme={themeMode} label="Comuna" value={patient.personal.commune || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, commune: e.target.value}})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField theme={themeMode} label="Previsión" value={patient.personal.convention || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, convention: e.target.value}})} />
                <InputField theme={themeMode} label="Apoderado (Si aplica)" value={patient.personal.guardian || ''} onChange={e=>savePatientData(selectedPatientId, {...patient, personal: {...patient.personal, guardian: e.target.value}})} />
            </div>
        </Card>
    );
}