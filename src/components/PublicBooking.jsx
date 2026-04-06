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

    // --- 🛡️ NUEVO: ESTADO HONEYPOT PARA BLOQUEAR BOTS ---
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
    }, [clinicId, supabase, notify]);

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
            const startTimeStr = current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            
            const next = new Date(current);
            next.setMinutes(next.getMinutes() + SLOT_DURATION_MINS);
            const endTimeStr = next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

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

        let allSlots = [
            ...generateTimeSlots(dayConfig.start1, dayConfig.end1),
            ...generateTimeSlots(dayConfig.start2, dayConfig.end2)
        ];

        try {
            const { data: takenTimes, error } = await supabase
                .rpc('get_occupied_slots', {
                    clinic_email: adminEmail,
                    check_date: dateStr
                });
            
            if (error) throw error;

            if (takenTimes && takenTimes.length > 0) {
                const timesToBlock = takenTimes.map(t => t.occupied_time);
                allSlots = allSlots.filter(slot => !timesToBlock.includes(slot.id));
            }
        } catch (err) {
            console.error("Error revisando disponibilidad", err);
        }

        setAvailableTimes(allSlots);
    };

    const handleSubmit = async () => {
        // --- 🛡️ LÓGICA HONEYPOT: SI ESTÁ LLENO, ES UN BOT ---
        if (honeypot !== '') {
            console.warn("🤖 Bot detectado por Honeypot. Bloqueando inserción.");
            setStep(4); // Falso éxito: lo mandamos al final para que deje de molestar
            return; 
        }

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
            
            const patientId = `pac_${formData.rut || Date.now().toString()}`;
            const patientData = {
                id: patientId,
                personal: { legalName: formData.name, rut: formData.rut, phone: formData.phone }
            };
            await supabase.from('patients').upsert([{ id: patientId, admin_email: adminEmail, data: patientData }]);

            setStep(4);
        } catch (err) {
            alert("Hubo un error al agendar tu cita. Intenta de nuevo.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><p className="animate-pulse font-bold text-[#A3968B] uppercase tracking-widest">Conectando con la Clínica...</p></div>;

    if (!clinicConfig || !adminEmail) return <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7]"><Stethoscope size={48} className="text-[#DFD2C4] mb-4"/><p className="font-black text-[#312923] text-xl tracking-tighter">Enlace Inválido</p><p className="text-xs font-bold text-[#9A8F84] uppercase tracking-widest mt-2">La clínica que buscas no existe o cambió su link.</p></div>;

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
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mt-2">Portal de Agendamiento de Pacientes</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-[#DFD2C4]/50 border border-[#DFD2C4]/60 p-8 animate-in fade-in zoom-in-95 duration-500 delay-150">
                
                {step === 1 && (
                    <div className="space-y-5 animate-in slide-in-from-right">
                        <div className="mb-6">
                            <h3 className="font-black text-xl text-[#312923]">Tus Datos</h3>
                            <p className="text-xs text-[#9A8F84] font-bold mt-1">¿Para quién es la cita?</p>
                        </div>
                        
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Teléfono / WhatsApp *</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                <input type="tel" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]" placeholder="+56 9 1234 5678" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} />
                            </div>
                        </div>

                        {/* --- 🛡️ CAMPO HONEYPOT INVISIBLE --- */}
                        <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}>
                            <label htmlFor="confirm_email_field" aria-hidden="true">No llenar este campo</label>
                            <input 
                                type="text" 
                                id="confirm_email_field" 
                                name="confirm_email_field" 
                                value={honeypot} 
                                onChange={(e) => setHoneypot(e.target.value)} 
                                tabIndex="-1" 
                                autoComplete="off" 
                            />
                        </div>

                        <button 
                            disabled={!formData.name || !formData.phone}
                            onClick={() => setStep(2)}
                            className="w-full mt-4 py-4 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl disabled:opacity-50 disabled:bg-stone-300 flex items-center justify-center gap-2 transition-all hover:bg-[#1a1512] shadow-lg"
                        >
                            Continuar <ChevronRight size={16}/>
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right">
                        <button onClick={() => setStep(1)} className="text-[#9A8F84] mb-4 hover:text-[#312923] transition-colors"><ArrowLeft size={20}/></button>
                        <div className="mb-6">
                            <h3 className="font-black text-xl text-[#312923]">Motivo de Consulta</h3>
                            <p className="text-xs text-[#9A8F84] font-bold mt-1">Cuéntanos brevemente en qué podemos ayudarte.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Tratamiento o Dolencia</label>
                            <div className="relative">
                                <FileText size={18} className="absolute left-4 top-4 text-[#DFD2C4]" />
                                <textarea rows="4" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651] resize-none" placeholder="Ej: Me duele una muela, quiero una limpieza, control de frenillos..." value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} />
                            </div>
                        </div>

                        <button 
                            onClick={() => setStep(3)}
                            className="w-full mt-4 py-4 bg-[#312923] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#1a1512] shadow-lg"
                        >
                            Elegir Fecha y Hora <ChevronRight size={16}/>
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5 animate-in slide-in-from-right">
                        <button onClick={() => setStep(2)} className="text-[#9A8F84] mb-4 hover:text-[#312923] transition-colors"><ArrowLeft size={20}/></button>
                        <div className="mb-6">
                            <h3 className="font-black text-xl text-[#312923]">Disponibilidad</h3>
                            <p className="text-xs text-[#9A8F84] font-bold mt-1">Selecciona el día y la hora que más te acomode.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Día de la Cita</label>
                            <div className="relative">
                                <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DFD2C4]" />
                                <input type="date" min={new Date().toISOString().split('T')[0]} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4] outline-none font-bold text-[#312923] focus:border-[#5B6651]" value={formData.date} onChange={e=>handleDateSelect(e.target.value)} />
                            </div>
                        </div>

                        {formData.date && (
                            <div className="space-y-1.5 pt-4 border-t border-[#DFD2C4]/40">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-2">Horarios Disponibles</label>
                                {availableTimes.length === 0 ? (
                                    <p className="text-center p-4 bg-red-50 text-red-500 rounded-xl font-bold text-sm">No hay horarios disponibles este día.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 mt-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                                        {availableTimes.map(slot => (
                                            <button 
                                                key={slot.id}
                                                onClick={() => setFormData({...formData, time: slot.id})}
                                                className={`py-3 px-2 rounded-xl text-xs font-black transition-all border ${formData.time === slot.id ? 'bg-[#5B6651] text-white border-[#5B6651] shadow-md scale-105' : 'bg-white border-[#DFD2C4] text-[#A3968B] hover:border-[#5B6651] hover:text-[#5B6651]'}`}
                                            >
                                                {slot.display}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button 
                            disabled={!formData.date || !formData.time || isSubmitting}
                            onClick={handleSubmit}
                            className="w-full mt-4 py-4 bg-[#CBAAA2] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl disabled:opacity-50 disabled:bg-stone-300 flex items-center justify-center gap-2 transition-all hover:bg-[#b09088] shadow-lg shadow-[#CBAAA2]/30"
                        >
                            {isSubmitting ? 'CONFIRMANDO...' : 'CONFIRMAR RESERVA'}
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center py-8 animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                        <h3 className="font-black text-2xl text-[#312923] mb-2">¡Cita Confirmada!</h3>
                        <p className="text-sm font-bold text-[#9A8F84] mb-6">
                            Te esperamos el <strong className="text-[#312923]">{formData.date.split('-').reverse().join('/')}</strong> a las <strong className="text-[#312923]">{formData.time}</strong>.
                        </p>
                        <p className="text-xs text-[#9A8F84] px-4">
                            Nos pondremos en contacto contigo vía WhatsApp para confirmar los detalles finales.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}