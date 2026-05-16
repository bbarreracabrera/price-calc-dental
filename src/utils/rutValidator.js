export function validateRUT(rutInput) {
    if (!rutInput) return false;
    const clean = rutInput.toString().replace(/[.\-\s]/g, '').toLowerCase();
    if (clean.length < 2) return false;

    const num = clean.slice(0, -1);
    const dv = clean.slice(-1);

    if (!/^\d+$/.test(num)) return false;

    let sum = 0;
    let mult = 2;
    for (let i = num.length - 1; i >= 0; i--) {
        sum += parseInt(num[i]) * mult;
        mult = mult === 7 ? 2 : mult + 1;
    }

    const expected = 11 - (sum % 11);
    const dvCalc = expected === 11 ? '0' : expected === 10 ? 'k' : String(expected);

    return dv === dvCalc;
}

export function formatRUT(rutInput) {
    if (!rutInput) return '';
    const clean = rutInput.toString().replace(/[.\-\s]/g, '').toLowerCase();
    if (clean.length < 2) return clean;

    const num = clean.slice(0, -1);
    const dv = clean.slice(-1);

    const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${dv}`;
}
