import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function ImplantologyTab({ patientId, onSave }) {
  const [implants, setImplants] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tooth: '',
    implantBrand: '', // Straumann, Nobel Biocare, Zimmer, etc.
    implantModel: '',
    implantLot: '',
    diameter: '4.8', // 3.3, 4.1, 4.8, 5.5, 6.5
    length: '10', // 8, 10, 12, 14, 16
    insertionTorque: '', // Nm
    isq: '', // Implant Stability Quotient
    prosthesisType: 'single', // single, bridge, complete
    immediateLoad: false,
    loadDate: '',
    abutmentType: '', // Stock, Custom
    crownMaterial: '', // Zirconia, PFM, All-on-4, etc.
    notes: '',
    radiographs: {
      preoperative: null,
      immediate: null,
      sixMonths: null
    }
  });

  const handleAddImplant = () => {
    const newImplant = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    setImplants([newImplant, ...implants]);
    resetForm();
    onSave?.(newImplant);
  };

  const handleDeleteImplant = (id) => {
    setImplants(implants.filter(i => i.id !== id));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      tooth: '',
      implantBrand: '',
      implantModel: '',
      implantLot: '',
      diameter: '4.8',
      length: '10',
      insertionTorque: '',
      isq: '',
      prosthesisType: 'single',
      immediateLoad: false,
      loadDate: '',
      abutmentType: '',
      crownMaterial: '',
      notes: '',
      radiographs: { preoperative: null, immediate: null, sixMonths: null }
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Nuevo Implante */}
      <div className="bg-white border border-[#DFD2C4] rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-black text-[#312923]">Registrar Nuevo Implante</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Fecha Inserción</label>
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
              placeholder="ej: 1.6, 2.4"
              value={formData.tooth}
              onChange={(e) => setFormData({ ...formData, tooth: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Marca</label>
            <select
              value={formData.implantBrand}
              onChange={(e) => setFormData({ ...formData, implantBrand: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="">Seleccionar marca</option>
              <option value="straumann">Straumann</option>
              <option value="nobel">Nobel Biocare</option>
              <option value="zimmer">Zimmer Biomet</option>
              <option value="hiossen">Hiossen</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Modelo</label>
            <input
              type="text"
              placeholder="Modelo"
              value={formData.implantModel}
              onChange={(e) => setFormData({ ...formData, implantModel: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Lote</label>
            <input
              type="text"
              placeholder="Lote"
              value={formData.implantLot}
              onChange={(e) => setFormData({ ...formData, implantLot: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Diámetro (mm)</label>
            <select
              value={formData.diameter}
              onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="3.3">3.3</option>
              <option value="4.1">4.1</option>
              <option value="4.8">4.8</option>
              <option value="5.5">5.5</option>
              <option value="6.5">6.5</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Largo (mm)</label>
            <select
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Torque Inserción (Nm)</label>
            <input
              type="number"
              value={formData.insertionTorque}
              onChange={(e) => setFormData({ ...formData, insertionTorque: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">ISQ (Estabilidad)</label>
            <input
              type="number"
              value={formData.isq}
              onChange={(e) => setFormData({ ...formData, isq: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Tipo Prótesis</label>
            <select
              value={formData.prosthesisType}
              onChange={(e) => setFormData({ ...formData, prosthesisType: e.target.value })}
              className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            >
              <option value="single">Unitaria</option>
              <option value="bridge">Puente</option>
              <option value="complete">Completa</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.immediateLoad}
              onChange={(e) => setFormData({ ...formData, immediateLoad: e.target.checked })}
              className="w-4 h-4 rounded border-[#DFD2C4]"
            />
            <span className="text-xs font-black uppercase tracking-widest text-[#6B615A]">Carga Inmediata</span>
          </label>
          {formData.immediateLoad && (
            <input
              type="date"
              value={formData.loadDate}
              onChange={(e) => setFormData({ ...formData, loadDate: e.target.value })}
              className="px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651]"
            />
          )}
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-[#6B615A] block mb-2">Notas Clínicas</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observaciones adicionales..."
            className="w-full px-4 py-2 border border-[#DFD2C4] rounded-lg text-sm focus:outline-none focus:border-[#5B6651] resize-none h-20"
          />
        </div>

        <button
          onClick={handleAddImplant}
          className="w-full px-4 py-3 bg-[#5B6651] text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[#4a5442] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Guardar Implante
        </button>
      </div>

      {/* Listado de Implantes */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#312923]">Implantes Registrados</h3>
        {implants.length === 0 ? (
          <p className="text-sm text-[#9A8F84] italic">No hay implantes registrados.</p>
        ) : (
          implants.map((implant) => (
            <div key={implant.id} className="bg-white border border-[#DFD2C4] rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-black text-[#312923]">Diente {implant.tooth}</p>
                  <p className="text-xs text-[#6B615A] font-bold">
                    {implant.implantBrand} {implant.implantModel} • {implant.diameter}x{implant.length}mm
                  </p>
                  <p className="text-xs text-[#9A8F84] font-bold mt-1">
                    Inserción: {new Date(implant.date).toLocaleDateString('es-CL')} • Torque: {implant.insertionTorque} Nm • ISQ: {implant.isq}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteImplant(implant.id)}
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
