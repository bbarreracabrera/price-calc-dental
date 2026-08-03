import React from 'react';

// =====================================================================================
// MOTOR ANATÓMICO REALISTA v2
// Coronas con curvas suaves (no polígonos rectos) + raíces cónicas independientes
// (múltiples raíces divergentes en molares, raíz única afilada en el resto).
// Mantiene el mismo viewBox 100x120 y la misma firma de retorno { isUpper, isLeft,
// crown, root, n } para no romper nada que ya consuma estos datos — pero ahora
// también expone `roots` (array) para quien quiera dibujar raíces múltiples.
// =====================================================================================

// Genera un cono de raíz suave entre la cervical (baseY) y el ápice (apexY).
// bow > 0 curva la raíz hacia la derecha, bow < 0 hacia la izquierda (divergencia).
const buildRoot = (cx, baseY, apexY, halfWidth, bow = 0) => {
    const midY = baseY + (apexY - baseY) * 0.55;
    return `M ${cx - halfWidth},${baseY} ` +
        `C ${cx - halfWidth * 0.55 + bow},${baseY + (apexY - baseY) * 0.3} ${cx - halfWidth * 0.12 + bow},${midY} ${cx + bow * 0.6},${apexY} ` +
        `C ${cx + halfWidth * 0.12 + bow},${midY} ${cx + halfWidth * 0.55 + bow},${baseY + (apexY - baseY) * 0.3} ${cx + halfWidth},${baseY} Z`;
};

export const getDetailedAnatomy = (number) => {
    const n = parseInt(number, 10);
    const isDeciduous = n >= 51 && n <= 85;
    const isUpper = (n >= 11 && n <= 28) || (n >= 51 && n <= 65);
    const isLeft = (n >= 21 && n <= 28) || (n >= 31 && n <= 38) || (n >= 61 && n <= 65) || (n >= 71 && n <= 75);
    const lastDigit = n % 10;

    const isIncisor = lastDigit === 1 || lastDigit === 2;
    const isCanine = lastDigit === 3;
    const isMolar = lastDigit >= 6 || (isDeciduous && (lastDigit === 4 || lastDigit === 5));
    const isPremolar = !isMolar && (lastDigit === 4 || lastDigit === 5);

    let crown, roots;

    // Cervical line: y=25 for uppers (root grows upward into negative y),
    // y≈75 for lowers (root grows downward past y=100).
    const cervY = isUpper ? 25 : 75;
    const dir = isUpper ? -1 : 1; // sign for "away from crown" direction

    if (isIncisor) {
        crown = isUpper
            ? "M 14,25 C 11,52 11,78 19,90 Q 50,100 81,90 C 89,78 89,52 86,25 Q 50,17 14,25 Z"
            : "M 17,8 Q 50,1 83,8 C 89,26 89,50 81,68 Q 50,78 19,68 C 11,50 11,26 17,8 Z";
        roots = [buildRoot(50, cervY, cervY + dir * 60, 17)];
    } else if (isCanine) {
        crown = isUpper
            ? "M 12,25 C 9,50 11,74 19,84 L 50,99 L 81,84 C 89,74 91,50 88,25 Q 50,15 12,25 Z"
            : "M 15,10 L 50,-3 L 85,10 C 90,28 90,52 82,70 Q 50,80 18,70 C 10,52 10,28 15,10 Z";
        roots = [buildRoot(50, cervY, cervY + dir * 78, 16)];
    } else if (isPremolar) {
        crown = isUpper
            ? "M 8,25 C 5,53 7,80 18,90 Q 34,96 50,90 Q 66,96 82,90 C 93,80 95,53 92,25 Q 50,14 8,25 Z"
            : "M 10,9 Q 50,0 90,9 C 94,28 92,52 84,68 Q 66,76 50,70 Q 34,76 16,68 C 8,52 6,28 10,9 Z";
        roots = [buildRoot(50, cervY, cervY + dir * 50, 20)];
    } else if (isMolar) {
        crown = isUpper
            ? "M 4,25 C 1,54 3,84 16,94 Q 50,103 84,94 C 97,84 99,54 96,25 Q 78,15 50,18 Q 22,15 4,25 Z"
            : "M 6,9 Q 50,-1 94,9 C 98,26 98,52 89,70 Q 78,80 50,77 Q 22,80 11,70 C 2,52 2,26 6,9 Z";
        roots = isDeciduous || isUpper
            // molares superiores (y temporales): 3 raíces divergentes
            ? [
                buildRoot(28, cervY, cervY + dir * 42, 12, dir * -6),
                buildRoot(50, cervY, cervY + dir * 46, 11, 0),
                buildRoot(72, cervY, cervY + dir * 42, 12, dir * 6),
            ]
            // molares inferiores: 2 raíces divergentes (mesial / distal)
            : [
                buildRoot(34, cervY, cervY + dir * 48, 15, dir * -5),
                buildRoot(66, cervY, cervY + dir * 48, 15, dir * 5),
            ];
    } else {
        crown = isUpper
            ? "M 4,25 C 2,55 4,88 20,96 Q 50,102 80,96 C 96,88 98,55 96,25 Q 50,14 4,25 Z"
            : "M 6,9 Q 50,0 94,9 C 98,28 96,52 89,70 Q 50,80 11,70 C 4,52 2,28 6,9 Z";
        roots = [buildRoot(50, cervY, cervY + dir * 55, 18)];
    }

    return { isUpper, isLeft, isMolar, isPremolar, isCanine, isIncisor, crown, root: roots[0], roots, n };
};

// --- COMPONENTE ODONTOGRAMA: CASILLA RELLENABLE (SIN SILUETA ANATÓMICA) ---
// A propósito NO dibuja corona ni raíz: es un recuadro cuadrado dividido en las
// 5 zonas clínicas estándar (V / M / D / O / L) que se rellenan según hallazgo.
// Los estados de pieza completa (ausente, corona, endodoncia, implante,
// extracción, movimientos) se muestran como borde/insignia sobre el recuadro,
// nunca superpuestos a un dibujo de diente — así se evita el problema de
// solapamiento visual del odontograma. La anatomía con raíces (getDetailedAnatomy)
// queda reservada exclusivamente para el periodontograma (ver componente Tooth).
export const ToothSVG = ({ number, faces, status, size = 42, interactive = false, activeFace = 'o', onFaceClick, showNumber = true }) => {
    const statusArr = Array.isArray(status) ? status : (status ? [status] : []);

    const isMissing = statusArr.includes('missing');
    const isCrown = statusArr.includes('crown');
    const isExtracting = statusArr.includes('extract');
    const isEndo = statusArr.includes('endo');
    const isImplant = statusArr.includes('implant');
    const movementStatus = ['extrusion', 'intrusion', 'mesioversion', 'distoversion', 'diastema'].find(s => statusArr.includes(s));

    const num = parseInt(number, 10);
    // Cuadrantes derechos: permanentes 1 y 4, temporales 5 y 8 (notación FDI)
    const isRightQuadrant = (num >= 11 && num <= 18) || (num >= 41 && num <= 48) || (num >= 51 && num <= 55) || (num >= 81 && num <= 85);
    const leftFaceId = isRightQuadrant ? 'd' : 'm';
    const rightFaceId = isRightQuadrant ? 'm' : 'd';

    const getFaceColor = (faceId) => {
        const f = faces?.[faceId];
        if (f === 'caries') return '#ef4444';
        if (f === 'filled') return '#60a5fa';
        if (f === 'sealant') return '#10b981';
        if (f === 'veneer') return '#facc15';
        return faceId === activeFace && interactive ? '#F3F0E9' : '#FFFFFF';
    };

    const movementStyle = {
        extrusion: { color: '#06b6d4', label: '↑' },
        intrusion: { color: '#06b6d4', label: '↓' },
        mesioversion: { color: '#a855f7', label: '←' },
        distoversion: { color: '#a855f7', label: '→' },
        diastema: { color: '#9A8F84', label: '↔' },
    }[movementStatus] || {};

    const Zone = ({ id, points }) => (
        <polygon
            points={points}
            fill={getFaceColor(id)}
            stroke="#DFD2C4"
            strokeWidth="2.5"
            className={interactive ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}
            onClick={(e) => {
                if (interactive && onFaceClick) {
                    e.stopPropagation();
                    onFaceClick(id);
                }
            }}
        />
    );

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Marco del recuadro — dorado punteado si tiene corona */}
                <rect
                    x="2" y="2" width="96" height="96" rx="16"
                    fill={isMissing ? '#F3F1EC' : '#FDFBF7'}
                    stroke={isCrown ? '#eab308' : '#312923'}
                    strokeWidth={isCrown ? 3 : 2}
                    strokeDasharray={isCrown ? '6 4' : undefined}
                />

                {/* 5 zonas rellenables (V, M, D, O, L) */}
                {!isMissing && (
                    <g>
                        <Zone id="v" points="6,6 94,6 70,28 30,28" />
                        <Zone id="l" points="6,94 30,72 70,72 94,94" />
                        <Zone id={leftFaceId} points="6,6 30,28 30,72 6,94" />
                        <Zone id={rightFaceId} points="94,6 70,28 70,72 94,94" />
                        <Zone id="o" points="30,28 70,28 70,72 30,72" />
                    </g>
                )}

                {/* Ausente */}
                {isMissing && (
                    <g stroke="#9A8F84" strokeWidth="4" strokeLinecap="round">
                        <line x1="20" y1="20" x2="80" y2="80" />
                        <line x1="80" y1="20" x2="20" y2="80" />
                    </g>
                )}

                {/* Extracción indicada — tachado rojo sobre las zonas */}
                {isExtracting && !isMissing && (
                    <g stroke="#ef4444" strokeWidth="5" strokeLinecap="round" opacity="0.85">
                        <line x1="14" y1="14" x2="86" y2="86" />
                        <line x1="86" y1="14" x2="14" y2="86" />
                    </g>
                )}

                {/* Endodoncia — canal central */}
                {isEndo && !isMissing && (
                    <line x1="50" y1="14" x2="50" y2="86" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
                )}

                {/* Implante — tornillo simplificado */}
                {isImplant && !isMissing && (
                    <rect x="42" y="14" width="16" height="72" rx="4" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="3 3" />
                )}

                {/* Movimiento dental — insignia de esquina */}
                {movementStatus && !isMissing && (
                    <g>
                        <circle cx="86" cy="14" r="12" fill={movementStyle.color} stroke="#FFFFFF" strokeWidth="2" />
                        <text x="86" y="19" textAnchor="middle" fontSize="15" fontWeight="900" fill="#FFFFFF">{movementStyle.label}</text>
                    </g>
                )}
            </svg>
            {showNumber && <span className="text-[10px] font-bold mt-1 text-[#312923]">{number}</span>}
        </div>
    );
};

// =====================================================================================
// DIENTE PARA PERIODONTOGRAMA (modo continuo) — ahora con:
//  - Sangrado (BOP) en cada uno de los 3 puntos de sondaje
//  - Pus en cada uno de los 3 puntos de sondaje
//  - Badge de movilidad (grado I / II / III) bajo el diente
//  - Icono de furca (grado I / II / III) sobre la zona de bifurcación radicular
//
// Estructura de datos real (confirmada contra useVoiceAssistant.js):
//   bop_v / bop_l : [bool, bool, bool]   (Distal, Centro, Mesial)
//   pus_v / pus_l : [bool, bool, bool]
//   mobility: 0 | 1 | 2 | 3    (grado único por diente, Miller)
//   furcation: 0 | 1 | 2 | 3   (grado único por diente, no por cara)
// =====================================================================================
export const Tooth = ({ number, status, onClick, isPerioMode, perioData, perioFace = 'v' }) => {
    const { isUpper, crown, roots, isMolar } = getDetailedAnatomy(number);
    const isMissing = Array.isArray(status) ? status.includes('missing') : status === 'missing';

    if (isMissing) return <div className="w-[45px] h-24 opacity-10 bg-gray-200" />;

    const bop = perioData?.[`bop_${perioFace}`] || [false, false, false];       // <-- AJUSTAR NOMBRE DE CAMPO
    const pus = perioData?.[`pus_${perioFace}`] || [false, false, false];       // <-- AJUSTAR NOMBRE DE CAMPO
    const mobility = perioData?.mobility || 0;
    const furcationGrade = perioData?.furcation || 0; // grado único por diente, no por cara

    // Posiciones X de los 3 puntos de sondaje (Distal, Centro, Mesial) sobre la línea
    // gingival del diente individual, alineadas con la lógica de renderPerioRow del PerioTab.
    const pointX = [22, 50, 78];
    const gumY = isUpper ? 27 : 73;

    const mobilityColor = mobility === 1 ? '#f59e0b' : mobility === 2 ? '#f97316' : mobility === 3 ? '#dc2626' : null;
    const mobilityLabel = mobility > 0 ? 'I'.repeat(mobility) : null;

    return (
        <div onClick={onClick} className="w-[45px] h-24 relative group cursor-pointer transition-transform hover:scale-105 z-10">
            <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible drop-shadow-sm">
                {roots.map((r, i) => (
                    <path key={i} d={r} fill="#F7F4EF" stroke="#E4D9CB" strokeWidth="1.5" />
                ))}
                <path d={crown} fill="#FFFFFF" stroke="#3D332B" strokeWidth="2" />

                {/* Furca: sólo molares, icono en forma de "Y" sobre la zona de bifurcación */}
                {isMolar && furcationGrade > 0 && (
                    <g transform={`translate(50, ${isUpper ? 22 : 78})`}>
                        <path
                            d="M -7,-6 L 0,2 L 7,-6 M 0,2 L 0,10"
                            stroke={furcationGrade >= 3 ? '#dc2626' : furcationGrade === 2 ? '#f97316' : '#f59e0b'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </g>
                )}

                {/* Sangrado y pus en cada uno de los 3 puntos de sondaje */}
                {pointX.map((x, idx) => (
                    <g key={idx}>
                        {bop[idx] && (
                            <circle cx={x} cy={gumY} r="4.5" fill="#ef4444" stroke="#FFFFFF" strokeWidth="1" className="animate-pulse" />
                        )}
                        {pus[idx] && (
                            <circle
                                cx={x}
                                cy={gumY + (isUpper ? 9 : -9)}
                                r="3.5"
                                fill="#eab308"
                                stroke="#FFFFFF"
                                strokeWidth="1"
                            />
                        )}
                    </g>
                ))}
            </svg>

            {/* Badge de movilidad */}
            {mobilityLabel && (
                <div
                    className={`absolute left-1/2 -translate-x-1/2 ${isUpper ? '-bottom-4' : '-top-4'} px-1.5 py-[1px] rounded-full text-[8px] font-black text-white shadow-sm`}
                    style={{ backgroundColor: mobilityColor }}
                    title={`Movilidad grado ${mobility}`}
                >
                    {mobilityLabel}
                </div>
            )}
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
