'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson } from './curriculum';

/**
 * Narration has two engines and prefers the better one it can actually use.
 *
 * "studio" plays pre-generated ElevenLabs audio shipped as static files, with
 * section marks from the API's character timings so highlighting and skipping
 * work exactly as they do live. No API key ever reaches the browser, because
 * the audio was generated ahead of time by scripts/narrate.mjs.
 *
 * "device" falls back to the speech voices already installed on the machine.
 * It is free, offline, and covers every lesson whether or not audio was
 * generated for it.
 */

export type Chunk = { label: string; text: string };
export type Engine = 'studio' | 'device' | 'none';

type Mark = { label: string; t: number };
type Manifest = {
  voiceId: string | null;
  model: string | null;
  lessons: Record<string, { file: string; dur: number; marks: Mark[] }>;
};

/** Must stay identical to lessonToChunks in scripts/voice-lib.mjs, or the marks drift. */
export function lessonToChunks(lesson: Lesson): Chunk[] {
  return [
    { label: 'Title', text: lesson.title },
    { label: 'The whole idea', text: lesson.oneLine },
    { label: 'Think of it like', text: lesson.like },
    ...lesson.body.map((p, i) => ({ label: `Explanation ${i + 1}`, text: p })),
    { label: 'Jargon decoder', text: lesson.words.map((w) => `${w.term}. ${w.means}`).join(' ') },
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
const PREFERRED = ['daniel', 'arthur', 'google uk english male', 'microsoft ryan', 'microsoft george', 'oliver', 'en-gb'];

export function rankVoice(v: SpeechSynthesisVoice): number {
  const name = `${v.name} ${v.lang}`.toLowerCase();
  const hit = PREFERRED.findIndex((p) => name.includes(p));
  let score = hit === -1 ? 100 : hit;
  if (v.lang.toLowerCase().startsWith('en-gb')) score -= 20;
  else if (v.lang.toLowerCase().startsWith('en')) score -= 10;
  if (v.localService) score -= 2;
  return score;
}

export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  return [...voices].sort((a, b) => rankVoice(a) - rankVoice(b))[0];
}

/** Which section a given playback position falls in. */
export function markIndexAt(marks: Mark[], t: number): number {
  let i = 0;
  while (i + 1 < marks.length && marks[i + 1].t <= t) i += 1;
  return i;
}

export type Speaker = ReturnType<typeof useSpeaker>;

export function useSpeaker() {
  const [supported, setSupported] = useState(false);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [engine, setEngine] = useState<Engine>('none');
  const [preferStudio, setPreferStudio] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [chunks, setChunks] = useState<Chunk[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const marksRef = useRef<Mark[]>([]);
  const chunksRef = useRef<Chunk[]>([]);
  const indexRef = useRef(0);
  const stoppedRef = useRef(true);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const modeRef = useRef<Engine>('none');

  useEffect(() => {
    rateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  /* Is there a pre-generated library alongside this page? */
  useEffect(() => {
    let cancelled = false;
    fetch('audio/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Manifest | null) => {
        if (!cancelled && m?.lessons && Object.keys(m.lessons).length > 0) setManifest(m);
      })
      .catch(() => {
        /* no studio library published — the device voice covers everything */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (manifest) setSupported(true);
  }, [manifest]);

  useEffect(() => {
    voiceRef.current = voices.find((v) => v.voiceURI === voiceURI) ?? null;
  }, [voiceURI, voices]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cipher-school-voice');
      if (saved) {
        const parsed = JSON.parse(saved) as { voiceURI?: string; rate?: number; studio?: boolean };
        if (parsed.voiceURI) setVoiceURI(parsed.voiceURI);
        if (parsed.rate) setRate(parsed.rate);
        if (typeof parsed.studio === 'boolean') setPreferStudio(parsed.studio);
      }
    } catch {
      /* narration preferences are cosmetic */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('cipher-school-voice', JSON.stringify({ voiceURI, rate, studio: preferStudio }));
    } catch {
      /* ignore */
    }
  }, [voiceURI, rate, preferStudio]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    modeRef.current = 'none';
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setIndex(0);
    setEngine('none');
  }, []);

  /* ---------- device engine: chain one utterance per section ---------- */

  const runDevice = useCallback(
    (n: number) => {
      const list = chunksRef.current;
      if (stoppedRef.current || n >= list.length) {
        if (n >= list.length) stop();
        return;
      }
      indexRef.current = n;
      setIndex(n);

      const u = new SpeechSynthesisUtterance(list[n].text);
      if (voiceRef.current) {
        u.voice = voiceRef.current;
        u.lang = voiceRef.current.lang;
      }
      u.rate = rateRef.current;
      u.pitch = 0.95; // slightly lower reads as measured rather than chirpy
      const advance = () => {
        if (!stoppedRef.current && indexRef.current === n) runDevice(n + 1);
      };
      u.onend = advance;
      u.onerror = advance;
      window.speechSynthesis.speak(u);
    },
    [stop],
  );

  /* ---------- studio engine: one file, marks drive the highlight ---------- */

  const startStudio = useCallback(
    (lessonId: string, from: number) => {
      const entry = manifest?.lessons[lessonId];
      if (!entry) return false;

      const audio = new Audio(`audio/${entry.file}`);
      audio.preload = 'auto';
      audio.playbackRate = rateRef.current;
      audioRef.current = audio;
      marksRef.current = entry.marks;

      audio.addEventListener('timeupdate', () => {
        const n = markIndexAt(marksRef.current, audio.currentTime);
        if (n !== indexRef.current) {
          indexRef.current = n;
          setIndex(n);
        }
      });
      audio.addEventListener('ended', stop);
      /* A missing or corrupt file should degrade to the device voice, not silence. */
      audio.addEventListener('error', () => {
        if (stoppedRef.current) return;
        modeRef.current = 'device';
        setEngine('device');
        audioRef.current = null;
        runDevice(indexRef.current);
      });

      const seek = entry.marks[from]?.t ?? 0;
      if (seek > 0) audio.currentTime = seek;
      indexRef.current = from;
      setIndex(from);
      void audio.play().catch(() => {
        /* autoplay refusal only happens without a gesture; our play is on a tap */
      });
      return true;
    },
    [manifest, runDevice, stop],
  );

  const play = useCallback(
    (lesson: Lesson, from = 0) => {
      const list = lessonToChunks(lesson);
      chunksRef.current = list;
      setChunks(list);
      stoppedRef.current = false;
      setSpeaking(true);
      setPaused(false);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();

      if (preferStudio && manifest?.lessons[lesson.id] && startStudio(lesson.id, from)) {
        modeRef.current = 'studio';
        setEngine('studio');
        return;
      }
      modeRef.current = 'device';
      setEngine('device');
      runDevice(from);
    },
    [manifest, preferStudio, runDevice, startStudio],
  );

  const pause = useCallback(() => {
    if (modeRef.current === 'studio') audioRef.current?.pause();
    else window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (modeRef.current === 'studio') void audioRef.current?.play().catch(() => {});
    else window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  const jump = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(0, indexRef.current + delta), chunksRef.current.length - 1);
      if (modeRef.current === 'studio' && audioRef.current) {
        audioRef.current.currentTime = marksRef.current[next]?.t ?? 0;
        indexRef.current = next;
        setIndex(next);
        return;
      }
      window.speechSynthesis.cancel();
      runDevice(next);
    },
    [runDevice],
  );

  /** Speak one short thing. Always the device voice — studio audio is pre-rendered. */
  const say = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
   * Only the device engine needs it; an audio element plays to the end.
   */
  useEffect(() => {
    if (engine !== 'device' || !speaking || paused) return;
    const t = window.setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);
    return () => window.clearInterval(t);
  }, [engine, speaking, paused]);

  /* Never leave a voice talking to an empty room. */
  useEffect(() => stop, [stop]);

  return {
    supported,
    engine,
    /** True when a pre-generated library was published alongside the app. */
    hasStudio: Boolean(manifest && Object.keys(manifest.lessons).length),
    studioCount: manifest ? Object.keys(manifest.lessons).length : 0,
    preferStudio,
    setPreferStudio,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    speaking,
    paused,
    index,
    total: chunks.length,
    chunks,
    hasAudioFor: (lessonId: string) => Boolean(manifest?.lessons[lessonId]),
    play,
    pause,
    resume,
    stop,
    jump,
    say,
  };
}
