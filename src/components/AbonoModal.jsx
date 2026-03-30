import React from 'react';
import { X, User } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { getLocalDate } from '../constants';

export default function AbonoModal({
    themeMode, selectedFinancialRecord, setModal, paymentInput, setPaymentInput,
    financialRecords, setFinancialRecords, saveToSupabase, notify,
    session, team = [] // <-- NUEVOS CABLES
}) {
    if (!selectedFinancialRecord) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <Card theme={themeMode} className="w-full max-w-md space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <div>
                        <h3 className="text-xl font-bold">{selectedFinancialRecord.patientName}</h3>
                        <p className="text-xs opacity-50">{selectedFinancialRecord.date}</p>
                    </div>
                    <button onClick={()=>setModal(null)}><X/></button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-white/5 rounded-xl"><p className="text-[10px] uppercase opacity-50">Total</p><p className="font-bold">${(selectedFinancialRecord.total||0).toLocaleString()}</p></div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl"><p className="text-[10px] uppercase text-emerald-500">Pagado</p><p className="font-bold text-emerald-400">${((selectedFinancialRecord.payments||[]).reduce((s,p)=>s+p.amount,0) + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0)).toLocaleString()}</p></div>
                    <div className="p-3 bg-red-500/10 rounded-xl"><p className="text-[10px] uppercase text-red-500">Deuda</p><p className="font-bold text-red-400">${((selectedFinancialRecord.total||0) - ((selectedFinancialRecord.payments||[]).reduce((s,p)=>s+p.amount,0) + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0))).toLocaleString()}</p></div>
                </div>
                <div className="space-y-3 bg-white/5 p-4 rounded-xl">
                    <h4 className="font-bold text-sm">Registrar Nuevo Abono</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <InputField theme={themeMode} type="number" placeholder="$ Monto" value={paymentInput.amount} onChange={e=>setPaymentInput({...paymentInput, amount:e.target.value})} />
                        <select className="bg-[#121212] border border-white/10 rounded-xl px-2 p-3 text-xs font-bold outline-none text-white" value={paymentInput.method} onChange={e=>setPaymentInput({...paymentInput, method:e.target.value})}>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>
                        <InputField theme={themeMode} placeholder="N° Boleta (Opc.)" value={paymentInput.receiptNumber} onChange={e=>setPaymentInput({...paymentInput, receiptNumber:e.target.value})} />
                    </div>
                    <Button theme={themeMode} className="w-full" onClick={async ()=>{
                        if(!paymentInput.amount) return;
                        
                        // HUELLA DIGITAL: ¿Quién recibió la plata?
                        const autor = session?.user?.email || 'Desconocido';

                        const newPayment = { 
                            amount: Number(paymentInput.amount), 
                            method: paymentInput.method, 
                            date: getLocalDate(), // Usamos la fecha del sistema para consistencia
                            receiptNumber: paymentInput.receiptNumber,
                            received_by: autor // <-- Se guarda en cada abono individual
                        };
                        
                        const currentPayments = selectedFinancialRecord.payments || [];
                        if (!selectedFinancialRecord.payments && selectedFinancialRecord.paid > 0) {
                            currentPayments.push({ amount: selectedFinancialRecord.paid, method: 'Histórico', date: selectedFinancialRecord.date });
                        }
                        
                        const updatedPayments = [...currentPayments, newPayment];
                        const newTotalPaid = updatedPayments.reduce((s,p)=>s+p.amount, 0);
                        const nr = {...selectedFinancialRecord, paid: newTotalPaid, payments: updatedPayments}; 
                        
                        setFinancialRecords(financialRecords.map(h => h.id === nr.id ? nr : h));
                        await saveToSupabase('financials', nr.id, nr); 
                        
                        setModal(null); 
                        setPaymentInput({amount:'', method:'Efectivo', date: getLocalDate(), receiptNumber: ''}); 
                        notify("Abono Registrado");
                    }}>CONFIRMAR PAGO</Button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                    <p className="text-[10px] font-bold opacity-50 uppercase">Historial de Pagos</p>
                    {(selectedFinancialRecord.payments || []).length > 0 ? (selectedFinancialRecord.payments.map((p, i) => (
                        <div key={i} className="flex flex-col gap-1 p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex gap-2 items-center">
                                    <span className="opacity-50">{p.date}</span> 
                                    <span className="font-bold">{p.method}</span>
                                    {p.receiptNumber && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-stone-300 font-mono tracking-wider border border-white/10">Bol: {p.receiptNumber}</span>}
                                </div>
                                <span className="font-bold text-emerald-400">+${p.amount.toLocaleString()}</span>
                            </div>
                            {/* MOSTRAR HUELLA DIGITAL */}
                            {p.received_by && (
                                <div className="flex items-center gap-1 opacity-50">
                                    <User size={8} />
                                    <span className="text-[8px] uppercase tracking-widest font-black">
                                        Recibido por: {team.find(m => m.email === p.received_by)?.name || p.received_by.split('@')[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))) : <p className="text-xs opacity-30 text-center">Sin abonos registrados.</p>}
                </div>
            </Card>
        </div>
    );
}