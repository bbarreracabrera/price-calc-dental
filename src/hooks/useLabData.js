import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const mergeJob = (job) => ({
    ...job,
    ...(job.data || {}),
    id: job.id,
    lab_email: job.lab_email,
    admin_email: job.admin_email,
    status: job.status,
    deleted_at: job.deleted_at,
    created_at: job.created_at,
});

export function useLabData(session) {
    const [jobs, setJobs] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const labEmail = session?.user?.email;

    const fetchJobs = async () => {
        if (!labEmail) return;

        const { data, error } = await supabase
            .from('lab_works')
            .select('*')
            .eq('lab_email', labEmail)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching lab jobs:', error);
            setError(error);
            return;
        }

        setJobs((data || []).map(mergeJob));
    };

    const fetchPricing = async () => {
        if (!labEmail) return;

        const { data, error } = await supabase
            .from('lab_pricing')
            .select('*')
            .eq('lab_email', labEmail)
            .is('deleted_at', null);

        if (error) {
            if (error.code === '42P01') {
                setPricing([]);
                return;
            }
            console.error('Error fetching pricing:', error);
            return;
        }

        setPricing(data || []);
    };

    useEffect(() => {
        let mounted = true;

        const loadAll = async () => {
            setIsLoading(true);
            await Promise.all([fetchJobs(), fetchPricing()]);
            if (mounted) setIsLoading(false);
        };

        if (labEmail) loadAll();
        else setIsLoading(false);

        return () => { mounted = false; };
    }, [labEmail]);

    return {
        jobs,
        pricing,
        isLoading,
        error,
        refreshJobs: fetchJobs,
        refreshPricing: fetchPricing,
    };
}
