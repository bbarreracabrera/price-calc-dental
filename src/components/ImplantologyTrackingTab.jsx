import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Calendar, Tag, HardDrive, Ruler, Shield, Layers, Bone } from 'lucide-react';
import { supabase } from '../supabase';

export default function ImplantologyTrackingTab({
    p, getPatient, selectedPatientId, savePatientData, notify, session
}) {
    const [implantRecords, setImplantRecords] = useState([]);
    const [newRecord, setNewRecord] = useState(null);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedPatientId) {
            fetchImplantRecords();
        }
    }, [selectedPatientId]);

    const fetchImplantRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('implantology_tracking')
            .select('*')
            .eq('patient_id', selectedPatientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching implantology records:', error);
            notify('Error al cargar registros de implantología.', 'error');
        } else {
            setImplantRecords(data);
        }
        setLoading(false);
    };

    const handleAddRecord = () => {
        setNewRecord({
            patient_id: selectedPatientId,
            implant_brand: '',
            implant_model: '',
            diameter: '',
            length: '',
            insertion_torque: '',
            placement_date: '',
            stage: 'osteointegracion', // 'osteointegracion', 'rehabilitacion'
            abutment_type: '',
            crown_type: '',
            bone_graft: false,
            bone_graft_notes: '',
            created_by: session?.user?.email || 'Desconocido'
        });
    };

    const handleSaveRecord = async (record) => {
        setLoading(true);
        let error = null;
        if (record.id) {
            const { error: updateError } = await supabase
                .from('implantology_tracking')
                .update(record)
                .eq('id', record.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('implantology_tracking')
                .insert([record]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving implantology record:', error);
            notify('Error al guardar registro de implantología.', 'error');
        } else {
            notify('Registro de implantología guardado exitosamente.', 'success');
            setNewRecord(null);
            setEditingRecordId(null);
            fetchImplantRecords();
        }
        setLoading(false);
    };

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
        setLoading(true);
        const { error } = await supabase
            .from('implantology_tracking')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting implantology record:', error);
            notify('Error al eliminar registro de implantología.', 'error');
        } else {
            notify('Registro de implantología eliminado exitosamente.', 'success');
            fetchImplantRecords();
        }
        setLoading(false);
    };

    const handleChange = (e, record, field) => {
        const updatedRecord = { ...record, [field]: e.target.value };
        if (record.id) {
            setImplantRecords(implantRecords.map(r => r.id === record.id ? updatedRecord : r));
        } else {
            setNewRecord(updatedRecord);
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-[#9A8F84]">Cargando registros de implantología...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#312923]">Seguimiento de Implantología</h3>
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
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Marca del Implante</label>
                            <input type="text" value={newRecord.implant_brand} onChange={(e) => handleChange(e, newRecord, 'implant_brand')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Nobel Biocare" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Modelo del Implante</label>
                            <input type="text" value={newRecord.implant_model} onChange={(e) => handleChange(e, newRecord, 'implant_model')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Conical Connection" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Diámetro (mm)</label>
                            <input type="text" value={newRecord.diameter} onChange={(e) => handleChange(e, newRecord, 'diameter')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: 3.5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Longitud (mm)</label>
                            <input type="text" value={newRecord.length} onChange={(e) => handleChange(e, newRecord, 'length')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: 11.5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Torque de Inserción (Ncm)</label>
                            <input type="text" value={newRecord.insertion_torque} onChange={(e) => handleChange(e, newRecord, 'insertion_torque')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: 35" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Fecha de Colocación</label>
                            <input type="date" value={newRecord.placement_date} onChange={(e) => handleChange(e, newRecord, 'placement_date')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Etapa</label>
                            <select value={newRecord.stage} onChange={(e) => handleChange(e, newRecord, 'stage')} className="w-full p-2 border border-[#DFD2C4] rounded-lg">
                                <option value="osteointegracion">Osteointegración</option>
                                <option value="rehabilitacion">Rehabilitación</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Abutment</label>
                            <input type="text" value={newRecord.abutment_type} onChange={(e) => handleChange(e, newRecord, 'abutment_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Pilar transepitelial" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Corona</label>
                            <input type="text" value={newRecord.crown_type} onChange={(e) => handleChange(e, newRecord, 'crown_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" placeholder="Ej: Zirconia" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={newRecord.bone_graft} onChange={(e) => setNewRecord({ ...newRecord, bone_graft: e.target.checked })} className="form-checkbox" />
                            <label className="text-xs font-bold text-[#9A8F84]">Injerto Óseo</label>
                        </div>
                        {newRecord.bone_graft && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#9A8F84] mb-1">Notas Injerto Óseo</label>
                                <textarea value={newRecord.bone_graft_notes} onChange={(e) => handleChange(e, newRecord, 'bone_graft_notes')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" rows="2" placeholder="Tipo de injerto, membrana, etc."></textarea>
                            </div>
                        )}
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

            {implantRecords.length === 0 && !newRecord ? (
                <div className="text-center py-10 text-[#9A8F84] border border-dashed border-[#DFD2C4] rounded-2xl bg-[#FDFBF7]/50">
                    <p>No hay registros de implantología para este paciente.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {implantRecords.map(record => (
                        <div key={record.id} className="bg-white p-4 rounded-2xl border border-[#DFD2C4]/60 shadow-sm">
                            {editingRecordId === record.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Marca del Implante</label>
                                            <input type="text" value={record.implant_brand} onChange={(e) => handleChange(e, record, 'implant_brand')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Modelo del Implante</label>
                                            <input type="text" value={record.implant_model} onChange={(e) => handleChange(e, record, 'implant_model')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Diámetro (mm)</label>
                                            <input type="text" value={record.diameter} onChange={(e) => handleChange(e, record, 'diameter')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Longitud (mm)</label>
                                            <input type="text" value={record.length} onChange={(e) => handleChange(e, record, 'length')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Torque de Inserción (Ncm)</label>
                                            <input type="text" value={record.insertion_torque} onChange={(e) => handleChange(e, record, 'insertion_torque')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Fecha de Colocación</label>
                                            <input type="date" value={record.placement_date} onChange={(e) => handleChange(e, record, 'placement_date')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Etapa</label>
                                            <select value={record.stage} onChange={(e) => handleChange(e, record, 'stage')} className="w-full p-2 border border-[#DFD2C4] rounded-lg">
                                                <option value="osteointegracion">Osteointegración</option>
                                                <option value="rehabilitacion">Rehabilitación</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Abutment</label>
                                            <input type="text" value={record.abutment_type} onChange={(e) => handleChange(e, record, 'abutment_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#9A8F84] mb-1">Tipo de Corona</label>
                                            <input type="text" value={record.crown_type} onChange={(e) => handleChange(e, record, 'crown_type')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={record.bone_graft} onChange={(e) => handleChange(e, record, 'bone_graft')} className="form-checkbox" />
                                            <label className="text-xs font-bold text-[#9A8F84]">Injerto Óseo</label>
                                        </div>
                                        {record.bone_graft && (
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-[#9A8F84] mb-1">Notas Injerto Óseo</label>
                                                <textarea value={record.bone_graft_notes} onChange={(e) => handleChange(e, record, 'bone_graft_notes')} className="w-full p-2 border border-[#DFD2C4] rounded-lg" rows="2"></textarea>
                                            </div>
                                        )}
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
                                        <p className="font-bold text-[#312923]">{record.implant_brand} {record.implant_model}</p>
                                        <p className="text-sm text-[#6B615A]">Ø{record.diameter}mm x L{record.length}mm | Torque: {record.insertion_torque} Ncm</p>
                                        <p className="text-xs text-[#9A8F84]">Colocación: {new Date(record.placement_date).toLocaleDateString()} | Etapa: {record.stage}</p>
                                        {record.abutment_type && <p className="text-xs text-[#9A8F84] mt-1">Abutment: {record.abutment_type} | Corona: {record.crown_type}</p>}
                                        {record.bone_graft && <p className="text-xs text-[#9A8F84] mt-1">Injerto Óseo: Sí ({record.bone_graft_notes})</p>}
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
