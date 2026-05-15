const FRIENDLY_ERRORS = {
    'duplicate key': 'Ya existe un registro con esos datos',
    'foreign key': 'Falta información relacionada',
    'network': 'Sin conexión a internet. Intenta de nuevo',
    'permission denied': 'No tienes permisos para realizar esta acción',
    'jwt': 'Tu sesión expiró. Vuelve a iniciar sesión',
    'invalid input': 'Los datos ingresados no son válidos',
    'timeout': 'La operación tardó demasiado. Intenta de nuevo',
    'not found': 'El recurso solicitado no existe',
    'fetch': 'Sin conexión a internet. Intenta de nuevo',
};

export function friendlyError(err) {
    const msg = (err?.message || err?.toString() || '').toLowerCase();
    for (const [key, value] of Object.entries(FRIENDLY_ERRORS)) {
        if (msg.includes(key)) return value;
    }
    return 'Algo salió mal. Intenta de nuevo';
}
