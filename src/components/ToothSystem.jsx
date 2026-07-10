import React from 'react';

// --- MOTOR ANATÓMICO REALISTA (BASADO EN REFERENCIA) ---
export const getDetailedAnatomy = (number) => {
    const n = parseInt(number);
    const isUpper = n < 30 || (n >= 51 && n <= 65);
    const isLeft = (n >= 21 && n <= 28) || (n >= 31 && n <= 38) || (n >= 61 && n <= 65) || (n >= 71 && n <= 75);

    let crown = "";
    let root = "";

    if ([11, 12, 21, 22, 31, 32, 41, 42].includes(n)) {
        crown = isUpper ? "M 10,25 L 90,25 L 85,95 Q 50,105 15,95 Z" : "M 15,5 L 85,5 L 80,75 Q 50,85 20,75 Z";
        root = isUpper ? "M 15,25 Q 50,-20 85,25" : "M 20,75 Q 50,120 80,75";
    } else if ([13, 23, 33, 43].includes(n)) {
        crown = isUpper ? "M 10,25 L 90,25 L 80,85 L 50,105 L 20,85 Z" : "M 20,5 L 50,-10 L 80,5 L 75,75 Q 50,85 25,75 Z";
        root = isUpper ? "M 15,25 Q 50,-30 85,25" : "M 25,75 Q 50,125 75,75";
    } else if ([14, 15, 24, 25, 34, 35, 44, 45].includes(n)) {
        crown = isUpper ? "M 5,25 L 95,25 Q 95,95 50,100 Q 5,95 5,25" : "M 5,5 Q 50,0 95,5 L 90,75 Q 50,85 10,75 Z";
        root = isUpper ? "M 10,25 Q 30,-15 50,15 Q 70,-15 90,25" : "M 10,75 Q 50,120 90,75";
    } else {
        crown = isUpper ? "M 0,25 L 100,25 Q 100,95 50,100 Q 0,95 0,25" : "M 0,5 Q 50,0 100,5 L 95,75 Q 50,85 5,75 Z";
        if (isUpper) {
            root = "M 5,25 Q 15,-15 35,20 Q 50,-20 65,20 Q 85,-15 95,25";
        } else {
            root = "M 5,75 Q 30,120 50,85 Q 70,120 95,75";
        }
    }

    return { isUpper, isLeft, crown, root, n };
};

// --- COMPONENTE ODONTOGRAMA (UPGRADE ENTERPRISE + ANATOMÍA REALISTA) ---
export const ToothSVG = ({ number, faces, status, mode, treatment, size = 42, interactive = false, activeFace = 'o', onFaceClick }) => {
    const { isUpper, crown, root } = getDetailedAnatomy(number);
    const statusArr = Array.isArray(status) ? status : (status ? [status] : []);
    
    const isMissing = statusArr.includes('missing');
    const isCrown = statusArr.includes('crown');
    const isExtracting = statusArr.includes('extract'); 
    const isEndo = statusArr.includes('endo'); 
    const isImplant = statusArr.includes('implant'); 
    
    const getFaceColor = (faceId) => {
        if (isMissing) return 'transparent';
        if (isCrown && !interactive) return '#eab308'; 
        const f = faces?.[faceId];
        if (f === 'caries') return '#ef4444'; 
        if (f === 'filled') return '#60a5fa'; 
        if (f === 'sealant') return '#10b981';
        return 'transparent';
    };

    const num = parseInt(number, 10);
    const isRightQuadrant = (num >= 11 && num <= 18) || (num >= 41 && num <= 48);
    const leftFaceId = isRightQuadrant ? 'd' : 'm';
    const rightFaceId = isRightQuadrant ? 'm' : 'd';

    const Face = ({ id, points }) => (
        <polygon 
            points={points} 
            fill={getFaceColor(id)} 
            stroke="#312923" 
            strokeWidth="3" 
            className={`${interactive ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={(e) => { 
                if(interactive && onFaceClick) { 
                    e.stopPropagation(); 
                    onFaceClick(id); 
                } 
            }}
        />
    );

    return (
        <div className="relative flex flex-col items-center" style={{ width: size, height: size * 1.5 }}>
            <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible drop-shadow-sm">
                {/* Raíz (Si no falta) */}
                {!isMissing && !isImplant && (
                    <path d={root} fill="#F9FAFB" stroke="#DFD2C4" strokeWidth="2" />
                )}
                
                {/* Corona (Si no falta) */}
                {!isMissing && (
                    <path d={crown} fill={isCrown ? '#FEF9C3' : '#FFFFFF'} stroke="#312923" strokeWidth="3" />
                )}

                {/* Hallazgos sobre la corona (Mismo sistema original) */}
                {!isMissing && (
                    <g transform="translate(10, 35) scale(0.8)">
                        <Face id="v" points="0,0 100,0 75,25 25,25" />
                        <Face id="l" points="0,100 25,75 75,75 100,100" />
                        <Face id={leftFaceId} points="0,0 25,25 25,75 0,100" />
                        <Face id={rightFaceId} points="100,0 75,25 75,75 100,100" />
                        <Face id="o" points="25,25 75,25 75,75 25,75" />
                    </g>
                )}

                {/* Implante */}
                {isImplant && (
                    <rect x="25" y={isUpper ? "0" : "80"} width="50" height="40" rx="5" fill="#9CA3AF" />
                )}

                {/* Endodoncia */}
                {isEndo && !isMissing && (
                    <line x1="50" y1="20" x2="50" y2="100" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
                )}

                {/* Extracción indicada */}
                {isExtracting && !isMissing && (
                    <g stroke="#ef4444" strokeWidth="8">
                        <line x1="10" y1="10" x2="90" y2="110" />
                        <line x1="90" y1="10" x2="10" y2="110" />
                    </g>
                )}
            </svg>
            {interactive && <span className="text-[10px] font-bold mt-1">{number}</span>}
            {isMissing && <div className="absolute inset-0 flex items-center justify-center text-red-500 text-4xl font-black opacity-40">X</div>}
        </div>
    );
};

// --- COMPONENTE DIENTE PARA PERIODONTOGRAMA (CONTINUO) ---
export const Tooth = ({ number, status, onClick, isPerioMode, perioData, perioFace = 'v' }) => {
    const { isUpper, crown, root } = getDetailedAnatomy(number);
    const isMissing = Array.isArray(status) ? status.includes('missing') : status === 'missing';

    if (isMissing) return <div className="w-[45px] h-24 opacity-10 bg-gray-200" />;

    return (
        <div onClick={onClick} className="w-[45px] h-24 relative group cursor-pointer transition-transform hover:scale-105 z-10">
            <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible">
                <path d={root} fill="#F3F4F6" stroke="#DFD2C4" strokeWidth="1.5" />
                <path d={crown} fill="#FFFFFF" stroke="#312923" strokeWidth="2.5" />
                {perioData?.[`bop_${perioFace}`]?.some(v => v) && (
                    <circle cx="50" cy="50" r="8" fill="#ef4444" className="animate-pulse" />
                )}
            </svg>
        </div>
    );
};

export const HygieneCell = ({ tooth, data = {}, onChange }) => {
    return (
        <div className="flex flex-col items-center gap-1 p-1">
            <span className="text-[9px] font-black opacity-40">{tooth}</span>
            <div className="w-8 h-8 rounded-full border-2 border-[#DFD2C4] relative rotate-45 overflow-hidden bg-white">
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    <button onClick={() => onChange('v')} className={`border-[0.5px] border-[#DFD2C4] ${data.v ? 'bg-red-500' : 'bg-white'}`} />
                    <button onClick={() => onChange('m')} className={`border-[0.5px] border-[#DFD2C4] ${data.m ? 'bg-red-500' : 'bg-white'}`} />
                    <button onClick={() => onChange('d')} className={`border-[0.5px] border-[#DFD2C4] ${data.d ? 'bg-red-500' : 'bg-white'}`} />
                    <button onClick={() => onChange('l')} className={`border-[0.5px] border-[#DFD2C4] ${data.l ? 'bg-red-500' : 'bg-white'}`} />
                </div>
            </div>
        </div>
    );
};
