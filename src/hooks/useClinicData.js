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
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);
    const [hasOlderData, setHasOlderData] = useState(false);
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date().toISOString().split('T')[0];
        const d = new Date();
        d.setDate(d.getDate() - 90);
        return { start: d.toISOString().split('T')[0], end };
    });
    const pageRef = useRef(0);
    const adminEmailRef = useRef(null);
    const initialLoadDone = useRef(false);

    const loadFinancials = async (start, end) => {
        const adminEmail = adminEmailRef.current;
        if (!adminEmail) return;
        setIsLoadingFinancials(true);
        try {
            const { data, error } = await supabase
                .from('financials')
                .select('*')
                .eq('admin_email', adminEmail)
                .is('deleted_at', null)
                .gte('data->>date', start)
                .lte('data->>date', end)
                .order('id', { ascending: false });
            if (error) throw error;
            setFinancialRecords(data?.map(r => ({
                ...r.data,
                id: r.id,
                boleta_emitida: r.boleta_emitida,
                boleta_fecha: r.boleta_fecha
            })) || []);
            const { count, error: countError } = await supabase
                .from('financials')
                .select('id', { count: 'exact' })
                .eq('admin_email', adminEmail)
                .is('deleted_at', null)
                .lt('data->>date', start)
                .limit(1);
            if (countError) {
                console.warn('No se pudo verificar registros anteriores:', countError);
                setHasOlderData(false);
            } else {
                setHasOlderData((count || 0) > 0);
            }
        } catch (err) {
            console.error('Error loading financials:', err);
        } finally {
            setIsLoadingFinancials(false);
        }
    };

    useEffect(() => {
        if (!session) return;
        let mounted = true;

        const load = async () => {
            const userEmail = session.user.email;
            let myClinicAdmin = userEmail;
            let myRole = 'admin';

            // 1. Averiguar si soy empleado de alguien más
            const { data: myTeamRecord } = await supabase
                .from('team')
                .select('admin_email, data')
                .eq('data->>email', userEmail)
                .is('deleted_at', null)
                .maybeSingle();

            if (!mounted) return;
            if (myTeamRecord) {
                myClinicAdmin = myTeamRecord.admin_email;
                myRole = myTeamRecord.data?.role || 'assistant';
            }

            // S1-A: verificar rol en servidor para prevenir escalada vía DevTools
            try {
                const { data: serverRole } = await supabase.rpc('get_my_role');
                if (serverRole && typeof serverRole === 'string') myRole = serverRole;
            } catch {
                // Si el RPC no existe aún, usar el rol del lookup local
            }

            adminEmailRef.current = myClinicAdmin;
            pageRef.current = 0;

            // 2. Equipo completo
            const { data: t } = await supabase.from('team').select('*').eq('admin_email', myClinicAdmin).is('deleted_at', null);
            if (!mounted) return;
            if (t) setTeam(t.map(r => ({ ...r.data, id: r.id })));

            // 3. Config
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

            if (!mounted) return;
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
                .is('deleted_at', null)
                .order('id', { ascending: false })
                .range(0, PAGE_SIZE - 1);

            if (!mounted) return;
            if (p) {
                const m = {};
                p.forEach(r => { m[r.id] = r.data; });
                setPatientRecords(m);
            }
            const total = count || 0;
            setTotalPatients(total);
            setHasMorePatients(total > PAGE_SIZE);

            // 5. Resto de datos
            const { data: a } = await supabase.from('appointments').select('*').eq('admin_email', myClinicAdmin).is('deleted_at', null);
            if (!mounted) return;
            if (a) setAppointments(a.map(r => ({ ...r.data, id: r.id })));

            const { data: pk } = await supabase.from('packs').select('*').eq('admin_email', myClinicAdmin).is('deleted_at', null);
            if (!mounted) return;
            if (pk) setProtocols(pk.map(r => ({ ...r.data, id: r.id })));

            const { data: i } = await supabase.from('inventory').select('*').eq('admin_email', myClinicAdmin).is('deleted_at', null);
            if (!mounted) return;
            if (i) setInventory(i.map(r => ({ ...r.data, id: r.id })));

            const { data: catData } = await supabase.from('catalog').select('*').eq('admin_email', myClinicAdmin).is('deleted_at', null);
            if (!mounted) return;
            if (catData) setCatalog(catData.map(r => ({ ...r.data, id: r.id })));

            const { data: labData } = await supabase.from('lab_works').select('*').eq('admin_email', myClinicAdmin).is('deleted_at', null);
            if (!mounted) return;
            if (labData) setLabWorks(labData.map(job => ({
                ...job,
                ...(job.data || {}),
                id: job.id,
                lab_email: job.lab_email,
                admin_email: job.admin_email,
                status: job.status,
                deleted_at: job.deleted_at,
            })));

            // Financials: carga inicial con rango por defecto (90 días)
            await loadFinancials(dateRange.start, dateRange.end);
            initialLoadDone.current = true;
        };

        load();
        return () => { mounted = false; };
    }, [session]);

    // Re-carga financials cuando el usuario cambia el rango
    useEffect(() => {
        if (!initialLoadDone.current) return;
        loadFinancials(dateRange.start, dateRange.end);
    }, [dateRange]);

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
            .is('deleted_at', null)
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

    return {
        loadMorePatients, hasMorePatients, patientsLoading, totalPatients,
        isLoadingFinancials, hasOlderData, dateRange, setDateRange, loadFinancials,
    };
}
