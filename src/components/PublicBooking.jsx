import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, Phone, FileText, CheckCircle2, ChevronRight, Stethoscope, ArrowLeft, Mail, CreditCard, Loader } from 'lucide-react';
import { formatRUT } from '../constants';
import { validateRUT } from '../utils/rutValidator';

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
    const [lastSubmitTime, setLastSubmitTime] = useState(0);
    const [submitCount, setSubmitCount] = useState(0);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requiresPayment, setRequiresPayment] = useState(false);
    const [acceptedDataPolicy, setAcceptedDataPolicy] = useState(false);
    const [formError, setFormError] = useState('');
    const [rutError, setRutError] = useState('');

    // Normaliza require_payment_at_booking: JSONB puede devolver boolean o string según el origen
    const requirePayment = clinicConfig?.require_payment_at_booking === true || clinicConfig?.require_payment_at_booking === 'true';
    const appointmentPrice = Number(clinicConfig?.appointment_price) || 0;

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

    const generateTimeSlots = (start, end, selectedDate) => {
        if (!start || !end) return [];
        const slots = [];
        let [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        const isToday = selectedDate === new Date().toISOString().split('T')[0];
        const now = new Date();

        let current = new Date();
        current.setHours(startHour, startMin, 0, 0);
        const endLimit = new Date();
        endLimit.setHours(endHour, endMin, 0, 0);

        const SLOT_DURATION_MINS = 30;

        while (current < endLimit) {
            if (isToday && current <= now) {
                current.setMinutes(current.getMinutes() + SLOT_DURATION_MINS);
                continue;
            }
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
            ...generateTimeSlots(dayConfig.start1, dayConfig.end1, dateStr),
            ...generateTimeSlots(dayConfig.start2, dayConfig.end2, dateStr)
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
        if (honeypot !== '') {
            setStep(4);
            return;
        }

        const now = Date.now();
        if (lastSubmitTime > 0 && now - lastSubmitTime < 5000) {
            setFormError('Por favor espera unos segundos antes de intentar de nuevo.');
            return;
        }
        if (submitCount >= 3) {
            setFormError('Demasiados intentos. Recarga la página o intenta más tarde.');
            return;
        }
        setLastSubmitTime(now);
        setSubmitCount(c => c + 1);

        if (!formData.name || !formData.phone || !formData.date || !formData.time) {
            setFormError("Por favor completa todos los campos requeridos.");
            return;
        }
        setFormError('');

        setIsSubmitting(true);
        try {
            const needsPayment = requirePayment && appointmentPrice > 0;
            const apptId = `appt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const cancelToken = crypto.randomUUID();

            let consentIp = 'unknown';
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json', {
                    signal: AbortSignal.timeout(3000)
                });
                const { ip } = await ipResponse.json();
                consentIp = ip;
            } catch { /* keep 'unknown' */ }

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
                        status: 'pending_payment', // Siempre inicia como pendiente de pago si requiere pago
                        cancel_token: cancelToken,
                        created_at: new Date().toISOString(),
                        consent_accepted: acceptedDataPolicy,
                        consent_version: '1.0',
                        consent_timestamp: new Date().toISOString(),
                        consent_user_agent: navigator.userAgent,
                        consent_screen: `${window.screen.width}x${window.screen.height}`,
                        consent_language: navigator.language,
                        consent_ip: consentIp,
                    }
                }]);

            if (apptError) throw apptError;

            // Crear o actualizar registro de paciente (upsert evita 409 si ya existe)
            const patientId = `pac_${formData.rut.replace(/\./g, '').replace(/-/g, '') || Date.now().toString()}`;
            const { error: patientError } = await supabase
                .from('patients')
                .upsert({
                    id: patientId,
                    admin_email: adminEmail,
                    data: { id: patientId, personal: { legalName: formData.name, rut: formData.rut, phone: formData.phone, email: formData.email } }
                }, { onConflict: 'id', ignoreDuplicates: false });
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
                        status: 'pending_payment', // Siempre inicia como pendiente de pago si requiere pago
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
                            amount: appointmentPrice,
                            description: `Reserva ${formData.reason || 'Consulta'} — ${formData.date} ${formData.time}`,
                            appointment_id: apptId,
                        },
                    }
                );

                if (payError || payData?.error) {
                    console.error('Error al iniciar pago:', payError || payData?.error);
                    setRequiresPayment(true);
                    setStep(4);
                    return;
                }

                const popup = window.open(payData.init_point, '_blank', 'noopener,noreferrer');
                localStorage.setItem('pending_appointment_id', apptId); // Guardar el ID de la cita pendiente
                if (!popup) {
                    notify('Tu navegador bloqueó la ventana de pago. Permite popups para este sitio y vuelve a intentar.');
                }
                setRequiresPayment(true);
                setStep(4); // Mantener el paso 4 para mostrar el mensaje de pago pendiente
                return;
            }

            // Flujo sin pago
            setStep(4);
        } catch (err) {
            setFormError("Hubo un error al agendar tu cita. Por favor intenta nuevamente.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><p className="animate-pulse font-bold text-[#A3968B] uppercase tracking-widest">Conectando con la Clínica...</p></div>;
    useEffect(() => {
        const checkPaymentStatus = async () => {
            const pendingApptId = localStorage.getItem('pending_appointment_id');
            if (pendingApptId) {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('data')
                    .eq('id', pendingApptId)
                    .single();

                if (error) {
                    console.error('Error al verificar el estado del pago:', error);
                    return;
                }

                if (data?.data?.status === 'agendado') {
                    notify('¡Tu cita ha sido confirmada!');
                    localStorage.removeItem('pending_appointment_id');
                    setStep(4); // O el paso final de éxito
                } else if (data?.data?.status === 'rechazado') {
                    notify('El pago fue rechazado. Por favor, intenta de nuevo.');
                    localStorage.removeItem('pending_appointment_id');
                    setStep(3); // Volver al paso de pago
                }
            }
        };
        checkPaymentStatus();
    }, [supabase, notify]);

    if (!clinicConfig || !adminEmail) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center"><h1 className="text-2xl font-black text-[#312923] mb-4">Clínica no encontrada</h1><p className="text-[#6B615A]">Asegúrate de que el enlace sea correcto.</p></div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#CBAAA2] selection:text-white">
            <div className="bg-white rounded-[2rem] border border-[#DFD2C4]/50 p-6 sm:p-10 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <h1 className="text-3xl font-black text-[#312923] tracking-tight mb-6 text-center">Agenda tu Cita en {clinicConfig.name}</h1>

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[#A3968B] mb-4">
                            <CalendarDays size={20} />
                            <span className="font-black text-sm uppercase tracking-widest">Paso 1: Elige Fecha y Hora</span>
                        </div>
                        <label className="block text-sm font-bold text-[#6B615A] mb-2">Fecha</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleDateSelect(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                        />
                        {formData.date && availableTimes.length > 0 && (
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-[#6B615A] mb-2">Hora</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-2 rounded-xl border border-[#DFD2C4]/50 bg-[#FDFBF7]">
                                    {availableTimes.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setFormData({ ...formData, time: slot.id })}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${formData.time === slot.id ? 'bg-[#5B6651] text-white shadow-md' : 'bg-white text-[#6B615A] hover:bg-[#F0EDE9] border border-[#DFD2C4]'}`}
                                        >
                                            {slot.id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {formData.date && availableTimes.length === 0 && (
                            <p className="text-sm font-bold text-red-500 mt-4">No hay horas disponibles para esta fecha.</p>
                        )}
                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.date || !formData.time}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg shadow-[#312923]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                        >
                            Siguiente <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[#A3968B] mb-4 hover:text-[#312923] transition-colors">
                            <ArrowLeft size={16} /> <span className="font-black text-sm uppercase tracking-widest">Volver</span>
                        </button>
                        <div className="flex items-center gap-2 text-[#A3968B] mb-4">
                            <User size={20} />
                            <span className="font-black text-sm uppercase tracking-widest">Paso 2: Tus Datos</span>
                        </div>
                        <label className="block text-sm font-bold text-[#6B615A] mb-2">Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Tu Nombre Completo"
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                        />
                        <label className="block text-sm font-bold text-[#6B615A] mb-2">RUT (sin puntos ni guion)</label>
                        <input
                            type="text"
                            value={formData.rut}
                            onChange={(e) => {
                                const rawRut = e.target.value.replace(/[^0-9kK]/g, '');
                                setFormData({ ...formData, rut: rawRut });
                                if (rawRut && !validateRUT(rawRut)) {
                                    setRutError('RUT inválido');
                                } else {
                                    setRutError('');
                                }
                            }}
                            placeholder="Ej: 12345678K"
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                        />
                        {rutError && <p className="text-red-500 text-xs mt-1">{rutError}</p>}
                        <label className="block text-sm font-bold text-[#6B615A] mb-2">Teléfono</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Ej: +56912345678"
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                        />
                        {(requirePayment || clinicConfig?.require_email_for_booking === true || clinicConfig?.require_email_for_booking === 'true') && (
                            <>
                                <label className="block text-sm font-bold text-[#6B615A] mb-2">Email (para confirmación)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="tu@correo.com"
                                    className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                                />
                            </>
                        )}
                        <label className="block text-sm font-bold text-[#6B615A] mb-2">Motivo de la Cita (opcional)</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Ej: Limpieza dental, Evaluación, etc."
                            rows="3"
                            className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] transition-colors shadow-sm"
                        ></textarea>
                        <div className="flex items-center mt-4">
                            <input
                                type="checkbox"
                                id="dataPolicy"
                                checked={acceptedDataPolicy}
                                onChange={(e) => setAcceptedDataPolicy(e.target.checked)}
                                className="h-4 w-4 text-[#5B6651] focus:ring-[#5B6651] border-[#DFD2C4] rounded"
                            />
                            <label htmlFor="dataPolicy" className="ml-2 block text-sm text-[#6B615A]">
                                Acepto la política de privacidad y el tratamiento de mis datos.
                            </label>
                        </div>
                        {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
                        <input type="text" name="honeypot" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ display: 'none' }} />
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name || !formData.phone || !acceptedDataPolicy || rutError}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg shadow-[#312923]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                        >
                            {isSubmitting ? <><Loader size={16} className="animate-spin" /> Agendando...</> : <>{requirePayment && appointmentPrice > 0 ? `Pagar $${appointmentPrice.toLocaleString('es-CL')} y Agendar` : 'Agendar Cita'} <ChevronRight size={16} /></>}
                        </button>
                        {requirePayment && appointmentPrice > 0 && (
                            <p className="text-xs font-bold text-[#9A8F84] mt-3 text-center">Se abrirá una ventana de MercadoPago para completar el pago.</p>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 text-center">
                        <div className="flex items-center gap-2 text-[#A3968B] mb-4 justify-center">
                            <CreditCard size={20} />
                            <span className="font-black text-sm uppercase tracking-widest">Paso 3: Confirmar Pago</span>
                        </div>
                        <h2 className="text-2xl font-black text-[#312923] mb-4">Pago Requerido</h2>
                        <p className="text-[#6B615A] text-base mb-6">Para confirmar tu cita, se requiere un pago de <span className="font-black">${appointmentPrice.toLocaleString('es-CL')} CLP</span>.</p>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#009ee3] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#007ab8] transition-all shadow-lg shadow-[#009ee3]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <><Loader size={16} className="animate-spin" /> Redirigiendo a MercadoPago...</> : <>Pagar con MercadoPago <ChevronRight size={16} /></>}
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#A3968B] hover:text-[#312923] transition-colors"
                        >
                            Volver a mis datos
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 text-center">
                        <CheckCircle2 size={48} className="text-[#5B6651] mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-[#312923] mb-2">¡Cita Agendada!</h2>
                        <p className="text-[#6B615A] text-base">
                            Tu hora ha sido agendada con éxito. Recibirás un correo de confirmación pronto.
                        </p>
                        {requiresPayment && (
                            <p className="text-[#6B615A] text-sm mt-4">
                                Tu hora quedará confirmada una vez que el pago sea procesado por MercadoPago.
                            </p>
                        )}
                        <button
                            onClick={() => {
                                setStep(1);
                                setFormData({ rut: '', name: '', phone: '', email: '', reason: '', date: '', time: '' });
                                setAcceptedDataPolicy(false);
                                setRequiresPayment(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg shadow-[#312923]/20 mt-6"
                        >
                            Agendar otra cita
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
