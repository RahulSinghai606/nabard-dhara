"use client";

// DHARA avatar — a diffused aurora orb with a calm, minimal vector face:
// high curved eyebrows, dot eyes, an "L" nose. Floats gently.

export default function DharaOrb({ size = 180, speaking = false }: { size?: number; speaking?: boolean }) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
      <div className="dhara-orb absolute inset-0" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
        {/* eyebrows — high, curved */}
        <path d="M 28 38 Q 36 30 44 36" opacity="0.95" />
        <path d="M 56 36 Q 64 30 72 38" opacity="0.95" />
        {/* dot eyes */}
        <circle cx="36" cy="48" r="2.6" fill="#fff" stroke="none" />
        <circle cx="64" cy="48" r="2.6" fill="#fff" stroke="none" />
        {/* L nose */}
        <path d="M 50 48 L 50 60 L 56 60" opacity="0.9" />
        {/* calm mouth: subtle line, animated bars when speaking */}
        {!speaking && <path d="M 43 72 Q 50 75 57 72" opacity="0.85" />}
      </svg>
      {speaking && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: size * 0.2 }}>
          <div className="flex items-end gap-[3px] h-4">
            <span className="sound-bar w-[3px] h-full bg-white/90 rounded-full inline-block" />
            <span className="sound-bar w-[3px] h-full bg-white/90 rounded-full inline-block" />
            <span className="sound-bar w-[3px] h-full bg-white/90 rounded-full inline-block" />
            <span className="sound-bar w-[3px] h-full bg-white/90 rounded-full inline-block" />
          </div>
        </div>
      )}
    </div>
  );
}
