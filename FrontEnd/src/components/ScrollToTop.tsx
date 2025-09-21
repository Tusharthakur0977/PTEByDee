import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // Re-run effect whenever pathname changes

  return null; // This component doesn't render anything visually
};

export default ScrollToTop;
