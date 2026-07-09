import React from 'react';

// --- MOTOR ANATÓMICO DENTAL (FDI COMPLIANT) ---
// Define la morfología según el número de diente
const getToothAnatomy = (number) => {
    const n = parseInt(number);
    const isUpper = n < 30 || (n >= 51 && n <= 65);
    
    // Clasificación por tipo
    const isMolar = [18, 17, 16, 26, 27, 28, 38, 37, 36, 46, 47, 48, 55, 54, 64, 65, 74, 75, 84, 85].includes(n);
    const isPremolar = [15, 14, 24, 25, 34, 35, 44, 45].includes(n);
    const isAnterior = !isMolar && !isPremolar;

    // Definición de raíces (Path SVG)
    let rootsPath = "";
    if (isAnterior) {
        // Una raíz cónica
        rootsPath = isUpper ? "M 25,25 Q 50,-15 75,25" : "M 25,75 Q 50,115 75,75";
    } else if (isPremolar) {
        // Raíz bífida o cónica ancha
        rootsPath = isUpper ? "M 20,25 Q 35,-10 50,20 Q 65,-10 80,25" : "M 20,75 Q 50,110 80,75";
    } else if (isMolar) {
        // Múltiples raíces
        if (isUpper) {
            rootsPath = "M 15,25 Q 25,-15 45,20 Q 55,-15 65,20 Q 75,-15 85,25";
        } else {
            rootsPath = "M 15,75 Q 35,115 50,85 Q 65,115 85,75";
        }
    }

    return { isMolar, isPremolar, isAnterior, isUpper, rootsPath };
};

export const ToothSVG = ({ number, faces, status, mode, treatment, size = 42, interactive = false, activeFace = 'o', onFaceClick }) => {
    const statusArr = Array.isArray(status) ? status : (status ? [status] : []);
    const { isUpper, rootsPath } = getToothAnatomy(number);
    
    const isMissing = statusArr.includes('missing');
    const isCrown = statusArr.includes('crown');
    const isExtracting = statusArr.includes('extract'); 
    const isEndo = statusArr.includes('endo'); 
    const isImplant = statusArr.includes('implant'); 
    
    const getDiagnosticColor = (f) => {
        if (f === 'caries') return '#ef4444'; 
        if (f === 'filled') return '#60a5fa'; 
        if (f === 'sealant') return '#10b981'; 
        if (f === 'veneer') return '#fde047';  
        return 'transparent';
    };

    const getFaceColor = (faceId) => {
        if (isMissing) return 'transparent';
        if (isCrown && !interactive) return '#eab308'; 
        if (mode === 'tratamientos' && treatment && treatment.name) {
            if (treatment?.status === 'planned') return '#CBAAA2'; 
            if (treatment?.status === 'completed') return '#5B6651'; 
        }
        return getDiagnosticColor(faces?.[faceId]);
    };

    const strokeColor = interactive ? '#DFD2C4' : '#9A8F84'; 
    const num = parseInt(number, 10);
    const isRightQuadrant = (num >= 11 && num <= 18) || (num >= 41 && num <= 48);
    const leftFaceId = isRightQuadrant ? 'd' : 'm';
    const rightFaceId = isRightQuadrant ? 'm' : 'd';

    const Face = ({ id, points }) => (
        <polygon 
            points={points} 
            fill={getFaceColor(id)} 
            stroke={strokeColor} 
            strokeWidth="3" 
            className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:fill-[#DFD2C4]/50' : ''} ${interactive && activeFace === id && !isMissing && !isCrown ? 'stroke-[#5B6651] stroke-[6px]' : ''}`}
            onClick={(e) => { if(interactive && onFaceClick) { e.stopPropagation(); onFaceClick(id); } }}
        />
    );

    return (
        <div className="relative flex flex-col items-center" style={{ width: size, height: size + 20 }}>
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm overflow-visible z-10 relative">
                {/* Dibujo de Raíces */}
                {!isMissing && !isImplant && (
                    <path d={rootsPath} fill="#F3F4F6" stroke={strokeColor} strokeWidth="2" opacity="0.8" />
                )}

                {/* Cuerpo del Diente (Corona) */}
                {!isMissing && (
                    <g transform="translate(0, 25)">
                        <Face id="v" points="5,5 95,5 75,25 25,25" />
                        <Face id="l" points="5,95 25,75 75,75 95,95" />
                        <Face id={leftFaceId} points="5,5 25,25 25,75 5,95" />
                        <Face id={rightFaceId} points="95,5 75,25 75,75 95,95" />
                        <Face id="o" points="25,25 75,25 75,75 25,75" />
                    </g>
                )}

                {/* Implante */}
                {isImplant && (
                    <g transform={isUpper ? "translate(25, 0)" : "translate(25, 80)"}>
                        <path d="M 10,0 L 40,0 L 35,40 L 15,40 Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="2"/>
                        {[8, 16, 24, 32].map(y => <line key={y} x1="12" y1={y} x2="38" y2={y} stroke="#4b5563" strokeWidth="1" />)}
                    </g>
                )}

                {/* Endodoncia */}
                {isEndo && !isMissing && (
                    <line x1="50" y1={isUpper ? "5" : "45"} x2="50" y2={isUpper ? "75" : "115"} stroke="#dc2626" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                )}

                {/* Corona Protésica */}
                {isCrown && !isMissing && (
                    <rect x="5" y="30" width="90" height="70" rx="15" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="4 2" />
                )}

                {/* Extracción */}
                {isExtracting && !isMissing && (
                    <g stroke="#ef4444" strokeWidth="8" strokeLinecap="round">
                        <line x1="10" y1="35" x2="90" y2="115" />
                        <line x1="90" y1="35" x2="100" y2="115" />
                    </g>
                )}
            </svg>
            
            {isMissing && <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none text-[#9A8F84] font-black text-5xl opacity-40 z-20" style={{ height: size }}>X</div>}
            {interactive && <span className={`text-[11px] font-black mt-1 z-20 relative ${isMissing ? 'text-[#9A8F84] opacity-50' : 'text-[#312923]'}`}>{number}</span>}
        </div>
    );
};

// --- COMPONENTE DIENTE MODO DUAL (Periodontograma con Raíces) ---
export const Tooth = ({ number, status, onClick, theme, isPerioMode, perioData, data, mode, perioFace = 'v' }) => {
    const { isUpper, rootsPath } = getToothAnatomy(number);
    const hasBOP = perioData && perioData[`bop_${perioFace}`]?.some(v => v === true);
    const hasPus = perioData && perioData[`pus_${perioFace}`]?.some(v => v === true);
    const hasAlert = (perioData?.mobility > 0) || (perioData?.furcation > 0);

    if (isPerioMode) {
        const isMissing = (Array.isArray(status) ? status.includes('missing') : status === 'missing') || (Array.isArray(data?.status) ? data?.status.includes('missing') : data?.status === 'missing');
        
        if (isMissing) {
            return (
                <div className="flex flex-col items-center gap-1 opacity-20 grayscale p-1 w-[44px]">
                    <div className="h-16 flex items-center justify-center text-xs font-black">AUS</div>
                    <span className="text-[9px] font-bold opacity-50">{number}</span>
                </div>
            );
        }

        const getY = (val) => 35 + ((parseFloat(val) || 0) * 5.5); 
        const num = parseInt(number);
        const isLeftQuad = (num >= 21 && num <= 28) || (num >= 31 && num <= 38) || (num >= 61 && num <= 65) || (num >= 71 && num <= 75); 
        
        const mgArray = perioData?.[`mg_${perioFace}`] || ['','',''];
        const pdArray = perioData?.[`pd_${perioFace}`] || ['','',''];

        let mgL, mgC, mgR, pdL, pdC, pdR;
        if (isLeftQuad) {
            mgL = getY(mgArray[2]); mgC = getY(mgArray[1]); mgR = getY(mgArray[0]);
            pdL = getY((parseFloat(mgArray[2]) || 0) + (parseFloat(pdArray[2]) || 0));
            pdC = getY((parseFloat(mgArray[1]) || 0) + (parseFloat(pdArray[1]) || 0));
            pdR = getY((parseFloat(mgArray[0]) || 0) + (parseFloat(pdArray[0]) || 0));
        } else {
            mgL = getY(mgArray[0]); mgC = getY(mgArray[1]); mgR = getY(mgArray[2]);
            pdL = getY((parseFloat(mgArray[0]) || 0) + (parseFloat(pdArray[0]) || 0));
            pdC = getY((parseFloat(mgArray[1]) || 0) + (parseFloat(pdArray[1]) || 0));
            pdR = getY((parseFloat(mgArray[2]) || 0) + (parseFloat(pdArray[2]) || 0));
        }

        const hasData = pdArray.some(val => val !== '') || mgArray.some(val => val !== '');
        const mgPath = `M 5,${mgL} Q 50,${mgC - 2} 95,${mgR}`;
        const pdPath = `M 5,${pdL} Q 50,${pdC - 2} 95,${pdR}`;
        const fillPath = `M 5,${mgL} Q 50,${mgC - 2} 95,${mgR} L 95,${pdR} Q 50,${pdC - 2} 5,${pdL} Z`;

        return (
            <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-105 transition-transform relative w-[48px] p-1">
                {/* Indicadores */}
                <div className="absolute -top-1 flex gap-0.5 z-20">
                    {hasBOP && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm"/>}
                    {hasPus && <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm"/>}
                    {hasAlert && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex items-center justify-center text-[6px] text-white font-black">!</div>}
                </div>

                <svg viewBox="0 0 100 120" className="w-full h-20 overflow-visible drop-shadow-sm">
                    {/* Dibujo de Raíces Anatómicas */}
                    <path d={rootsPath} fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" opacity="0.6" />
                    
                    {/* Corona Esquemática */}
                    <rect x="5" y={isUpper ? "25" : "55"} width="90" height="40" rx="8" fill="#F3F4F6" stroke="#DFD2C4" strokeWidth="1" />
                    
                    {/* Líneas de Milimetraje */}
                    {[35, 46, 57, 68, 79, 90].map(y => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#DFD2C4" strokeWidth="0.5" strokeDasharray="2" />
                    ))}
                    
                    {hasData && (
                        <g transform={isUpper ? "translate(0,0)" : "translate(0,0)"}>
                            <path d={fillPath} fill="#ef4444" fillOpacity="0.2" />
                            <path d={mgPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                            <path d={pdPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                        </g>
                    )}
                </svg>
                <span className="text-[9px] font-black opacity-40 mt-1">{number}</span>
            </div>
        );
    }
    
    return (
        <div onClick={onClick} className="relative group">
            <ToothSVG number={number} faces={data?.faces} status={status || data?.status} mode={mode} treatment={data?.treatment} size={40} interactive={true} onFaceClick={(f) => data?.onFaceClick ? data.onFaceClick(f) : onClick?.()} />
        </div>
    );
};

export const HygieneCell = ({ tooth, data = {}, onChange }) => {
    const isUpper = tooth < 30;
    return (
        <div className="flex flex-col items-center gap-1.5 p-1">
            <span className="text-[10px] font-black opacity-50">{tooth}</span>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[#DFD2C4] relative transform rotate-45 shadow-inner bg-[#FDFBF7] hover:border-[#5B6651] transition-colors">
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-[#DFD2C4]">
                    <button onClick={() => onChange('v')} className={`w-full h-full transition-all ${data.v ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} />
                    <button onClick={() => onChange('m')} className={`w-full h-full transition-all ${data.m ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} />
                    <button onClick={() => onChange('d')} className={`w-full h-full transition-all ${data.d ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} />
                    <button onClick={() => onChange('l')} className={`w-full h-full transition-all ${data.l ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#DFD2C4] rounded-full z-10"></div>
            </div>
        </div>
    );
};
