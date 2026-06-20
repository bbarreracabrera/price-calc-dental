import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export default function OrthodonticsTab({ patientId, onSave }) {
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    apparatology: 'brackets', // brackets, aligners, functional
    arcType: 'NiTi',
    arcSize: '0.016',
    adjustmentNotes: '',
    cephalometricAngles: {
      sna: '',
      snb: '',
      anb: '',
      fma: ''
    },
    cigoIndex: '',
    iconIndex: '',
    photos: {
      frontal: null,
      lateral: null,
      occlusal: null
    },
    nextAppointment: '',
    treatmentPhase: 'initial' // initial, intermediate, final
  });

  const handleAddRecord = () => {
    const newRecord = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    setRecords([newRecord, ...records]);
    resetForm();
    onSave?.(newRecord);
  };

  const handleUpdateRecord = (id) => {
    setRecords(records.map(r => r.id === id ? { ...r, ...formData } : r));
    setEditingId(null);
    resetForm();
  };

  const handleDeleteRecord = (id) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      apparatology: 'brackets',
      arcType: 'NiTi',
      arcSize: '0.016',
      adjustmentNotes: '',
      cephalometricAngles: { sna: '', snb: '', anb: '', fma: '' },
      cigoIndex: '',
      iconIndex: '',
      photos: { frontal: null, lateral: null, occlusal: null },
      nextAppointment: '',
      treatmentPhase: 'initial'
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Registro */}
      <div className="bg-white border border-[#DFD2C4] rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-black text-[#312923]">Nuevo Registro Ortodóncico</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Fecha</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Aparatología</label>
            <select
              value={formData.apparatology}
              onChange={(e) => setFormData({ ...formData, apparatology: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="brackets">Brackets Fijos</option>
              <option value="aligners">Alineadores Transparentes</option>
              <option value="functional">Aparatos Funcionales</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Tipo de Arco</label>
            <input
              type="text"
              placeholder="ej: NiTi, Acero"
              value={formData.arcType}
              onChange={(e) => setFormData({ ...formData, arcType: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Calibre Arco</label>
            <input
              type="text"
              placeholder="ej: 0.016, 0.018"
              value={formData.arcSize}
              onChange={(e) => setFormData({ ...formData, arcSize: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Ángulos Cefalométricos</label>
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="SNA"
              value={formData.cephalometricAngles.sna}
              onChange={(e) => setFormData({
                ...formData,
                cephalometricAngles: { ...formData.cephalometricAngles, sna: e.target.value }
              })}
              className="px-3 py-2 border border-[#DFD2C4] rounded-lg text-xs focus:outline-none focus:border-[#5B6651]"
            />
            <input
              type="number"
              placeholder="SNB"
              value={formData.cephalometricAngles.snb}
              onChange={(e) => setFormData({
                ...formData,
                cephalometricAngles: { ...formData.cephalometricAngles, snb: e.target.value }
              })}
              className="px-3 py-2 border border-[#DFD2C4] rounded-lg text-xs focus:outline-none focus:border-[#5B6651]"
            />
            <input
              type="number"
              placeholder="ANB"
              value={formData.cephalometricAngles.anb}
              onChange={(e) => setFormData({
                ...formData,
                cephalometricAngles: { ...formData.cephalometricAngles, anb: e.target.value }
              })}
              className="px-3 py-2 border border-[#DFD2C4] rounded-lg text-xs focus:outline-none focus:border-[#5B6651]"
            />
            <input
              type="number"
              placeholder="FMA"
              value={formData.cephalometricAngles.fma}
              onChange={(e) => setFormData({
                ...formData,
                cephalometricAngles: { ...formData.cephalometricAngles, fma: e.target.value }
              })}
              className="px-3 py-2 border border-[#DFD2C4] rounded-lg text-xs focus:outline-none focus:border-[#5B6651]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Notas de Ajuste</label>
          <textarea
            value={formData.adjustmentNotes}
            onChange={(e) => setFormData({ ...formData, adjustmentNotes: e.target.value })}
            placeholder="Describe los cambios realizados en esta cita..."
            className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651] resize-none h-24"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAddRecord}
            className="flex-1 px-4 py-3 bg-[#5B6651] text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[#4a5442] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Guardar Registro
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-3 bg-white border border-[#DFD2C4] text-[#6B615A] rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[#FDFBF7] transition-all"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Historial de Registros */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#312923]">Historial de Citas</h3>
        {records.length === 0 ? (
          <p className="text-sm text-[#9A8F84] italic">No hay registros aún.</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="bg-white border border-[#DFD2C4] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-[#312923]">{new Date(record.date).toLocaleDateString('es-CL')}</p>
                  <p className="text-xs text-[#6B615A] font-bold">
                    {record.apparatology === 'brackets' && 'Brackets Fijos'}
                    {record.apparatology === 'aligners' && 'Alineadores'}
                    {record.apparatology === 'functional' && 'Aparato Funcional'}
                    {' • '} Arco: {record.arcType} {record.arcSize}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData(record);
                      setEditingId(record.id);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
              {record.adjustmentNotes && (
                <p className="text-xs text-[#6B615A] bg-[#FDFBF7] p-3 rounded-lg">{record.adjustmentNotes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
