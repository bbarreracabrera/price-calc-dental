import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Upload, Download, X, CheckCircle, Loader, AlertTriangle } from 'lucide-react';

export default function ImportPatientsModal({ isOpen, onClose, session, onSuccess, clinicOwner }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB
        if (f.size > MAX_CSV_SIZE) {
            setError('El archivo es demasiado grande (máximo 10MB)');
            return;
        }

        setFile(f);
        setError('');
        setResult(null);

        try {
            const text = await f.text();
            const lines = text.split('\n').filter(l => l.trim());

            if (lines.length < 2) {
                setError('El archivo está vacío o no tiene datos');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            if (!headers.some(h => h.includes('nombre') || h.includes('name'))) {
                setError('Falta la columna obligatoria: nombre');
                return;
            }

            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((h, i) => { obj[h] = values[i] || ''; });
                return obj;
            });

            setPreview(rows.slice(0, 5));
        } catch (err) {
            setError('Error leyendo el archivo: ' + err.message);
        }
    };

    const handleImport = async () => {
        if (!file || !session?.user?.email) return;
        setImporting(true);
        setError('');

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const findCol = (...names) => {
                for (const n of names) {
                    const idx = headers.findIndex(h => h.includes(n));
                    if (idx !== -1) return idx;
                }
                return -1;
            };

            const nameIdx  = findCol('nombre', 'name');
            const rutIdx   = findCol('rut');
            const phoneIdx = findCol('telefono', 'teléfono', 'phone', 'celular');
            const emailIdx = findCol('email', 'correo');
            const ageIdx   = findCol('edad', 'age');

            const patients = lines.slice(1).map((line, idx) => {
                const values = line.split(',').map(v => v.trim());
                const id = `pat_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
                return {
                    id,
                    admin_email: clinicOwner || session.user.email,
                    data: {
                        id,
                        personal: {
                            legalName: values[nameIdx] || '',
                            rut:   rutIdx   !== -1 ? values[rutIdx]   : '',
                            phone: phoneIdx !== -1 ? values[phoneIdx] : '',
                            email: emailIdx !== -1 ? values[emailIdx] : '',
                            age:   ageIdx   !== -1 ? values[ageIdx]   : '',
                        },
                        importedAt: new Date().toISOString(),
                    }
                };
            }).filter(p => p.data.personal.legalName);

            if (patients.length === 0) {
                setError('No se encontraron pacientes válidos en el archivo');
                setImporting(false);
                return;
            }

            let inserted = 0;
            let errors = 0;
            const batchSize = 100;

            for (let i = 0; i < patients.length; i += batchSize) {
                const batch = patients.slice(i, i + batchSize);
                const { error: batchError } = await supabase
                    .from('patients')
                    .upsert(batch, { onConflict: 'id' });

                if (batchError) {
                    errors += batch.length;
                    console.error('Error en batch:', batchError);
                } else {
                    inserted += batch.length;
                }
            }

            setResult({ inserted, errors, total: patients.length });
            if (onSuccess) onSuccess();
        } catch (err) {
            setError('Error al importar: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;
        if (!droppedFile.name.toLowerCase().endsWith('.csv')) {
            setError('Solo se aceptan archivos .csv');
            return;
        }
        await handleFileChange({ target: { files: [droppedFile] } });
    };

    const downloadTemplate = () => {
        const csv = 'nombre,rut,telefono,email,edad\nJuan Pérez,12.345.678-9,+56912345678,juan@example.com,35\nMaría González,11.111.111-1,+56987654321,maria@example.com,42';
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_pacientes.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#312923]/60 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl p-6 max-h-[95vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-black text-[#312923]">Importar pacientes desde CSV</h3>
                        <p className="text-sm font-bold text-[#9A8F84] mt-1">Sube un archivo CSV con los datos de tus pacientes</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-[#9A8F84] hover:text-[#312923] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {!result ? (
                    <>
                        <button
                            onClick={downloadTemplate}
                            className="w-full mb-4 px-4 py-3 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-[#312923] hover:bg-[#DFD2C4]/30 transition-colors"
                        >
                            <Download size={16} /> Descargar plantilla CSV
                        </button>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center mb-4 transition-all ${
                                isDragging
                                    ? 'border-[#5B6651] bg-[#5B6651]/5'
                                    : 'border-[#DFD2C4] hover:border-[#A3968B] hover:bg-[#FDFBF7]'
                            }`}
                        >
                            <Upload size={32} className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-[#5B6651]' : 'text-[#9A8F84]'}`} />
                            <p className="text-sm font-bold text-[#312923] mb-2">
                                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo CSV o haz clic para seleccionar'}
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="inline-block px-4 py-2 bg-[#312923] text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-[#1a1512] transition-colors"
                            >
                                Seleccionar archivo
                            </label>
                            {file && (
                                <p className="mt-3 text-xs font-bold text-[#5B6651]">{file.name}</p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                <p className="text-red-700 text-sm font-bold">{error}</p>
                            </div>
                        )}

                        {preview.length > 0 && (
                            <div className="bg-[#FDFBF7] rounded-2xl p-4 mb-4 border border-[#DFD2C4]/50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-3">
                                    Vista previa (primeras {preview.length} filas)
                                </p>
                                <div className="space-y-1.5">
                                    {preview.map((row, i) => (
                                        <p key={i} className="text-xs font-bold text-[#312923]">
                                            {Object.values(row).filter(Boolean).join(' · ')}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 border border-[#DFD2C4] rounded-2xl font-black text-sm text-[#312923] hover:bg-[#DFD2C4]/30 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || importing}
                                className="flex-1 py-3 bg-[#5B6651] hover:bg-[#4a5442] text-white font-black text-sm rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {importing ? <><Loader size={16} className="animate-spin" /> Importando...</> : 'Importar pacientes'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <CheckCircle size={48} className="text-[#5B6651] mx-auto mb-4" />
                        <h4 className="text-lg font-black text-[#312923] mb-2">¡Importación completada!</h4>
                        <p className="text-sm font-bold text-[#9A8F84] mb-6">
                            Se importaron <strong className="text-[#312923]">{result.inserted}</strong> de <strong className="text-[#312923]">{result.total}</strong> pacientes.
                            {result.errors > 0 && <span className="text-red-500 ml-1">({result.errors} errores)</span>}
                        </p>
                        <button
                            onClick={() => { setResult(null); setFile(null); setPreview([]); onClose(); }}
                            className="px-6 py-3 bg-[#312923] hover:bg-[#1a1512] text-white rounded-2xl font-black text-sm transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
