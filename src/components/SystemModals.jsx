import React, { useState, useEffect, useMemo } from 'react';
import { Loader, Search, Cloud, Lock, Mail, ArrowRight, FileText, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
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

// --- PESTAÑA DE TÉRMINOS Y CONDICIONES ---
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

// --- EL BUSCADOR INTELIGENTE ---
const normalize = (str) =>
    (str || '').toString().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[\.\-\s]/g, '');

export const PatientSelect = ({ theme, patients, onSelect, placeholder = "Buscar por nombre, RUT, teléfono o email...", adminEmail }) => {
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
            let q = supabase
                .from('patients')
                .select('id, data');
            if (adminEmail) q = q.eq('admin_email', adminEmail);
            const { data } = await q
                .or([
                    `data->personal->>legalName.ilike.%${query}%`,
                    `data->personal->>rut.ilike.%${query}%`,
                    `data->personal->>phone.ilike.%${query}%`,
                    `data->personal->>email.ilike.%${query}%`,
                ].join(','))
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
        if (!query || query.length < 2) return [];
        const q = normalize(query);
        const local = Object.values(patients).filter(p => {
            const personal = p.personal || {};
            return (
                normalize(personal.legalName).includes(q) ||
                normalize(personal.rut).includes(q) ||
                normalize(personal.phone).includes(q) ||
                normalize(personal.email).includes(q) ||
                normalize(personal.nickname).includes(q)
            );
        });
        const all = [...local, ...dbResults];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        return unique;
    }, [query, patients, dbResults]);

    return (
        <div className="w-full">
            <InputField
                icon={Search}
                placeholder={placeholder}
                value={query}
                onChange={e => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
            />
            {showResults && query && (
                <div className="mt-2 rounded-2xl border border-[#DFD2C4]/70 max-h-60 overflow-y-auto shadow-inner bg-white custom-scrollbar transition-all animate-in fade-in slide-in-from-top-2">

                    {isSearching && (
                        <div className="p-4 text-xs text-[#9A8F84] font-medium text-center flex items-center justify-center gap-2">
                            <Loader size={14} className="animate-spin"/> Buscando en base de datos...
                        </div>
                    )}

                    {!isSearching && combinedResults.length > 0 ? combinedResults.map(p => (
                        <div
                            key={p.id}
                            onClick={() => { onSelect(p); setQuery(p.personal?.legalName); setShowResults(false); }}
                            className="p-4 hover:bg-[#FDFBF7] cursor-pointer border-b border-[#DFD2C4]/30 last:border-0 flex justify-between items-center group transition-colors"
                        >
                            <div>
                                <p className="font-bold text-sm text-[#312923] group-hover:text-[#5B6651]">{p.personal?.legalName}</p>
                                {(p.personal?.rut || p.personal?.phone) && (
                                    <p className="text-[11px] font-medium text-[#9A8F84] mt-0.5">
                                        {p.personal?.rut && `${p.personal.rut}`}
                                        {p.personal?.rut && p.personal?.phone && ' · '}
                                        {p.personal?.phone}
                                    </p>
                                )}
                            </div>
                            {!patients[p.id] && <span className="text-[9px] bg-[#DFD2C4]/30 text-[#9A8F84] border border-[#DFD2C4] px-2 py-0.5 rounded-full font-black tracking-widest shrink-0">NUBE</span>}
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

// --- PANTALLA DE AUTENTICACIÓN (DISEÑO PREMIUM + TU LÓGICA) ---
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
            setMsg(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message); 
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
        <div className="fixed inset-0 w-full min-h-screen flex bg-[#FDFBF7] font-sans selection:bg-[#CBAAA2] selection:text-white z-[100] overflow-y-auto">
            
            {/* --- PANEL IZQUIERDO (VISUAL Y BRANDING) - Oculto en móviles --- */}
            <div className="hidden lg:flex w-1/2 bg-[#312923] relative flex-col justify-between p-12 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-[#5B6651]/40 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-20 right-10 w-64 h-64 bg-[#CBAAA2]/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                        <Cloud className="text-white" size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-white">ShiningCloud<span className="text-[#DFD2C4]">Dental</span></span>
                </div>

                <div className="relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-md">
                        <Sparkles size={14} className="text-[#CBAAA2]"/> Entorno Seguro
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
                        Tu clínica en la <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFD2C4] to-[#CBAAA2]">bóveda digital.</span>
                    </h1>
                    <p className="text-[#DFD2C4] font-medium text-lg leading-relaxed">
                        Encriptación de grado bancario y trazabilidad absoluta. Todo lo que necesitas para dirigir tu ecosistema médico, protegido bajo los estándares más estrictos.
                    </p>
                </div>

                <div className="relative z-10 flex gap-6 text-[#DFD2C4]/60 font-black text-xs uppercase tracking-widest">
                    <span className="flex items-center gap-2"><ShieldCheck size={16}/> MINSAL Ready</span>
                    <span className="flex items-center gap-2"><Lock size={16}/> AES-256</span>
                </div>
            </div>

            {/* --- PANEL DERECHO (FORMULARIO DE ACCESO) --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative min-h-screen">
                
                {/* Botón Volver a la Landing (Útil si el usuario quiere salir de la pantalla completa) */}
                <div className="absolute top-6 right-6 z-20">
                    <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] hover:text-[#312923] transition-colors">
                        Volver al inicio
                    </button>
                </div>

                <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                    
                    <div className="text-center lg:text-left mb-8">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                            <div className="w-12 h-12 bg-[#312923] rounded-xl flex items-center justify-center shadow-md">
                                <Cloud className="text-white" size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        {vieneDePago ? (
                            <>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter mb-3">Comienza tu viaje.</h2>
                                <p className="text-[#5B6651] text-xs font-bold bg-[#5B6651]/10 px-4 py-2 rounded-full border border-[#5B6651]/20 inline-block">
                                    ¡Suscripción confirmada! 💳
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-black text-[#312923] tracking-tighter mb-2">
                                    {isSignUp ? 'Crear Clínica' : 'Bienvenido de vuelta.'}
                                </h2>
                                <p className="text-[#6B615A] font-medium">
                                    {isSignUp ? 'Registra tu clínica en el sistema.' : 'Ingresa tus credenciales para acceder.'}
                                </p>
                            </>
                        )}
                    </div>

                    {vieneDePago && (
                        <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl flex items-start gap-3 shadow-sm">
                            <AlertCircle size={18} className="text-[#5B6651] shrink-0 mt-0.5"/>
                            <p className="text-xs font-bold text-[#6B615A] leading-relaxed">
                                Crea el correo y contraseña con el que administrarás tu clínica a partir de hoy.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        
                        {msg && (
                            <div className={`p-4 rounded-xl text-xs font-bold text-center border ${msg.includes('Error') || msg.includes('incorrectos') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {msg}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-[#A3968B] group-focus-within:text-[#5B6651] transition-colors"/>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="doctor@clinica.cl"
                                    className="w-full pl-11 pr-4 py-4 bg-white border border-[#DFD2C4] rounded-2xl text-[#312923] font-medium placeholder:text-[#DFD2C4] focus:outline-none focus:ring-2 focus:ring-[#5B6651]/30 focus:border-[#5B6651] transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Contraseña</label>
                                {!isSignUp && (
                                    <button type="button" onClick={handleResetPassword} disabled={loading} className="text-[10px] font-black uppercase tracking-widest text-[#CBAAA2] hover:text-[#312923] transition-colors">
                                        ¿Olvidaste tu clave?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-[#A3968B] group-focus-within:text-[#5B6651] transition-colors"/>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-4 bg-white border border-[#DFD2C4] rounded-2xl text-[#312923] font-medium placeholder:text-[#DFD2C4] focus:outline-none focus:ring-2 focus:ring-[#5B6651]/30 focus:border-[#5B6651] transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-[#312923] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#312923]/20 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="animate-pulse flex items-center gap-2"><Loader size={16} className="animate-spin"/> Procesando...</span>
                            ) : (
                                <>
                                    {isSignUp ? 'Crear Clínica Digital' : 'Acceder al Sistema'} <ArrowRight size={16}/>
                                </>
                            )}
                        </button>
                    </form>

                    {!vieneDePago && (
                        <div className="mt-8 text-center border-t border-[#DFD2C4]/40 pt-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-3">
                                ¿Aún no tienes tu clínica en la nube?
                            </p>
                            <button 
                                onClick={(e) => { e.preventDefault(); window.location.href = MP_SUBSCRIPTION_LINK; }} 
                                className="w-full px-6 py-3.5 rounded-2xl border border-[#DFD2C4] text-[#6B615A] hover:bg-white hover:text-[#5B6651] hover:border-[#5B6651]/50 transition-all text-xs font-black uppercase tracking-widest shadow-sm bg-[#FDFBF7]"
                            >
                                Probar 30 días gratis
                            </button>
                            
                            <p className="text-xs font-bold text-[#6B615A] mt-6">
                                O <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#5B6651] hover:text-[#312923] transition-colors font-black underline decoration-[#5B6651]/30 underline-offset-4">
                                    {isSignUp ? "inicia sesión aquí" : "crea una cuenta manual"}
                                </button>
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};