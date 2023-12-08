import { useState, useEffect } from 'react';

function useWindowSize(): [number, number] {
    const [size, setSize] = useState<[number, number]>([0, 0]);

    useEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return size;
}

export default useWindowSize;
