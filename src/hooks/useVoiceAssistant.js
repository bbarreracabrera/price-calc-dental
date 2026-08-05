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
    // FIX #5: persiste la cara activa (v/l) ENTRE frases dictadas por separado.
    // Antes, "defaultFace" se recalculaba desde cero en cada evento de
    // reconocimiento, así que decir "palatino" en una frase y "distal tres" en
    // la siguiente frase perdía el contexto y volvía a asumir vestibular.
    const activeFaceRef = useRef('v');
    const activeToothRef = useRef(null);
    // FIX #6 (importante): recognition.onend/onerror quedaban cerrados sobre el
    // valor de "isListening" del render en que arrancó toggleVoice — ese valor
    // nunca se actualizaba, así que la condición "if (isListening)" adentro de
    // esos callbacks era SIEMPRE false. Resultado: cada vez que Chrome cerraba
    // la sesión de reconocimiento solo (algo que pasa seguido, sobre todo tras
    // unos segundos de silencio entre comandos, con o sin error 'no-speech'),
    // el código nunca la reiniciaba y el micrófono quedaba apagado sin avisar.
    // Se reemplaza por un ref que sí refleja el estado actual en todo momento.
    const isListeningRef = useRef(false);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

    const toggleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { latestProps.current.notify("Navegador no soporta IA de voz. Usa Chrome."); return; }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false); setVoiceStatus('');
            activeFaceRef.current = 'v';
            activeToothRef.current = null;
        } else {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CL';
            recognition.continuous = true;
            recognition.interimResults = false;
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
                            // FIX #4 (menor): límites de palabra para evitar reemplazos parciales
                            // dentro de otras palabras a futuro (no afecta el vocabulario actual).
                            const numMap = {
                                'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
                                'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'cero': '0',
                                'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
                                'menos ': '-', 'grado ': ''
                            };
                            Object.keys(numMap).forEach(key => {
                                const trimmed = key.trim();
                                const hasTrailingSpace = key.endsWith(' ');
                                const pattern = hasTrailingSpace
                                    ? new RegExp(`\\b${trimmed}\\s`, 'g')
                                    : new RegExp(`\\b${trimmed}\\b`, 'g');
                                cleanText = cleanText.replace(pattern, hasTrailingSpace ? numMap[key] : numMap[key]);
                            });

                            const existingPerio = p.clinical.perio?.[currentToothId] || {};
                            let newData = {
                                ...existingPerio,
                                pd_v: [...(existingPerio.pd_v || ['', '', ''])], pd_l: [...(existingPerio.pd_l || ['', '', ''])],
                                mg_v: [...(existingPerio.mg_v || ['', '', ''])], mg_l: [...(existingPerio.mg_l || ['', '', ''])],
                                bop_v: [...(existingPerio.bop_v || [false, false, false])], bop_l: [...(existingPerio.bop_l || [false, false, false])],
                                pus_v: [...(existingPerio.pus_v || [false, false, false])], pus_l: [...(existingPerio.pus_l || [false, false, false])],
                                mobility: existingPerio.mobility || 0, furcation: existingPerio.furcation || 0
                            };

                            // Listas de keywords compartidas (usadas tanto para el aviso de
                            // cambio de cara como para el parser de cláusulas más abajo).
                            const SITE_IDX = { distal: 0, centro: 1, medio: 1, mesial: 2 };
                            const SITE_KEYWORDS = Object.keys(SITE_IDX);
                            const BLEED_KEYWORDS = ['sangra', 'sangrado', 'hemorragia', 'punto rojo', 'positivo', 'sangrante'];
                            const PUS_KEYWORDS = ['pus', 'supura', 'supuracion', 'supuración', 'exudado', 'absceso'];
                            const MARGIN_KEYWORDS = ['margen', 'recesion', 'recesión', 'encia', 'encía'];

                            // FIX #5: si cambiaste de pieza desde la última frase, la cara
                            // vuelve a vestibular por defecto (evita arrastrar "palatino"
                            // del diente anterior al nuevo diente sin querer).
                            if (activeToothRef.current !== currentToothId.toString()) {
                                activeFaceRef.current = 'v';
                                activeToothRef.current = currentToothId.toString();
                            }

                            // Si esta frase menciona la cara explícitamente, actualiza el
                            // contexto persistente; si no, se usa la última cara dicha.
                            if (cleanText.includes('palatino') || cleanText.includes('lingual')) {
                                activeFaceRef.current = 'l';
                            } else if (cleanText.includes('vestibular') || cleanText.includes('bucal')) {
                                activeFaceRef.current = 'v';
                            }
                            const defaultFace = activeFaceRef.current;

                            // Frase que SOLO cambia de cara (sin sitios/números/hallazgos) →
                            // confirma el cambio con feedback, aunque no haya nada que guardar.
                            const onlyFaceMention = (cleanText.includes('palatino') || cleanText.includes('lingual') || cleanText.includes('vestibular') || cleanText.includes('bucal'))
                                && !/\d/.test(cleanText)
                                && !SITE_KEYWORDS.some(k => cleanText.includes(k))
                                && !cleanText.includes('sano') && !cleanText.includes('limpiar')
                                && !BLEED_KEYWORDS.some(k => cleanText.includes(k))
                                && !PUS_KEYWORDS.some(k => cleanText.includes(k))
                                && !cleanText.includes('movilidad') && !cleanText.includes('mueve') && !cleanText.includes('furca') && !cleanText.includes('entrada');
                            if (onlyFaceMention) {
                                notify(`↔️ Cara activa: ${defaultFace === 'l' ? 'Palatino/Lingual' : 'Vestibular'}`);
                            }

                            if (cleanText.includes('sano') || cleanText.includes('limpiar')) {
                                newData[`pd_${defaultFace}`] = ['', '', ''];
                                newData[`mg_${defaultFace}`] = ['', '', ''];
                                newData[`bop_${defaultFace}`] = [false, false, false];
                                newData[`pus_${defaultFace}`] = [false, false, false];
                                newData.mobility = 0;
                                newData.furcation = 0;
                            } else {
                                // ==========================================================
                                // PARSER POR CLÁUSULAS
                                // FIX #1: además de partir por coma/"y"/";"/".", se parte
                                // ANTES de cada palabra clave de sitio o hallazgo (lookahead),
                                // porque el reconocimiento de voz casi nunca entrega comas ni
                                // puntos reales cuando el usuario solo hace una pausa breve.
                                // Sin esto, una frase dictada de corrido como
                                // "distal tres sangra centro dos mesial tres sin sangrado"
                                // llegaba como UNA sola cláusula y "sangra"/"sin" se aplicaban
                                // a los 3 sitios en vez de solo al suyo.
                                // ==========================================================
                                const CLAUSE_SPLIT = /,| y |;|\.|(?=\bdistal\b)|(?=\bcentro\b)|(?=\bmedio\b)|(?=\bmesial\b)|(?=\bmovilidad\b)|(?=\bmueve\b)|(?=\bfurca\b)|(?=\bentrada\b)/;
                                const clauses = cleanText.split(CLAUSE_SPLIT).map(c => c.trim()).filter(Boolean);

                                // FIX #2: "modo margen" se hereda dentro de la misma frase.
                                // Ej: "margen distal dos, centro uno, mesial dos" — una vez que
                                // aparece "margen" en la primera cláusula, las siguientes

                                // cláusulas (centro, mesial) sin la palabra "margen" también
                                // se guardan como margen, no como PD. Se reinicia en cada
                                // dictado nuevo (declarada dentro de onresult).
                                let carryMargin = false;

                                clauses.forEach(clause => {
                                    const numbers = clause.match(/-?\d+/g) || [];
                                    const negated = / no |^no |sin /.test(` ${clause} `);
                                    const hasMarginKeyword = MARGIN_KEYWORDS.some(k => clause.includes(k));
                                    if (hasMarginKeyword) carryMargin = true;
                                    const isMargin = hasMarginKeyword || carryMargin;
                                    const isMobility = clause.includes('movilidad') || clause.includes('mueve');
                                    const isFurca = clause.includes('furca') || clause.includes('entrada');
                                    const isBleed = BLEED_KEYWORDS.some(k => clause.includes(k));
                                    const isPus = PUS_KEYWORDS.some(k => clause.includes(k));
                                    // cara: si la cláusula la menciona explícitamente, prevalece
                                    // sobre la cara por defecto de todo el dictado (permite mezclar
                                    // "vestibular ... palatino ..." en la misma frase).
                                    const face = clause.includes('palatino') || clause.includes('lingual')
                                        ? 'l'
                                        : (clause.includes('vestibular') || clause.includes('bucal') ? 'v' : defaultFace);

                                    // --- Movilidad / Furca: valen para todo el diente, no por cara ---
                                    if (isMobility) {
                                        if (numbers[0] !== undefined) newData.mobility = Math.min(3, Math.max(0, parseInt(numbers[0], 10)));
                                        return;
                                    }
                                    if (isFurca) {
                                        if (numbers[0] !== undefined) newData.furcation = Math.min(3, Math.max(0, parseInt(numbers[0], 10)));
                                        return;
                                    }

                                    const sitesInClause = SITE_KEYWORDS.filter(s => clause.includes(s));

                                    if (sitesInClause.length > 0) {
                                        // Sitio(s) explícitos en esta cláusula → el hallazgo se aplica
                                        // solo a ellos, tomando el número que aparece después de
                                        // cada palabra de sitio dentro de la MISMA cláusula.
                                        sitesInClause.forEach(site => {
                                            const idx = SITE_IDX[site];
                                            const after = clause.slice(clause.indexOf(site));
                                            const val = (after.match(/-?\d+/) || [])[0];
                                            if (val !== undefined) {
                                                if (isMargin) newData[`mg_${face}`][idx] = val;
                                                else if (numbers.length) newData[`pd_${face}`][idx] = val;
                                            }
                                            if (isBleed) newData[`bop_${face}`][idx] = !negated;
                                            if (isPus) newData[`pus_${face}`][idx] = !negated;
                                        });
                                    } else if (numbers.length >= 3) {
                                        // Ráfaga de 3 números sin sitio explícito → Distal, Centro, Mesial en orden.
                                        if (isMargin) {
                                            newData[`mg_${face}`] = numbers.slice(0, 3);
                                            notify(`📏 Ráfaga Margen (${face}): ${numbers.slice(0, 3).join('-')}`);
                                        } else {
                                            newData[`pd_${face}`] = numbers.slice(0, 3);
                                            notify(`📏 Ráfaga PD (${face}): ${numbers.slice(0, 3).join('-')}`);
                                        }
                                    } else if (isBleed || isPus) {
                                        // "sangra toda la cara" / "sangrado generalizado" sin sitio → aplica a los 3 puntos.
                                        [0, 1, 2].forEach(idx => {
                                            if (isBleed) newData[`bop_${face}`][idx] = !negated;
                                            if (isPus) newData[`pus_${face}`][idx] = !negated;
                                        });
                                    }
                                });
                            }

                            setPerioData(newData);
                            setToothModalData({ ...toothModalData, perio: newData, id: currentToothId });

                            const updatedPerio = { ...p.clinical.perio, [currentToothId]: newData };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, perio: updatedPerio } });

                            if (text.includes('avanza') || text.includes('siguiente') || text.includes('pasamos')) {
                                // FIX #3: PERIO_ORDER original solo cubría dientes permanentes.
                                // Si se dictaba "avanza" en una pieza temporal (51-55/61-65/
                                // 71-75/81-85), currIdx daba -1 y el comando se ignoraba en
                                // silencio. Se agrega PERIO_ORDER_PED y se elige la lista según
                                // a qué grupo pertenece la pieza activa.
                                const PERIO_ORDER = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '38', '37', '36', '35', '34', '33', '32', '31', '41', '42', '43', '44', '45', '46', '47', '48'];
                                const PERIO_ORDER_PED = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65', '75', '74', '73', '72', '71', '81', '82', '83', '84', '85'];

                                const toothStr = currentToothId.toString();
                                const orderList = PERIO_ORDER.includes(toothStr)
                                    ? PERIO_ORDER
                                    : (PERIO_ORDER_PED.includes(toothStr) ? PERIO_ORDER_PED : null);

                                if (orderList) {
                                    const currIdx = orderList.indexOf(toothStr);
                                    if (currIdx >= 0 && currIdx < orderList.length - 1) {
                                        setTimeout(() => {
                                            if (setSelectedToothId) setSelectedToothId(orderList[currIdx + 1]);
                                            notify(`✔️ Guardado. Siguiente: Pieza ${orderList[currIdx + 1]}`);
                                        }, 400);
                                    }
                                }
                            } else if (text.includes('listo') || text.includes('termina') || text.includes('cerrar')) {
                                if (setSelectedToothId) setSelectedToothId(null);
                                activeFaceRef.current = 'v';
                                activeToothRef.current = null;
                                notify("✔️ Periodontograma finalizado");
                            }
                        }
                        // ==========================================
                        // MODO ODONTOGRAMA
                        // ==========================================
                        else {
                            const existingTooth = p.clinical.teeth?.[currentToothId] || { faces: { v: null, l: null, m: null, d: null, o: null }, status: null, notes: '', treatment: { name: '', status: 'planned' } };
                            let newState = { ...existingTooth };
                            if (!newState.faces) newState.faces = { v: null, l: null, m: null, d: null, o: null };

                            const facesMap = { 'vestibular': 'v', 'lingual': 'l', 'palatina': 'l', 'mesial': 'm', 'distal': 'd', 'oclusal': 'o', 'incisal': 'o' };
                            const faceId = Object.keys(facesMap).find(f => text.includes(f)) ? facesMap[Object.keys(facesMap).find(f => text.includes(f))] : null;

                            if (text.includes('caries') || text.includes('lesión')) { if (faceId) { newState.faces[faceId] = 'caries'; newState.activeFace = faceId; newState.status = null; } }
                            else if (text.includes('resina') || text.includes('empaste')) { if (faceId) { newState.faces[faceId] = 'filled'; newState.activeFace = faceId; newState.status = null; } }
                            else if (text.includes('corona')) newState.status = 'crown';
                            else if (text.includes('ausente') || text.includes('extraído')) newState.status = 'missing';
                            else if (text.includes('implante')) newState.status = 'implant';
                            else if (text.includes('sano') || text.includes('limpiar')) { if (faceId) { newState.faces[faceId] = null; newState.activeFace = faceId; } else { newState.faces = { v: null, l: null, m: null, d: null, o: null }; newState.status = null; } }

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

            recognition.onerror = (e) => {
                console.error("Speech Error:", e.error);
                if (e.error === 'no-speech' && isListeningRef.current) {
                    // Silencio detectado, no hacer nada (recognition.onend se
                    // encargará de reiniciar el reconocimiento automáticamente)
                } else {
                    setIsListening(false);
                    setVoiceStatus('');
                }
            };

            recognition.onend = () => {
                if (isListeningRef.current) {
                    try { recognition.start(); } catch (e) {}
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
