import React, { useState } from 'react';
import {
    X, Cloud, LogOut, TrendingUp, CalendarClock, User, Users,
    Wallet, Calculator, Stethoscope, Library, FlaskConical, Box, Settings, Shield, ShieldCheck,
    Globe, HelpCircle
} from 'lucide-react';

export default function Sidebar({
    mobileMenuOpen, setMobileMenuOpen, config, session, userRole,
    activeTab, setActiveTab, setSelectedPatientId, supabase,
    isWorkspaceActive, todayApptCount = 0, isMasterAdmin = false
}) {
    const [showShortcuts, setShowShortcuts] = useState(false);
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
        if (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') { base.push({ id: 'sterilization', label: 'Esterilización', icon: ShieldCheck }); }
        if (userRole === 'admin') { base.push({ id: 'inventory', label: 'Insumos', icon: Box }); base.push({ id: 'settings', label: 'Ajustes', icon: Settings }); }
        base.push({ id: 'terms', label: 'Legal', icon: Shield });
        return base;
    };

    const sidebarWidth = isWorkspaceActive ? 'w-20' : 'w-64';
    const hideOnCollapse = isWorkspaceActive ? 'hidden' : 'block';
    const centerIcons = isWorkspaceActive ? 'justify-center' : '';

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-in-out bg-white border-r border-[#DFD2C4]/50 flex flex-col shadow-[4px_0_24px_rgba(91,102,81,0.04)]`}>
            
            {/* --- CABECERA Y LOGO --- */}
            <div className={`p-6 border-b border-[#DFD2C4]/40 flex flex-col items-center gap-4 relative bg-[#FDFBF7]/50 ${isWorkspaceActive ? 'px-2' : ''}`}>
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-[#9A8F84] hover:bg-[#DFD2C4]/30 rounded-full transition-colors">
                    <X size={20}/>
                </button>
                
                {/* Logo */}
                <div className={`rounded-2xl flex items-center justify-center shadow-sm bg-gradient-to-br from-[#9A8F84] to-[#5B6651] text-white border border-[#DFD2C4] transition-all ${isWorkspaceActive ? 'w-10 h-10' : 'w-14 h-14'}`}>
                    {config?.logo ? (
                        <img src={config.logo} className="w-full h-full object-contain rounded-2xl" alt="Logo"/>
                    ) : (
                        <Cloud size={isWorkspaceActive ? 20 : 28} strokeWidth={2.5}/>
                    )}
                </div>
                
                {/* Textos del Logo (Se ocultan si colapsa) */}
                <div className={`text-center ${hideOnCollapse}`}>
                    <h1 className="text-xl font-black tracking-tight text-[#312923]">ShiningCloud</h1>
                    <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#CBAAA2] mt-1">Dental</p>
                </div>
            </div>
            
            {/* --- PERFIL DE USUARIO --- */}
            <div className={`px-4 py-5 ${isWorkspaceActive ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-3 p-3 rounded-2xl bg-[#FDFBF7] border border-[#DFD2C4]/60 shadow-sm hover:border-[#CBAAA2]/50 transition-colors ${centerIcons}`}>
                    <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${userRole === 'admin' ? 'bg-[#312923]' : userRole === 'dentist' ? 'bg-[#5B6651]' : 'bg-[#9A8F84]'}`}>
                        {session?.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className={`overflow-hidden flex-1 ${hideOnCollapse}`}>
                        <p className="text-xs font-bold text-[#312923] truncate">{session?.user?.email?.split('@')[0] || 'Usuario'}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${userRole === 'admin' ? 'text-[#CBAAA2]' : userRole === 'dentist' ? 'text-[#5B6651]' : 'text-[#9A8F84]'}`}>
                            {userRole === 'admin' ? 'Administrador' : userRole === 'dentist' ? 'Dentista' : 'Asistente'}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- NAVEGACIÓN PRINCIPAL --- */}
            <nav className={`px-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar pb-4 ${isWorkspaceActive ? 'px-2' : ''}`}>
                {getMenuItems().map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            data-tour={item.id === 'ficha' ? 'patients' : item.id}
                            title={isWorkspaceActive ? item.label : ''}
                            onClick={() => {
                                setActiveTab(item.id); 
                                if(item.id !== 'ficha') setSelectedPatientId(null); 
                                setMobileMenuOpen(false); 
                            }} 
                            className={`w-full flex items-center gap-3 py-3.5 rounded-2xl font-bold text-xs transition-all duration-200 group ${centerIcons} ${isActive ? 'bg-[#5B6651]/10 text-[#5B6651] border border-[#5B6651]/20' : 'text-[#6B615A] hover:bg-[#FDFBF7] hover:text-[#312923] border border-transparent'} ${isWorkspaceActive ? 'px-0' : 'px-4'}`}
                        >
                            <item.icon size={18} className={`shrink-0 transition-transform duration-300 ${isActive ? 'text-[#5B6651] scale-110' : 'text-[#9A8F84] group-hover:text-[#CBAAA2] group-hover:scale-110'}`}/>
                            <span className={`mt-0.5 flex-1 ${hideOnCollapse}`}>{item.label}</span>
                            {item.id === 'agenda' && todayApptCount > 0 && (
                                <span className={`text-[9px] font-black bg-[#5B6651] text-white px-1.5 py-0.5 rounded-full leading-none shrink-0 ${hideOnCollapse}`}>
                                    {todayApptCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* --- ZONA INFERIOR: PANEL MAESTRO & SALIR --- */}
            <div className={`p-4 space-y-3 border-t border-[#DFD2C4]/40 bg-[#FDFBF7]/30 ${isWorkspaceActive ? 'px-2' : ''}`}>
                
                {/* BOTÓN PANEL MAESTRO */}
                {isMasterAdmin && (
                    <button
                        title={isWorkspaceActive ? "Panel Maestro" : ""}
                        onClick={() => { setActiveTab('master_panel'); setMobileMenuOpen(false); }}
                        className={`w-full p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 ${centerIcons} ${
                            activeTab === 'master_panel'
                            ? 'bg-[#5B6651] text-white shadow-md border border-[#4a5442]'
                            : 'bg-[#312923] text-[#A3968B] border border-[#1a1512] hover:bg-black hover:scale-[1.02] shadow-sm'
                        }`}
                    >
                        <Globe size={18} className={`shrink-0 transition-transform duration-300 ${activeTab === 'master_panel' ? 'text-white' : 'text-[#A3968B]'}`}/>
                        <span className={`mt-0.5 ${hideOnCollapse}`}>Panel Maestro</span>
                    </button>
                )}

                {/* BOTÓN CERRAR SESIÓN */}
                <button
                    title={isWorkspaceActive ? "Cerrar Sesión" : ""}
                    onClick={() => supabase.auth.signOut()}
                    className={`w-full p-4 rounded-2xl bg-white border border-[#DFD2C4]/50 text-[#6B615A] font-bold text-xs transition-all hover:bg-[#CBAAA2]/10 hover:text-[#312923] hover:border-[#CBAAA2]/40 flex items-center gap-3 ${centerIcons}`}
                >
                    <LogOut size={18} className="text-[#CBAAA2] shrink-0"/>
                    <span className={`mt-0.5 ${hideOnCollapse}`}>CERRAR SESIÓN</span>
                </button>

                {/* PANEL DE ATAJOS */}
                <div className="relative">
                    <button
                        title="Atajos de teclado"
                        onClick={() => setShowShortcuts(s => !s)}
                        className={`w-full p-3 rounded-xl text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] transition-colors flex items-center gap-3 text-[10px] font-bold ${centerIcons}`}
                    >
                        <HelpCircle size={15} className="shrink-0"/>
                        <span className={hideOnCollapse}>Atajos de teclado</span>
                    </button>
                    {showShortcuts && (
                        <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#312923] text-white rounded-2xl p-4 shadow-2xl z-50 text-[10px] space-y-1.5">
                            <p className="font-black uppercase tracking-widest text-[#A3968B] mb-2">Atajos</p>
                            {[
                                ['Ctrl/⌘ + K', 'Buscar paciente'],
                                ['N', 'Nuevo paciente'],
                                ['A', 'Nueva cita'],
                                ['P', 'Ir a Pacientes'],
                                ['G', 'Ir a Agenda'],
                                ['F', 'Ir a Finanzas'],
                            ].map(([key, label]) => (
                                <div key={key} className="flex justify-between items-center gap-3">
                                    <span className="text-[#DFD2C4]">{label}</span>
                                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] shrink-0">{key}</kbd>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}