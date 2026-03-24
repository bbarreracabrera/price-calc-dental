import React, { useState, useEffect, useMemo } from 'react';
import { Loader, Search, Cloud } from 'lucide-react';
import { supabase } from '../supabase';
import { THEMES } from '../constants';
import { InputField } from './UIComponents';
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

    if (!signedUrl) return <div className="w-full h-full flex items-center justify-center bg-black/10"><Loader className="animate-spin opacity-50" size={20}/></div>;

    const isPdf = signedUrl.toLowerCase().includes('.pdf');

    if (isPdf) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10" onClick={() => window.open(signedUrl, '_blank')}>
                <span className="text-4xl mb-2">📄</span>
                <span className="text-[10px] font-bold px-2 text-center opacity-50 break-all">Ver Documento</span>
            </div>
        );
    }

    return <img src={signedUrl} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => onClick(signedUrl)} alt="Ficha" />;
};

// --- PESTAÑA DE TÉRMINOS Y CONDICIONES ---
export const TermsScreen = ({ theme }) => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
            <div className={`${theme.card} rounded-3xl p-6 md:p-10 shadow-xl border border-white/5`}>
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                    <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Términos de Uso y Servicio</h2>
                        <p className={`text-sm ${theme.subText}`}>Última actualización: 28-02-2026</p>
                    </div>
                </div>
                <div className={theme.subText}>
                    <LegalText isDarkTheme={false} />
                </div>
            </div>
        </div>
    );
};

// --- EL BUSCADOR INTELIGENTE (ASÍNCRONO) ---
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
    
    const t = THEMES[theme] || THEMES.dark;
    
    return (
        <div className="relative w-full z-20">
            <InputField theme={theme} icon={Search} placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
            {showResults && query && (
                <div className={`absolute left-0 right-0 top-full mt-2 rounded-xl border max-h-48 overflow-y-auto shadow-xl ${t.card}`}>
                    {isSearching && <div className="p-3 text-xs opacity-50 text-center flex items-center justify-center gap-2"><Loader size={12} className="animate-spin"/> Buscando en servidor...</div>}
                    {!isSearching && combinedResults.length > 0 ? combinedResults.map(p => (
                        <div key={p.id} onClick={() => { onSelect(p); setQuery(p.personal?.legalName); setShowResults(false); }} className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center">
                            <p className="font-bold text-sm">{p.personal?.legalName}</p>
                            {!patients[p.id] && <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-black tracking-widest">NUBE</span>}
                        </div>
                    )) : !isSearching && (
                        <div className="p-3 text-xs opacity-50">
                            No encontrado. <span className="underline cursor-pointer font-bold ml-1 text-cyan-400" onClick={()=>{ onSelect({id:'new', name: query}); setShowResults(false); }}>Crear "{query}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- PANTALLA DE AUTENTICACIÓN ---
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

  const handleResetPassword = async () => {
    if (!email) {
      setMsg('Por favor, ingresa tu correo electrónico arriba.');
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
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 z-[100]">
      <div className="w-full max-w-sm flex flex-col items-center">    
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
          <Cloud className="text-white" size={36} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">ShiningCloud</h1>
        {vieneDePago ? (
            <p className="text-amber-400 text-sm mb-8 font-bold text-center">
                ¡Suscripción confirmada! 💳<br/>Crea tu contraseña para entrar.
            </p>
        ) : (
            <p className="text-slate-400 text-sm mb-8 text-center">Ingresa a tu clínica</p>
        )}

        <form onSubmit={handleAuth} className="w-full space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl relative">
          {msg && <div className="p-3 bg-white/10 border border-white/20 text-white text-xs rounded-xl text-center font-bold">{msg}</div>}
          <input type="email" placeholder="Email" className="w-full p-4 bg-black/40 rounded-xl text-white outline-none border border-white/10 focus:border-amber-500 transition-colors" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Clave (mín. 6 caracteres)" className="w-full p-4 bg-black/40 rounded-xl text-white outline-none border border-white/10 focus:border-amber-500 transition-colors" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
          
          {!isSignUp && (
            <button type="button" onClick={handleResetPassword} disabled={loading} className="text-sm text-cyan-400 hover:text-cyan-300 text-left -mt-2 mb-2 w-fit transition-colors">
                ¿Olvidaste tu contraseña?
            </button>
          )}
          
          <button disabled={loading} className="w-full p-4 bg-amber-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors">
            {loading ? 'Procesando...' : (isSignUp ? 'Crear Mi Clínica' : 'Entrar')}
          </button>
        </form>

        {!vieneDePago && (
          <button onClick={(e) => { e.preventDefault(); window.location.href = MP_SUBSCRIPTION_LINK; }} className="mt-6 text-xs font-bold text-white/60 uppercase tracking-widest hover:text-amber-400 transition-all duration-300 text-center">
            ¿No tienes cuenta? <br/>
            <span className="underline underline-offset-4 mt-2 inline-block">Probar 30 días gratis</span>
          </button>
        )}
      </div>
    </div>
  );
};