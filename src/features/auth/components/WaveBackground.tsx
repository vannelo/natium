/**
 * Subtle water-inspired motion for the access screens. Two slow, translating
 * wave layers; honors prefers-reduced-motion through global CSS.
 */
export function WaveBackground() {
  const wave = 'M0,96 C240,160 480,32 720,96 C960,160 1200,32 1440,96 L1440,200 L0,200 Z'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(67,201,232,0.18),_transparent_55%)]" />
      <div className="absolute bottom-0 left-0 h-48 w-[200%] animate-wave-slow opacity-40">
        <svg viewBox="0 0 2880 200" preserveAspectRatio="none" className="h-full w-full">
          <path d={wave} fill="#173D55" />
          <path d={wave} fill="#173D55" transform="translate(1440,0)" />
        </svg>
      </div>
      <div className="absolute -bottom-6 left-0 h-40 w-[200%] animate-wave opacity-60">
        <svg viewBox="0 0 2880 200" preserveAspectRatio="none" className="h-full w-full">
          <path d={wave} fill="#43C9E8" fillOpacity="0.35" />
          <path d={wave} fill="#43C9E8" fillOpacity="0.35" transform="translate(1440,0)" />
        </svg>
      </div>
    </div>
  )
}
