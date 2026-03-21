import React from 'react';
import { Stethoscope, Plus, X, Printer } from 'lucide-react';
import { Card, Button, InputField } from './UIComponents';
import { PatientSelect } from './SystemModals';

export default function PrescriptionView({
    themeMode, t, patientRecords, getPatient, savePatientData, setPatientRecords,
    rxPatient, setRxPatient, medInput, setMedInput, prescription, setPrescription,
    notify, generatePDF
}) {
    return (
        <Card theme={themeMode} className="space-y-4 animate-in fade-in">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4"><Stethoscope className={t.accent}/> Emisión de Recetas</h2>
            <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." onSelect={(p) => {
                if (p.id === 'new') {
                    const newId = "pac_" + Date.now().toString();
                    const nombreReal = p.name;
                    const newPatient = getPatient(newId);
                    newPatient.id = newId;
                    newPatient.name = nombreReal;
                    if (!newPatient.personal) newPatient.personal = {};
                    newPatient.personal.legalName = nombreReal;
                    
                    savePatientData(newId, newPatient);
                    setRxPatient(newPatient);
                    notify("Paciente Creado Exitosamente");
                } else {
                    setPatientRecords(prev => ({...prev, [p.id]: p}));
                    setRxPatient(p);
                }
            }} />
            
            {rxPatient && (
                <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in">
                    <div className={`w-12 h-12 rounded-full ${t.accentBg} flex items-center justify-center font-bold text-white`}>
                        {rxPatient.personal.legalName[0]}
                    </div>
                    <div>
                        <p className="font-bold">{rxPatient.personal.legalName}</p>
                        <p className="text-xs opacity-60">RUT: {rxPatient.personal.rut}</p>
                    </div>
                </div>
            )}
            
            <div className="flex gap-2">
                <InputField theme={themeMode} placeholder="Fármaco..." value={medInput.name} onChange={e=>setMedInput({...medInput, name:e.target.value})}/>
                <InputField theme={themeMode} placeholder="Dosis..." value={medInput.dosage} onChange={e=>setMedInput({...medInput, dosage:e.target.value})}/>
                <Button theme={themeMode} onClick={()=>{
                    if(medInput.name) {
                        setPrescription([...prescription, medInput]); 
                        setMedInput({name:'', dosage:''});
                    }
                }}><Plus/></Button>
            </div>
            
            {prescription.map((p,i)=>(
                <div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between text-xs items-center">
                    <span><strong>{p.name}</strong> - {p.dosage}</span>
                    <button className="text-red-400 hover:text-red-500" onClick={()=>setPrescription(prescription.filter((_,idx)=>idx!==i))}><X size={14}/></button>
                </div>
            ))}
            
            <Button theme={themeMode} className="w-full mt-4" onClick={()=>generatePDF('rx', rxPatient)}>
                <Printer/> GENERAR PDF
            </Button>
        </Card>
    );
}