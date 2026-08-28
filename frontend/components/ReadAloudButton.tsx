"use client";

import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";

// BCP-47 codes for the browser's SpeechSynthesis voice matching.
// Voice availability depends on the user's OS/browser - not every device
// ships every language, so we detect what's actually available rather
// than assuming.
export const SUPPORTED_LANGUAGES: { label: string; value: string; speechLang: string }[] = [
  { label: "English", value: "English", speechLang: "en-IN" },
  { label: "Hindi (हिन्दी)", value: "Hindi", speechLang: "hi-IN" },
  { label: "Marathi (मराठी)", value: "Marathi", speechLang: "mr-IN" },
  { label: "Tamil (தமிழ்)", value: "Tamil", speechLang: "ta-IN" },
  { label: "Bengali (বাংলা)", value: "Bengali", speechLang: "bn-IN" },
  { label: "Gujarati (ગુજરાતી)", value: "Gujarati", speechLang: "gu-IN" },
];

export default function ReadAloudButton({
  text,
  speechLang,
}: {
  text: string;
  speechLang: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function handleClick() {
    if (!supported) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.95;

    // Prefer a voice that actually matches the requested language, if the
    // device has one installed - otherwise fall back to the default voice
    // (still speaks, just possibly with an English accent).
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === speechLang) ||
      voices.find((v) => v.lang.startsWith(speechLang.split("-")[0]));
    if (match) utterance.voice = match;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel(); // stop anything already playing
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:border-primary hover:text-primary"
    >
      {speaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3.5 w-3.5" />}
      {speaking ? "Stop" : "Read aloud"}
    </button>
  );
}
