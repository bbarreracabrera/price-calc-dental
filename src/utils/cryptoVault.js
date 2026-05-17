const VAULT_PREFIX = 'shining_vault_v2_';

async function getKey(userId, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(userId + '_shining_dental_salt_2026'),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(data, userId) {
    if (!userId) throw new Error('userId requerido para cifrar');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await getKey(userId, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const plaintext = enc.encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encrypted, userId) {
    try {
        const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);
        const key = await getKey(userId, salt);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        console.error('Error descifrando vault:', e);
        return null;
    }
}

export async function setVaultItem(key, data, userId) {
    const encrypted = await encryptData(data, userId);
    localStorage.setItem(VAULT_PREFIX + key, encrypted);
}

export async function getVaultItem(key, userId) {
    const encrypted = localStorage.getItem(VAULT_PREFIX + key);
    if (!encrypted) return null;
    return await decryptData(encrypted, userId);
}

export function removeVaultItem(key) {
    localStorage.removeItem(VAULT_PREFIX + key);
}

export function clearVault() {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(VAULT_PREFIX)) localStorage.removeItem(key);
    });
}
