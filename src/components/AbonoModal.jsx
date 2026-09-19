import React from 'react';
import { X, User } from 'lucide-react';
import { InputField } from './UIComponents';
import { getLocalDate } from '../constants';

export default function AbonoModal({
    themeMode, selectedFinancialRecord, setModal, paymentInput, setPaymentInput,
    financialRecords, setFinancialRecords, saveToSupabase, notify,
    session, team = []
}) {
    if (!selectedFinancialRecord) return null;

    const totalPaid = (selectedFinancialRecord.payments || []).reduce((s, p) => s + p.amount, 0)
        + (selectedFinancialRecord.paid && !selectedFinancialRecord.payments ? selectedFinancialRecord.paid : 0);
    const debt = (selectedFinancialRecord.total || 0) - totalPaid;

    return (
        <div className="fixed inset-0 z-[100] bg-[#241F1B]/60 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md p-6 max-h-[95vh] overflow-y-auto shadow-2xl border border-[#D9D2C7]/50">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#D9D2C7]/50 pb-4 mb-5">
                    <div>
                        <h3 className="text-xl font-black text-[#241F1B]">{selectedFinancialRecord.patientName}</h3>
                        <p className="text-xs font-bold text-[#5E554E] mt-0.5">{selectedFinancialRecord.date}</p>
                    </div>
                    <button
                        onClick={() => setModal(null)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FBFAF8] text-[#5E554E] hover:bg-[#D9D2C7]/40 hover:text-[#241F1B] transition-colors border border-[#D9D2C7]/50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Stat boxes */}
                <div className="grid grid-cols-3 gap-2 text-center mb-5">
                    <div className="p-3 bg-[#FBFAF8] border border-[#D9D2C7]/50 rounded-2xl">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] mb-1">Total</p>
                        <p className="font-black text-[#241F1B]">${(selectedFinancialRecord.total || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-[#46523C]/5 border border-[#46523C]/20 rounded-2xl">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#46523C] mb-1">Pagado</p>
                        <p className="font-black text-[#46523C]">${totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-[#D3A9A0]/10 border border-[#D3A9A0]/20 rounded-2xl">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#D3A9A0] mb-1">Deuda</p>
                        <p className="font-black text-[#D3A9A0]">${debt.toLocaleString()}</p>
                    </div>
                </div>

                {/* New payment form */}
                <div className="bg-[#FBFAF8] border border-[#D9D2C7]/50 rounded-2xl p-4 mb-5 space-y-3">
                    <h4 className="font-black text-sm text-[#241F1B]">Registrar Nuevo Abono</h4>
                    <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] block">Fecha del pago</label>
                        <input
                            type="date"
                            value={paymentInput.date}
                            onChange={e => setPaymentInput({ ...paymentInput, date: e.target.value })}
                            className="w-full p-3 border border-[#D9D2C7] rounded-2xl bg-white text-[#241F1B] font-bold text-sm outline-none focus:border-[#46523C] transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <InputField
                            type="number"
                            placeholder="$ Monto"
                            value={paymentInput.amount}
                            onChange={e => setPaymentInput({ ...paymentInput, amount: e.target.value })}
                        />
                        <select
                            className="w-full p-3 rounded-2xl bg-white border border-[#D9D2C7] text-[#241F1B] font-bold text-xs outline-none focus:border-[#46523C] transition-colors"
                            value={paymentInput.method}
                            onChange={e => setPaymentInput({ ...paymentInput, method: e.target.value })}
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>
                        <InputField
                            placeholder="N° Boleta (Opc.)"
                            value={paymentInput.receiptNumber}
                            onChange={e => setPaymentInput({ ...paymentInput, receiptNumber: e.target.value })}
                        />
                    </div>
                    <button
                        className="w-full py-3 bg-[#46523C] hover:bg-[#36402F] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-colors"
                        onClick={async () => {
                            if (!paymentInput.amount) return;

                            const autor = session?.user?.email || 'Desconocido';
                            const newPayment = {
                                amount: Number(paymentInput.amount),
                                method: paymentInput.method,
                                date: getLocalDate(),
                                receiptNumber: paymentInput.receiptNumber,
                                received_by: autor
                            };

                            const currentPayments = selectedFinancialRecord.payments || [];
                            if (!selectedFinancialRecord.payments && selectedFinancialRecord.paid > 0) {
                                currentPayments.push({ amount: selectedFinancialRecord.paid, method: 'Histórico', date: selectedFinancialRecord.date });
                            }

                            const updatedPayments = [...currentPayments, newPayment];
                            const newTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
                            const nr = { ...selectedFinancialRecord, paid: newTotalPaid, payments: updatedPayments };

                            setFinancialRecords(financialRecords.map(h => h.id === nr.id ? nr : h));
                            await saveToSupabase('financials', nr.id, nr);

                            setModal(null);
                            setPaymentInput({ amount: '', method: 'Efectivo', date: getLocalDate(), receiptNumber: '' });
                            notify("Abono Registrado");
                        }}
                    >
                        Confirmar Pago
                    </button>
                </div>

                {/* Payment history */}
                <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E]">Historial de Pagos</p>
                    {(selectedFinancialRecord.payments || []).length > 0 ? (
                        selectedFinancialRecord.payments.map((p, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 bg-[#FBFAF8] border border-[#D9D2C7]/40 rounded-xl">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-[#5E554E] font-bold">{p.date}</span>
                                        <span className="font-black text-[#241F1B]">{p.method}</span>
                                        {p.receiptNumber && (
                                            <span className="text-[11px] bg-[#D9D2C7]/40 text-[#5E554E] px-1.5 py-0.5 rounded font-mono tracking-wider border border-[#D9D2C7]">
                                                Bol: {p.receiptNumber}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-black text-[#46523C]">+${p.amount.toLocaleString()}</span>
                                </div>
                                {p.received_by && (
                                    <div className="flex items-center gap-1 text-[#5E554E]">
                                        <User size={9} />
                                        <span className="text-[11px] uppercase tracking-widest font-black">
                                            Recibido por: {team.find(m => m.email === p.received_by)?.name || p.received_by.split('@')[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs font-bold text-[#5E554E] text-center py-4">Sin abonos registrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
