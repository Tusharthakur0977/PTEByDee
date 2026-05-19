import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll immediately
    window.scrollTo(0, 0);

    // Override browser layout shifts on the next rendering frame
    const frameId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    // Delayed fallback for asynchronous API data loading and dynamic height changes
    const timerId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 60);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
    };
  }, [pathname, search]); // Re-run effect whenever pathname or query parameters change

  return null; // This component doesn't render anything visually
};

export default ScrollToTop;
