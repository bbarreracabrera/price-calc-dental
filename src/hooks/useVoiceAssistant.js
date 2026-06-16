import { useState, useRef, useEffect } from 'react';

export function useVoiceAssistant(props) {
    const { patientTab, activeTab } = props;
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
                                // --- NUEVA LÓGICA DE MODO RÁFAGA Y PROCESAMIENTO POR SITIO ---
                            const sites = ['distal', 'centro', 'medio', 'mesial'];
                            const isV = face === 'v';
                            
                            // 1. Detectar ráfaga de números (ej: "3 2 3")
                            const allNumbers = cleanText.match(/-?\d/g) || [];
                            
                            if (allNumbers.length >= 3 && !cleanText.includes('margen')) {
                                // Ráfaga de Profundidad de Sondaje
                                newData[`pd_${face}`] = [parseInt(allNumbers[0]), parseInt(allNumbers[1]), parseInt(allNumbers[2])];
                                notify(`📏 Ráfaga: ${allNumbers[0]}-${allNumbers[1]}-${allNumbers[2]} en cara ${isV?'Vestibular':(parseInt(currentToothId)>30?'Lingual':'Palatina')}`);
                            } else {
                                // Procesamiento individual por sitio
                                sites.forEach((site, idx) => {
                                    if (cleanText.includes(site)) {
                                        const actualIdx = site === 'distal' ? 0 : (site === 'mesial' ? 2 : 1);
                                        
                                        // Buscar número inmediatamente después o antes de la palabra del sitio
                                        const siteNumbers = cleanText.split(site)[1]?.match(/-?\d/);
                                        if (siteNumbers) {
                                            if (cleanText.includes('margen')) {
                                                newData[`mg_${face}`][actualIdx] = parseInt(siteNumbers[0]);
                                            } else {
                                                newData[`pd_${face}`][actualIdx] = parseInt(siteNumbers[0]);
                                            }
                                        }

                                        // Sangrado y Pus por sitio específico
                                        if (cleanText.includes('sangra') || cleanText.includes('sangrado')) {
                                            newData[`bop_${face}`][actualIdx] = !cleanText.includes('no');
                                        }
                                        if (cleanText.includes('pus') || cleanText.includes('supura')) {
                                            newData[`pus_${face}`][actualIdx] = !cleanText.includes('no');
                                        }
                                    }
                                });

                                // Si solo hay números sin sitio, y no es ráfaga, aplicamos al "centro" por defecto
                                if (allNumbers.length === 1 && !sites.some(s => cleanText.includes(s))) {
                                    if (cleanText.includes('margen')) newData[`mg_${face}`][1] = parseInt(allNumbers[0]);
                                    else newData[`pd_${face}`][1] = parseInt(allNumbers[0]);
                                }
                            }
                            
                            // Movilidad y Furca (Globales del diente)
                            const movMatch = cleanText.match(/movilidad\s?(\d)/);
                            if (movMatch) newData.mobility = parseInt(movMatch[1]);

                            const furcMatch = cleanText.match(/furca\s?(\d)/);
                            if (furcMatch) newData.furcation = parseInt(furcMatch[1]);
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

    // Detener escucha al cambiar de pestaña
    useEffect(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [patientTab, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                    recognitionRef.current.abort();
                } catch (e) {}
            }
        };
    }, []);

    return { isListening, voiceStatus, isPerioVoiceActive, voiceFeedback, toggleVoice, startPerioDictation };
}