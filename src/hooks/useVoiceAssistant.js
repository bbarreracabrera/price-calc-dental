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
    const activeFaceRef = useRef('v');
    const activeToothRef = useRef(null);
    const isListeningRef = useRef(false);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

    const [voiceConfirmationEnabled, setVoiceConfirmationEnabled] = useState(false);
    const voiceConfirmationEnabledRef = useRef(false);
    const toggleVoiceConfirmation = () => {
        voiceConfirmationEnabledRef.current = !voiceConfirmationEnabledRef.current;
        setVoiceConfirmationEnabled(voiceConfirmationEnabledRef.current);
    };

    const suppressAutoRestartRef = useRef(false);
    const speak = (text) => {
        if (!text || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-CL';
        utter.rate = 1.15;
        if (recognitionRef.current && isListeningRef.current) {
            suppressAutoRestartRef.current = true;
            try { recognitionRef.current.stop(); } catch (e) {}
            const resume = () => {
                suppressAutoRestartRef.current = false;
                if (isListeningRef.current && recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch (e) {}
                }
            };
            utter.onend = resume;
            utter.onerror = resume;
        }
        window.speechSynthesis.speak(utter);
    };

    const toggleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { latestProps.current.notify("Navegador no soporta IA de voz. Usa Chrome."); return; }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false); setVoiceStatus('');
            activeFaceRef.current = 'v';
            activeToothRef.current = null;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            suppressAutoRestartRef.current = false;
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
                    let text = transcript.toLowerCase();
                    text = text.replace(/\b([1-8])[.\s]([1-8])\b/g, '$1$2');
                    latestProps.current.notify(`IA Escuchó: "${text}"`);

                    const toothMatch = text.match(/\b([1-4][1-8]|[5-8][1-5])\b/);
                    const toothMatchNum = toothMatch ? Number(toothMatch[0]) : null;

                    if (toothMatchNum !== null) {
                        const prevTooth = activeToothRef.current;
                        activeToothRef.current = toothMatchNum;
                        if (prevTooth !== toothMatchNum) {
                            activeFaceRef.current = 'v';
                        }
                        if (latestProps.current.setSelectedToothId) latestProps.current.setSelectedToothId(toothMatchNum);
                        // Actualizar también el id en el modal si está abierto
                        if (latestProps.current.setToothModalData && latestProps.current.toothModalData) {
                            latestProps.current.setToothModalData(prev => ({ ...prev, id: toothMatchNum }));
                        }
                    }

                    setTimeout(() => {
                        const { patientTab, setPerioData, getPatient, selectedPatientId, savePatientData, notify, setSelectedToothId, setToothModalData, toothModalData } = latestProps.current;
                        const currentToothId = toothMatchNum !== null ? toothMatchNum : (activeToothRef.current || toothModalData?.id);
                        if (!currentToothId) return;

                        let p = getPatient(selectedPatientId);

                        if (patientTab === 'perio') {
                            let cleanText = text.replace(/diente\s?\d\s?\d/g, '').replace(/\b([1-4][1-8]|[5-8][1-5])\b/g, '');

                            const numMap = {
                                'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
                                'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'cero': '0',
                                'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
                                'menos ': '-', 'guion ': '-', 'guión ': '-', 'grado ': ''
                            };
                            Object.keys(numMap).forEach(key => {
                                const trimmed = key.trim();
                                const hasTrailingSpace = key.endsWith(' ');
                                const pattern = hasTrailingSpace
                                    ? new RegExp(`\\b${trimmed}\\s`, 'g')
                                    : new RegExp(`\\b${trimmed}\\b`, 'g');
                                cleanText = cleanText.replace(pattern, hasTrailingSpace ? numMap[key] : numMap[key]);
                            });

                            // Separar tres dígitos pegados
                            cleanText = cleanText.replace(/\b(\d{3})\b/g, (match) => match.split('').join(' '));

                            const existingPerio = p.clinical.perio?.[currentToothId] || {};
                            let newData = {
                                ...existingPerio,
                                pd_v: [...(existingPerio.pd_v || ['', '', ''])], pd_l: [...(existingPerio.pd_l || ['', '', ''])],
                                mg_v: [...(existingPerio.mg_v || ['', '', ''])], mg_l: [...(existingPerio.mg_l || ['', '', ''])],
                                bop_v: [...(existingPerio.bop_v || [false, false, false])], bop_l: [...(existingPerio.bop_l || [false, false, false])],
                                pus_v: [...(existingPerio.pus_v || [false, false, false])], pus_l: [...(existingPerio.pus_l || [false, false, false])],
                                mobility: existingPerio.mobility || 0, furcation: existingPerio.furcation || 0
                            };

                            // Determinar lado izquierdo/ derecho
                            const quadrant = Math.floor(currentToothId / 10);
                            const isLeftSide = [1, 4, 5, 8].includes(quadrant);

                            const SITE_IDX = isLeftSide
                                ? { distal: 0, centro: 1, medio: 1, mesial: 2 }
                                : { mesial: 0, centro: 1, medio: 1, distal: 2 };
                            const SITE_KEYWORDS = Object.keys(SITE_IDX);
                            const SITE_LABEL = isLeftSide
                                ? ['distal', 'centro', 'mesial']
                                : ['mesial', 'centro', 'distal'];

                            const BLEED_KEYWORDS = ['sangra', 'sangrado', 'hemorragia', 'punto rojo', 'positivo', 'sangrante'];
                            const PUS_KEYWORDS = ['pus', 'supura', 'supuracion', 'supuración', 'exudado', 'absceso'];
                            const MARGIN_KEYWORDS = ['margen', 'recesion', 'recesión', 'encia', 'encía'];
                            // *** NUEVO: sinónimos de profundidad de sondaje ***
                            const PD_KEYWORDS = ['profundidad', 'sondeo', 'sondaje'];

                            const confirmations = [];

                            // *** DETECCIÓN DE IMPLANTE MEJORADA ***
                            let pWithImplant = p;
                            const implantRegex = /(?:sin|no)?\s*(?:implantes?|implant)/;
                            if (implantRegex.test(text)) {
                                const currentTooth = p.clinical.teeth?.[currentToothId] || {};
                                let statusArr = Array.isArray(currentTooth.status) ? [...currentTooth.status] : (currentTooth.status ? [currentTooth.status] : []);
                                const negated = /(?:sin|no)\s*(?:implantes?|implant)/.test(text);
                                if (negated) {
                                    statusArr = statusArr.filter(s => s !== 'implant');
                                    if (statusArr.length === 0) statusArr = null;
                                    confirmations.push('sin implante');
                                    notify(`✔️ Implante removido de pieza ${currentToothId}`);
                                } else {
                                    if (!statusArr.includes('implant')) {
                                        statusArr.push('implant');
                                        confirmations.push('implante');
                                        notify(`✔️ Implante agregado a pieza ${currentToothId}`);
                                    } else {
                                        notify(`La pieza ${currentToothId} ya tiene implante`);
                                    }
                                }
                                const updatedTooth = { ...currentTooth, status: statusArr };
                                const updatedTeeth = { ...p.clinical.teeth, [currentToothId]: updatedTooth };
                                pWithImplant = { ...p, clinical: { ...p.clinical, teeth: updatedTeeth } };
                            }

                            if (cleanText.includes('palatino') || cleanText.includes('lingual')) {
                                activeFaceRef.current = 'l';
                            } else if (cleanText.includes('vestibular') || cleanText.includes('bucal')) {
                                activeFaceRef.current = 'v';
                            }
                            const defaultFace = activeFaceRef.current;

                            const onlyFaceMention = (cleanText.includes('palatino') || cleanText.includes('lingual') || cleanText.includes('vestibular') || cleanText.includes('bucal'))
                                && !/\d/.test(cleanText)
                                && !SITE_KEYWORDS.some(k => cleanText.includes(k))
                                && !cleanText.includes('sano') && !cleanText.includes('limpiar')
                                && !BLEED_KEYWORDS.some(k => cleanText.includes(k))
                                && !PUS_KEYWORDS.some(k => cleanText.includes(k))
                                && !MARGIN_KEYWORDS.some(k => cleanText.includes(k))
                                && !PD_KEYWORDS.some(k => cleanText.includes(k))
                                && !cleanText.includes('movilidad') && !cleanText.includes('mueve') && !cleanText.includes('furca') && !cleanText.includes('entrada')
                                && !cleanText.includes('implante');
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
                                confirmations.push('cara limpia');
                            } else {
                                const CLAUSE_SPLIT = /,| y |;|\.|(?=\bmesial\b)|(?=\bdistal\b)|(?=\bcentro\b)|(?=\bmedio\b)|(?=\bmovilidad\b)|(?=\bmueve\b)|(?=\bfurca\b)|(?=\bentrada\b)/;
                                const rawClauses = cleanText.split(CLAUSE_SPLIT).map(c => c.trim()).filter(Boolean);

                                // *** NUEVO: incluir PD_KEYWORDS en FINDING_WORDS para fusión ***
                                const FINDING_WORDS = [...BLEED_KEYWORDS, ...PUS_KEYWORDS, ...MARGIN_KEYWORDS, ...PD_KEYWORDS];
                                const ADVANCE_KEYWORDS = [...SITE_KEYWORDS, 'movilidad', 'mueve', 'furca', 'entrada'];
                                const clauses = [];
                                for (let i = 0; i < rawClauses.length; i++) {
                                    const c = rawClauses[i];
                                    const next = rawClauses[i + 1];
                                    const nextHasAnchor = !!next && ADVANCE_KEYWORDS.some(k => next.includes(k));
                                    const cHasNumber = /-?\d/.test(c);
                                    const cHasSite = SITE_KEYWORDS.some(s => c.includes(s));
                                    const cHasFinding = FINDING_WORDS.some(k => c.includes(k));
                                    const cIsBareNumber = /^-?\d+$/.test(c);
                                    const cIsBareNegation = /(^| )(sin|no)( |$)/.test(c) && !cHasNumber && !cHasSite && !cHasFinding;
                                    // *** CONDICIÓN DE FUSIÓN CORREGIDA ***
                                    // Fusiona si la cláusula actual no tiene sitio, la siguiente tiene ancla,
                                    // y la actual tiene hallazgo (incluye profundidad) o es número o negación.
                                    const shouldMerge = nextHasAnchor && !cHasSite && (cHasFinding || cIsBareNumber || cIsBareNegation);
                                    if (shouldMerge) { clauses.push(`${c} ${next}`); i++; }
                                    else clauses.push(c);
                                }

                                let carryMargin = false;
                                const GENERALIZE_KEYWORDS = ['toda la cara', 'generalizado', 'generalizada', 'todos los puntos'];
                                let carrySiteIdx = null;

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
                                    const face = clause.includes('palatino') || clause.includes('lingual')
                                        ? 'l'
                                        : (clause.includes('vestibular') || clause.includes('bucal') ? 'v' : defaultFace);

                                    if (isMobility) {
                                        if (negated) { newData.mobility = 0; confirmations.push('sin movilidad'); }
                                        else if (numbers[0] !== undefined) { newData.mobility = Math.min(3, Math.max(0, parseInt(numbers[0], 10))); confirmations.push(`movilidad ${newData.mobility}`); }
                                        return;
                                    }
                                    if (isFurca) {
                                        if (negated) { newData.furcation = 0; confirmations.push('sin furca'); }
                                        else if (numbers[0] !== undefined) { newData.furcation = Math.min(3, Math.max(0, parseInt(numbers[0], 10))); confirmations.push(`furca ${newData.furcation}`); }
                                        return;
                                    }

                                    const sitesInClause = SITE_KEYWORDS.filter(s => clause.includes(s));

                                    if (sitesInClause.length > 0) {
                                        sitesInClause.forEach(site => {
                                            const idx = SITE_IDX[site];
                                            carrySiteIdx = idx;
                                            const after = clause.slice(clause.indexOf(site));
                                            let val = (after.match(/-?\d+/) || [])[0];
                                            if (val === undefined && numbers.length === 1) val = numbers[0];
                                            if (val !== undefined) {
                                                if (isMargin) { newData[`mg_${face}`][idx] = val; confirmations.push(`margen ${SITE_LABEL[idx]} ${val}`); }
                                                else if (numbers.length) { newData[`pd_${face}`][idx] = val; confirmations.push(`${SITE_LABEL[idx]} ${val}`); }
                                            }
                                            if (isBleed) { newData[`bop_${face}`][idx] = !negated; confirmations.push(`${SITE_LABEL[idx]} ${negated ? 'sin sangrado' : 'sangra'}`); }
                                            if (isPus) { newData[`pus_${face}`][idx] = !negated; confirmations.push(`${SITE_LABEL[idx]} ${negated ? 'sin pus' : 'con pus'}`); }
                                        });
                                    } else if (numbers.length >= 3) {
                                        carrySiteIdx = null;
                                        const burst = isLeftSide
                                            ? [numbers[0], numbers[1], numbers[2]]
                                            : [numbers[2], numbers[1], numbers[0]];
                                        if (isMargin) {
                                            newData[`mg_${face}`] = burst;
                                            notify(`📏 Ráfaga Margen (${face}): ${burst.join(' / ')} mm`);
                                            confirmations.push(`margen ${burst.join(' ')}`);
                                        } else {
                                            newData[`pd_${face}`] = burst;
                                            notify(`📏 Ráfaga PD (${face}): ${burst.join(' / ')} mm`);
                                            confirmations.push(`profundidad ${burst.join(' ')}`);
                                        }
                                    } else if (isBleed || isPus) {
                                        const isGeneralized = GENERALIZE_KEYWORDS.some(k => clause.includes(k));
                                        if (!isGeneralized && carrySiteIdx !== null) {
                                            if (isBleed) { newData[`bop_${face}`][carrySiteIdx] = !negated; confirmations.push(`${SITE_LABEL[carrySiteIdx]} ${negated ? 'sin sangrado' : 'sangra'}`); }
                                            if (isPus) { newData[`pus_${face}`][carrySiteIdx] = !negated; confirmations.push(`${SITE_LABEL[carrySiteIdx]} ${negated ? 'sin pus' : 'con pus'}`); }
                                        } else {
                                            [0, 1, 2].forEach(idx => {
                                                if (isBleed) newData[`bop_${face}`][idx] = !negated;
                                                if (isPus) newData[`pus_${face}`][idx] = !negated;
                                            });
                                            if (isBleed) confirmations.push(negated ? 'sin sangrado en toda la cara' : 'sangrado generalizado');
                                            if (isPus) confirmations.push(negated ? 'sin pus en toda la cara' : 'pus generalizado');
                                        }
                                    } else if (numbers.length > 0) {
                                        if (numbers.length < 3) {
                                            notify(`⚠️ Solo capté ${numbers.length} número(s) en "${clause}" — si ibas a dictar los 3 puntos juntos, puede que el micrófono se haya perdido uno. Intenta de nuevo o agrega distal/centro/mesial`);
                                        } else {
                                            notify(`⚠️ No pude ubicar "${clause}" — agrega distal/centro/mesial, o dicta los 3 valores juntos`);
                                        }
                                    }
                                });
                            }

                            setPerioData(newData);
                            if (toothModalData?.id) {
                                setToothModalData({ ...toothModalData, perio: newData });
                            }

                            const updatedPerio = { ...pWithImplant.clinical.perio, [currentToothId]: newData };
                            savePatientData(selectedPatientId, { ...pWithImplant, clinical: { ...pWithImplant.clinical, perio: updatedPerio } });

                            if (voiceConfirmationEnabledRef.current && confirmations.length) {
                                speak(confirmations.join(', '));
                            }

                            if (text.includes('avanza') || text.includes('siguiente') || text.includes('pasamos')) {
                                const PERIO_ORDER = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '38', '37', '36', '35', '34', '33', '32', '31', '41', '42', '43', '44', '45', '46', '47', '48'];
                                const PERIO_ORDER_PED = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65', '75', '74', '73', '72', '71', '81', '82', '83', '84', '85'];

                                const toothStr = currentToothId.toString();
                                const orderList = PERIO_ORDER.includes(toothStr)
                                    ? PERIO_ORDER
                                    : (PERIO_ORDER_PED.includes(toothStr) ? PERIO_ORDER_PED : null);

                                if (orderList) {
                                    const currIdx = orderList.indexOf(toothStr);
                                    if (currIdx >= 0 && currIdx < orderList.length - 1) {
                                        const nextTooth = Number(orderList[currIdx + 1]);
                                        activeToothRef.current = nextTooth;
                                        activeFaceRef.current = 'v';
                                        if (setSelectedToothId) setSelectedToothId(nextTooth);
                                        if (setToothModalData && toothModalData) {
                                            setToothModalData(prev => ({ ...prev, id: nextTooth }));
                                        }
                                        notify(`✔️ Guardado. Siguiente: Pieza ${nextTooth}`);
                                    }
                                }
                            } else if (text.includes('listo') || text.includes('termina') || text.includes('cerrar')) {
                                if (setSelectedToothId) setSelectedToothId(null);
                                activeFaceRef.current = 'v';
                                activeToothRef.current = null;
                                notify("✔️ Periodontograma finalizado");
                            }
                        } else {
                            // Modo Odontograma (sin cambios relevantes)
                            const existingTooth = p.clinical.teeth?.[currentToothId] || { faces: { v: null, l: null, m: null, d: null, o: null }, status: [], notes: '', treatment: { name: '', status: 'planned' } };
                            let newState = { ...existingTooth };
                            if (!newState.faces) newState.faces = { v: null, l: null, m: null, d: null, o: null };

                            let statusArr = Array.isArray(newState.status) ? [...newState.status] : (newState.status ? [newState.status] : []);

                            const FACE_MAP = { 'vestibular': 'v', 'lingual': 'l', 'palatina': 'l', 'mesial': 'm', 'distal': 'd', 'oclusal': 'o', 'incisal': 'o' };
                            const FACE_KEYWORDS = Object.keys(FACE_MAP);
                            const FACE_LABEL = { v: 'vestibular', l: 'lingual', m: 'mesial', d: 'distal', o: 'oclusal' };

                            const FACE_FINDING_MAP = {
                                'caries': 'caries', 'lesión': 'caries', 'lesion': 'caries',
                                'resina': 'filled', 'empaste': 'filled',
                                'sellante': 'sealant',
                                'carilla': 'veneer',
                            };
                            const FACE_FINDING_WORDS = Object.keys(FACE_FINDING_MAP);

                            const TOGGLE_MAP = {
                                'corona': 'crown',
                                'endodoncia': 'endo', 'endo': 'endo',
                                'implante': 'implant',
                                'extrusión': 'extrusion', 'extrusion': 'extrusion',
                                'intrusión': 'intrusion', 'intrusion': 'intrusion',
                                'mesioversión': 'mesioversion', 'mesioversion': 'mesioversion',
                                'distoversión': 'distoversion', 'distoversion': 'distoversion',
                                'diastema': 'diastema',
                            };
                            const TOGGLE_WORDS = Object.keys(TOGGLE_MAP);

                            const facePattern = FACE_KEYWORDS.map(f => `(?=\\b${f}\\b)`).join('|');
                            const CLAUSE_SPLIT_OD = new RegExp(`,| y |;|\\.|${facePattern}`);
                            const rawClausesOd = text.split(CLAUSE_SPLIT_OD).map(c => c.trim()).filter(Boolean);

                            const clausesOd = [];
                            for (let i = 0; i < rawClausesOd.length; i++) {
                                const c = rawClausesOd[i];
                                const next = rawClausesOd[i + 1];
                                const nextHasFace = !!next && FACE_KEYWORDS.some(f => next.includes(f));
                                const cHasFace = FACE_KEYWORDS.some(f => c.includes(f));
                                const cHasFaceFinding = FACE_FINDING_WORDS.some(k => c.includes(k));
                                const shouldMerge = nextHasFace && cHasFaceFinding && !cHasFace;
                                if (shouldMerge) { clausesOd.push(`${c} ${next}`); i++; }
                                else clausesOd.push(c);
                            }

                            const confirmations = [];

                            clausesOd.forEach(clause => {
                                const faceWord = FACE_KEYWORDS.find(f => clause.includes(f));
                                const faceId = faceWord ? FACE_MAP[faceWord] : null;
                                const negated = /(^| )(sin|no)( |$)/.test(` ${clause} `);

                                const faceFindingWord = FACE_FINDING_WORDS.find(k => clause.includes(k));
                                if (faceFindingWord) {
                                    if (faceId) {
                                        if (negated) {
                                            newState.faces[faceId] = null;
                                            confirmations.push(`sin ${faceFindingWord} ${FACE_LABEL[faceId]}`);
                                        } else {
                                            newState.faces[faceId] = FACE_FINDING_MAP[faceFindingWord];
                                            newState.activeFace = faceId;
                                            statusArr = statusArr.filter(s => s !== 'missing');
                                            confirmations.push(`${faceFindingWord} ${FACE_LABEL[faceId]}`);
                                        }
                                    } else {
                                        notify(`⚠️ No pude ubicar "${clause}" — especifica la cara (vestibular/lingual/mesial/distal/oclusal)`);
                                    }
                                    return;
                                }

                                const toggleWord = TOGGLE_WORDS.find(k => clause.includes(k));
                                if (toggleWord) {
                                    const value = TOGGLE_MAP[toggleWord];
                                    statusArr = statusArr.filter(s => s !== 'missing');
                                    if (negated) {
                                        statusArr = statusArr.filter(s => s !== value);
                                        confirmations.push(`sin ${toggleWord}`);
                                    } else if (!statusArr.includes(value)) {
                                        statusArr.push(value);
                                        confirmations.push(toggleWord);
                                    }
                                    return;
                                }

                                if (clause.includes('extrac') && clause.includes('indicad')) {
                                    statusArr = statusArr.filter(s => s !== 'missing');
                                    if (negated) { statusArr = statusArr.filter(s => s !== 'extract'); confirmations.push('sin indicación de extracción'); }
                                    else if (!statusArr.includes('extract')) { statusArr.push('extract'); confirmations.push('extracción indicada'); }
                                    return;
                                }

                                if (clause.includes('ausente') || clause.includes('extraído') || clause.includes('extraido')) {
                                    if (negated) { statusArr = statusArr.filter(s => s !== 'missing'); confirmations.push('diente presente'); }
                                    else { statusArr = ['missing']; newState.faces = { v: null, l: null, m: null, d: null, o: null }; confirmations.push('ausente'); }
                                    return;
                                }

                                if (clause.includes('sano') || clause.includes('limpiar')) {
                                    if (faceId) { newState.faces[faceId] = null; newState.activeFace = faceId; confirmations.push(`${FACE_LABEL[faceId]} sano`); }
                                    else { newState.faces = { v: null, l: null, m: null, d: null, o: null }; statusArr = []; confirmations.push('diente sano'); }
                                    return;
                                }
                            });

                            newState.status = statusArr;
                            newState.notes = (newState.notes ? newState.notes.trim() + '\n' : '') + transcript.charAt(0).toUpperCase() + transcript.slice(1);

                            setToothModalData({ ...toothModalData, ...newState, id: currentToothId });
                            const updatedTeeth = { ...p.clinical.teeth, [currentToothId]: { ...newState, id: currentToothId } };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, teeth: updatedTeeth } });

                            if (text.includes('avanza') || text.includes('siguiente') || text.includes('listo') || text.includes('guardar')) {
                                activeToothRef.current = null;
                                if (setSelectedToothId) setSelectedToothId(null);
                                notify(`✔️ Pieza ${currentToothId} guardada.`);
                                confirmations.push('guardado');
                            }

                            if (voiceConfirmationEnabledRef.current && confirmations.length) {
                                speak(confirmations.join(', '));
                            }
                        }
                    }, 0);
                }
            };

            recognition.onerror = (e) => {
                console.error("Speech Error:", e.error);
                if (e.error === 'no-speech' && isListeningRef.current) {
                    // Silencio detectado, no hacer nada
                } else {
                    setIsListening(false);
                    setVoiceStatus('');
                }
            };

            recognition.onend = () => {
                if (suppressAutoRestartRef.current) return;
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

    return { isListening, voiceStatus, isPerioVoiceActive, voiceFeedback, toggleVoice, startPerioDictation, voiceConfirmationEnabled, toggleVoiceConfirmation };
}