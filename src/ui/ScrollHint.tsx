import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/* A bottom fade + "scroll for more" cue so it's obvious there's content below.
   Fixed to the window bottom; fades out once you reach the end. Watches scroll,
   resize, and content changes (tab switches change the height). */
export function ScrollHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    const update = () => setShow(el.scrollHeight - el.clientHeight - el.scrollTop > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const t = window.setInterval(update, 400); // catch tab-driven height changes
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearInterval(t);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 46,
        pointerEvents: 'none',
        zIndex: 30,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 6,
        background: 'linear-gradient(to top, var(--bg-0) 20%, transparent)',
        opacity: show ? 1 : 0,
        transition: 'opacity 200ms var(--ease-out)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-label)',
          color: 'var(--accent)',
        }}
      >
        Scroll for more
        <ChevronDown size={12} />
      </span>
    </div>
  );
}
