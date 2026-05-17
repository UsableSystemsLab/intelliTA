import { useCallback, useEffect, useRef, useState } from 'react';

export default function useActiveTime(enabled = true) {
    const [activeSeconds, setActiveSeconds] = useState(0);
    const visibleRef = useRef(
        typeof document === 'undefined' ? true : !document.hidden
    );
    const focusedRef = useRef(
        typeof document === 'undefined' ? true : document.hasFocus()
    );

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return undefined;

        const onVisibility = () => { visibleRef.current = !document.hidden; };
        const onFocus = () => { focusedRef.current = true; };
        const onBlur = () => { focusedRef.current = false; };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);

        const id = setInterval(() => {
            if (visibleRef.current && focusedRef.current) {
                setActiveSeconds((s) => s + 1);
            }
        }, 1000);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, [enabled]);

    const reset = useCallback(() => setActiveSeconds(0), []);

    return { activeSeconds, reset };
}
