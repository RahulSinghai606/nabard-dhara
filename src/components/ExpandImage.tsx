"use client";

// ExpandImage — full-screen image expansion on scroll (GSAP scrub):
// a framed field photograph grows until it fills the viewport, with an
// overlay message revealed at full bleed.

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ExpandImage({
  src,
  kicker,
  title,
  overlayTitle,
  overlaySub,
}: {
  src: string;
  kicker: string;
  title: React.ReactNode;
  overlayTitle: string;
  overlaySub: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(frameRef.current, { scale: 0.42, borderRadius: 32 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "+=1200",
          scrub: 0.5,
          pin: stageRef.current,
          anticipatePin: 1,
        },
      });
      tl.to(".xi-caption", { opacity: 0, y: -24, duration: 0.3 }, 0.05);
      tl.to(frameRef.current, { scale: 1, borderRadius: 0, duration: 1, ease: "power2.inOut" }, 0);
      tl.fromTo(".xi-overlay", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35 }, 0.62);
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div ref={stageRef} className="h-screen overflow-hidden field-bg noise relative flex items-center justify-center">
        <div className="xi-caption absolute top-[11%] left-0 right-0 text-center z-20 px-6 pointer-events-none">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-sprout mb-3">{kicker}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-forest">{title}</h2>
        </div>

        <div ref={frameRef} className="relative w-screen h-screen overflow-hidden card-elevate [will-change:transform]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/20 to-transparent" />
          <div className="xi-overlay absolute bottom-0 left-0 right-0 p-10 sm:p-16 text-white">
            <p className="font-display text-3xl sm:text-5xl font-bold leading-tight max-w-3xl">{overlayTitle}</p>
            <p className="mt-4 text-white/85 text-lg max-w-2xl">{overlaySub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
