import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Calendar, Tag, Crosshair, Ruler, FlaskConical, Droplets, Microscope } from 'lucide-react';
import { supabase } from '../supabase';

export default function EndodonticsTrackingTab({
    p, getPatient, selectedPatientId, savePatientData, notify, session
}) {
    const [endoRecords, setEndoRecords] = useState([]);
    const [newRecord, setNewRecord] = useState(null);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedPatientId) {
            fetchEndoRecords();
        }
    }, [selectedPatientId]);

    const fetchEndoRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('endodontics_tracking')
            .select('*')
            .eq('patient_id', selectedPatientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching endodontics records:', error);
            notify('Error al cargar registros de endodoncia.', 'error');
        } else {
            setEndoRecords(data);
        }
        setLoading(false);
    };

    const handleAddRecord = () => {
        setNewRecord({
            patient_id: selectedPatientId,
            tooth_number: '',
            diagnosis: '',
            working_length: '',
            instruments_used: '',
            irrigation_solution: '',
            intracanal_medication: '',
            obturation_material: '',
            radiographic_follow_up: false,
            notes: '',
            created_by: session?.user?.email || 'Desconocido'
        });
    };

    const handleSaveRecord = async (record) => {
        setLoading(true);
        let error = null;
        if (record.id) {
            const { error: updateError } = await supabase
                .from('endodontics_tracking')
                .update(record)
                .eq('id', record.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('endodontics_tracking')
                .insert([record]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving endodontics record:', error);
            notify('Error al guardar registro de endodoncia.', 'error');
        } else {
            notify('Registro de endodoncia guardado exitosamente.', 'success');
            setNewRecord(null);
            setEditingRecordId(null);
            fetchEndoRecords();
        }
        setLoading(false);
    };

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
        setLoading(true);
        const { error } = await supabase
            .from('endodontics_tracking')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting endodontics record:', error);
            notify('Error al eliminar registro de endodoncia.', 'error');
        } else {
            notify('Registro de endodoncia eliminado exitosamente.', 'success');
            fetchEndoRecords();
        }
        setLoading(false);
    };

    const handleChange = (e, record, field) => {
        const updatedRecord = { ...record, [field]: e.target.value };
        if (record.id) {
            setEndoRecords(endoRecords.map(r => r.id === record.id ? updatedRecord : r));
        } else {
            setNewRecord(updatedRecord);
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-[#9A8F84]">Cargando registros de endodoncia...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#312923]">Seguimiento de Endodoncia</h3>
                <button
                    onClick={handleAddRecord}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5B6651] text-white rounded-xl text-sm font-bold hover:bg-[#4a5442] transition-colors"
                >
                    <Plus size={16} /> Nuevo Registro
                </button>
            </div>

            {newRecord && (
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#DFD2C4]/60 shadow-sm space-y-4">
                    <h4 className="font-bold text-[#312923]">Nuevo Registro</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Número de Diente</label>
                            <input type="text" value={newRecord.tooth_number} onChange={(e) => handleChange(e, newRecord, 'tooth_number')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: 1.6" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Diagnóstico</label>
                            <input type="text" value={newRecord.diagnosis} onChange={(e) => handleChange(e, newRecord, 'diagnosis')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Pulpitis irreversible" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Longitud de Trabajo (mm)</label>
                            <input type="text" value={newRecord.working_length} onChange={(e) => handleChange(e, newRecord, 'working_length')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: 21.5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Instrumentos Utilizados</label>
                            <input type="text" value={newRecord.instruments_used} onChange={(e) => handleChange(e, newRecord, 'instruments_used')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: K-files #15-40, ProTaper Universal" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Solución de Irrigación</label>
                            <input type="text" value={newRecord.irrigation_solution} onChange={(e) => handleChange(e, newRecord, 'irrigation_solution')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Hipoclorito de Sodio 5.25%" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Medicación Intraconducto</label>
                            <input type="text" value={newRecord.intracanal_medication} onChange={(e) => handleChange(e, newRecord, 'intracanal_medication')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Hidróxido de Calcio" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Material de Obturación</label>
                            <input type="text" value={newRecord.obturation_material} onChange={(e) => handleChange(e, newRecord, 'obturation_material')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Cono de gutapercha, sellador AH Plus" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={newRecord.radiographic_follow_up} onChange={(e) => setNewRecord({ ...newRecord, radiographic_follow_up: e.target.checked })} className="form-checkbox" />
                            <label className="text-xs font-bold text-[#9A8F84]">Seguimiento Radiográfico</label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Notas Adicionales</label>
                            <textarea value={newRecord.notes} onChange={(e) => handleChange(e, newRecord, 'notes')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" rows="3" placeholder="Cualquier otra observación relevante"></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setNewRecord(null)} className="px-4 py-2 text-[#312923] rounded-xl text-sm font-bold hover:bg-[#F5EFE8] transition-colors">
                            <X size={16} className="inline-block mr-1" /> Cancelar
                        </button>
                        <button onClick={() => handleSaveRecord(newRecord)} className="px-4 py-2 bg-[#5B6651] text-white rounded-xl text-sm font-bold hover:bg-[#4a5442] transition-colors">
                            <Save size={16} className="inline-block mr-1" /> Guardar
                        </button>
                    </div>
                </div>
            )}

            {endoRecords.length === 0 && !newRecord ? (
                <div className="text-center py-10 text-[#9A8F84] border border-dashed border-[#DFD2C4] rounded-2xl bg-[#FDFBF7]/50">
                    <p>No hay registros de endodoncia para este paciente.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {endoRecords.map(record => (
                        <div key={record.id} className="bg-white p-4 rounded-2xl border border-[#DFD2C4]/60 shadow-sm">
                            {editingRecordId === record.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Número de Diente</label>
                                            <input type="text" value={record.tooth_number} onChange={(e) => handleChange(e, record, 'tooth_number')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Diagnóstico</label>
                                            <input type="text" value={record.diagnosis} onChange={(e) => handleChange(e, record, 'diagnosis')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Longitud de Trabajo (mm)</label>
                                            <input type="text" value={record.working_length} onChange={(e) => handleChange(e, record, 'working_length')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Instrumentos Utilizados</label>
                                            <input type="text" value={record.instruments_used} onChange={(e) => handleChange(e, record, 'instruments_used')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Solución de Irrigación</label>
                                            <input type="text" value={record.irrigation_solution} onChange={(e) => handleChange(e, record, 'irrigation_solution')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Medicación Intraconducto</label>
                                            <input type="text" value={record.intracanal_medication} onChange={(e) => handleChange(e, record, 'intracanal_medication')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Material de Obturación</label>
                                            <input type="text" value={record.obturation_material} onChange={(e) => handleChange(e, record, 'obturation_material')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={record.radiographic_follow_up} onChange={(e) => handleChange(e, record, 'radiographic_follow_up')} className="form-checkbox" />
                                            <label className="text-xs font-bold text-[#9A8F84]">Seguimiento Radiográfico</label>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Notas Adicionales</label>
                                            <textarea value={record.notes} onChange={(e) => handleChange(e, record, 'notes')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" rows="3"></textarea>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingRecordId(null)} className="px-4 py-2 text-[#312923] rounded-xl text-sm font-bold hover:bg-[#F5EFE8] transition-colors">
                                            <X size={16} className="inline-block mr-1" /> Cancelar
                                        </button>
                                        <button onClick={() => handleSaveRecord(record)} className="px-4 py-2 bg-[#5B6651] text-white rounded-xl text-sm font-bold hover:bg-[#4a5442] transition-colors">
                                            <Save size={16} className="inline-block mr-1" /> Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <p className="font-bold text-[#312923]">Diente: {record.tooth_number} - {record.diagnosis}</p>
                                        <p className="text-sm text-[#6B615A]">Longitud de Trabajo: {record.working_length}mm | Instrumentos: {record.instruments_used}</p>
                                        <p className="text-xs text-[#9A8F84]">Irrigación: {record.irrigation_solution} | Medicación: {record.intracanal_medication}</p>
                                        <p className="text-xs text-[#9A8F84] mt-1">Obturación: {record.obturation_material}</p>
                                        {record.radiographic_follow_up && <p className="text-xs text-[#9A8F84] mt-1">Seguimiento Radiográfico: Sí</p>}
                                        {record.notes && <p className="text-xs text-[#9A8F84] mt-1">Notas: {record.notes}</p>}
                                        <p className="text-xs text-[#9A8F84] mt-1">Registrado por: {record.created_by} el {new Date(record.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2 mt-3 md:mt-0">
                                        <button onClick={() => setEditingRecordId(record.id)} className="p-2 text-[#5B6651] hover:bg-[#F5EFE8] rounded-lg transition-colors">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteRecord(record.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
