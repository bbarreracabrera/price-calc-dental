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

            // 3. Config — settings.data ya contiene todos los campos, incluidos los de MP.
            //    clinic_config se mantiene solo para datos generales (nombre de fallback, etc.)
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

            const finalConfig = {
                ...(s?.data || {}),
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
