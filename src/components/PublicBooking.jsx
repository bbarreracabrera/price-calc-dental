import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, Phone, FileText, CheckCircle2, ChevronRight, Stethoscope, ArrowLeft, Mail, CreditCard, Loader } from 'lucide-react';
import { formatRUT } from '../constants';

export default function PublicBooking({ clinicId, supabase, notify }) {
    const [clinicConfig, setClinicConfig] = useState(null);
    const [adminEmail, setAdminEmail] = useState(null);
    const [loading, setLoading] = useState(true);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        rut: '',
        name: '',
        phone: '',
        email: '',
        reason: '',
        date: '',
        time: ''
    });

    const [honeypot, setHoneypot] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requiresPayment, setRequiresPayment] = useState(false);

    const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    useEffect(() => {
        const fetchClinicData = async () => {
            try {
                const { data, error } = await supabase
                    .from('public_clinic_info')
                    .select('admin_email, data')
                    .eq('data->>publicSlug', clinicId)
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    setClinicConfig(data.data);
                    setAdminEmail(data.admin_email);
                } else {
                    console.warn("No se encontró ninguna clínica con el enlace:", clinicId);
                }
            } catch (err) {
                console.error("Error cargando clínica:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClinicData();
    }, [clinicId, supabase]);

    const generateTimeSlots = (start, end) => {
        if (!start || !end) return [];
        const slots = [];
        let [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let current = new Date();
        current.setHours(startHour, startMin, 0, 0);
        const endLimit = new Date();
        endLimit.setHours(endHour, endMin, 0, 0);

        const SLOT_DURATION_MINS = 30;

        while (current < endLimit) {
            const startTimeStr = current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
            const next = new Date(current);
            next.setMinutes(next.getMinutes() + SLOT_DURATION_MINS);
            const endTimeStr = next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (next <= endLimit) {
                slots.push({ id: startTimeStr, display: `${startTimeStr} - ${endTimeStr}` });
            }
            current.setMinutes(current.getMinutes() + SLOT_DURATION_MINS);
        }
        return slots;
    };

    const handleDateSelect = async (dateStr) => {
        const year = parseInt(dateStr?.split('-')[0], 10);
        if (!dateStr || year < 2000 || year > 2100) return;

        setFormData({ ...formData, date: dateStr, time: '' });
        if (!clinicConfig?.schedule) return;

        const dateObj = new Date(`${dateStr}T12:00:00`);
        const dayName = daysMap[dateObj.getDay()];
        const dayConfig = clinicConfig.schedule[dayName];

        if (!dayConfig || !dayConfig.active) {
            setAvailableTimes([]);
            return;
        }

        let allSlots = [
            ...generateTimeSlots(dayConfig.start1, dayConfig.end1),
            ...generateTimeSlots(dayConfig.start2, dayConfig.end2)
        ];

        try {
            const { data: appts, error } = await supabase
                .from('public_appointments_availability')
                .select('time, duration')
                .eq('admin_email', adminEmail)
                .eq('date', dateStr);

            if (error) throw error;

            if (appts && appts.length > 0) {
                const toMins = (t) => { const [h, m] = t.split(':').map(Number); return (h * 60) + m; };
                allSlots = allSlots.filter(slot => {
                    const slotStart = toMins(slot.id);
                    const slotEnd = slotStart + 30;
                    const isOccupied = appts.some(appt => {
                        const apptStart = toMins(appt.time);
                        const apptEnd = apptStart + (Number(appt.duration) || 30);
                        return slotStart < apptEnd && slotEnd > apptStart;
                    });
                    return !isOccupied;
                });
            }
        } catch (err) {
            console.error("Error revisando disponibilidad", err);
        }

        setAvailableTimes(allSlots);
    };

    const handleSubmit = async () => {
        if (honeypot !== '') return setStep(4);
        if (!formData.name || !formData.phone || !formData.date || !formData.time) {
            return alert("Por favor completa todos los campos requeridos.");
        }

        setIsSubmitting(true);
        try {
            const needsPayment = !!(clinicConfig?.require_payment_at_booking && clinicConfig?.appointment_price > 0);
            const apptId = `appt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const cancelToken = crypto.randomUUID();

            const { error: apptError } = await supabase
                .from('appointments')
                .insert([{
                    id: apptId,
                    admin_email: adminEmail,
                    data: {
                        id: apptId,
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        treatment: formData.reason || 'Consulta General (Agendado Online)',
                        date: formData.date,
                        time: formData.time,
                        duration: 30,
                        status: needsPayment ? 'pending_payment' : 'agendado',
                        cancel_token: cancelToken,
                        created_at: new Date().toISOString(),
                    }
                }]);

            if (apptError) throw apptError;

            // Crear registro de paciente
            const patientId = `pac_${formData.rut.replace(/\./g, '').replace(/-/g, '') || Date.now().toString()}`;
            const { error: patientError } = await supabase
                .from('patients')
                .insert([{
                    id: patientId,
                    admin_email: adminEmail,
                    data: { id: patientId, personal: { legalName: formData.name, rut: formData.rut, phone: formData.phone, email: formData.email } }
                }]);
            if (patientError) console.warn('No se pudo crear registro de paciente:', patientError.message);

            // Notificar al dentista y al paciente — no bloquea el flujo si falla
            try {
                await supabase.functions.invoke('notify-booking', {
                    body: {
                        clinic_email: adminEmail,
                        clinic_name: clinicConfig?.name,
                        clinic_phone: clinicConfig?.phone,
                        clinic_address: clinicConfig?.address,
                        patient_name: formData.name,
                        patient_email: formData.email || null,
                        patient_phone: formData.phone,
                        date: formData.date,
                        time: formData.time,
                        treatment: formData.reason || 'Consulta General',
                        payment_status: needsPayment ? 'pending_payment' : 'scheduled',
                        cancel_token: cancelToken,
                        appointment_id: apptId,
                    }
                });
            } catch (err) {
                console.error('Error enviando notificación de reserva:', err);
            }

            // Si requiere pago → llamar Edge Function y abrir MP
            if (needsPayment) {
                const { data: payData, error: payError } = await supabase.functions.invoke(
                    'create-payment',
                    {
                        body: {
                            clinic_email: adminEmail,
                            patient_name: formData.name,
                            patient_email: formData.email || '',
                            amount: clinicConfig.appointment_price,
                            description: `Reserva ${formData.reason || 'Consulta'} — ${formData.date} ${formData.time}`,
                            appointment_id: apptId,
                        },
                    }
                );

                if (payError || payData?.error) {
                    console.error('Error al iniciar pago:', payError || payData?.error);
                    // La cita quedó creada con status pending_payment; avisamos pero igual avanzamos
                    setRequiresPayment(true);
                    setStep(4);
                    return;
                }

                window.open(payData.init_point, '_blank', 'noopener,noreferrer');
                setRequiresPayment(true);
                setStep(4);
                return;
            }

            // Flujo sin pago
            setStep(4);
        } catch (err) {
            alert("Hubo un error al agendar tu cita.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><p className="animate-pulse font-bold text-[#A3968B] uppercase tracking-widest">Conectando con la Clínica...</p></div>;
    if (!clinicConfig || !adminEmail) return <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7]"><Stethoscope size={48} className="text-[#DFD2C4] mb-4"/><p className="font-black text-[#312923] text-xl tracking-tighter">Enlace Inválido</p></div>;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {clinicConfig.logo ? (
                    <img src={clinicConfig.logo} alt="Logo" className="h-20 mx-auto mb-4 drop-shadow-md" />
                ) : (
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 border border-[#DFD2C4]">
                        <Stethoscope size={32} className="text-[#CBAAA2]"/>
                    </div>
                )}
                <h1 className="text-3xl font-black text-[#312923] tracking-tighter">{clinicConfig.name}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-2">Portal de Agendamiento</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[#DFD2C4]/60 p-8">
                {/* STEP 1 — Datos personales */}
                {step === 1 && (
                    <div className="space-y-5 animate-in slide-in-from-right">
                        <h3 className="font-black text-xl text-[#312923]">Tus Datos</h3>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Nombre Completo *</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                <input type="text" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]" placeholder="Ej. Juan Pérez" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">RUT (Opcional)</label>
                            <input type="text" className="w-full px-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]" placeholder="12.345.678-9" value={formData.rut} onChange={e=>setFormData({...formData, rut: formatRUT(e.target.value)})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Teléfono *</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                <input type="tel" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]" placeholder="+56 9..." value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} />
                            </div>
                        </div>
                        {clinicConfig?.require_payment_at_booking && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Correo electrónico <span className="text-[#CBAAA2]">*</span></label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                    <input type="email" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]" placeholder="tu@correo.com" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                                </div>
                                <p className="text-[10px] font-bold text-[#9A8F84] ml-2">Necesario para el recibo de pago</p>
                            </div>
                        )}
                        <button
                            disabled={!formData.name || !formData.phone || (clinicConfig?.require_payment_at_booking && !formData.email)}
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            Continuar <ChevronRight size={16}/>
                        </button>
                    </div>
                )}

                {/* STEP 2 — Motivo */}
                {step === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right">
                        <button onClick={() => setStep(1)} className="text-[#9A8F84] mb-4 hover:text-[#312923] transition-colors"><ArrowLeft size={20}/></button>
                        <h3 className="font-black text-xl text-[#312923]">Motivo de Consulta</h3>
                        <textarea rows="4" className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] resize-none" placeholder="Ej: Limpieza dental..." value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} />
                        <button onClick={() => setStep(3)} className="w-full py-4 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
                            Elegir Fecha <ChevronRight size={16}/>
                        </button>
                    </div>
                )}

                {/* STEP 3 — Fecha y hora */}
                {step === 3 && (
                    <div className="space-y-5 animate-in slide-in-from-right">
                        <button onClick={() => setStep(2)} className="text-[#9A8F84] mb-4 hover:text-[#312923] transition-colors"><ArrowLeft size={20}/></button>
                        <h3 className="font-black text-xl text-[#312923]">Disponibilidad</h3>
                        <input type="date" min={new Date().toISOString().split('T')[0]} className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] font-bold text-[#312923]" value={formData.date} onChange={e=>handleDateSelect(e.target.value)} />

                        {formData.date && (
                            <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                                {availableTimes.length === 0 ? (
                                    <p className="col-span-2 text-center p-4 text-red-500 font-bold text-sm">Sin horarios disponibles.</p>
                                ) : (
                                    availableTimes.map(slot => (
                                        <button key={slot.id} onClick={() => setFormData({...formData, time: slot.id})} className={`py-3 rounded-xl text-xs font-black transition-all border ${formData.time === slot.id ? 'bg-[#5B6651] text-white border-[#5B6651]' : 'bg-white border-[#DFD2C4] text-[#A3968B]'}`}>
                                            {slot.display}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* PASO 4 — Banner de monto antes de confirmar */}
                        {clinicConfig?.require_payment_at_booking && clinicConfig?.appointment_price > 0 && (
                            <div className="flex items-center gap-4 p-4 bg-[#CBAAA2]/10 border border-[#CBAAA2]/30 rounded-2xl">
                                <CreditCard size={24} className="text-[#CBAAA2] shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Monto a pagar</p>
                                    <p className="text-xl font-black text-[#312923]">
                                        ${clinicConfig.appointment_price.toLocaleString('es-CL')} CLP
                                    </p>
                                    <p className="text-[10px] font-bold text-[#9A8F84] mt-0.5">
                                        Tu hora se confirma al completar el pago
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={!formData.date || !formData.time || isSubmitting}
                            onClick={handleSubmit}
                            className="w-full py-4 bg-[#CBAAA2] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {isSubmitting
                                ? <><Loader size={16} className="animate-spin"/> PROCESANDO...</>
                                : clinicConfig?.require_payment_at_booking
                                    ? <><CreditCard size={16}/> RESERVAR Y PAGAR</>
                                    : 'CONFIRMAR RESERVA'
                            }
                        </button>
                    </div>
                )}

                {/* STEP 4 — Confirmación */}
                {step === 4 && (
                    <div className="text-center py-8 animate-in zoom-in-95">
                        {requiresPayment ? (
                            <>
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CreditCard size={32} className="text-amber-500" />
                                </div>
                                <h3 className="font-black text-2xl text-[#312923] mb-2 tracking-tighter">Reserva Pendiente</h3>
                                <p className="text-sm font-bold text-[#9A8F84] leading-relaxed mb-3">
                                    Se abrió una pestaña con MercadoPago para completar tu pago.
                                </p>
                                <p className="text-xs font-bold text-[#CBAAA2]">
                                    Tu hora quedará confirmada una vez que el pago sea procesado.
                                </p>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={48} className="text-[#5B6651] mx-auto mb-6" />
                                <h3 className="font-black text-2xl text-[#312923] mb-2 tracking-tighter">¡Cita Confirmada!</h3>
                                <p className="text-sm font-bold text-[#9A8F84]">
                                    Te esperamos el {formData.date.split('-').reverse().join('/')} a las {formData.time}.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
