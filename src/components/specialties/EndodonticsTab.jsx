import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function EndodonticsTab({ patientId, onSave }) {
  const [treatments, setTreatments] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tooth: '',
    diagnosis: '', // Pulpitis reversible, Pulpitis irreversible, Necrosis, etc.
    symptoms: '',
    workingLength: '',
    conductometryLength: '',
    fileSequence: '', // Ej: 10K, 15K, 20K, 25K
    obturationTechnique: 'lateral', // lateral, continuous wave, single cone
    sealer: '', // AH Plus, Epiphany, etc.
    guttaPercha: '', // Color, marca
    medicationBetweenSessions: '', // Hidróxido de calcio, Clorhexidina, etc.
    sessionCount: 1,
    sessionNotes: '',
    radiographs: {
      preoperative: null,
      working: null,
      final: null
    },
    complications: '',
    prognosis: 'favorable', // favorable, uncertain, unfavorable
    followUpDate: ''
  });

  const handleAddTreatment = () => {
    const newTreatment = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    setTreatments([newTreatment, ...treatments]);
    resetForm();
    onSave?.(newTreatment);
  };

  const handleDeleteTreatment = (id) => {
    setTreatments(treatments.filter(t => t.id !== id));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      tooth: '',
      diagnosis: '',
      symptoms: '',
      workingLength: '',
      conductometryLength: '',
      fileSequence: '',
      obturationTechnique: 'lateral',
      sealer: '',
      guttaPercha: '',
      medicationBetweenSessions: '',
      sessionCount: 1,
      sessionNotes: '',
      radiographs: { preoperative: null, working: null, final: null },
      complications: '',
      prognosis: 'favorable',
      followUpDate: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Nuevo Tratamiento */}
      <div className="bg-white border border-[#DFD2C4] rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-black text-[#312923]">Registrar Tratamiento Endodóncico</h3>

        <div className="grid grid-cols-3 gap-4">
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
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Diente</label>
            <input
              type="text"
              placeholder="ej: 1.6"
              value={formData.tooth}
              onChange={(e) => setFormData({ ...formData, tooth: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Diagnóstico</label>
            <select
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="">Seleccionar</option>
              <option value="pulpitis_reversible">Pulpitis Reversible</option>
              <option value="pulpitis_irreversible">Pulpitis Irreversible</option>
              <option value="necrosis">Necrosis Pulpar</option>
              <option value="periodontitis_apical">Periodontitis Apical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Síntomas</label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            placeholder="Describe los síntomas del paciente..."
            className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651] resize-none h-16"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Longitud de Trabajo (mm)</label>
            <input
              type="number"
              value={formData.workingLength}
              onChange={(e) => setFormData({ ...formData, workingLength: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Conductometría (mm)</label>
            <input
              type="number"
              value={formData.conductometryLength}
              onChange={(e) => setFormData({ ...formData, conductometryLength: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Secuencia de Limas</label>
            <input
              type="text"
              placeholder="ej: 10K, 15K, 20K, 25K"
              value={formData.fileSequence}
              onChange={(e) => setFormData({ ...formData, fileSequence: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Técnica Obturación</label>
            <select
              value={formData.obturationTechnique}
              onChange={(e) => setFormData({ ...formData, obturationTechnique: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="lateral">Condensación Lateral</option>
              <option value="continuous">Onda Continua</option>
              <option value="single">Cono Único</option>
              <option value="thermafil">Thermafil</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Cemento Sellador</label>
            <input
              type="text"
              placeholder="ej: AH Plus"
              value={formData.sealer}
              onChange={(e) => setFormData({ ...formData, sealer: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Número de Sesiones</label>
            <input
              type="number"
              value={formData.sessionCount}
              onChange={(e) => setFormData({ ...formData, sessionCount: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Medicación Entre Sesiones</label>
          <input
            type="text"
            placeholder="ej: Hidróxido de Calcio"
            value={formData.medicationBetweenSessions}
            onChange={(e) => setFormData({ ...formData, medicationBetweenSessions: e.target.value })}
            className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Complicaciones</label>
            <textarea
              value={formData.complications}
              onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
              placeholder="Si las hay..."
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651] resize-none h-16"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Notas de Sesión</label>
            <textarea
              value={formData.sessionNotes}
              onChange={(e) => setFormData({ ...formData, sessionNotes: e.target.value })}
              placeholder="Observaciones clínicas..."
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651] resize-none h-16"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Pronóstico</label>
            <select
              value={formData.prognosis}
              onChange={(e) => setFormData({ ...formData, prognosis: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="favorable">Favorable</option>
              <option value="uncertain">Incierto</option>
              <option value="unfavorable">Desfavorable</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Fecha Seguimiento</label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
        </div>

        <button
          onClick={handleAddTreatment}
          className="w-full px-4 py-3 bg-[#5B6651] text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[#4a5442] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Guardar Tratamiento
        </button>
      </div>

      {/* Historial de Tratamientos */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#312923]">Historial de Tratamientos</h3>
        {treatments.length === 0 ? (
          <p className="text-sm text-[#9A8F84] italic">No hay tratamientos registrados.</p>
        ) : (
          treatments.map((treatment) => (
            <div key={treatment.id} className="bg-white border border-[#DFD2C4] rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-black text-[#312923]">Diente {treatment.tooth}</p>
                  <p className="text-xs text-[#6B615A] font-bold">
                    {treatment.diagnosis} • {treatment.sessionCount} sesión(es)
                  </p>
                  <p className="text-xs text-[#9A8F84] font-bold mt-1">
                    {new Date(treatment.date).toLocaleDateString('es-CL')} • Pronóstico: {treatment.prognosis}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTreatment(treatment.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
