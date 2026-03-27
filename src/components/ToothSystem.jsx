import React from 'react';

// --- MOTOR GRÁFICO DEL ODONTOGRAMA ---
export const ToothSVG = ({ number, faces, status, mode, treatment, size = 42, interactive = false, activeFace = 'o', onFaceClick }) => {
    const statusArr = Array.isArray(status) ? status : (status ? [status] : []);
    
    const isMissing = statusArr.includes('missing');
    const isCrown = statusArr.includes('crown');
    
    const getDiagnosticColor = (f) => {
        if (f === 'caries') return '#ef4444'; 
        if (f === 'filled') return '#3b82f6'; 
        if (f === 'sealant') return '#10b981';
        if (f === 'fracture') return '#f97316';
        return 'transparent';
    };

    const getTreatmentColor = () => {
        if (treatment?.status === 'planned') return '#ef4444'; 
        if (treatment?.status === 'completed') return '#10b981'; 
        return 'transparent';
    };

    const getFaceColor = (faceId) => {
        if (isMissing) return 'transparent';
        if (isCrown && !interactive) return '#eab308';
        if (mode === 'tratamientos' && treatment && treatment.name) return getTreatmentColor();
        return getDiagnosticColor(faces?.[faceId]);
    };

    const strokeColor = interactive ? '#888' : '#666'; 

    const num = parseInt(number, 10);
    const isRightQuadrant = (num >= 11 && num <= 18) || (num >= 41 && num <= 48);
    const leftFaceId = isRightQuadrant ? 'd' : 'm';
    const rightFaceId = isRightQuadrant ? 'm' : 'd';

    const Face = ({ id, points }) => (
        <polygon 
            points={points} 
            fill={getFaceColor(id)} 
            stroke={strokeColor} 
            strokeWidth="4" 
            className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:fill-black/20 dark:hover:fill-white/20' : ''} ${interactive && activeFace === id && !isMissing && !isCrown ? 'stroke-cyan-500 stroke-[8px]' : ''}`}
            onClick={(e) => { if(interactive && onFaceClick) { e.stopPropagation(); onFaceClick(id); } }}
            style={{ zIndex: interactive && activeFace === id ? 10 : 1 }}
        />
    );

    return (
        <div className="relative flex flex-col items-center" style={{ width: size, height: size + 20 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
                <Face id="v" points="0,0 100,0 75,25 25,25" />
                <Face id="l" points="0,100 25,75 75,75 100,100" />
                <Face id={leftFaceId} points="0,0 25,25 25,75 0,100" />
                <Face id={rightFaceId} points="100,0 75,25 75,75 100,100" />
                <Face id="o" points="25,25 75,25 75,75 25,75" />

                {statusArr.includes('crown') && interactive && (
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#eab308" strokeWidth="6" className="pointer-events-none" strokeDasharray="4 2" />
                )}
                {statusArr.includes('endo') && (
                    <circle cx="50" cy="50" r="16" fill="#a855f7" className="pointer-events-none shadow-xl" />
                )}
                {statusArr.includes('implant') && (
                    <g className="pointer-events-none">
                        <rect x="42" y="10" width="16" height="80" fill="#a1a1aa" rx="4" />
                        <line x1="35" y1="30" x2="65" y2="30" stroke="#52525b" strokeWidth="4" />
                        <line x1="35" y1="50" x2="65" y2="50" stroke="#52525b" strokeWidth="4" />
                        <line x1="35" y1="70" x2="65" y2="70" stroke="#52525b" strokeWidth="4" />
                    </g>
                )}
                {statusArr.includes('extruded') && (
                    <path d="M50,15 L50,85 M30,35 L50,15 L70,35" stroke="#06b6d4" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-lg" />
                )}
                {statusArr.includes('intruded') && (
                    <path d="M50,15 L50,85 M30,65 L50,85 L70,65" stroke="#06b6d4" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-lg" />
                )}
            </svg>
            
            {isMissing && <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none text-red-500 font-black text-5xl opacity-80" style={{ height: size }}>X</div>}
            <span className={`text-[11px] font-black mt-1 ${mode === 'tratamientos' && treatment?.name ? 'text-emerald-500' : 'opacity-60 text-stone-500 dark:text-white'}`}>{number}</span>
        </div>
    );
};

// --- COMPONENTE DIENTE MODO DUAL ---
export const Tooth = ({ number, status, onClick, theme, isPerioMode, perioData, data, mode, perioFace = 'v' }) => {
    const hasBOP = perioData && Object.values(perioData.bop || {}).some(v => v === true);
    const hasPus = perioData?.pus;
    const hasAlert = (perioData?.mobility > 0) || (perioData?.furcation > 0);

    if (isPerioMode) {
        // SOLUCIÓN AQUÍ: Verificamos tanto si es la nueva lista como si es la palabra antigua
        const checkMissing = (s) => Array.isArray(s) ? s.includes('missing') : s === 'missing';
        const isMissing = checkMissing(status) || checkMissing(data?.status);
        
        if (isMissing) {
            return (
                <div className="flex flex-col items-center gap-1 opacity-20 pointer-events-none grayscale relative p-1 w-[40px]">
                    <svg viewBox="0 0 100 80" className="w-full h-12 mt-1">
                        <path d="M 15,25 Q 50,-5 85,25 L 80,75 Q 50,90 20,75 Z" fill="#000" />
                    </svg>
                    <span className="text-[9px] font-bold absolute bottom-0 bg-black text-white px-1 rounded">AUS</span>
                </div>
            );
        }

        const getY = (val) => 30 + ((parseInt(val) || 0) * 5); 
        const isLeftQuad = number >= 20 && number < 40; 
        
        let kLeft, kRight, kCenter;
        if (perioFace === 'v') {
            kCenter = 'v'; kLeft = isLeftQuad ? 'vm' : 'vd'; kRight = isLeftQuad ? 'vd' : 'vm';
        } else {
            kCenter = 'l'; kLeft = isLeftQuad ? 'lm' : 'ld'; kRight = isLeftQuad ? 'ld' : 'lm';
        }

        const mgL = getY(perioData?.mg?.[kLeft]); const mgC = getY(perioData?.mg?.[kCenter]); const mgR = getY(perioData?.mg?.[kRight]);
        const pdL = getY((parseInt(perioData?.mg?.[kLeft]) || 0) + (parseInt(perioData?.pd?.[kLeft]) || 0));
        const pdC = getY((parseInt(perioData?.mg?.[kCenter]) || 0) + (parseInt(perioData?.pd?.[kCenter]) || 0));
        const pdR = getY((parseInt(perioData?.mg?.[kRight]) || 0) + (parseInt(perioData?.pd?.[kRight]) || 0));

        const hasData = perioData?.pd?.[kLeft] || perioData?.pd?.[kCenter] || perioData?.pd?.[kRight];

        return (
            <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative p-0.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 w-[44px]">
                {perioFace === 'v' && (
                    <div className="absolute -top-1 flex gap-1 z-20">
                        {hasBOP && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"/>}
                        {hasPus && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_5px_yellow]"/>}
                        {hasAlert && <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white font-black shadow-md">!</div>}
                    </div>
                )}
                
                <span className="text-[7px] font-black opacity-30 absolute top-0 left-0 bg-black/10 px-1 rounded">
                    {perioFace === 'v' ? 'V' : (number < 30 ? 'P' : 'L')}
                </span>

                <svg viewBox="0 0 100 80" className="w-full h-12 drop-shadow-sm mt-2 overflow-visible">
                    <path d="M 15,25 Q 50,-5 85,25 L 80,75 Q 50,90 20,75 Z" fill={theme === 'light' ? '#e5e7eb' : '#374151'} fillOpacity={0.6} />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="2" strokeDasharray="4" opacity="0.3" />
                    
                    {hasData && (
                        <>
                            <polygon points={`0,${mgL} 50,${mgC} 100,${mgR} 100,${pdR} 50,${pdC} 0,${pdL}`} fill="#ef4444" fillOpacity="0.4" />
                            <polyline points={`0,${mgL} 50,${mgC} 100,${mgR}`} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points={`0,${pdL} 50,${pdC} 100,${pdR}`} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                    )}
                </svg>
                <span className="text-[9px] font-bold opacity-50 mt-1">{number}</span>
            </div>
        );
    }
    
    return (
        <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
            <ToothSVG number={number} faces={data?.faces} status={status || data?.status} mode={mode} treatment={data?.treatment} size={40} />
        </div>
    );
};

// --- CÉLULA DE HIGIENE O'LEARY CIRCULAR ---
export const HygieneCell = ({ tooth, data = {}, onChange }) => {
    const isUpper = tooth < 30;
    
    return (
        <div className="flex flex-col items-center gap-1.5 p-1">
            <span className="text-[10px] font-black opacity-50">{tooth}</span>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white/10 relative transform rotate-45 shadow-inner bg-black/40 hover:border-cyan-500/50 transition-colors">
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-black">
                    <button onClick={() => onChange('v')} className={`w-full h-full transition-all hover:opacity-80 ${data.v ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`} title="Vestibular" />
                    <button onClick={() => onChange('m')} className={`w-full h-full transition-all hover:opacity-80 ${data.m ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`} title="Mesial" />
                    <button onClick={() => onChange('d')} className={`w-full h-full transition-all hover:opacity-80 ${data.d ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`} title="Distal" />
                    <button onClick={() => onChange('l')} className={`w-full h-full transition-all hover:opacity-80 ${data.l ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`} title={isUpper ? "Palatino" : "Lingual"} />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full z-10"></div>
            </div>
        </div>
    );
};