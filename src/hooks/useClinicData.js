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
            // 1. PRIMERO: Averiguar quién soy y quién es el dueño de mi clínica
            const { data: t } = await supabase.from('team').select('*');
            let myClinicAdmin = session.user.email; 
            
            if (t) {
                const allTeamData = t.map(r => ({...r.data, id: r.id}));
                const me = allTeamData.find(u => u.email === session.user.email);
                if (me) myClinicAdmin = me.admin_email; 
                const myTeam = allTeamData.filter(u => u.admin_email === myClinicAdmin);
                setTeam(myTeam);
                setUserRole(me ? me.role : 'admin');
            }
            setClinicOwner(myClinicAdmin);

            // 2. SEGUNDO: Descargar SOLO los datos que le pertenecen a mi clínica
            const { data: s } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
            if (s) setConfigLocal(s.data);
            
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
    }, [session]); // Se vuelve a ejecutar solo si cambia la sesión
}