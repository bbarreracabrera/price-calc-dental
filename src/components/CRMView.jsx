import React from 'react';
import { Users, Star, MessageCircle } from 'lucide-react';
import { Card } from './UIComponents';

export default function CRMView({ 
    themeMode, t, getRecalls, patientRecords, 
    setActiveTab, setSelectedPatientId, sendWhatsApp, getPatientPhone 
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Users className={t.accent}/> CRM de Retención</h2>
                    <p className="text-xs opacity-50 mt-1">Pacientes inactivos por más de 6 meses sin citas futuras.</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold">
                    {getRecalls.length} Pacientes para recuperar
                </div>
            </div>

            {getRecalls.length === 0 ? (
                <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center opacity-50 flex flex-col items-center gap-4">
                    <Star size={40} className="opacity-30"/>
                    <p>¡Excelente! No tienes pacientes inactivos o atrasados en sus controles.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {getRecalls.map(appt => (
                        <Card key={appt.id} theme={themeMode} className="flex flex-col md:flex-row justify-between items-center p-4 hover:border-emerald-500/50 transition-colors">
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg opacity-50">
                                    {appt.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{appt.name}</h4>
                                    <p className="text-xs text-red-400">Última visita: {appt.date.split('-').reverse().join('/')} ({appt.treatment})</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={()=>{
                                    setActiveTab('ficha'); 
                                    setSelectedPatientId(Object.keys(patientRecords).find(k => patientRecords[k].personal?.legalName === appt.name));
                                }} className="flex-1 md:flex-none p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">
                                    Ver Ficha
                                </button>
                                <button onClick={()=>sendWhatsApp(getPatientPhone(appt.name), `Hola ${appt.name}, nos comunicamos de ShiningCloud Dental. Vemos que han pasado más de 6 meses desde tu última atención (${appt.treatment}). Nos encantaría agendar un control preventivo gratuito para ver cómo estás. ¿Te gustaría ver horarios disponibles?`)} className="flex-1 md:flex-none p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
                                    <MessageCircle size={16}/> Recuperar por WhatsApp
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}