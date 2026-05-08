import React, { useEffect } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';

export default function WelcomeTour({ run, onComplete, setActiveTab, setMobileMenuOpen }) {

    useEffect(() => {
        if (run && setMobileMenuOpen && window.innerWidth < 768) {
            setMobileMenuOpen(true);
        }
    }, [run, setMobileMenuOpen]);

    const steps = [
        {
            target: 'body',
            placement: 'center',
            title: '¡Bienvenido/a a ShiningCloud Dental!',
            content: 'Te hago un tour rápido de los puntos clave de la app. Toma menos de 1 minuto.',
        },
        {
            target: '[data-tour="dashboard"]',
            title: 'Inicio',
            content: 'Aquí ves tu balance financiero, alertas de inventario, y próximas entregas de laboratorio.',
            placement: 'auto',
        },
        {
            target: '[data-tour="agenda"]',
            title: 'Agenda',
            content: 'Tus citas semanales. Puedes agendar, editar y cancelar desde aquí.',
            placement: 'auto',
        },
        {
            target: '[data-tour="patients"]',
            title: 'Pacientes',
            content: 'Tu fichero clínico completo: anamnesis, odontograma, evolución, consentimientos.',
            placement: 'auto',
        },
        {
            target: '[data-tour="catalog"]',
            title: 'Arancel',
            content: 'Tus tratamientos con precios. Puedes cargar el Arancel Referencial chileno con un click.',
            placement: 'auto',
        },
        {
            target: '[data-tour="settings"]',
            title: 'Ajustes',
            content: 'Configura tu clínica: horarios, MercadoPago, equipo, laboratorios.',
            placement: 'auto',
        },
        {
            target: 'body',
            placement: 'center',
            title: '¡Listo para empezar! ✨',
            content: 'Ya conoces lo principal. Ahora es tu turno. Si tienes dudas, puedes repetir el tour desde Ajustes.',
        },
    ];

    const handleCallback = (data) => {
        const { status, type, action, index } = data;

        if (type === EVENTS.STEP_AFTER && setActiveTab) {
            const tabsByStep = {
                1: 'dashboard',
                2: 'agenda',
                3: 'ficha',
                4: 'catalog',
                5: 'settings',
            };
            const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            if (tabsByStep[nextIndex] !== undefined) {
                setActiveTab(tabsByStep[nextIndex]);
            }
        }

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            if (onComplete) onComplete();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            showProgress
            hideCloseButton={false}
            disableOverlayClose
            callback={handleCallback}
            styles={{
                options: {
                    primaryColor: '#5B6651',
                    textColor: '#312923',
                    backgroundColor: '#FDFBF7',
                    arrowColor: '#FDFBF7',
                    overlayColor: 'rgba(49, 41, 35, 0.5)',
                    zIndex: 1000,
                },
                tooltip: { borderRadius: 16, padding: 20 },
                buttonNext: { backgroundColor: '#312923', borderRadius: 12, padding: '10px 20px' },
                buttonBack: { color: '#9A8F84' },
                buttonSkip: { color: '#9A8F84' },
            }}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                last: 'Finalizar',
                next: 'Siguiente',
                skip: 'Saltar',
            }}
        />
    );
}
