import { useEffect, useState } from 'react';
import { getTips } from '../../design/loadingTips';
import './KrishiLoader.css';

export interface KrishiLoaderProps {
  /** Language code used to pick default tips (en, hi, gu). */
  lang?: string;
  /** Custom tips. Overrides the defaults for `lang`. */
  tips?: string[];
  /** Fixed status line under the animation, e.g. "Finding the best crops". */
  message?: string;
  /** Size of the logo mark in px. */
  size?: number;
  /** Cover the whole screen (use for the first app load). */
  fullScreen?: boolean;
  /** How long each tip stays visible. */
  tipIntervalMs?: number;
  className?: string;
}

export function KrishiLoader({
  lang = 'en',
  tips,
  message,
  size = 120,
  fullScreen = false,
  tipIntervalMs = 3200,
  className = '',
}: KrishiLoaderProps) {
  const list = tips && tips.length > 0 ? tips : getTips(lang);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * list.length));

  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), tipIntervalMs);
    return () => window.clearInterval(id);
  }, [list.length, tipIntervalMs]);

  const rootClass = ['kl-root', fullScreen ? 'kl-root--fullscreen' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true">
      <svg
        className="kl-mark"
        style={{ width: size, height: size }}
        viewBox="0 0 120 120"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            className="kl-hangers"
            d="M30 65V100M45 56.5V100M75 56.5V100M90 65V100"
            stroke="#0F4A32"
            strokeWidth="2.5"
            opacity=".5"
          />
          <path className="kl-arch" pathLength={1} d="M14 100A46 46 0 0 1 106 100" stroke="#0F4A32" strokeWidth="7" />
          <path className="kl-deck" pathLength={1} d="M8 100H112" stroke="#D9A93F" strokeWidth="7" />
          <path className="kl-stem" pathLength={1} d="M60 100V46" stroke="#3B8E4F" strokeWidth="5" />
        </g>
        <path className="kl-leaf kl-leaf--l" d="M60 46C44 46 33 36 31 20C48 20 58 29 60 46Z" fill="#4FA35B" />
        <path className="kl-leaf kl-leaf--r" d="M60 46C76 46 87 36 89 20C72 20 62 29 60 46Z" fill="#4FA35B" />
      </svg>

      {message ? <p className="kl-message">{message}</p> : null}
      <p className="kl-tip" key={index}>
        {list[index]}
      </p>
    </div>
  );
}

export default KrishiLoader;
