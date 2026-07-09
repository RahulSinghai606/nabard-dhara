// Voice layer — browser-native TTS/ASR (works offline for many voices on-device;
// Bhashini-aligned cloud path in production). Graceful everywhere.

export function speak(text: string, locale: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;
  u.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === locale) || voices.find((v) => v.lang.startsWith(locale.split("-")[0]));
  if (match) u.voice = match;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeak() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

type SR = { start: () => void; stop: () => void; lang: string; interimResults: boolean; onresult: (e: unknown) => void; onerror: (e: unknown) => void; onend: () => void };

export function listenOnce(locale: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => SR; SpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return reject(new Error("asr-unsupported"));
    const rec = new Ctor();
    rec.lang = locale;
    rec.interimResults = false;
    let done = false;
    rec.onresult = (e: unknown) => {
      done = true;
      const ev = e as { results: { [i: number]: { [j: number]: { transcript: string } } } };
      resolve(ev.results[0][0].transcript);
    };
    rec.onerror = () => {
      if (!done) reject(new Error("asr-error"));
    };
    rec.onend = () => {
      if (!done) reject(new Error("asr-silent"));
    };
    rec.start();
  });
}
