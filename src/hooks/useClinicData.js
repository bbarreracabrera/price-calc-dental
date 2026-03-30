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

            // 1. PRIMERO: Averiguar si soy empleado de alguien más
            // Buscamos en la tabla team donde mi correo coincida dentro del JSON "data"
            const { data: myTeamRecord } = await supabase
                .from('team')
                .select('admin_email, data')
                .eq('data->>email', userEmail)
                .maybeSingle();
            
            if (myTeamRecord) {
                myClinicAdmin = myTeamRecord.admin_email; // Soy empleado, uso la clínica de mi jefe
                myRole = myTeamRecord.data?.role || 'assistant';
            }
            
            setClinicOwner(myClinicAdmin);
            setUserRole(myRole);

            // 2. OBTENER EL EQUIPO COMPLETO (Para mostrar en Ajustes)
            const { data: t } = await supabase.from('team').select('*').eq('admin_email', myClinicAdmin);
            if (t) setTeam(t.map(r => ({ ...r.data, id: r.id })));

            // 3. SEGUNDO: Descargar SOLO los datos que le pertenecen a esta clínica (Jefe)
            const { data: s } = await supabase.from('settings').select('*').eq('id', 'general').eq('admin_email', myClinicAdmin).maybeSingle();
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
    }, [session]); 
}