import React, { useState, useEffect, useMemo } from 'react';
import { Loader, Search, Cloud, Lock, Mail, ArrowRight, FileText } from 'lucide-react';
import { supabase } from '../supabase';
import { THEMES } from '../constants';
import { InputField, Button, Card } from './UIComponents';
import LegalText from './LegalText';

// --- COMPONENTE DE SEGURIDAD: URLS FIRMADAS PARA BUCKET PRIVADO ---
export const PrivateImage = ({ img, onClick }) => {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        let isMounted = true; 
        const fetchUrl = async () => {
            if (img.url && img.url.startsWith('http')) {
                if (isMounted) setSignedUrl(img.url);
                return;
            }
            
            const filePath = img.path || img.url; 
            const { data, error } = await supabase.storage.from('patient-images').createSignedUrl(filePath, 3600);
            
            if (isMounted && data) setSignedUrl(data.signedUrl);
            if (error) console.error("Error seguridad imagen:", error);
        };
        fetchUrl();
        return () => { isMounted = false; }; 
    }, [img]);

    if (!signedUrl) return <div className="w-full h-full flex items-center justify-center bg-[#FDFBF7] rounded-xl border border-[#DFD2C4]/40"><Loader className="animate-spin text-[#9A8F84]" size={20}/></div>;

    const isPdf = signedUrl.toLowerCase().includes('.pdf');

    if (isPdf) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-[#FDFBF7] hover:bg-white border border-[#DFD2C4]/40 transition-colors rounded-xl" onClick={() => window.open(signedUrl, '_blank')}>
                <FileText size={32} className="mb-2 text-[#CBAAA2]"/>
                <span className="text-[10px] font-bold px-2 text-center text-[#9A8F84] uppercase tracking-widest break-all">Ver PDF</span>
            </div>
        );
    }

    return <img src={signedUrl} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => onClick(signedUrl)} alt="Ficha" />;
};

// --- PESTAÑA DE TÉRMINOS Y CONDICIONES (Actualizada a Paleta Boutique) ---
export const TermsScreen = ({ theme }) => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
            <Card className="p-6 md:p-10 shadow-xl border border-[#DFD2C4]/40">
                <div className="flex items-center gap-4 mb-8 border-b border-[#DFD2C4]/40 pb-6">
                    <div className="w-12 h-12 bg-[#FDFBF7] border border-[#DFD2C4] text-[#5B6651] rounded-2xl flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-[#312923]">Términos de Uso y Servicio</h2>
                        <p className="text-sm text-[#9A8F84] font-medium mt-1">Última actualización: 28-02-2026</p>
                    </div>
                </div>
                <div className="text-[#6B615A] leading-relaxed">
                    <LegalText isDarkTheme={false} />
                </div>
            </Card>
        </div>
    );
};

// --- EL BUSCADOR INTELIGENTE (Actualizado a Paleta Boutique) ---
export const PatientSelect = ({ theme, patients, onSelect, placeholder = "Buscar Paciente..." }) => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [dbResults, setDbResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setDbResults([]);
            return;
        }
        
        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            const { data } = await supabase
                .from('patients')
                .select('id, data')
                .ilike('data->personal->>legalName', `%${query}%`)
                .limit(10); 
            
            if (data) {
                const formatted = data.map(r => ({ ...r.data, id: r.id }));
                setDbResults(formatted);
            }
            setIsSearching(false);
        }, 500); 

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const combinedResults = useMemo(() => { 
        if (!query) return []; 
        const local = Object.values(patients).filter(p => p.personal?.legalName?.toLowerCase().includes(query.toLowerCase())); 
        const all = [...local, ...dbResults];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        return unique;
    }, [query, patients, dbResults]);
    
    return (
        <div className="relative w-full z-20">
            <InputField icon={Search} placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
            {showResults && query && (
                <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[#DFD2C4]/50 max-h-48 overflow-y-auto shadow-xl bg-white custom-scrollbar z-50">
                    {isSearching && <div className="p-4 text-xs text-[#9A8F84] font-medium text-center flex items-center justify-center gap-2"><Loader size={14} className="animate-spin"/> Buscando en base de datos...</div>}
                    
                    {!isSearching && combinedResults.length > 0 ? combinedResults.map(p => (
                        <div key={p.id} onClick={() => { onSelect(p); setQuery(p.personal?.legalName); setShowResults(false); }} className="p-4 hover:bg-[#FDFBF7] cursor-pointer border-b border-[#DFD2C4]/30 last:border-0 flex justify-between items-center group transition-colors">
                            <p className="font-bold text-sm text-[#312923] group-hover:text-[#5B6651]">{p.personal?.legalName}</p>
                            {!patients[p.id] && <span className="text-[9px] bg-[#DFD2C4]/30 text-[#9A8F84] border border-[#DFD2C4] px-2 py-0.5 rounded-full font-black tracking-widest">NUBE</span>}
                        </div>
                    )) : !isSearching && (
                        <div className="p-4 text-sm text-[#6B615A] text-center">
                            No encontrado. <button className="underline cursor-pointer font-bold ml-1 text-[#CBAAA2] hover:text-[#5B6651] transition-colors" onClick={(e)=>{ e.preventDefault(); onSelect({id:'new', name: query}); setShowResults(false); }}>Crear "{query}"</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- PANTALLA DE AUTENTICACIÓN (AJUSTE DE PROPORCIONES) ---
export const AuthScreen = () => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [loading, setLoading] = useState(false); 
    const [msg, setMsg] = useState('');
   
    const MP_SUBSCRIPTION_LINK = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f46b2675174844d09cb9f59000fadd5d";
    const urlParams = new URLSearchParams(window.location.search);
    const vieneDePago = urlParams.get('pago') === 'exitoso';
    const [isSignUp, setIsSignUp] = useState(vieneDePago);
  
    const handleAuth = async (e) => { 
        e.preventDefault(); 
        setLoading(true); 
        setMsg(''); 
        try { 
            if (isSignUp) { 
                const { error } = await supabase.auth.signUp({ email, password }); 
                if (error) throw error; 
                setMsg('¡Clínica creada! Iniciando sesión...'); 
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                window.history.replaceState({}, document.title, window.location.pathname);
            } else { 
                const { error } = await supabase.auth.signInWithPassword({ email, password }); 
                if (error) throw error; 
            } 
        } catch (error) { 
            setMsg(error.message); 
        } finally { 
            setLoading(false); 
        } 
    };
  
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setMsg('Por favor, ingresa tu correo electrónico abajo.');
            return;
        }
        setLoading(true);
        setMsg('Enviando correo...');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });
        if (error) setMsg("Error: " + error.message);
        else setMsg("¡Te enviamos un enlace al correo!");
        setLoading(false);
    };
   
    return (
        <div className="fixed inset-0 bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-6 z-[100] overflow-y-auto selection:bg-[#CBAAA2] selection:text-white">
            
            {/* Elementos Decorativos de Fondo */}
            <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#DFD2C4]/30 blur-[100px] pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#CBAAA2]/15 blur-[120px] pointer-events-none"></div>

            {/* Redujimos el py-10 a py-4 para que no choque con el techo */}
            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500 py-4">    
                
                {/* Redujimos el padding vertical (py) pero mantuvimos el horizontal (px) */}
                <Card className="w-full px-8 py-8 sm:px-10 sm:py-10 shadow-2xl bg-white/95 backdrop-blur-xl border-[#DFD2C4]/50 flex flex-col items-center">
                    
                    {/* Logo un poco más sutil (w-16 en vez de w-20) */}
                    <div className="w-16 h-16 bg-[#5B6651] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5B6651]/20 mb-5 border border-[#DFD2C4]/40">
                        <Cloud className="text-white" size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-[#312923] tracking-tight mb-1 text-center">ShiningCloud<span className="text-[#CBAAA2]">Pro</span></h1>
                    
                    {vieneDePago ? (
                        <div className="text-center mb-6">
                            <p className="text-[#5B6651] text-xs font-bold bg-[#5B6651]/10 px-4 py-2 rounded-full border border-[#5B6651]/20 inline-block mb-2">
                                ¡Suscripción confirmada! 💳
                            </p>
                            <p className="text-[#6B615A] text-xs font-medium">Crea tu contraseña para entrar al sistema.</p>
                        </div>
                    ) : (
                        <p className="text-[#9A8F84] text-sm font-medium mb-8 text-center tracking-wide">Acceso a Clínica Digital</p>
                    )}
      
                    {/* space-y-4 en lugar de space-y-6 para juntar suavemente los inputs */}
                    <form onSubmit={handleAuth} className="space-y-4 w-full">
                        
                        {msg && (
                            <div className="p-3 bg-[#FDFBF7] border border-[#DFD2C4] text-[#6B615A] text-xs rounded-xl text-center font-bold">
                                {msg}
                            </div>
                        )}
                        
                        <InputField 
                            icon={Mail}
                            type="email" 
                            placeholder="correo@clinica.cl" 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            required 
                            label="Correo Electrónico"
                        />
                        
                        <InputField 
                            icon={Lock}
                            type="password" 
                            placeholder="Mínimo 6 caracteres" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                            required 
                            minLength={6} 
                            label="Contraseña"
                        />
                        
                        {!isSignUp && (
                            <div className="flex justify-end pt-1">
                                <button type="button" onClick={handleResetPassword} disabled={loading} className="text-[11px] font-bold text-[#CBAAA2] hover:text-[#9A8F84] transition-colors underline-offset-4 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}
                        
                        <div className="pt-2">
                            {/* Botón un poco más esbelto (py-3.5) */}
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full py-3.5 text-sm tracking-widest uppercase shadow-xl shadow-[#5B6651]/20 hover:-translate-y-0.5"
                                variant="primary"
                            >
                                {loading ? 'Procesando...' : (isSignUp ? 'Crear Mi Clínica' : 'Entrar al Sistema')}
                                {!loading && <ArrowRight size={18} className="ml-2"/>}
                            </Button>
                        </div>
                    </form>
                </Card>
  
                {/* Footer del Formulario ajustado (mt-6 en lugar de mt-12) */}
                {!vieneDePago && (
                    <div className="mt-6 text-center">
                        <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mb-3">
                            ¿Aún no tienes cuenta?
                        </p>
                        <button 
                            onClick={(e) => { e.preventDefault(); window.location.href = MP_SUBSCRIPTION_LINK; }} 
                            className="px-6 py-2.5 rounded-full border border-[#DFD2C4] text-[#6B615A] hover:bg-white hover:text-[#5B6651] hover:border-[#CBAAA2] transition-all text-xs font-bold uppercase tracking-widest shadow-sm bg-[#FDFBF7]"
                        >
                            Probar 30 días gratis
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};