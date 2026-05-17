export function scoreBOP(bopPct) {
    const v = Math.max(0, Math.min(100, bopPct || 0));
    if (v <= 9) return 1;
    if (v <= 24) return 2;
    if (v < 100) return 3;
    return 4;
}

export function scorePPD(sitesWithPocket) {
    const v = Math.max(0, sitesWithPocket || 0);
    if (v === 0) return 1;
    if (v <= 4) return 2;
    if (v <= 8) return 3;
    return 4;
}

export function scoreDP(teethLost) {
    const v = Math.max(0, Math.min(32, teethLost || 0));
    if (v <= 4) return 1;
    if (v <= 8) return 2;
    if (v <= 12) return 3;
    return 4;
}

export function scoreBL(bonelossPercent, age) {
    const bl = Math.max(0, Math.min(100, bonelossPercent || 0));
    const ag = Math.max(1, age || 1);
    const ratio = bl / ag;
    if (ratio < 0.5) return 1;
    if (ratio < 1.0) return 2;
    if (ratio < 2.0) return 3;
    return 4;
}

export function calculateBopPct(bopPositiveSites, totalSites) {
    const pos = Math.max(0, bopPositiveSites || 0);
    const tot = Math.max(0, totalSites || 0);
    if (tot === 0) return 0;
    return Math.min(100, (pos / tot) * 100);
}

export function calculateBlRatio(bonelossPercent, age) {
    const bl = Math.max(0, Math.min(100, bonelossPercent || 0));
    const ag = Math.max(1, age || 1);
    return bl / ag;
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
