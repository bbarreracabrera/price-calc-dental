import React from 'react';
import { Loader } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <Loader size={32} className="text-[#46523C] animate-spin" />
                <p className="text-sm text-[#5E554E] font-bold">Cargando...</p>
            </div>
        </div>
    );
}
