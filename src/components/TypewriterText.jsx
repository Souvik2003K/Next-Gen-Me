'use client';

import { useState, useEffect, useRef } from 'react';
import { Linkify } from '@/utils/Linkify';

/**
 * TypewriterText
 * - Animates text character by character
 * - Once done, switches to linkified rendering (URLs become <a> tags)
 */
export default function TypewriterText({
  text = '',
  speed = 12,
  color,
  onDone,
  isWelcome = false,
}) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone]       = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    setIsDone(false);
    indexRef.current = 0;

    const tick = () => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
        timerRef.current = setTimeout(tick, speed);
      } else {
        setIsDone(true);
        onDone?.();
      }
    };

    timerRef.current = setTimeout(tick, speed);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const sharedStyle = {
    color: color || 'inherit',
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontSize: isWelcome ? '1.15rem' : 'inherit',
    fontWeight: isWelcome ? 700 : 'inherit',
  };

  /* ── After animation: render with clickable links ── */
  if (isDone) {
    return (
      <pre style={sharedStyle}>
        {Linkify(text, color)}
      </pre>
    );
  }

  /* ── During animation: plain text + blinking cursor ── */
  return (
    <pre style={sharedStyle}>
      {displayed}
      <span className="cursor-blink">▌</span>
    </pre>
  );
}