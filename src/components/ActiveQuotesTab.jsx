import React from 'react';
import { Calculator, CheckCircle, Clock } from 'lucide-react';
import { Card } from './UIComponents';

export default function ActiveQuotesTab({ getPatient, selectedPatientId }) {
    const patient = getPatient(selectedPatientId);
    const quotes = patient.clinical?.quotes || [];
    const teeth = patient.clinical?.teeth || {};

    // Filtramos para mostrar solo los presupuestos que están en proceso
    const activeQuotes = quotes.filter(q => q.status === 'en_proceso' || q.status === 'pending');

    if (activeQuotes.length === 0) {
        return (
            <div className="text-center py-12 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem] animate-in fade-in">
                <Calculator className="mx-auto text-[#DFD2C4] mb-3" size={32}/>
                <p className="text-sm font-bold text-[#9A8F84]">No hay presupuestos activos</p>
                <p className="text-[10px] mt-1 text-[#A3968B] uppercase tracking-widest">Genera uno desde el cotizador</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            {/* --- ENCABEZADO --- */}
            <div className="border-b border-[#DFD2C4]/50 pb-4">
                <h2 className="text-2xl font-black text-[#312923] tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-xl">
                        <Calculator size={22} />
                    </div>
                    Presupuestos en Proceso
                </h2>
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2 ml-1">
                    Seguimiento automático clínico-financiero
                </p>
            </div>

            {/* --- LISTA DE PRESUPUESTOS --- */}
            <div className="grid gap-6">
                {activeQuotes.map(quote => {
                    let completedCount = 0;
                    
                    // MAGIA: Cruzamos los ítems del presupuesto con el estado real del odontograma
                    const processedItems = quote.items.map(item => {
                        let isDone = false;
                        
                        if (item.tooth && teeth[item.tooth]) {
                            const tData = teeth[item.tooth];
                            // Si el tratamiento en el odontograma coincide en nombre y está completado, marcamos check
                            if (tData.treatment?.name === item.name && tData.treatment?.status === 'completed') {
                                isDone = true;
                            }
                        } else if (item.status === 'completed') {
                            isDone = true; 
                        }

                        if (isDone) completedCount++;
                        return { ...item, isDone };
                    });

                    // Calculamos el porcentaje de avance
                    const progress = Math.round((completedCount / quote.items.length) * 100);

                    return (
                        <Card key={quote.id} className="p-6 rounded-[2rem] border border-[#DFD2C4]/60 bg-white shadow-sm overflow-hidden relative">
                            {/* Barra de progreso visual en la parte superior de la tarjeta */}
                            <div className="absolute top-0 left-0 h-1 bg-[#FDFBF7] w-full">
                                <div className="h-full bg-[#5B6651] transition-all duration-1000" style={{width: `${progress}%`}}></div>
                            </div>
                            
                            <div className="flex justify-between items-start mb-4 mt-2 border-b border-[#DFD2C4]/40 pb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651] bg-[#5B6651]/10 px-3 py-1 rounded-lg border border-[#5B6651]/20">
                                        {quote.date}
                                    </span>
                                    <h3 className="text-lg font-black text-[#312923] mt-2 tracking-tight">Presupuesto #{quote.id.substring(quote.id.length - 4)}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-[#312923]">${quote.total.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">Total</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {processedItems.map((item, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${item.isDone ? 'bg-[#5B6651]/5 border-[#5B6651]/20' : 'bg-[#FDFBF7] border-[#DFD2C4]/50'}`}>
                                        <div className="flex items-center gap-3">
                                            {item.isDone ? (
                                                <CheckCircle size={18} className="text-[#5B6651]" />
                                            ) : (
                                                <Clock size={18} className="text-[#CBAAA2]" />
                                            )}
                                            <div>
                                                <p className={`text-sm font-bold ${item.isDone ? 'text-[#5B6651]' : 'text-[#312923]'}`}>{item.name}</p>
                                                {item.tooth && <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Pieza {item.tooth}</p>}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-[#6B615A]">${item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}