import { useState, useRef, useEffect } from 'react';

export function useVoiceAssistant(props) {
    const latestProps = useRef(props);
    useEffect(() => { latestProps.current = props; }, [props]);

    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('');
    const [isPerioVoiceActive, setIsPerioVoiceActive] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState('');
    const recognitionRef = useRef(null);

    const toggleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { latestProps.current.notify("Navegador no soporta IA de voz. Usa Chrome."); return; }
        
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false); setVoiceStatus('');
        } else {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CL'; recognition.continuous = true; recognition.interimResults = false;
            
            recognition.onstart = () => { 
                setIsListening(true); 
                setVoiceStatus(latestProps.current.patientTab === 'perio' ? 'Dicta (ej: "Diente 18, tres dos tres, no sangra distal")...' : 'Dicta Odonto (ej: "Diente 14 caries, avanza")...'); 
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) if (event.results[i].isFinal) transcript += event.results[i][0].transcript; 
                
                if (transcript) {
                    const text = transcript.toLowerCase();
                    latestProps.current.notify(`IA Escuchó: "${text}"`);

                    const toothMatch = text.match(/\b([1-4][1-8]|[5-8][1-5])\b/); 
                    let targetToothId = latestProps.current.toothModalData?.id; 
                    
                    if (toothMatch) {
                        targetToothId = toothMatch[0];
                        if (latestProps.current.setSelectedToothId) latestProps.current.setSelectedToothId(targetToothId); 
                    }

                    setTimeout(() => {
                        const { patientTab, setPerioData, getPatient, selectedPatientId, savePatientData, notify, setSelectedToothId, setToothModalData, toothModalData } = latestProps.current;
                        const currentToothId = targetToothId || toothModalData?.id;
                        if (!currentToothId) return;

                        const p = getPatient(selectedPatientId);

                        // ==========================================
                        // MODO PERIODONTOGRAMA
                        // ==========================================
                        if (patientTab === 'perio') {
                            let cleanText = text.replace(/diente\s?\d\s?\d/g, '').replace(/\b([1-4][1-8]|[5-8][1-5])\b/g, '');
                            cleanText = cleanText.replace(/uno/g, '1').replace(/dos/g, '2').replace(/tres/g, '3').replace(/cuatro/g, '4').replace(/cinco/g, '5').replace(/seis/g, '6').replace(/siete/g, '7').replace(/ocho/g, '8').replace(/nueve/g, '9').replace(/cero/g, '0').replace(/menos /g, '-');
                            
                            const existingPerio = p.clinical.perio?.[currentToothId] || {};
                            let newData = { 
                                ...existingPerio, 
                                pd_v: existingPerio.pd_v || ['','',''], pd_l: existingPerio.pd_l || ['','',''], 
                                mg_v: existingPerio.mg_v || ['','',''], mg_l: existingPerio.mg_l || ['','',''], 
                                bop_v: [...(existingPerio.bop_v || [false,false,false])], bop_l: [...(existingPerio.bop_l || [false,false,false])], 
                                pus_v: [...(existingPerio.pus_v || [false,false,false])], pus_l: [...(existingPerio.pus_l || [false,false,false])], 
                                mobility: existingPerio.mobility || 0, furcation: existingPerio.furcation || 0 
                            };
                            
                            const face = (cleanText.includes('palatino') || cleanText.includes('lingual')) ? 'l' : 'v'; 

                            // --- Comando "Sano" o "Limpiar" para resetear el diente entero ---
                            if (cleanText.includes('sano') || cleanText.includes('limpiar')) {
                                newData[`pd_${face}`] = ['','',''];
                                newData[`mg_${face}`] = ['','',''];
                                newData[`bop_${face}`] = [false,false,false];
                                newData[`pus_${face}`] = [false,false,false];
                                newData.mobility = 0;
                                newData.furcation = 0;
                            } else {
                                // Procesamiento normal de números
                                let pdText = cleanText;
                                let mgText = "";

                                if (pdText.includes('margen')) {
                                    const parts = pdText.split('margen');
                                    pdText = parts[0]; mgText = parts[1];
                                }

                                const pdNumbers = pdText.match(/-?\d/g) || [];
                                const mgNumbers = mgText.match(/-?\d/g) || [];
                                
                                const movMatch = cleanText.split('movilidad')[1]?.match(/\d/);
                                if (movMatch) newData.mobility = parseInt(movMatch[0]);

                                const furcMatch = cleanText.split('furca')[1]?.match(/\d/);
                                if (furcMatch) newData.furcation = parseInt(furcMatch[0]);

                                if (pdNumbers.length > 0) {
                                    newData[`pd_${face}`] = [ pdNumbers[0] !== undefined ? parseInt(pdNumbers[0]) : newData[`pd_${face}`][0], pdNumbers[1] !== undefined ? parseInt(pdNumbers[1]) : newData[`pd_${face}`][1], pdNumbers[2] !== undefined ? parseInt(pdNumbers[2]) : newData[`pd_${face}`][2] ];
                                }
                                if (mgNumbers.length > 0) {
                                    newData[`mg_${face}`] = [ mgNumbers[0] !== undefined ? parseInt(mgNumbers[0]) : newData[`mg_${face}`][0], mgNumbers[1] !== undefined ? parseInt(mgNumbers[1]) : newData[`mg_${face}`][1], mgNumbers[2] !== undefined ? parseInt(mgNumbers[2]) : newData[`mg_${face}`][2] ];
                                }

                                // --- LÓGICA DE SANGRADO (Añadir / Quitar) ---
                                const isRemovingBOP = cleanText.includes('no sangra') || cleanText.includes('sin sangrad') || cleanText.includes('quita sangrad') || cleanText.includes('borra sangrad');
                                const isAddingBOP = !isRemovingBOP && (cleanText.includes('sangra') || cleanText.includes('sangrado'));

                                if (isAddingBOP || isRemovingBOP) {
                                    const val = isAddingBOP;
                                    if (cleanText.includes('distal')) newData[`bop_${face}`][0] = val;
                                    if (cleanText.includes('centro') || cleanText.includes('medio')) newData[`bop_${face}`][1] = val;
                                    if (cleanText.includes('mesial')) newData[`bop_${face}`][2] = val;
                                    
                                    // Si no especifica cara, aplicamos al centro (o borramos todo si es la orden de quitar)
                                    if (!cleanText.includes('distal') && !cleanText.includes('mesial') && !cleanText.includes('centro') && !cleanText.includes('medio')) {
                                        if (isRemovingBOP) newData[`bop_${face}`] = [false, false, false];
                                        else newData[`bop_${face}`][1] = true;
                                    }
                                }

                                // --- LÓGICA DE PUS (Añadir / Quitar) ---
                                const isRemovingPus = cleanText.includes('no pus') || cleanText.includes('sin pus') || cleanText.includes('quita pus') || cleanText.includes('borra pus') || cleanText.includes('no supura');
                                const isAddingPus = !isRemovingPus && (cleanText.includes('pus') || cleanText.includes('supura'));

                                if (isAddingPus || isRemovingPus) {
                                    const val = isAddingPus;
                                    if (cleanText.includes('distal')) newData[`pus_${face}`][0] = val;
                                    if (cleanText.includes('centro') || cleanText.includes('medio')) newData[`pus_${face}`][1] = val;
                                    if (cleanText.includes('mesial')) newData[`pus_${face}`][2] = val;
                                    
                                    if (!cleanText.includes('distal') && !cleanText.includes('mesial') && !cleanText.includes('centro') && !cleanText.includes('medio')) {
                                        if (isRemovingPus) newData[`pus_${face}`] = [false, false, false];
                                        else newData[`pus_${face}`][1] = true;
                                    }
                                }
                            }

                            setPerioData(newData);
                            setToothModalData({ ...toothModalData, perio: newData, id: currentToothId });

                            const updatedPerio = { ...p.clinical.perio, [currentToothId]: newData };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: updatedPerio } });

                            if (text.includes('avanza') || text.includes('siguiente')) {
                                const PERIO_ORDER = [ '18','17','16','15','14','13','12','11', '21','22','23','24','25','26','27','28', '38','37','36','35','34','33','32','31', '41','42','43','44','45','46','47','48' ];
                                const currIdx = PERIO_ORDER.indexOf(currentToothId.toString());
                                if (currIdx >= 0 && currIdx < PERIO_ORDER.length - 1) {
                                    setTimeout(() => {
                                        if (setSelectedToothId) setSelectedToothId(PERIO_ORDER[currIdx + 1]);
                                        notify(`✔️ Guardado. Avanzando a pieza ${PERIO_ORDER[currIdx + 1]}`);
                                    }, 400); 
                                }
                            } else if (text.includes('listo') || text.includes('cierra')) {
                                if (setSelectedToothId) setSelectedToothId(null);
                                notify("✔️ Periodontograma Guardado");
                            }
                        } 
                        // ==========================================
                        // MODO ODONTOGRAMA
                        // ==========================================
                        else {
                            const existingTooth = p.clinical.teeth?.[currentToothId] || { faces: {v:null, l:null, m:null, d:null, o:null}, status: null, notes: '', treatment: {name: '', status: 'planned'} };
                            let newState = { ...existingTooth };
                            if (!newState.faces) newState.faces = {v:null, l:null, m:null, d:null, o:null};

                            const facesMap = { 'vestibular': 'v', 'lingual': 'l', 'palatina': 'l', 'mesial': 'm', 'distal': 'd', 'oclusal': 'o', 'incisal': 'o' };
                            const faceId = Object.keys(facesMap).find(f => text.includes(f)) ? facesMap[Object.keys(facesMap).find(f => text.includes(f))] : null;

                            if (text.includes('caries') || text.includes('lesión')) { if (faceId) { newState.faces[faceId] = 'caries'; newState.activeFace = faceId; newState.status = null; } } 
                            else if (text.includes('resina') || text.includes('empaste')) { if (faceId) { newState.faces[faceId] = 'filled'; newState.activeFace = faceId; newState.status = null; } } 
                            else if (text.includes('corona')) newState.status = 'crown';
                            else if (text.includes('ausente') || text.includes('extraído')) newState.status = 'missing';
                            else if (text.includes('implante')) newState.status = 'implant';
                            else if (text.includes('sano') || text.includes('limpiar')) { if (faceId) { newState.faces[faceId] = null; newState.activeFace = faceId; } else { newState.faces = {v:null,l:null,m:null,d:null,o:null}; newState.status = null; } }

                            newState.notes = (newState.notes ? newState.notes.trim() + '\n' : '') + transcript.charAt(0).toUpperCase() + transcript.slice(1);

                            setToothModalData({ ...toothModalData, ...newState, id: currentToothId });
                            const updatedTeeth = { ...p.clinical.teeth, [currentToothId]: { ...newState, id: currentToothId } };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, teeth: updatedTeeth } });

                            if (text.includes('avanza') || text.includes('siguiente') || text.includes('listo') || text.includes('guardar')) {
                                setTimeout(() => {
                                    if (setSelectedToothId) setSelectedToothId(null); 
                                    notify(`✔️ Pieza ${currentToothId} guardada.`);
                                }, 400);
                            }
                        }
                    }, toothMatch ? 800 : 0);
                }
            };
            recognition.onerror = (e) => { setIsListening(false); setVoiceStatus(''); };
            recognition.onend = () => { setIsListening(false); setVoiceStatus(''); };
            recognitionRef.current = recognition;
            try { recognition.start(); } catch (e) { console.error(e); }
        }
    };

    const startPerioDictation = () => {};

    return { isListening, voiceStatus, isPerioVoiceActive, voiceFeedback, toggleVoice, startPerioDictation };
}