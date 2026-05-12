import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';

const PAGE_SIZE = 100;

export function useClinicData({
    session, setTeam, setUserRole, setClinicOwner, setConfigLocal,
    setPatientRecords, setAppointments, setFinancialRecords,
    setProtocols, setInventory, setCatalog, setLabWorks
}) {
    const [totalPatients, setTotalPatients] = useState(0);
    const [hasMorePatients, setHasMorePatients] = useState(false);
    const [patientsLoading, setPatientsLoading] = useState(false);
    const pageRef = useRef(0);
    const adminEmailRef = useRef(null);

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

            adminEmailRef.current = myClinicAdmin;
            pageRef.current = 0;

            // 2. Equipo completo
            const { data: t } = await supabase.from('team').select('*').eq('admin_email', myClinicAdmin);
            if (t) setTeam(t.map(r => ({ ...r.data, id: r.id })));

            // 3. Config — React 18 batchea estos tres setters en un solo render
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
            setConfigLocal({
                ...(s?.data || {}),
                name: s?.data?.name || cc?.name || 'Profesional',
            });

            // 4. Primera página de pacientes con conteo total
            const { data: p, count } = await supabase
                .from('patients')
                .select('*', { count: 'exact' })
                .eq('admin_email', myClinicAdmin)
                .order('id', { ascending: false })
                .range(0, PAGE_SIZE - 1);

            if (p) {
                const m = {};
                p.forEach(r => { m[r.id] = r.data; });
                setPatientRecords(m);
            }
            const total = count || 0;
            setTotalPatients(total);
            setHasMorePatients(total > PAGE_SIZE);

            // 5. Resto de datos
            const { data: a } = await supabase.from('appointments').select('*').eq('admin_email', myClinicAdmin);
            if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));

            const { data: f } = await supabase.from('financials').select('*').eq('admin_email', myClinicAdmin);
            if (f) setFinancialRecords(f.map(r => ({ ...r.data, id: r.id, boleta_emitida: r.boleta_emitida, boleta_fecha: r.boleta_fecha })));

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

    const loadMorePatients = async () => {
        if (patientsLoading || !adminEmailRef.current) return;
        setPatientsLoading(true);

        const nextPage = pageRef.current + 1;
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: p } = await supabase
            .from('patients')
            .select('*')
            .eq('admin_email', adminEmailRef.current)
            .order('id', { ascending: false })
            .range(from, to);

        if (p && p.length > 0) {
            const m = {};
            p.forEach(r => { m[r.id] = r.data; });
            setPatientRecords(prev => ({ ...prev, ...m }));
            pageRef.current = nextPage;
            setHasMorePatients(p.length === PAGE_SIZE);
        } else {
            setHasMorePatients(false);
        }
        setPatientsLoading(false);
    };

    return { loadMorePatients, hasMorePatients, patientsLoading, totalPatients };
}
