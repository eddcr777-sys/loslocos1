import { useState, useEffect } from 'react';

export const usePWAStatus = () => {
    const [isStandalone, setIsStandalone] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkStatus = () => {
            // Check if the app is running in standalone mode (PWA)
            const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

            // Check if the current device is mobile based on screen width
            const mobile = window.innerWidth <= 768;

            setIsStandalone(standalone);
            setIsMobile(mobile);
        };

        // Initial check
        checkStatus();

        // Listen for resize to handle orientation changes or desktop window resizing
        window.addEventListener('resize', checkStatus);

        // Listen for display mode changes (e.g. when app is launched as PWA)
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleChange = () => checkStatus();

        try {
            mediaQuery.addEventListener('change', handleChange);
        } catch (e) {
            // Fallback for older browsers
            (mediaQuery as any).addListener(handleChange);
        }

        return () => {
            window.removeEventListener('resize', checkStatus);
            try {
                mediaQuery.removeEventListener('change', handleChange);
            } catch (e) {
                (mediaQuery as any).removeListener(handleChange);
            }
        };
    }, []);

    return { isStandalone, isMobile };
};
