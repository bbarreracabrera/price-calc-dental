import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Upload, Download, X, CheckCircle, Loader, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx'; // Ya incluido en package.json

/**
 * Componente de Importación Inteligente "Zero Friction"
 * Soporta Excel (.xlsx, .xls) y CSV.
 * Mapea automáticamente columnas de Dentalink, Reservo, AgendaPro y otros.
 */
export default function ImportPatientsModal({ isOpen, onClose, session, onSuccess, clinicOwner }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [allData, setAllData] = useState([]);

    if (!isOpen) return null;

    // Lógica de mapeo inteligente de columnas
    const smartMap = (headers) => {
        const findCol = (possibleNames) => {
            return headers.findIndex(h => 
                possibleNames.some(name => h.toLowerCase().includes(name.toLowerCase()))
            );
        };

        return {
            nameIdx:  findCol(['nombre', 'name', 'paciente', 'nombres', 'apellidos']),
            rutIdx:   findCol(['rut', 'r.u.t', 'identificación', 'dni', 'documento']),
            phoneIdx: findCol(['telefono', 'teléfono', 'phone', 'celular', 'móvil', 'movil']),
            emailIdx: findCol(['email', 'correo', 'e-mail']),
            ageIdx:   findCol(['edad', 'age', 'fecha nacimiento', 'nacimiento']),
        };
    };

    const handleFileChange = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
        const isCSV = f.name.endsWith('.csv');

        if (!isExcel && !isCSV) {
            setError('Solo se aceptan archivos Excel (.xlsx, .xls) o CSV');
            return;
        }

        setFile(f);
        setError('');
        setResult(null);

        try {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 2) {
                    setError('El archivo está vacío o no tiene datos');
                    return;
                }

                const headers = data[0].map(h => String(h || '').trim());
                const mapping = smartMap(headers);

                if (mapping.nameIdx === -1) {
                    setError('No pudimos encontrar la columna de "Nombre". Asegúrate de que el archivo tenga encabezados.');
                    return;
                }

                const rows = data.slice(1).map(row => {
                    const obj = {
                        legalName: row[mapping.nameIdx] || '',
                        rut:   mapping.rutIdx   !== -1 ? String(row[mapping.rutIdx] || '') : '',
                        phone: mapping.phoneIdx !== -1 ? String(row[mapping.phoneIdx] || '') : '',
                        email: mapping.emailIdx !== -1 ? String(row[mapping.emailIdx] || '') : '',
                        age:   mapping.ageIdx   !== -1 ? String(row[mapping.ageIdx] || '') : '',
                    };
                    return obj;
                }).filter(r => r.legalName);

                setAllData(rows);
                setPreview(rows.slice(0, 5));
            };
            reader.readAsBinaryString(f);
        } catch (err) {
            setError('Error leyendo el archivo: ' + err.message);
        }
    };

    const handleImport = async () => {
        if (!allData.length || !session?.user?.email) return;
        setImporting(true);
        setError('');

        try {
            const adminEmail = clinicOwner || session.user.email;
            
            const patients = allData.map((p, idx) => {
                const id = `pat_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
                return {
                    id,
                    admin_email: adminEmail,
                    data: {
                        id,
                        personal: {
                            ...p,
                            rut: p.rut.replace(/\./g, '').toUpperCase(), // Limpieza básica de RUT
                        },
                        importedAt: new Date().toISOString(),
                        source: 'import_wizard'
                    }
                };
            });

            let inserted = 0;
            let errors = 0;
            const batchSize = 50; // Batch más pequeño para mayor estabilidad

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
        handleFileChange({ target: { files: [droppedFile] } });
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#312923]/60 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full md:max-w-2xl p-6 md:p-8 max-h-[95vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-[#312923] tracking-tight">Migración Inteligente</h3>
                        <p className="text-sm font-bold text-[#9A8F84] mt-1">Sube tu Excel de Dentalink, Reservo o AgendaPro</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#9A8F84] hover:text-[#312923] hover:bg-[#FDFBF7] rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {!result ? (
                    <>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-[2rem] p-10 text-center mb-6 transition-all duration-300 ${
                                isDragging
                                    ? 'border-[#5B6651] bg-[#5B6651]/5 scale-[1.02]'
                                    : 'border-[#DFD2C4] hover:border-[#A3968B] hover:bg-[#FDFBF7]'
                            }`}
                        >
                            <div className="w-16 h-16 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <FileSpreadsheet size={32} className={isDragging ? 'text-[#5B6651]' : 'text-[#CBAAA2]'} />
                            </div>
                            
                            <p className="text-base font-black text-[#312923] mb-1">
                                {isDragging ? '¡Suéltalo ahora!' : 'Arrastra tu Excel o CSV aquí'}
                            </p>
                            <p className="text-xs font-bold text-[#9A8F84] mb-6">Soportamos .xlsx, .xls y .csv</p>
                            
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-upload"
                            />
                            <label
                                htmlFor="excel-upload"
                                className="inline-flex px-8 py-3 bg-[#312923] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-pointer hover:bg-black hover:shadow-lg transition-all active:scale-95"
                            >
                                Seleccionar archivo
                            </label>
                            
                            {file && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-[#5B6651] bg-[#5B6651]/10 py-2 px-4 rounded-full w-fit mx-auto border border-[#5B6651]/20">
                                    <CheckCircle size={14} />
                                    <span className="text-xs font-black">{file.name}</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-in fade-in zoom-in-95">
                                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-red-700 text-sm font-bold leading-relaxed">{error}</p>
                            </div>
                        )}

                        {preview.length > 0 && (
                            <div className="bg-[#FDFBF7] rounded-[1.5rem] p-5 mb-6 border border-[#DFD2C4]/50 shadow-inner">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8F84]">
                                        Vista previa de datos detectados
                                    </p>
                                    <span className="text-[10px] font-black bg-[#5B6651] text-white px-2 py-0.5 rounded-md">
                                        {allData.length} pacientes encontrados
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {preview.map((row, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs font-bold text-[#312923] bg-white p-2.5 rounded-xl border border-[#DFD2C4]/30">
                                            <div className="w-6 h-6 rounded-lg bg-[#DFD2C4]/20 flex items-center justify-center text-[10px] text-[#9A8F84]">{i+1}</div>
                                            <span className="truncate flex-1">{row.legalName}</span>
                                            <span className="text-[#9A8F84] tabular-nums">{row.rut || 'Sin RUT'}</span>
                                        </div>
                                    ))}
                                    {allData.length > 5 && (
                                        <p className="text-center text-[10px] font-black text-[#9A8F84] pt-2 italic">
                                            + {allData.length - 5} pacientes más...
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 border border-[#DFD2C4] rounded-2xl font-black text-[11px] uppercase tracking-widest text-[#9A8F84] hover:bg-[#FDFBF7] hover:text-[#312923] transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!allData.length || importing}
                                className="flex-1 py-4 bg-[#5B6651] hover:bg-[#4a5442] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#5B6651]/20 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {importing ? <><Loader size={16} className="animate-spin" /> Procesando...</> : 'Confirmar Importación'}
                            </button>
                        </div>
                        
                        <p className="mt-6 text-center text-[10px] font-bold text-[#9A8F84] leading-relaxed">
                            Al importar, ShiningCloud Dental normaliza los datos y elimina duplicados automáticamente para mantener tu clínica en orden.
                        </p>
                    </>
                ) : (
                    <div className="text-center py-10 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-[#5B6651]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-[#5B6651]" />
                        </div>
                        <h4 className="text-2xl font-black text-[#312923] mb-2 tracking-tight">¡Migración Exitosa!</h4>
                        <p className="text-base font-bold text-[#9A8F84] mb-8 max-w-sm mx-auto">
                            Hemos liberado tus datos. Se importaron <strong className="text-[#312923]">{result.inserted}</strong> pacientes correctamente.
                            {result.errors > 0 && <div className="text-red-500 mt-2 text-xs">Hubo {result.errors} errores en piezas de datos corruptas.</div>}
                        </p>
                        <button
                            onClick={() => { setResult(null); setFile(null); setPreview([]); onClose(); }}
                            className="w-full sm:w-auto px-12 py-4 bg-[#312923] hover:bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl"
                        >
                            Ir a mi Clínica
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
