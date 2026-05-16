export function scoreBOP(bopPct) {
    if (bopPct <= 9) return 1;
    if (bopPct <= 24) return 2;
    if (bopPct < 100) return 3;
    return 4;
}

export function scorePPD(sitesWithPocket) {
    if (sitesWithPocket === 0) return 1;
    if (sitesWithPocket <= 4) return 2;
    if (sitesWithPocket <= 8) return 3;
    return 4;
}

export function scoreDP(teethLost) {
    if (teethLost <= 4) return 1;
    if (teethLost <= 8) return 2;
    if (teethLost <= 12) return 3;
    return 4;
}

export function scoreBL(bonelossPercent, age) {
    const ratio = age > 0 ? bonelossPercent / age : 0;
    if (ratio < 0.5) return 1;
    if (ratio < 1.0) return 2;
    if (ratio < 2.0) return 3;
    return 4;
}

export function calculateBopPct(bopPositiveSites, totalSites) {
    return totalSites > 0 ? (bopPositiveSites / totalSites) * 100 : 0;
}

export function calculateBlRatio(bonelossPercent, age) {
    return age > 0 ? bonelossPercent / age : 0;
}

export function classifyRisk(scores) {
    let nHigh = 0;
    let nMod = 0;
    for (const s of scores) {
        if (s >= 3) nHigh++;
        else if (s === 2) nMod++;
    }
    if (nHigh >= 2) return 'high';
    if (nHigh === 0 && nMod <= 1) return 'low';
    return 'moderate';
}

export const RISK_LABELS = {
    low:      { label: 'Riesgo Bajo',     interval: 'Control cada 12 meses',  color: '#5B6651' },
    moderate: { label: 'Riesgo Moderado', interval: 'Control cada 6 meses',   color: '#D9A86C' },
    high:     { label: 'Riesgo Alto',     interval: 'Control cada 3-4 meses', color: '#B92323' },
};
