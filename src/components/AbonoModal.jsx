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
        <div className="fixed inset-0 z-[100] bg-[#312923]/60 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md p-6 max-h-[95vh] overflow-y-auto shadow-2xl border border-[#DFD2C4]/50">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#DFD2C4]/50 pb-4 mb-5">
                    <div>
                        <h3 className="text-xl font-black text-[#312923]">{selectedFinancialRecord.patientName}</h3>
                        <p className="text-xs font-bold text-[#9A8F84] mt-0.5">{selectedFinancialRecord.date}</p>
                    </div>
                    <button
                        onClick={() => setModal(null)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FDFBF7] text-[#9A8F84] hover:bg-[#DFD2C4]/40 hover:text-[#312923] transition-colors border border-[#DFD2C4]/50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Stat boxes */}
                <div className="grid grid-cols-3 gap-2 text-center mb-5">
                    <div className="p-3 bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1">Total</p>
                        <p className="font-black text-[#312923]">${(selectedFinancialRecord.total || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-[#5B6651]/5 border border-[#5B6651]/20 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#5B6651] mb-1">Pagado</p>
                        <p className="font-black text-[#5B6651]">${totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-[#CBAAA2]/10 border border-[#CBAAA2]/20 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#CBAAA2] mb-1">Deuda</p>
                        <p className="font-black text-[#CBAAA2]">${debt.toLocaleString()}</p>
                    </div>
                </div>

                {/* New payment form */}
                <div className="bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl p-4 mb-5 space-y-3">
                    <h4 className="font-black text-sm text-[#312923]">Registrar Nuevo Abono</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <InputField
                            type="number"
                            placeholder="$ Monto"
                            value={paymentInput.amount}
                            onChange={e => setPaymentInput({ ...paymentInput, amount: e.target.value })}
                        />
                        <select
                            className="w-full p-3 rounded-2xl bg-white border border-[#DFD2C4] text-[#312923] font-bold text-xs outline-none focus:border-[#5B6651] transition-colors"
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
                        className="w-full py-3 bg-[#5B6651] hover:bg-[#4a5442] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-colors"
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Historial de Pagos</p>
                    {(selectedFinancialRecord.payments || []).length > 0 ? (
                        selectedFinancialRecord.payments.map((p, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 bg-[#FDFBF7] border border-[#DFD2C4]/40 rounded-xl">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-[#9A8F84] font-bold">{p.date}</span>
                                        <span className="font-black text-[#312923]">{p.method}</span>
                                        {p.receiptNumber && (
                                            <span className="text-[9px] bg-[#DFD2C4]/40 text-[#6B615A] px-1.5 py-0.5 rounded font-mono tracking-wider border border-[#DFD2C4]">
                                                Bol: {p.receiptNumber}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-black text-[#5B6651]">+${p.amount.toLocaleString()}</span>
                                </div>
                                {p.received_by && (
                                    <div className="flex items-center gap-1 text-[#9A8F84]">
                                        <User size={9} />
                                        <span className="text-[8px] uppercase tracking-widest font-black">
                                            Recibido por: {team.find(m => m.email === p.received_by)?.name || p.received_by.split('@')[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs font-bold text-[#9A8F84] text-center py-4">Sin abonos registrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
