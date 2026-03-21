import React from 'react';
import { FlaskConical, Trash2 } from 'lucide-react';
import { Card, Button } from './UIComponents';
import { supabase } from '../supabase';
import { getLocalDate } from '../constants';

export default function LabView({ 
    themeMode, t, labWorks, setLabWorks, setNewLabWork, setModal, notify 
}) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3"><FlaskConical className={t.accent} size={28}/> Control de Laboratorio</h2>
                    <p className="text-xs opacity-50 mt-1">Gestiona los envíos y recepciones de coronas, prótesis y placas.</p>
                </div>
                <Button theme={themeMode} onClick={() => {
                    setNewLabWork({ patientId: '', patientName: '', workType: '', tooth: '', labName: '', sendDate: getLocalDate(), expectedDate: '', status: 'sent', id: null });
                    setModal('labWork');
                }}>+ Nuevo Trabajo</Button>
            </div>

            <Card theme={themeMode}>
                <div className="overflow-x-auto custom-scrollbar w-full"> 
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className={`text-xs uppercase opacity-50 border-b ${t.border}`}>
                            <tr>
                                <th className="px-5 py-4">Paciente</th>
                                <th className="px-5 py-4">Trabajo</th>
                                <th className="px-5 py-4 text-center">Pieza</th>
                                <th className="px-5 py-4">Laboratorio</th>
                                <th className="px-5 py-4">Envío</th>
                                <th className="px-5 py-4">Entrega</th>
                                <th className="px-5 py-4 text-center">Estado</th>
                                <th className="px-5 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labWorks.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-8 opacity-50 font-bold">No hay trabajos en curso. ¡Todo al día!</td></tr>
                            ) : (
                                labWorks.sort((a,b) => new Date(a.expectedDate) - new Date(b.expectedDate)).map(work => {
                                    const isLate = new Date(work.expectedDate) < new Date() && work.status === 'sent';
                                    return (
                                        <tr key={work.id} className={`border-b ${t.border} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                                            <td className="px-5 py-5 font-bold min-w-[150px]">{work.patientName}</td>
                                            <td className="px-5 py-5">
                                                <div className="max-w-[180px] truncate" title={work.workType}>{work.workType}</div>
                                            </td>
                                            <td className="px-5 py-5 text-center font-bold text-cyan-600 dark:text-cyan-400">{work.tooth || '-'}</td>
                                            <td className="px-5 py-5 whitespace-nowrap">{work.labName}</td>
                                            <td className="px-5 py-5 text-xs opacity-70 whitespace-nowrap">{work.sendDate}</td>
                                            <td className="px-5 py-5 font-bold whitespace-nowrap align-middle">
                                                <div className={`flex items-center gap-1 ${isLate ? 'text-red-500' : ''}`}>
                                                    {isLate && <span>⚠️</span>} 
                                                    <span>{work.expectedDate}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${work.status === 'received' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'}`}>
                                                    {work.status === 'received' ? '✅ Recibido' : '⏳ En Tránsito'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {work.status === 'sent' && (
                                                        <button onClick={async () => {
                                                            const updated = { ...work, status: 'received' };
                                                            setLabWorks(labWorks.map(w => w.id === work.id ? updated : w));
                                                            await supabase.from('lab_works').update({ status: 'received' }).eq('id', work.id);
                                                            notify("Trabajo marcado como RECIBIDO");
                                                        }} className="text-[10px] bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform font-bold">Recibir</button>
                                                    )}
                                                    <button onClick={async () => {
                                                        if(window.confirm("¿Seguro que deseas eliminar este registro?")){
                                                            setLabWorks(labWorks.filter(w => w.id !== work.id));
                                                            await supabase.from('lab_works').delete().eq('id', work.id);
                                                        }
                                                    }} className="p-1.5 text-red-500 opacity-50 hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}