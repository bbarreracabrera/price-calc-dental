import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mic, MicOff, FileLock, PenTool, Clock, User, ShieldCheck, ListTodo, CheckCircle2, BookOpen, Plus, Trash2, ChevronDown, ChevronUp, X, Tag } from 'lucide-react';
import { Button } from './UIComponents';
import { supabase } from '../supabase';
import { getVaultItem, setVaultItem, removeVaultItem } from '../utils/cryptoVault';

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
                <div className="p-6 border-t border-[#DFD2C4]/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#9A8F84] hover:bg-[#F5EFE8] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || !content.trim() || saving}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                            title.trim() && content.trim() && !saving
                                ? 'bg-[#5B6651] text-white hover:bg-[#4a5542] shadow-sm'
                                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                        }`}
                    >
                        {saving ? <span className="animate-pulse">Guardando...</span> : <><Plus size={14} /> Guardar Plantilla</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-componente: Panel selector de plantillas ─────────────────────────
function TemplateSelector({ templates, loadingTemplates, onSelect, onDelete, onNew, clinicEmail }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const filteredTemplates = useMemo(() => {
        if (activeCategory === 'all') return templates;
        return templates.filter(t => t.category === activeCategory);
    }, [templates, activeCategory]);

    const usedCategories = useMemo(() => {
        const cats = new Set(templates.map(t => t.category));
        return TEMPLATE_CATEGORIES.filter(c => cats.has(c.id));
    }, [templates]);

    const handleDelete = async (templateId) => {
        try {
            const { error } = await supabase
                .from("evolution_templates")
                .delete()
                .eq("id", templateId);
            if (error) throw error;
            onDelete(templateId);
            setConfirmDelete(null);
        } catch (err) {
            console.error('Error eliminando plantilla:', err);
        }
    };

    return (
        <div className="mb-5 border border-[#DFD2C4]/60 rounded-2xl overflow-hidden">
            {/* Header del panel */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#FDFBF7] hover:bg-[#F5EFE8] transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#CBAAA2]/15 rounded-lg">
                        <BookOpen size={14} className="text-[#CBAAA2]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#312923]">
                        Plantillas de Evolución
                    </span>
                    {templates.length > 0 && (
                        <span className="bg-[#5B6651]/10 text-[#5B6651] text-[9px] font-black px-2 py-0.5 rounded-full">
                            {templates.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={e => { e.stopPropagation(); onNew(); }}
                        className="p-1.5 rounded-lg bg-[#5B6651]/10 text-[#5B6651] hover:bg-[#5B6651]/20 transition-colors"
                        title="Nueva plantilla"
                    >
                        <Plus size={13} />
                    </button>
                    {isOpen ? <ChevronUp size={16} className="text-[#9A8F84]" /> : <ChevronDown size={16} className="text-[#9A8F84]" />}
                </div>
            </button>

            {/* Contenido expandible */}
            {isOpen && (
                <div className="border-t border-[#DFD2C4]/50 bg-white">
                    {loadingTemplates ? (
                        <div className="py-8 text-center text-[10px] font-bold uppercase tracking-widest text-[#9A8F84] animate-pulse">
                            Cargando plantillas...
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="py-8 text-center">
                            <BookOpen size={28} className="mx-auto text-[#DFD2C4] mb-2" />
                            <p className="text-sm font-bold text-[#9A8F84] mb-1">Sin plantillas aún</p>
                            <p className="text-xs text-[#A3968B] mb-4">Crea tu primera plantilla para ahorrar tiempo en cada consulta</p>
                            <button
                                onClick={onNew}
                                className="px-5 py-2 rounded-xl text-xs font-black bg-[#5B6651] text-white hover:bg-[#4a5542] transition-colors"
                            >
                                + Crear primera plantilla
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Filtro por categoría */}
                            {usedCategories.length > 1 && (
                                <div className="px-4 pt-3 pb-2 flex gap-1.5 flex-wrap border-b border-[#DFD2C4]/30">
                                    <button
                                        onClick={() => setActiveCategory('all')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                            activeCategory === 'all'
                                                ? 'bg-[#312923] text-white'
                                                : 'bg-[#F5EFE8] text-[#9A8F84] hover:bg-[#DFD2C4]/50'
                                        }`}
                                    >
                                        Todas
                                    </button>
                                    {usedCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                                activeCategory === cat.id
                                                    ? 'bg-[#CBAAA2] text-white'
                                                    : 'bg-[#F5EFE8] text-[#9A8F84] hover:bg-[#DFD2C4]/50'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Lista de plantillas */}
                            <div className="p-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {filteredTemplates.map(template => (
                                    <div key={template.id} className="flex items-center justify-between bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-[#CBAAA2]/10 rounded-lg">
                                                <BookOpen size={14} className="text-[#CBAAA2]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#312923]">{template.title}</p>
                                                <p className="text-xs text-[#9A8F84]">{TEMPLATE_CATEGORIES.find(c => c.id === template.category)?.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onSelect(template.content)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#5B6651] text-white hover:bg-[#4a5542] transition-colors"
                                            >
                                                Usar
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(template.id)}
                                                className="p-1.5 rounded-lg text-[#9A8F84] hover:bg-[#F5EFE8] transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm border border-[#DFD2C4]/60 animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b border-[#DFD2C4]/50">
                            <h3 className="text-lg font-black text-[#312923]">Confirmar Eliminación</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-[#312923]">¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="p-6 border-t border-[#DFD2C4]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#9A8F84] hover:bg-[#F5EFE8] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                className="px-6 py-2.5 rounded-xl text-sm font-black bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Componente principal: PatientEvolutionTab ────────────────────────────
export default function PatientEvolutionTab({ selectedPatientId, clinicOwner, notify }) {
    const [newEvolution, setNewEvolution] = useState('');
    const [evolutions, setEvolutions] = useState([]);
    const [loadingEvo, setLoadingEvo] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [factoryTemplatesLoaded, setFactoryTemplatesLoaded] = useState(false);

    const patient = useMemo(() => getPatient(selectedPatientId), [selectedPatientId]);

    // --- Speech Recognition State ---
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // --- Draft State ---
    const [draftEvolution, setDraftEvolution] = useState('');
    const [showDraftRecovered, setShowDraftRecovered] = useState(false);

    // --- Funciones de Supabase ---
    const fetchEvolutions = async () => {
        setLoadingEvo(true);
        try {
            const { data, error } = await supabase
                .from('patient_evolutions')
                .select('*')
                .eq('patient_id', selectedPatientId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setEvolutions(data);
        } catch (error) {
            console.error('Error fetching evolutions:', error);
            notify('error', 'Error al cargar evoluciones.');
        } finally {
            setLoadingEvo(false);
        }
    };

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const { data, error } = await supabase
                .from('evolution_templates')
                .select('*')
                .eq('clinic_email', clinicOwner.email);
            if (error) throw error;
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            notify('error', 'Error al cargar plantillas.');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const loadFactoryTemplates = async () => {
        if (!clinicOwner || factoryTemplatesLoaded) return;

        try {
            const { data: existingTemplates, error: fetchError } = await supabase
                .from('evolution_templates')
                .select('title')
                .eq('clinic_email', clinicOwner.email);

            if (fetchError) throw fetchError;

            const existingTitles = new Set(existingTemplates.map(t => t.title));
            const templatesToInsert = FACTORY_TEMPLATES.filter(
                template => !existingTitles.has(template.title)
            ).map(template => ({
                clinic_email: clinicOwner.email,
                title: template.title,
                content: template.content,
                category: template.category
            }));

            if (templatesToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('evolution_templates')
                    .insert(templatesToInsert);
                if (insertError) throw insertError;
                notify('success', `Se cargaron ${templatesToInsert.length} plantillas de fábrica.`);
            }
            setFactoryTemplatesLoaded(true);
            fetchTemplates(); // Refrescar la lista de plantillas después de cargar las de fábrica
        } catch (error) {
            console.error('Error loading factory templates:', error);
            notify('error', 'Error al cargar plantillas de fábrica.');
        }
    };

    // --- Efectos --- 
    useEffect(() => {
        if (selectedPatientId) {
            fetchEvolutions();
            fetchTemplates();
        }
    }, [selectedPatientId]);

    useEffect(() => {
        loadFactoryTemplates();
    }, [clinicOwner, factoryTemplatesLoaded]);

    // --- Speech Recognition ---
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-CL';

        recognitionRef.current.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            setNewEvolution(prev => prev + finalTranscript + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            notify('error', 'Error en el reconocimiento de voz.');
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    // --- Draft Management ---
    useEffect(() => {
        const draftKey = `draft_evolution_${selectedPatientId}`;
        const savedDraft = getVaultItem(draftKey);
        if (savedDraft) {
            setNewEvolution(savedDraft);
            setShowDraftRecovered(true);
            notify('info', 'Borrador recuperado automáticamente.');
        }
    }, [selectedPatientId]);

    useEffect(() => {
        const draftKey = `draft_evolution_${selectedPatientId}`;
        if (newEvolution.trim() !== '') {
            setVaultItem(draftKey, newEvolution);
        } else {
            removeVaultItem(draftKey);
        }
    }, [newEvolution, selectedPatientId]);

    const handleSave = async () => {
        if (!newEvolution.trim()) return;

        setIsSaving(true);
        try {
            const patientData = await getPatient(selectedPatientId);
            if (!patientData) {
                notify('error', 'Paciente no encontrado.');
                return;
            }

            const evolutionData = {
                patient_id: selectedPatientId,
                clinic_email: clinicOwner.email,
                author: clinicOwner.name || 'Dr. Desconocido',
                evolution_text: newEvolution.trim(),
                created_at: new Date().toISOString(),
            };

            const { signature_hash, error: hashError } = await generateHash(evolutionData);
            if (hashError) throw hashError;

            const { error } = await supabase
                .from('patient_evolutions')
                .insert({
                    ...evolutionData,
                    signature_hash: signature_hash,
                });

            if (error) throw error;

            setNewEvolution('');
            removeVaultItem(`draft_evolution_${selectedPatientId}`);
            fetchEvolutions();
            notify('success', 'Evolución firmada y sellada con éxito!');
        } catch (error) {
            console.error('Error saving evolution:', error);
            notify('error', `Error al guardar evolución: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTemplateSaved = () => {
        setShowNewTemplateModal(false);
        fetchTemplates();
        notify('success', 'Plantilla guardada con éxito!');
    };

    const handleTemplateSelected = (content) => {
        setNewEvolution(prev => prev + content + '\n');
        notify('info', 'Plantilla aplicada.');
    };

    const handleTemplateDeleted = (templateId) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        notify('success', 'Plantilla eliminada.');
    };

    // Helper para obtener datos del paciente (asumiendo que existe en algún contexto o se puede buscar)
    async function getPatient(patientId) {
        const { data, error } = await supabase
            .from('patients')
            .select('id, name, rut')
            .eq('id', patientId)
            .single();
        if (error) {
            console.error('Error fetching patient:', error);
            return null;
        }
        return data;
    }

    // Helper para generar hash (simplificado para el ejemplo)
    async function generateHash(data) {
        // En una aplicación real, esto implicaría un proceso criptográfico más robusto
        // Por ahora, es una simulación.
        const dataString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return { signature_hash: hashHex };
    }

    return (
        <div className="p-6 bg-[#FDFBF7] rounded-[2rem] shadow-lg border border-[#DFD2C4]/60 h-full flex flex-col">
            {showNewTemplateModal && (
                <NewTemplateModal
                    onClose={() => setShowNewTemplateModal(false)}
                    onSave={handleTemplateSaved}
                    clinicEmail={clinicOwner.email}
                />
            )}

            <TemplateSelector
                templates={templates}
                loadingTemplates={loadingTemplates}
                onSelect={handleTemplateSelected}
                onDelete={handleTemplateDeleted}
                onNew={() => setShowNewTemplateModal(true)}
                clinicEmail={clinicOwner.email}
            />

            <div className="flex-grow">
                {patient && (
                    <div className="mb-5 p-4 bg-[#F5EFE8] rounded-2xl border border-[#DFD2C4]/50 flex items-center gap-3">
                        <User size={20} className="text-[#CBAAA2]" />
                        <div>
                            <p className="text-sm font-bold text-[#312923]">Paciente: {patient.name}</p>
                            <p className="text-xs text-[#9A8F84]">RUT: {patient.rut}</p>
                        </div>
                    </div>
                )}

                <div className="relative mb-4">
                    <textarea
                        value={newEvolution}
                        onChange={(e) => setNewEvolution(e.target.value)}
                        placeholder="Escribe la evolución clínica aquí..."
                        rows={8}
                        className="w-full p-4 pr-12 bg-white border border-[#DFD2C4]/60 rounded-2xl text-sm font-medium text-[#312923] outline-none focus:border-[#5B6651]/50 transition-colors resize-y custom-scrollbar"
                    ></textarea>
                    <button
                        onClick={toggleListening}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
                            isListening ? 'bg-[#EF4444] text-white' : 'bg-[#F5EFE8] text-[#9A8F84] hover:bg-[#DFD2C4]/50'
                        }`}
                        title={isListening ? 'Detener dictado' : 'Iniciar dictado'}
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    {draftEvolution && (
                        <p className="text-xs text-[#9A8F84] italic">✓ {draftEvolution}</p>
                    )}
                </div>

                {showDraftRecovered && (
                    <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl p-3 mb-4 flex items-center gap-2">
                        <p className="text-sm font-bold text-[#312923]">Recuperamos un borrador que dejaste sin guardar</p>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Nueva Entrada</span>
                </div>
                
                <div className="relative bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl p-5 focus-within:border-[#5B6651]/50 transition-colors shadow-inner">
                    <textarea 
                        rows="4" 
                        placeholder="Redacte la evolución clínica del día de hoy... (No podrá ser modificada una vez firmada)" 
                        className="bg-transparent outline-none w-full font-medium text-sm text-[#312923] resize-none placeholder:text-[#9A8F84]/60 custom-scrollbar pr-10" 
                        value={newEvolution}
                        onChange={(e) => setNewEvolution(e.target.value)}
                    />
                    {draftStatus && (
                        <p className="text-xs text-[#9A8F84] italic">✓ {draftStatus}</p>
                    )}
                </div>

                <div className="mt-3 flex justify-end">
                    <Button 
                        variant="primary" 
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${
                            newEvolution.trim() && !isSaving
                            ? 'bg-[#312923] text-white hover:bg-[#1a1512] shadow-[#312923]/20 hover:-translate-y-0.5' 
                            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none'
                        }`}
                        onClick={handleSave}
                        disabled={!newEvolution.trim() || isSaving}
                    >
                        {isSaving ? <span className="animate-pulse">SELLANDO...</span> : <><FileLock size={16} /> Firmar y Sellar</>}
                    </Button>
                </div>
            </div>

            {/* --- HISTORIAL --- */}
            <div className="pt-6">
                {loadingEvo ? (
                    <div className="text-center py-12 text-[#9A8F84] text-xs font-bold uppercase tracking-widest animate-pulse">
                        Cargando Historial Criptográfico...
                    </div>
                ) : evolutions.length === 0 ? (
                    <div className="text-center py-12 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem]">
                        <Clock className="mx-auto text-[#DFD2C4] mb-3" size={32}/>
                        <p className="text-sm font-bold text-[#9A8F84]">No hay registros clínicos previos</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-[#DFD2C4]/40 ml-4 pl-8 space-y-8 pb-4">
                        {evolutions.map((ev) => (
                            <div key={ev.id} className="relative group">
                                <div className="absolute -left-[41px] top-5 w-4 h-4 bg-white border-4 border-[#CBAAA2] group-hover:border-[#5B6651] rounded-full shadow-sm transition-colors z-10" />
                                <div className="bg-white p-6 rounded-[2rem] border border-[#DFD2C4]/60 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b border-[#DFD2C4]/40 pb-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-[#5B6651] uppercase tracking-widest bg-[#5B6651]/5 px-3 py-1.5 rounded-lg border border-[#5B6651]/10">
                                            <Clock size={14} />
                                            {formatDate(ev.created_at)}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#9A8F84] bg-[#FDFBF7] px-3 py-1.5 rounded-lg border border-[#DFD2C4]/50">
                                            <User size={12} className="text-[#CBAAA2]" />
                                            {ev.author}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#312923] leading-relaxed whitespace-pre-wrap font-medium">
                                        {ev.evolution_text}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-[#DFD2C4]/30 flex items-center justify-end opacity-50">
                                        <span className="text-[8px] font-mono text-[#9A8F84] flex items-center gap-1" title="Hash criptográfico SHA-256">
                                            <FileLock size={10} /> Hash: {ev.signature_hash.substring(0, 16)}...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
