import React from 'react';

// --- MOTOR GRÁFICO DEL ODONTOGRAMA (UPGRADE ENTERPRISE) ---
export const ToothSVG = ({ number, faces, status, mode, treatment, size = 42, interactive = false, activeFace = 'o', onFaceClick }) => {
    const statusArr = Array.isArray(status) ? status : (status ? [status] : []);
    
    // Estados que afectan a todo el diente
    const isMissing = statusArr.includes('missing');
    const isCrown = statusArr.includes('crown');
    const isExtracting = statusArr.includes('extract'); 
    const isEndo = statusArr.includes('endo'); 
    const isImplant = statusArr.includes('implant'); 
    
    const getDiagnosticColor = (f) => {
        if (f === 'caries') return '#ef4444'; 
        if (f === 'filled') return '#60a5fa'; 
        if (f === 'sealant') return '#10b981'; // Verde para sellantes
        if (f === 'veneer') return '#fde047';  // Amarillo pastel para carillas
        return 'transparent';
    };

    const getTreatmentColor = () => {
        if (treatment?.status === 'planned') return '#CBAAA2'; 
        if (treatment?.status === 'completed') return '#5B6651'; 
        return 'transparent';
    };

    const getFaceColor = (faceId) => {
        if (isMissing) return 'transparent';
        if (isCrown && !interactive) return '#eab308'; 
        if (mode === 'tratamientos' && treatment && treatment.name) return getTreatmentColor();
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
            strokeWidth="4" 
            className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:fill-[#DFD2C4]/50' : ''} ${interactive && activeFace === id && !isMissing && !isCrown ? 'stroke-[#5B6651] stroke-[8px]' : ''}`}
            onClick={(e) => { 
                if(interactive && onFaceClick) { 
                    e.stopPropagation(); 
                    onFaceClick(id); 
                } 
            }}
            style={{ zIndex: interactive && activeFace === id ? 10 : 1 }}
        />
    );

    return (
        <div className="relative flex flex-col items-center" style={{ width: size, height: size + 20 }}>
            {/* TORNILLO DE IMPLANTE (Si aplica, se dibuja arriba o abajo dependiendo del cuadrante) */}
            {isImplant && (
                <svg viewBox="0 0 100 40" className={`absolute w-full h-8 ${num < 30 ? '-top-6' : '-bottom-6 rotate-180'} pointer-events-none drop-shadow-md z-0`}>
                    <path d="M 35,5 L 65,5 L 60,35 L 40,35 Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="2"/>
                    <line x1="37" y1="10" x2="63" y2="10" stroke="#4b5563" strokeWidth="2"/>
                    <line x1="38" y1="18" x2="62" y2="18" stroke="#4b5563" strokeWidth="2"/>
                    <line x1="39" y1="26" x2="61" y2="26" stroke="#4b5563" strokeWidth="2"/>
                </svg>
            )}

            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm overflow-visible z-10 relative">
                {/* Caras del Diente */}
                {!isMissing && (
                    <>
                        <Face id="v" points="0,0 100,0 75,25 25,25" />
                        <Face id="l" points="0,100 25,75 75,75 100,100" />
                        <Face id={leftFaceId} points="0,0 25,25 25,75 0,100" />
                        <Face id={rightFaceId} points="100,0 75,25 75,75 100,100" />
                        <Face id="o" points="25,25 75,25 75,75 25,75" />
                    </>
                )}

                {/* ENDODONCIA (Línea roja central) */}
                {isEndo && !isMissing && (
                    <line x1="50" y1="20" x2="50" y2="80" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" className="pointer-events-none drop-shadow-sm" />
                )}

                {/* CORONA */}
                {isCrown && interactive && !isMissing && (
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#eab308" strokeWidth="6" className="pointer-events-none" strokeDasharray="4 2" />
                )}
                
                {/* --- MOVIMIENTOS DENTARIOS --- */}
                {(statusArr.includes('extrusion') || statusArr.includes('extruded')) && (
                    <path d="M50,85 L50,15 M30,35 L50,15 L70,35" stroke="#06b6d4" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-md" />
                )}
                {(statusArr.includes('intrusion') || statusArr.includes('intruded')) && (
                    <path d="M50,15 L50,85 M30,65 L50,85 L70,65" stroke="#06b6d4" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-md" />
                )}
                {statusArr.includes('mesioversion') && (
                    <path d={isRightQuadrant ? "M80,80 Q50,110 20,80 M40,65 L20,80 L35,95" : "M20,80 Q50,110 80,80 M60,65 L80,80 L65,95"} stroke="#a855f7" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-md" />
                )}
                {statusArr.includes('distoversion') && (
                    <path d={isRightQuadrant ? "M20,80 Q50,110 80,80 M60,65 L80,80 L65,95" : "M80,80 Q50,110 20,80 M40,65 L20,80 L35,95"} stroke="#a855f7" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-md" />
                )}
                {statusArr.includes('diastema') && (
                    <g className="pointer-events-none drop-shadow-sm">
                        <line x1={isRightQuadrant ? "110" : "-10"} y1="20" x2={isRightQuadrant ? "110" : "-10"} y2="80" stroke="#9A8F84" strokeWidth="6" strokeLinecap="round" />
                        <line x1={isRightQuadrant ? "125" : "-25"} y1="20" x2={isRightQuadrant ? "125" : "-25"} y2="80" stroke="#9A8F84" strokeWidth="6" strokeLinecap="round" />
                    </g>
                )}

                {/* EXTRACCIÓN INDICADA (Cruz Roja) */}
                {isExtracting && !isMissing && (
                    <g className="pointer-events-none drop-shadow-md">
                        <line x1="20" y1="80" x2="80" y2="20" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                        <line x1="20" y1="20" x2="80" y2="80" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                    </g>
                )}
            </svg>
            
            {/* AUSENTE (Giant X) */}
            {isMissing && <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none text-[#9A8F84] font-black text-5xl opacity-80 z-20" style={{ height: size }}>X</div>}
            
            {interactive && <span className={`text-[11px] font-black mt-1 z-20 relative ${isMissing ? 'text-[#9A8F84] opacity-50' : 'text-[#312923]'}`}>{number}</span>}
        </div>
    );
};

// --- COMPONENTE DIENTE MODO DUAL (Periodontograma) ---
export const Tooth = ({ number, status, onClick, theme, isPerioMode, perioData, data, mode, perioFace = 'v' }) => {
    
    const hasBOP = perioData && perioData[`bop_${perioFace}`] && perioData[`bop_${perioFace}`].some(v => v === true);
    const hasPus = perioData && perioData[`pus_${perioFace}`] && perioData[`pus_${perioFace}`].some(v => v === true);
    const hasAlert = (perioData?.mobility > 0) || (perioData?.furcation > 0);

    if (isPerioMode) {
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
        
        const num = parseInt(number);
        const isLeftQuad = (num >= 21 && num <= 28) || (num >= 31 && num <= 38) || (num >= 61 && num <= 65) || (num >= 71 && num <= 75); 
        
        const mgArray = perioData?.[`mg_${perioFace}`] || ['','',''];
        const pdArray = perioData?.[`pd_${perioFace}`] || ['','',''];

        let mgL, mgC, mgR, pdL, pdC, pdR;

        if (isLeftQuad) {
            mgL = getY(mgArray[2]); mgC = getY(mgArray[1]); mgR = getY(mgArray[0]);
            pdL = getY((parseInt(mgArray[2]) || 0) + (parseInt(pdArray[2]) || 0));
            pdC = getY((parseInt(mgArray[1]) || 0) + (parseInt(pdArray[1]) || 0));
            pdR = getY((parseInt(mgArray[0]) || 0) + (parseInt(pdArray[0]) || 0));
        } else {
            mgL = getY(mgArray[0]); mgC = getY(mgArray[1]); mgR = getY(mgArray[2]);
            pdL = getY((parseInt(mgArray[0]) || 0) + (parseInt(pdArray[0]) || 0));
            pdC = getY((parseInt(mgArray[1]) || 0) + (parseInt(pdArray[1]) || 0));
            pdR = getY((parseInt(mgArray[2]) || 0) + (parseInt(pdArray[2]) || 0));
        }

        const hasData = pdArray.some(val => val !== '') || mgArray.some(val => val !== '');

        return (
            <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 transition-transform relative p-0.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 w-[44px]">
                
                {/* Gotitas de Sangre, Pus y Alertas */}
                <div className="absolute -top-1 flex gap-1 z-20">
                    {hasBOP && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"/>}
                    {hasPus && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_5px_yellow]"/>}
                    {hasAlert && <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white font-black shadow-md">!</div>}
                </div>
                
                <span className="text-[7px] font-black opacity-30 absolute top-0 left-0 bg-black/10 px-1 rounded">
                    {perioFace === 'v' ? 'V' : (number < 30 ? 'P' : 'L')}
                </span>

                <svg viewBox="0 0 100 80" className="w-full h-12 drop-shadow-sm mt-2 overflow-visible">
                    <path d="M 15,25 Q 50,-5 85,25 L 80,75 Q 50,90 20,75 Z" fill={'#e5e7eb'} fillOpacity={0.6} />
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
    
    // --- ODONTOGRAMA NORMAL ---
    return (
        <div onClick={onClick} className="relative group">
            <ToothSVG 
                number={number} 
                faces={data?.faces} 
                status={status || data?.status} 
                mode={mode} 
                treatment={data?.treatment} 
                size={40} 
                interactive={true} 
                onFaceClick={(face) => {
                    if (data?.onFaceClick) {
                        data.onFaceClick(face);
                    } else if (onClick) {
                        onClick();
                    }
                }}
            />
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
                    <button onClick={() => onChange('v')} className={`w-full h-full transition-all ${data.v ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} title="Vestibular" />
                    <button onClick={() => onChange('m')} className={`w-full h-full transition-all ${data.m ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} title="Mesial" />
                    <button onClick={() => onChange('d')} className={`w-full h-full transition-all ${data.d ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} title="Distal" />
                    <button onClick={() => onChange('l')} className={`w-full h-full transition-all ${data.l ? 'bg-[#ef4444]' : 'bg-white hover:bg-[#FDFBF7]'}`} title={isUpper ? "Palatino" : "Lingual"} />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#DFD2C4] rounded-full z-10"></div>
            </div>
        </div>
    );
};