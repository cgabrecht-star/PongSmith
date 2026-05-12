"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useTypewriter, char-by-char Text-Reveal-Hook.
 *
 * @param text   Zieltext
 * @param speed  Millisekunden pro Zeichen (default 28)
 * @param start  Wann das Typing beginnen soll (default true)
 *
 * @returns { output: aktueller Stand, done: true wenn fertig }
 */
export function useTypewriter(text: string, speed = 28, start = true) {
  const [output, setOutput] = useState("");
  const [done, setDone] = useState(false);
  const sequenceRef = useRef(0); // Race-condition-Schutz

  useEffect(() => {
    setOutput("");
    setDone(false);
    if (!start || !text) return;

    sequenceRef.current += 1;
    const seq = sequenceRef.current;
    let i = 0;
    const id = window.setInterval(() => {
      if (sequenceRef.current !== seq) {
        window.clearInterval(id);
        return;
      }
      i++;
      setOutput(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => {
      window.clearInterval(id);
    };
  }, [text, speed, start]);

  return { output, done };
}
