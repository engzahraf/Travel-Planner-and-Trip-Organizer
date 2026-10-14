import React, { useEffect, useRef, useState } from 'react';

/**
 * AnimatedPage — wraps a page and plays a fade+slide-up animation
 * whenever `pageKey` changes (i.e. when the user switches views).
 */
export default function AnimatedPage({ pageKey, children }) {
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(null);

  useEffect(() => {
    // Trigger re-animation whenever the pageKey changes
    setVisible(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    prevKey.current = pageKey;
    return () => cancelAnimationFrame(raf);
  }, [pageKey]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}
