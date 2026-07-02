import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileLock, PenTool, Clock, User, ShieldCheck, ListTodo, CheckCircle2, BookOpen, Plus, Trash2, ChevronDown, ChevronUp, X, Tag } from 'lucide-react';
import { Button } from './UIComponents';
import { supabase } from '../supabase';
import { getVaultItem, setVaultItem, removeVaultItem } from '../utils/cryptoVault';

// Importar los nuevos componentes de seguimiento
import OrthodonticsTrackingTab from './OrthodonticsTrackingTab';
import ImplantologyTrackingTab from './ImplantologyTrackingTab';
import EndodonticsTrackingTab from './EndodonticsTrackingTab';

const FACTORY_TEMPLATES = [
    {
        title: "Evaluación Inicial",
        content: "Paciente acude a consulta por primera vez. Se realiza anamnesis completa, examen clínico extraoral e intraoral. Se discuten antecedentes médicos y dentales. Se establecen objetivos de tratamiento y se solicitan exámenes complementarios.",
        category: "general"
    },
    {
        title: "Control de Ortodoncia Mensual",
        content: "Control de avance de tratamiento de ortodoncia. Se evalúa higiene, estado de brackets y arcos. Se realizan ajustes necesarios (cambio de ligaduras, arcos, etc.). Se dan indicaciones y se programa próxima cita.",
        category: "ortodoncia"
    },
    {
        title: "Instalación de Implante Dental",
        content: "Procedimiento quirúrgico para la instalación de implante dental en zona [especificar zona]. Anestesia local. Incisión, osteotomía, inserción del implante. Sutura. Indicaciones post-operatorias y medicación.",
        category: "implantologia"
    },
    {
        title: "Tratamiento de Endodoncia (1ra Sesión)",
        content: "Diagnóstico de pulpitis irreversible en pieza [especificar pieza]. Anestesia local. Aislamiento absoluto. Apertura cameral, instrumentación y conformación de conductos. Irrigación. Medicación intraconducto. Cierre provisional. Indicaciones.",
        category: "endodoncia"
    },
    {
        title: "Control Post-Operatorio (Cirugía Menor)",
        content: "Control de herida quirúrgica en zona [especificar zona]. Se evalúa cicatrización, ausencia de signos inflamatorios o infecciosos. Retiro de suturas si aplica. Indicaciones finales y alta.",
        category: "cirugia"
    },
    {
        title: "Limpieza Dental Profesional",
        content: "Profilaxis dental completa. Remoción de placa bacteriana y cálculo supragingival y subgingival. Pulido coronario. Instrucciones de higiene oral y recomendaciones de productos.",
        category: "general"
    },
    {
        title: "Exodoncia Simple",
        content: "Extracción de pieza [especificar pieza]. Anestesia local. Sindesmotomía, luxación y avulsión. Revisión de alvéolo. Compresión y hemostasia. Indicaciones post-operatorias.",
        category: "cirugia"
    },
    {
        title: "Restauración con Resina Compuesta",
        content: "Diagnóstico de caries en pieza [especificar pieza]. Anestesia local si es necesario. Eliminación de tejido cariado. Preparación cavitaria. Adhesión y restauración con resina compuesta. Pulido y ajuste oclusal.",
        category: "general"
    },
    {
        title: "Blanqueamiento Dental (Sesión Clínica)",
        content: "Aplicación de agente blanqueador en clínica. Protección de tejidos blandos. Activación del agente. Sesiones según protocolo. Indicaciones post-blanqueamiento y cuidados.",
        category: "estetica"
    },
    {
        title: "Tratamiento Periodontal (Fase Higiénica)",
        content: "Diagnóstico de gingivitis/periodontitis. Instrucción de higiene oral. Destartraje y alisado radicular por cuadrante. Control de placa. Reevaluación periodontal.",
        category: "periodoncia"
    },
    {
        title: "Consulta Pediátrica (Primera Visita)",
        content: "Anamnesis a padres. Examen clínico bucal en niño/a. Evaluación de riesgo de caries. Instrucción de higiene oral para padres e hijo/a. Fluoración tópica. Recomendaciones dietéticas.",
        category: "pediatria"
    },
];

// ─── Categorías predefinidas para las plantillas ───────────────────────────
const TEMPLATE_CATEGORIES = [
    { id: 'general', label: 'General' },
    { id: 'ortodoncia', label: 'Ortodoncia' },
    { id: 'implantologia', label: 'Implantología' },
    { id: 'endodoncia', label: 'Endodoncia' },
    { id: 'periodoncia', label: 'Periodoncia' },
    { id: 'cirugia', label: 'Cirugía' },
    { id: 'pediatria', label: 'Pediatría' },
    { id: 'estetica', label: 'Estética' },
];

// ─── Sub-componente: Modal para crear nueva plantilla ─────────────────────
function NewTemplateModal({ onClose, onSave, clinicEmail }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from("evolution_templates")
                .insert([{ clinic_email: clinicEmail, title: title.trim(), content: content.trim(), category }]);
            if (error) throw error;
            onSave();
        } catch (err) {
            console.error('Error guardando plantilla:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-[#DFD2C4]/60 animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-[#DFD2C4]/50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-[#312923] flex items-center gap-2">
                        <BookOpen size={18} className="text-[#CBAAA2]" />
                        Nueva Plantilla de Evolución
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5EFE8] text-[#9A8F84] transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5">
                            Título de la Plantilla
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej: Control de Ortodoncia Estándar"
                            className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-4 py-3 text-sm font-medium text-[#312923] outline-none focus:border-[#5B6651]/50 transition-colors placeholder:text-[#9A8F84]/50"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5">
                            Categoría
                        </label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-4 py-3 text-sm font-medium text-[#312923] outline-none focus:border-[#5B6651]/50 transition-colors"
                        >
                            {TEMPLATE_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] block mb-1.5">
                            Contenido de la Plantilla
                        </label>
                        <textarea
                            rows={5}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Redacte el texto que se autocompletará al seleccionar esta plantilla..."
                            className="w-full bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl px-4 py-3 text-sm font-medium text-[#312923] outline-none focus:border-[#5B6651]/50 transition-colors resize-none placeholder:text-[#9A8F84]/50 custom-scrollbar"
                        />
                    </div>
                </div>
                <div className="p-6 bg-[#FDFBF7] border-t border-[#DFD2C4]/50 flex justify-end gap-3 rounded-b-[2rem]">
                    <Button onClick={onClose} variant="secondary">
                        <X size={16} /> Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Plantilla'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PatientEvolutionTab({
    p, getPatient, selectedPatientId, savePatientData,
    newEvolution, setNewEvolution, notify, session, patientTab
}) {
    const [templates, setTemplates] = useState([]);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [activeTemplateCategory, setActiveTemplateCategory] = useState('all');
    const evolutionInputRef = useRef(null);

    useEffect(() => {
        fetchTemplates();
    }, [session]);

    useEffect(() => {
        if (evolutionInputRef.current) {
            evolutionInputRef.current.focus();
        }
    }, [newEvolution]);

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from("evolution_templates")
            .select("*")
            .eq("clinic_email", session.user.email);
        if (error) console.error("Error fetching templates:", error);
        else setTemplates(data);
    };

    const handleSaveEvolution = async () => {
        if (!newEvolution.trim()) {
            notify("La evolución no puede estar vacía.", "error");
            return;
        }

        const updatedPatient = { ...p };
        if (!updatedPatient.clinical) updatedPatient.clinical = {};
        if (!updatedPatient.clinical.evolutions) updatedPatient.clinical.evolutions = [];

        updatedPatient.clinical.evolutions.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            content: newEvolution,
            dentist: session?.user?.email || 'Desconocido',
            locked: false,
        });

        await savePatientData(updatedPatient);
        setNewEvolution('');
        notify("Evolución guardada exitosamente.", "success");
    };

    const applyTemplate = (templateContent) => {
        setNewEvolution(templateContent);
        setShowTemplates(false);
        notify("Plantilla aplicada.", "info");
    };

    const toggleLockEvolution = async (evolutionId) => {
        const updatedPatient = { ...p };
        const evolutionIndex = updatedPatient.clinical.evolutions.findIndex(e => e.id === evolutionId);
        if (evolutionIndex > -1) {
            updatedPatient.clinical.evolutions[evolutionIndex].locked = !updatedPatient.clinical.evolutions[evolutionIndex].locked;
            await savePatientData(updatedPatient);
            notify("Estado de evolución actualizado.", "success");
        }
    };

    const deleteEvolution = async (evolutionId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta evolución? Esta acción es irreversible.")) return;

        const updatedPatient = { ...p };
        updatedPatient.clinical.evolutions = updatedPatient.clinical.evolutions.filter(e => e.id !== evolutionId);
        await savePatientData(updatedPatient);
        notify("Evolución eliminada.", "success");
    };

    const filteredTemplates = activeTemplateCategory === 'all'
        ? templates
        : templates.filter(t => t.category === activeTemplateCategory);

    // Renderizado condicional de las pestañas de especialidades
    if (patientTab === 'orthodontics') {
        return <OrthodonticsTrackingTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} session={session} />;
    }
    if (patientTab === 'implantology') {
        return <ImplantologyTrackingTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} session={session} />;
    }
    if (patientTab === 'endodontics') {
        return <EndodonticsTrackingTab p={p} getPatient={getPatient} selectedPatientId={selectedPatientId} savePatientData={savePatientData} notify={notify} session={session} />;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#312923] tracking-tight">Evolución Clínica</h3>

            {/* Área para nueva evolución */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#DFD2C4]/60">
                <textarea
                    id="new-evolution-input"
                    ref={evolutionInputRef}
                    value={newEvolution}
                    onChange={e => setNewEvolution(e.target.value)}
                    placeholder="Escribe una nueva evolución clínica aquí..."
                    rows={6}
                    className="w-full p-4 border border-[#DFD2C4]/60 rounded-xl bg-[#FDFBF7] text-[#312923] font-medium outline-none focus:border-[#5B6651]/50 transition-colors resize-none custom-scrollbar"
                ></textarea>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                    <div className="flex gap-2">
                        <Button onClick={() => setShowTemplates(!showTemplates)} variant="secondary">
                            <BookOpen size={16} /> Plantillas
                        </Button>
                        <Button onClick={() => setShowNewTemplateModal(true)} variant="secondary">
                            <Plus size={16} /> Nueva Plantilla
                        </Button>
                    </div>
                    <Button onClick={handleSaveEvolution} disabled={!newEvolution.trim()}>
                        <CheckCircle2 size={16} /> Guardar Evolución
                    </Button>
                </div>

                {/* Modal de Nueva Plantilla */}
                {showNewTemplateModal && (
                    <NewTemplateModal
                        onClose={() => setShowNewTemplateModal(false)}
                        onSave={() => { setShowNewTemplateModal(false); fetchTemplates(); }}
                        clinicEmail={session?.user?.email}
                    />
                )}

                {/* Selector de Plantillas */}
                {showTemplates && (
                    <div className="mt-6 bg-[#FDFBF7] p-4 rounded-2xl border border-[#DFD2C4]/60 shadow-inner">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => setActiveTemplateCategory('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTemplateCategory === 'all' ? 'bg-[#5B6651] text-white' : 'bg-white text-[#6B615A] hover:bg-[#F5EFE8]'}`}
                            >
                                Todas
                            </button>
                            {TEMPLATE_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTemplateCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTemplateCategory === cat.id ? 'bg-[#5B6651] text-white' : 'bg-white text-[#6B615A] hover:bg-[#F5EFE8]'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {filteredTemplates.length === 0 ? (
                                <p className="text-sm text-[#9A8F84] col-span-full">No hay plantillas disponibles para esta categoría.</p>
                            ) : (
                                filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => applyTemplate(template.content)}
                                        className="p-3 bg-white border border-[#DFD2C4]/60 rounded-xl cursor-pointer hover:bg-[#F5EFE8] transition-colors shadow-sm"
                                    >
                                        <p className="font-bold text-[#312923] text-sm">{template.title}</p>
                                        <p className="text-xs text-[#9A8F84] mt-1 truncate">{template.content}</p>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#CBAAA2] mt-2 block">{TEMPLATE_CATEGORIES.find(cat => cat.id === template.category)?.label || 'General'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Historial de evoluciones */}
            <div className="space-y-4">
                {p.clinical?.evolutions?.length === 0 ? (
                    <div className="text-center py-10 text-[#9A8F84] border border-dashed border-[#DFD2C4] rounded-2xl bg-[#FDFBF7]/50">
                        <p>No hay evoluciones clínicas registradas para este paciente.</p>
                    </div>
                ) : (
                    p.clinical.evolutions.map(evolution => (
                        <div key={evolution.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#DFD2C4]/60">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-xs font-bold text-[#9A8F84] uppercase tracking-widest">{new Date(evolution.date).toLocaleDateString()} - {new Date(evolution.date).toLocaleTimeString()}</p>
                                    <p className="text-sm font-medium text-[#6B615A]">Dr. {evolution.dentist}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleLockEvolution(evolution.id)}
                                        className={`p-2 rounded-lg transition-colors ${evolution.locked ? 'text-[#5B6651] hover:bg-[#F5EFE8]' : 'text-[#CBAAA2] hover:bg-[#F5EFE8]'}`}
                                        title={evolution.locked ? 'Desbloquear evolución' : 'Bloquear evolución'}
                                    >
                                        <FileLock size={16} />
                                    </button>
                                    {!evolution.locked && (
                                        <button
                                            onClick={() => deleteEvolution(evolution.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar evolución"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-[#312923] leading-relaxed whitespace-pre-wrap">{evolution.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
