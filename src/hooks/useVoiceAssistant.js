import { useState, useRef } from 'react';

export function useVoiceAssistant({ notify, setToothModalData, setPerioData, goToAdjacentTooth }) {
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('');
    const [isPerioVoiceActive, setIsPerioVoiceActive] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState('');
    const recognitionRef = useRef(null);

    const toggleVoice = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Navegador no compatible. Por favor, usa Google Chrome.");
            return;
        }
        
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setVoiceStatus('');
        } else {
            const recognition = new window.webkitSpeechRecognition();
            recognition.lang = 'es-CL';
            recognition.continuous = true; 
            recognition.interimResults = false;
            
            recognition.onstart = () => { setIsListening(true); setVoiceStatus('Escuchando evolución...'); };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) { 
                    if (event.results[i].isFinal) transcript += event.results[i][0].transcript; 
                }

                if (transcript) {
                    const text = transcript.toLowerCase();
                    const facesMap = { 'vestibular': 'v', 'lingual': 'l', 'palatina': 'l', 'mesial': 'm', 'distal': 'd', 'oclusal': 'o', 'incisal': 'o' };
                    const foundFaceKey = Object.keys(facesMap).find(f => text.includes(f));
                    const faceId = foundFaceKey ? facesMap[foundFaceKey] : null;

                    if (text.includes('caries') || text.includes('lesión')) {
                        if (faceId) setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: 'caries' }, activeFace: faceId, status: null }));
                    } 
                    else if (text.includes('resina') || text.includes('empaste') || text.includes('obturación')) {
                        if (faceId) setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: 'filled' }, activeFace: faceId, status: null }));
                    } 
                    else if (text.includes('corona')) {
                        setToothModalData(prev => ({ ...prev, status: 'crown' }));
                    } 
                    else if (text.includes('ausente') || text.includes('extraído') || text.includes('extracción')) {
                        setToothModalData(prev => ({ ...prev, status: 'missing' }));
                    } 
                    else if (text.includes('sano') || text.includes('limpiar')) {
                        if (faceId) {
                            setToothModalData(prev => ({ ...prev, faces: { ...prev.faces, [faceId]: null }, activeFace: faceId }));
                        } else {
                            setToothModalData(prev => ({ ...prev, faces: {v:null,l:null,m:null,d:null,o:null}, status: null }));
                        }
                    }

                    setToothModalData(prev => ({
                        ...prev, 
                        notes: (prev.notes ? prev.notes.trim() + ' ' : '') + transcript.charAt(0).toUpperCase() + transcript.slice(1) 
                    }));
                }
            };

            recognition.onerror = () => { setIsListening(false); setVoiceStatus(''); };
            recognition.onend = () => { setIsListening(false); setVoiceStatus(''); };

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    const startPerioDictation = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { notify("Tu navegador no soporta dictado por voz."); return; }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsPerioVoiceActive(true);
            setVoiceFeedback('Escuchando (ej: "tres, dos, tres")...');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setVoiceFeedback(`Escuchaste: "${transcript}"`);
            
            const cleanText = transcript
                .replace(/uno/g, '1').replace(/dos/g, '2').replace(/tres/g, '3')
                .replace(/cuatro/g, '4').replace(/cinco/g, '5').replace(/seis/g, '6')
                .replace(/siete/g, '7').replace(/ocho/g, '8').replace(/nueve/g, '9').replace(/cero/g, '0')
                .replace(/menos /g, '-');

            setPerioData(prev => {
                let newData = { ...prev, pd: { ...(prev.pd || {}) }, mg: { ...(prev.mg || {}) }, bop: { ...(prev.bop || {}) } };
                let pdNumbers = []; let mgNumbers = [];

                if (cleanText.includes('margen')) {
                    const parts = cleanText.split('margen');
                    pdNumbers = parts[0].match(/-?\d/g) || [];
                    mgNumbers = parts[1].match(/-?\d/g) || [];
                } else {
                    pdNumbers = cleanText.match(/-?\d/g) || [];
                }
                
                const isPalatino = cleanText.includes('palatino') || cleanText.includes('lingual');

                if (pdNumbers.length >= 6) {
                    if (pdNumbers[0]) newData.pd.vd = pdNumbers[0]; if (pdNumbers[1]) newData.pd.v  = pdNumbers[1]; if (pdNumbers[2]) newData.pd.vm = pdNumbers[2];
                    if (pdNumbers[3]) newData.pd.ld = pdNumbers[3]; if (pdNumbers[4]) newData.pd.l  = pdNumbers[4]; if (pdNumbers[5]) newData.pd.lm = pdNumbers[5];
                } else if (pdNumbers.length > 0) {
                    if (isPalatino) {
                        if (pdNumbers[0]) newData.pd.ld = pdNumbers[0]; if (pdNumbers[1]) newData.pd.l  = pdNumbers[1]; if (pdNumbers[2]) newData.pd.lm = pdNumbers[2];
                    } else { 
                        if (pdNumbers[0]) newData.pd.vd = pdNumbers[0]; if (pdNumbers[1]) newData.pd.v  = pdNumbers[1]; if (pdNumbers[2]) newData.pd.vm = pdNumbers[2];
                    }
                }

                if (mgNumbers.length >= 6) {
                    if (mgNumbers[0]) newData.mg.vd = mgNumbers[0]; if (mgNumbers[1]) newData.mg.v  = mgNumbers[1]; if (mgNumbers[2]) newData.mg.vm = mgNumbers[2];
                    if (mgNumbers[3]) newData.mg.ld = mgNumbers[3]; if (mgNumbers[4]) newData.mg.l  = mgNumbers[4]; if (mgNumbers[5]) newData.mg.lm = mgNumbers[5];
                } else if (mgNumbers.length > 0) {
                    if (isPalatino) {
                        if (mgNumbers[0]) newData.mg.ld = mgNumbers[0]; if (mgNumbers[1]) newData.mg.l  = mgNumbers[1]; if (mgNumbers[2]) newData.mg.lm = mgNumbers[2];
                    } else {
                        if (mgNumbers[0]) newData.mg.vd = mgNumbers[0]; if (mgNumbers[1]) newData.mg.v  = mgNumbers[1]; if (mgNumbers[2]) newData.mg.vm = mgNumbers[2];
                    }
                }

                if (cleanText.includes('sangra') || cleanText.includes('sangrado')) {
                    if (isPalatino) newData.bop.l = true; else newData.bop.v = true; 
                }
                if (cleanText.includes('pus') || cleanText.includes('supura')) newData.pus = true;
                
                if (cleanText.includes('siguiente') || cleanText.includes('próximo') || cleanText.includes('avanza')) {
                    setTimeout(() => goToAdjacentTooth(1, newData), 100);
                } 
                else if (cleanText.includes('anterior') || cleanText.includes('atrás') || cleanText.includes('vuelve')) {
                    setTimeout(() => goToAdjacentTooth(-1, newData), 100);
                }
                return newData;
            });
        };

        recognition.onerror = () => { setVoiceFeedback('No se entendió. Intenta de nuevo.'); setIsPerioVoiceActive(false); };
        recognition.onend = () => { setIsPerioVoiceActive(false); setTimeout(() => setVoiceFeedback(''), 3000); };

        recognition.start();
    };

    return { isListening, voiceStatus, isPerioVoiceActive, voiceFeedback, toggleVoice, startPerioDictation };
}