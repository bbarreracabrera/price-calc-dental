import { useEffect } from 'react';
import { supabase } from '../supabase';

export function useClinicData({
    session, setTeam, setUserRole, setClinicOwner, setConfigLocal,
    setPatientRecords, setAppointments, setFinancialRecords,
    setProtocols, setInventory, setCatalog, setLabWorks
}) {
    useEffect(() => {
        if (!session) return;

        const load = async () => {
            const userEmail = session.user.email;
            let myClinicAdmin = userEmail;
            let myRole = 'admin';

            // 1. Averiguar si soy empleado de alguien más
            const { data: myTeamRecord } = await supabase
                .from('team')
                .select('admin_email, data')
                .eq('data->>email', userEmail)
                .maybeSingle();

            if (myTeamRecord) {
                myClinicAdmin = myTeamRecord.admin_email;
                myRole = myTeamRecord.data?.role || 'assistant';
            }

            // 2. Equipo completo
            const { data: t } = await supabase.from('team').select('*').eq('admin_email', myClinicAdmin);
            if (t) setTeam(t.map(r => ({ ...r.data, id: r.id })));

            // 3. Config — settings (JSONB) + clinic_config (columnas planas, incluye tokens MP)
            //    Ambas queries en paralelo para no bloquear el render.
            //    setClinicOwner + setUserRole + setConfigLocal en el mismo bloque síncrono
            //    → React 18 los batchea en un solo render (evita el flash del OnboardingModal).
            const [{ data: s }, { data: cc }] = await Promise.all([
                supabase
                    .from('settings')
                    .select('*')
                    .eq('id', 'general')
                    .eq('admin_email', myClinicAdmin)
                    .maybeSingle(),
                supabase
                    .from('clinic_config')
                    .select('*')
                    .eq('id', myClinicAdmin)
                    .maybeSingle(),
            ]);

            setClinicOwner(myClinicAdmin);
            setUserRole(myRole);

            // Solo extraemos los campos MP de clinic_config — no hacemos spread completo
            // para evitar que columnas como 'schedule' (TEXT) sobreescriban objetos de settings.data.
            const mpFields = cc ? {
                mp_access_token: cc.mp_access_token,
                mp_refresh_token: cc.mp_refresh_token,
                mp_user_id: cc.mp_user_id,
                mp_public_key: cc.mp_public_key,
                mp_connected_at: cc.mp_connected_at,
                require_payment_at_booking: cc.require_payment_at_booking,
                appointment_price: cc.appointment_price,
            } : {};

            const finalConfig = {
                ...(s?.data || {}),
                ...mpFields,
                name: s?.data?.name || cc?.name || 'Profesional',
            };
            setConfigLocal(finalConfig);

            // 4. Resto de datos
            const { data: p } = await supabase.from('patients').select('*').eq('admin_email', myClinicAdmin).order('id', { ascending: false }).limit(50);
            if (p) { const m = {}; p.forEach(r => m[r.id] = r.data); setPatientRecords(m); }

            const { data: a } = await supabase.from('appointments').select('*').eq('admin_email', myClinicAdmin);
            if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));

            const { data: f } = await supabase.from('financials').select('*').eq('admin_email', myClinicAdmin);
            if (f) setFinancialRecords(f.map(r => ({ ...r.data, id: r.id })));

            const { data: pk } = await supabase.from('packs').select('*').eq('admin_email', myClinicAdmin);
            if (pk) setProtocols(pk.map(r => ({ ...r.data, id: r.id })));

            const { data: i } = await supabase.from('inventory').select('*').eq('admin_email', myClinicAdmin);
            if (i) setInventory(i.map(r => ({ ...r.data, id: r.id })));

            const { data: catData } = await supabase.from('catalog').select('*').eq('admin_email', myClinicAdmin);
            if (catData) setCatalog(catData.map(r => ({ ...r.data, id: r.id })));

            const { data: labData } = await supabase.from('lab_works').select('*').eq('admin_email', myClinicAdmin);
            if (labData) setLabWorks(labData);
        };

        load();
    }, [session]);
}
