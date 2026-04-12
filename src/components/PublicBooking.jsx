import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, Phone, FileText, CheckCircle2, ChevronRight, Stethoscope, ArrowLeft } from 'lucide-react';
import { formatRUT } from '../constants';

export default function PublicBooking({ clinicId, supabase, notify }) {
    const [clinicConfig, setClinicConfig] = useState(null);
    const [adminEmail, setAdminEmail] = useState(null); 
    const [loading, setLoading] = useState(true);
    
    // Estados del formulario
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        rut: '',
        name: '',
        phone: '',
        reason: '',
        date: '',
        time: '' 
    });

    const [honeypot, setHoneypot] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    useEffect(() => {
        const fetchClinicData = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('admin_email, data')
                    .eq('id', 'general')
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
                slots.push({
                    id: startTimeStr, 
                    display: `${startTimeStr} - ${endTimeStr}` 
                });
            }
            current.setMinutes(current.getMinutes() + SLOT_DURATION_MINS);
        }
        return slots;
    };

    // --- 🛡️ LÓGICA DE FILTRADO CORREGIDA (RANGOS DE TIEMPO) ---
    const handleDateSelect = async (dateStr) => {
        setFormData({ ...formData, date: dateStr, time: '' });
        if (!clinicConfig?.schedule) return;

        const dateObj = new Date(`${dateStr}T12:00:00`); 
        const dayName = daysMap[dateObj.getDay()];
        const dayConfig = clinicConfig.schedule[dayName];

        if (!dayConfig || !dayConfig.active) {
            setAvailableTimes([]);
            return;
        }

        // 1. Generamos todos los posibles slots del día
        let allSlots = [
            ...generateTimeSlots(dayConfig.start1, dayConfig.end1),
            ...generateTimeSlots(dayConfig.start2, dayConfig.end2)
        ];

        try {
            // 2. Consultamos TODAS las citas de ese día para esta clínica
            const { data: appts, error } = await supabase
                .from('appointments')
                .select('data')
                .eq('admin_email', adminEmail)
                .eq('data->>date', dateStr);
            
            if (error) throw error;

            if (appts && appts.length > 0) {
                // Función auxiliar: convierte "HH:mm" a minutos totales
                const toMins = (t) => {
                    const [h, m] = t.split(':').map(Number);
                    return (h * 60) + m;
                };

                // 3. Filtramos los slots comparando si colisionan con el rango de alguna cita
                allSlots = allSlots.filter(slot => {
                    const slotStart = toMins(slot.id);
                    const slotEnd = slotStart + 30; // Cada botón dura 30 mins

                    const isOccupied = appts.some(appt => {
                        const a = appt.data;
                        const apptStart = toMins(a.time);
                        // Si la cita no tiene duración, asumimos 30 mins
                        const apptEnd = apptStart + (Number(a.duration) || 30);

                        // Lógica de colisión: el slot está ocupado si...
                        // (El slot empieza antes de que termine la cita) Y (El slot termina después de que empiece la cita)
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
            const newApptId = Date.now().toString();
            const appointmentData = {
                id: newApptId,
                name: formData.name,
                treatment: formData.reason || 'Consulta General (Agendado Online)',
                date: formData.date,
                time: formData.time, 
                duration: 30, 
                status: 'agendado'
            };

            const { error: apptError } = await supabase
                .from('appointments')
                .insert([{ id: newApptId, admin_email: adminEmail, data: appointmentData }]);

            if (apptError) throw apptError;
            
            const patientId = `pac_${formData.rut.replace(/\./g, '').replace(/-/g, '') || Date.now().toString()}`;
            const patientData = {
                id: patientId,
                personal: { legalName: formData.name, rut: formData.rut, phone: formData.phone }
            };
            await supabase.from('patients').upsert([{ id: patientId, admin_email: adminEmail, data: patientData }]);

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
                        <button disabled={!formData.name || !formData.phone} onClick={() => setStep(2)} className="w-full py-4 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
                            Continuar <ChevronRight size={16}/>
                        </button>
                    </div>
                )}

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

                        <button disabled={!formData.date || !formData.time || isSubmitting} onClick={handleSubmit} className="w-full py-4 bg-[#CBAAA2] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg">
                            {isSubmitting ? 'CONFIRMANDO...' : 'CONFIRMAR RESERVA'}
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center py-8 animate-in zoom-in-95">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-6" />
                        <h3 className="font-black text-2xl text-[#312923] mb-2">¡Cita Confirmada!</h3>
                        <p className="text-sm font-bold text-[#9A8F84]">Te esperamos el {formData.date.split('-').reverse().join('/')} a las {formData.time}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}