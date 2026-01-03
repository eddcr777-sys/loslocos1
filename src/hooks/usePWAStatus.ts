import { useState, useEffect } from 'react';

export const usePWAStatus = () => {
    const [isStandalone, setIsStandalone] = useState(() => {
        return document.documentElement.classList.contains('standalone') ||
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    });
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);

    useEffect(() => {
        const checkStatus = () => {
            // Check if the app is running in standalone mode (PWA)
            const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

            // Check if the current device is mobile based on screen width (consistent with MainLayout)
            const mobile = window.innerWidth <= 1024;

            setIsStandalone(standalone);
            setIsMobile(mobile);

            // Apply class to document element for global CSS targeting
            if (standalone) {
                document.documentElement.classList.add('standalone');
            } else {
                document.documentElement.classList.remove('standalone');
            }
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
