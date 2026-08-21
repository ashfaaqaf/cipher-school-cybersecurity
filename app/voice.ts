'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson } from './curriculum';

/**
 * Narration through the browser's own speech engine. No API key, no network,
 * no audio files to ship — and it keeps working offline once the page is on
 * the Home Screen, which matters for an app people will use on a commute.
 */

export type Chunk = { label: string; text: string };

/** Split a lesson into the order you would actually read it aloud. */
export function lessonToChunks(lesson: Lesson): Chunk[] {
  return [
    { label: 'Title', text: lesson.title },
    { label: 'The whole idea', text: lesson.oneLine },
    { label: 'Think of it like', text: lesson.like },
    ...lesson.body.map((p, i) => ({ label: `Explanation ${i + 1}`, text: p })),
    {
      label: 'Jargon decoder',
      text: lesson.words.map((w) => `${w.term}. ${w.means}`).join(' '),
    },
    { label: 'Why this matters', text: lesson.why },
    { label: 'Go and do this', text: lesson.doThis },
    { label: 'Check yourself', text: lesson.check },
  ];
}

/**
 * Rank installed voices for a calm, measured, British-leaning narrator.
 * Which voices exist is entirely up to the device, so this is a preference
 * order rather than a guarantee.
 */
const PREFERRED = [
  'daniel', // iOS / macOS en-GB
  'arthur',
  'google uk english male',
  'microsoft ryan',
  'microsoft george',
  'oliver',
  'en-gb',
];

export function rankVoice(v: SpeechSynthesisVoice): number {
  const name = `${v.name} ${v.lang}`.toLowerCase();
  const hit = PREFERRED.findIndex((p) => name.includes(p));
  let score = hit === -1 ? 100 : hit;
  if (v.lang.toLowerCase().startsWith('en-gb')) score -= 20;
  else if (v.lang.toLowerCase().startsWith('en')) score -= 10;
  if (v.localService) score -= 2; // local voices do not need the network
  return score;
}

export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  return [...voices].sort((a, b) => rankVoice(a) - rankVoice(b))[0];
}

export type Speaker = ReturnType<typeof useSpeaker>;

export function useSpeaker() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);

  const chunksRef = useRef<Chunk[]>([]);
  const indexRef = useRef(0);
  const stoppedRef = useRef(true);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  /* Voices load asynchronously, and on some browsers only after an event. */
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);

    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length === 0) return;
      setVoices(list);
      setVoiceURI((current) => current ?? pickDefaultVoice(list)?.voiceURI ?? null);
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    voiceRef.current = voices.find((v) => v.voiceURI === voiceURI) ?? null;
  }, [voiceURI, voices]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cipher-school-voice');
      if (saved) {
        const parsed = JSON.parse(saved) as { voiceURI?: string; rate?: number };
        if (parsed.voiceURI) setVoiceURI(parsed.voiceURI);
        if (parsed.rate) setRate(parsed.rate);
      }
    } catch {
      /* narration preferences are cosmetic */
    }
  }, []);

  useEffect(() => {
    if (!voiceURI) return;
    try {
      window.localStorage.setItem('cipher-school-voice', JSON.stringify({ voiceURI, rate }));
    } catch {
      /* ignore */
    }
  }, [voiceURI, rate]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    chunksRef.current = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setIndex(0);
  }, []);

  /** Speak chunk n, then chain into the next one. */
  const run = useCallback(
    (n: number) => {
      const chunks = chunksRef.current;
      if (stoppedRef.current || n >= chunks.length) {
        if (n >= chunks.length) stop();
        return;
      }
      indexRef.current = n;
      setIndex(n);

      const u = new SpeechSynthesisUtterance(chunks[n].text);
      if (voiceRef.current) {
        u.voice = voiceRef.current;
        u.lang = voiceRef.current.lang;
      }
      u.rate = rateRef.current;
      u.pitch = 0.95; // slightly lower reads as measured rather than chirpy
      u.onend = () => {
        if (!stoppedRef.current && indexRef.current === n) run(n + 1);
      };
      u.onerror = () => {
        if (!stoppedRef.current && indexRef.current === n) run(n + 1);
      };
      window.speechSynthesis.speak(u);
    },
    [stop],
  );

  const play = useCallback(
    (chunks: Chunk[], from = 0) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      chunksRef.current = chunks;
      stoppedRef.current = false;
      setSpeaking(true);
      setPaused(false);
      run(from);
    },
    [run],
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  const jump = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(0, indexRef.current + delta), chunksRef.current.length - 1);
      window.speechSynthesis.cancel();
      run(next);
    },
    [run],
  );

  /** Speak one short thing without disturbing a running narration queue. */
  const say = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) {
      u.voice = voiceRef.current;
      u.lang = voiceRef.current.lang;
    }
    u.rate = rateRef.current;
    u.pitch = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  /*
   * Chromium silently stops synthesis after roughly fifteen seconds unless it
   * is nudged. Pausing and resuming on a timer is the long-standing workaround.
   */
  useEffect(() => {
    if (!speaking || paused) return;
    const t = window.setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);
    return () => window.clearInterval(t);
  }, [speaking, paused]);

  /* Never leave a voice talking to an empty room. */
  useEffect(() => stop, [stop]);

  return {
    supported,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    speaking,
    paused,
    index,
    total: chunksRef.current.length,
    chunks: chunksRef.current,
    play,
    pause,
    resume,
    stop,
    jump,
    say,
  };
}
