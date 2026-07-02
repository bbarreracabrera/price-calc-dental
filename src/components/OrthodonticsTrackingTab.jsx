import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Calendar, Tag, GitBranch, Ruler, Type, Droplets, ListTodo } from 'lucide-react';
import { supabase } from '../supabase';

export default function OrthodonticsTrackingTab({
    p, getPatient, selectedPatientId, savePatientData, notify, session
}) {
    const [orthoRecords, setOrthoRecords] = useState([]);
    const [newRecord, setNewRecord] = useState(null);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedPatientId) {
            fetchOrthoRecords();
        }
    }, [selectedPatientId]);

    const fetchOrthoRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orthodontics_tracking')
            .select('*')
            .eq('patient_id', selectedPatientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orthodontics records:', error);
            notify('Error al cargar registros de ortodoncia.', 'error');
        } else {
            setOrthoRecords(data);
        }
        setLoading(false);
    };

    const handleAddRecord = () => {
        setNewRecord({
            patient_id: selectedPatientId,
            treatment_type: '',
            torque_angulation: '',
            archwire_type: '',
            archwire_change_date: '',
            elastomers: '',
            activation_notes: '',
            created_by: session?.user?.email || 'Desconocido'
        });
    };

    const handleSaveRecord = async (record) => {
        setLoading(true);
        let error = null;
        if (record.id) {
            const { error: updateError } = await supabase
                .from('orthodontics_tracking')
                .update(record)
                .eq('id', record.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('orthodontics_tracking')
                .insert([record]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving orthodontics record:', error);
            notify('Error al guardar registro de ortodoncia.', 'error');
        } else {
            notify('Registro de ortodoncia guardado exitosamente.', 'success');
            setNewRecord(null);
            setEditingRecordId(null);
            fetchOrthoRecords();
        }
        setLoading(false);
    };

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
        setLoading(true);
        const { error } = await supabase
            .from('orthodontics_tracking')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting orthodontics record:', error);
            notify('Error al eliminar registro de ortodoncia.', 'error');
        } else {
            notify('Registro de ortodoncia eliminado exitosamente.', 'success');
            fetchOrthoRecords();
        }
        setLoading(false);
    };

    const handleChange = (e, record, field) => {
        const updatedRecord = { ...record, [field]: e.target.value };
        if (record.id) {
            setOrthoRecords(orthoRecords.map(r => r.id === record.id ? updatedRecord : r));
        } else {
            setNewRecord(updatedRecord);
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-[#9A8F84]">Cargando registros de ortodoncia...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#312923]">Seguimiento de Ortodoncia</h3>
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
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Tratamiento</label>
                            <input type="text" value={newRecord.treatment_type} onChange={(e) => handleChange(e, newRecord, 'treatment_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Fijo, Removible, Alineadores" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Torque/Angulación por Diente</label>
                            <input type="text" value={newRecord.torque_angulation} onChange={(e) => handleChange(e, newRecord, 'torque_angulation')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: 15° en 1.1" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Arco</label>
                            <input type="text" value={newRecord.archwire_type} onChange={(e) => handleChange(e, newRecord, 'archwire_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="NiTi 0.14, Acero 0.16x0.22" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Fecha Cambio de Arco</label>
                            <input type="date" value={newRecord.archwire_change_date} onChange={(e) => handleChange(e, newRecord, 'archwire_change_date')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Elastómeros</label>
                            <input type="text" value={newRecord.elastomers} onChange={(e) => handleChange(e, newRecord, 'elastomers')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Color, Tipo" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Notas de Activación</label>
                            <textarea value={newRecord.activation_notes} onChange={(e) => handleChange(e, newRecord, 'activation_notes')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" rows="3" placeholder="Ajustes realizados, indicaciones al paciente"></textarea>
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

            {orthoRecords.length === 0 && !newRecord ? (
                <div className="text-center py-10 text-[#9A8F84] border border-dashed border-[#DFD2C4] rounded-2xl bg-[#FDFBF7]/50">
                    <p>No hay registros de ortodoncia para este paciente.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orthoRecords.map(record => (
                        <div key={record.id} className="bg-white p-4 rounded-2xl border border-[#DFD2C4]/60 shadow-sm">
                            {editingRecordId === record.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Tratamiento</label>
                                            <input type="text" value={record.treatment_type} onChange={(e) => handleChange(e, record, 'treatment_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Torque/Angulación por Diente</label>
                                            <input type="text" value={record.torque_angulation} onChange={(e) => handleChange(e, record, 'torque_angulation')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Arco</label>
                                            <input type="text" value={record.archwire_type} onChange={(e) => handleChange(e, record, 'archwire_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Fecha Cambio de Arco</label>
                                            <input type="date" value={record.archwire_change_date} onChange={(e) => handleChange(e, record, 'archwire_change_date')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Elastómeros</label>
                                            <input type="text" value={record.elastomers} onChange={(e) => handleChange(e, record, 'elastomers')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Notas de Activación</label>
                                            <textarea value={record.activation_notes} onChange={(e) => handleChange(e, record, 'activation_notes')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" rows="3"></textarea>
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
                                        <p className="font-bold text-[#312923]">{record.treatment_type || 'Sin tipo'}</p>
                                        <p className="text-sm text-[#6B615A]">Arco: {record.archwire_type || 'N/A'} | Elastómeros: {record.elastomers || 'N/A'}</p>
                                        {record.archwire_change_date && <p className="text-xs text-[#9A8F84]">Cambio de arco: {new Date(record.archwire_change_date).toLocaleDateString()}</p>}
                                        {record.activation_notes && <p className="text-xs text-[#9A8F84] mt-1">Notas: {record.activation_notes}</p>}
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
