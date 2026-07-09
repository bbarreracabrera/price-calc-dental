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
            recognition.lang = 'es-CL'; 
            recognition.continuous = true; 
            recognition.interimResults = false;
            // Aumentar la sensibilidad y evitar que se corte por silencios cortos
            recognition.maxAlternatives = 1;
            
            recognition.onstart = () => { 
                setIsListening(true); 
                setVoiceStatus(latestProps.current.patientTab === 'perio' ? 'Dicta (ej: "Diente 18, tres dos tres, sangra distal")...' : 'Dicta Odonto (ej: "Diente 14 caries, avanza")...'); 
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) transcript += event.results[i][0].transcript; 
                }
                
                if (transcript) {
                    const text = transcript.toLowerCase();
                    latestProps.current.notify(`IA Escuchó: "${text}"`);

                    // 1. Identificar Diente
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
                        // MODO PERIODONTOGRAMA (UPGRADED)
                        // ==========================================
                        if (patientTab === 'perio') {
                            let cleanText = text.replace(/diente\s?\d\s?\d/g, '').replace(/\b([1-4][1-8]|[5-8][1-5])\b/g, '');
                            
                            // Normalización de números extendida
                            const numMap = {
                                'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5', 
                                'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'cero': '0',
                                'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
                                'menos ': '-', 'grado ': ''
                            };
                            Object.keys(numMap).forEach(key => {
                                cleanText = cleanText.replace(new RegExp(key, 'g'), numMap[key]);
                            });
                            
                            const existingPerio = p.clinical.perio?.[currentToothId] || {};
                            let newData = { 
                                ...existingPerio, 
                                pd_v: [...(existingPerio.pd_v || ['','',''])], pd_l: [...(existingPerio.pd_l || ['','',''])], 
                                mg_v: [...(existingPerio.mg_v || ['','',''])], mg_l: [...(existingPerio.mg_l || ['','',''])], 
                                bop_v: [...(existingPerio.bop_v || [false,false,false])], bop_l: [...(existingPerio.bop_l || [false,false,false])], 
                                pus_v: [...(existingPerio.pus_v || [false,false,false])], pus_l: [...(existingPerio.pus_l || [false,false,false])], 
                                mobility: existingPerio.mobility || 0, furcation: existingPerio.furcation || 0 
                            };
                            
                            const face = (cleanText.includes('palatino') || cleanText.includes('lingual')) ? 'l' : 'v'; 

                            if (cleanText.includes('sano') || cleanText.includes('limpiar')) {
                                newData[`pd_${face}`] = ['','',''];
                                newData[`mg_${face}`] = ['','',''];
                                newData[`bop_${face}`] = [false,false,false];
                                newData[`pus_${face}`] = [false,false,false];
                                newData.mobility = 0;
                                newData.furcation = 0;
                            } else {
                                const sites = ['distal', 'centro', 'medio', 'mesial'];
                                const allNumbers = cleanText.match(/-?\d+/g) || [];
                                
                                // 1. Ráfaga de 3 números (Profundidad de Sondaje)
                                if (allNumbers.length >= 3 && !cleanText.includes('margen') && !cleanText.includes('movilidad') && !cleanText.includes('furca')) {
                                    newData[`pd_${face}`] = [allNumbers[0], allNumbers[1], allNumbers[2]];
                                    notify(`📏 Ráfaga PD: ${allNumbers[0]}-${allNumbers[1]}-${allNumbers[2]}`);
                                } 
                                // 2. Ráfaga de 3 números con "Margen"
                                else if (allNumbers.length >= 3 && cleanText.includes('margen')) {
                                    newData[`mg_${face}`] = [allNumbers[0], allNumbers[1], allNumbers[2]];
                                    notify(`📏 Ráfaga Margen: ${allNumbers[0]}-${allNumbers[1]}-${allNumbers[2]}`);
                                }
                                else {
                                    // Procesamiento por palabras clave
                                    sites.forEach((site) => {
                                        if (cleanText.includes(site)) {
                                            const actualIdx = site === 'distal' ? 0 : (site === 'mesial' ? 2 : 1);
                                            
                                            // Extraer número asociado al sitio
                                            const parts = cleanText.split(site);
                                            const nextPart = parts[1] || '';
                                            const siteNumMatch = nextPart.match(/-?\d+/);
                                            
                                            if (siteNumMatch) {
                                                const val = siteNumMatch[0];
                                                if (cleanText.includes('margen')) newData[`mg_${face}`][actualIdx] = val;
                                                else newData[`pd_${face}`][actualIdx] = val;
                                            }

                                            // Sangrado / Pus
                                            if (cleanText.includes('sangra') || cleanText.includes('sangrado') || cleanText.includes('punto rojo') || cleanText.includes('positivo')) {
                                                newData[`bop_${face}`][actualIdx] = !cleanText.includes('no');
                                            }
                                            if (cleanText.includes('pus') || cleanText.includes('supura') || cleanText.includes('exudado')) {
                                                newData[`pus_${face}`][actualIdx] = !cleanText.includes('no');
                                            }
                                        }
                                    });

                                    // Movilidad mejorada
                                    const movKeywords = ['movilidad', 'mueve', 'grado'];
                                    if (movKeywords.some(k => cleanText.includes(k)) && !cleanText.includes('furca')) {
                                        const movMatch = cleanText.match(/(?:movilidad|mueve|grado)\s?(\d+)/);
                                        if (movMatch) newData.mobility = parseInt(movMatch[1]);
                                    }

                                    // Furca mejorada
                                    if (cleanText.includes('furca') || cleanText.includes('entrada')) {
                                        const furcMatch = cleanText.match(/(?:furca|entrada|grado)\s?(\d+)/);
                                        if (furcMatch) newData.furcation = parseInt(furcMatch[1]);
                                    }
                                }
                            }

                            setPerioData(newData);
                            setToothModalData({ ...toothModalData, perio: newData, id: currentToothId });

                            const updatedPerio = { ...p.clinical.perio, [currentToothId]: newData };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: updatedPerio } });

                            // Lógica de avance mejorada
                            if (text.includes('avanza') || text.includes('siguiente') || text.includes('pasamos')) {
                                const PERIO_ORDER = [ '18','17','16','15','14','13','12','11', '21','22','23','24','25','26','27','28', '38','37','36','35','34','33','32','31', '41','42','43','44','45','46','47','48' ];
                                const currIdx = PERIO_ORDER.indexOf(currentToothId.toString());
                                if (currIdx >= 0 && currIdx < PERIO_ORDER.length - 1) {
                                    setTimeout(() => {
                                        if (setSelectedToothId) setSelectedToothId(PERIO_ORDER[currIdx + 1]);
                                        notify(`✔️ Guardado. Siguiente: Pieza ${PERIO_ORDER[currIdx + 1]}`);
                                    }, 400); 
                                }
                            } else if (text.includes('listo') || text.includes('termina') || text.includes('cerrar')) {
                                if (setSelectedToothId) setSelectedToothId(null);
                                notify("✔️ Periodontograma finalizado");
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

            // REINICIO AUTOMÁTICO PARA EVITAR QUE SE DESACTIVE RÁPIDO
            recognition.onerror = (e) => { 
                console.error("Speech Error:", e.error);
                if (e.error === 'no-speech' && isListening) {
                    // Silencio detectado, no hacer nada, el navegador suele seguir escuchando si continuous=true
                } else {
                    setIsListening(false); 
                    setVoiceStatus(''); 
                }
            };
            
            recognition.onend = () => { 
                // Si el usuario no lo detuvo manualmente, intentamos reiniciar
                if (isListening) {
                    try { recognition.start(); } catch(e) {}
                } else {
                    setIsListening(false); 
                    setVoiceStatus(''); 
                }
            };

            recognitionRef.current = recognition;
            try { recognition.start(); } catch (e) { console.error(e); }
        }
    };

    const startPerioDictation = () => {};

    useEffect(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [patientTab, activeTab]); 

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
