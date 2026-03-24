import React from 'react';
import { 
    X, Cloud, Moon, Sun, Droplets, LogOut, TrendingUp, 
    CalendarClock, User, Users, Wallet, Calculator, 
    Stethoscope, Library, FlaskConical, Box, Settings, Shield 
} from 'lucide-react';
import { THEMES } from '../constants';

export default function Sidebar({
    mobileMenuOpen, setMobileMenuOpen, config, session, userRole,
    activeTab, setActiveTab, setSelectedPatientId, themeMode, toggleTheme, supabase
}) {
    const t = THEMES[themeMode] || THEMES.dark;

    // Movimos la lógica del menú aquí adentro
    const getMenuItems = () => {
        const base = [
            { id: 'dashboard', label: 'Inicio', icon: TrendingUp },
            { id: 'agenda', label: 'Agenda', icon: CalendarClock },
            { id: 'ficha', label: 'Pacientes', icon: User },
            { id: 'recalls', label: 'Retención CRM', icon: Users },
        ];
        if (userRole === 'admin' || userRole === 'assistant') { base.push({ id: 'history', label: 'Caja & Gastos', icon: Wallet }); }
        if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'quote', label: 'Cotizador', icon: Calculator }); }
        if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'clinical', label: 'Recetas', icon: Stethoscope }); }
        if (userRole === 'admin' || userRole === 'dentist') { base.push({ id: 'catalog', label: 'Arancel', icon: Library }); }
        if (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') { base.push({ id: 'lab', label: 'Laboratorio', icon: FlaskConical }); }
        if (userRole === 'admin') { base.push({ id: 'inventory', label: 'Insumos', icon: Box }); base.push({ id: 'settings', label: 'Ajustes', icon: Settings }); }
        base.push({ id: 'terms', label: 'Legal', icon: Shield });
        return base;
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out ${t.card} border-r flex flex-col`}>
            <div className="p-8 border-b border-white/5 flex flex-col items-center gap-4 relative">
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 opacity-50"><X/></button>
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${t.gradient}`}>
                    {config.logo ? <img src={config.logo} className="w-full h-full object-contain rounded-2xl" alt="Logo"/> : <Cloud className="text-white" size={32}/>}
                </div>
                <div className="text-center">
                    <h1 className="text-xl font-black tracking-tight">ShiningCloud</h1>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${t.subText}`}>Dental OS</p>
                </div>
            </div>
            
            <div className="px-6 py-6">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${userRole === 'admin' ? 'bg-emerald-500' : userRole === 'dentist' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {session.user.email[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{session.user.email.split('@')[0]}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${userRole === 'admin' ? 'text-emerald-400' : userRole === 'dentist' ? 'text-blue-400' : 'text-purple-400'}`}>
                            {userRole === 'admin' ? 'Admin' : userRole === 'dentist' ? 'Dr.' : 'Asist.'}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                {getMenuItems().map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatientId(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wide transition-all duration-300 group ${activeTab === item.id ? t.activeNav : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}>
                        <item.icon size={18} className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-current' : ''}`}/> {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 space-y-2 border-t border-white/5">
                <button onClick={toggleTheme} className="w-full p-3 rounded-2xl bg-white/5 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:bg-white/10 hover:scale-[1.02]">
                    {themeMode === 'dark' ? <Moon size={14}/> : themeMode === 'light' ? <Sun size={14}/> : <Droplets size={14}/>} TEMA
                </button>
                <button onClick={() => supabase.auth.signOut()} className="w-full p-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-xs transition-all hover:bg-red-500/20 hover:scale-[1.02]">
                    <LogOut size={14} className="inline mr-2"/> SALIR
                </button>
            </div>
        </aside>
    );
}