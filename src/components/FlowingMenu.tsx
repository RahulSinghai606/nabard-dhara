"use client";

// FlowingMenu — marquee-on-hover sector menu (GSAP), adapted for DHARA:
// hovering a sector floods the row with a leaf-green marquee of the sector
// name + field imagery. Directional entry/exit preserved from the reference.

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

export interface MenuItemData {
  text: string;
  sub: string;
  image: string;
}

const MenuItem: React.FC<MenuItemData & { isFirst: boolean }> = ({ text, sub, image, isFirst }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);
  const animationDefaults = { duration: 0.6, ease: "expo.out" };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  useEffect(() => {
    const calc = () => {
      const part = marqueeInnerRef.current?.querySelector(".marquee-part") as HTMLElement | null;
      if (!part) return;
      setRepetitions(Math.max(4, Math.ceil(window.innerWidth / (part.offsetWidth || 100)) + 2));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [text]);

  useEffect(() => {
    const setup = () => {
      const part = marqueeInnerRef.current?.querySelector(".marquee-part") as HTMLElement | null;
      if (!part || !marqueeInnerRef.current) return;
      const w = part.offsetWidth;
      if (!w) return;
      animationRef.current?.kill();
      animationRef.current = gsap.to(marqueeInnerRef.current, { x: -w, duration: 14, ease: "none", repeat: -1 });
    };
    const timer = setTimeout(setup, 120);
    return () => {
      clearTimeout(timer);
      animationRef.current?.kill();
    };
  }, [text, repetitions]);

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap.timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap.timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  return (
    <div className="flex-1 relative overflow-hidden text-center" ref={itemRef} style={{ borderTop: isFirst ? "none" : "1px solid var(--line)" }}>
      <div
        className="flex items-center justify-center gap-4 h-full relative cursor-pointer font-display font-bold text-[3.4vh] sm:text-[4vh] text-forest transition-opacity hover:opacity-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
        <span className="font-body font-normal text-[1.6vh] text-ink-faint hidden sm:inline">{sub}</span>
      </div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none translate-y-[101%] bg-leaf" ref={marqueeRef}>
        <div className="h-full w-fit flex" ref={marqueeInnerRef}>
          {[...Array(repetitions)].map((_, idx) => (
            <div className="marquee-part flex items-center flex-shrink-0 text-white" key={idx}>
              <span className="whitespace-nowrap font-display font-bold text-[3.4vh] sm:text-[4vh] leading-none px-[1.4vw]">{text}</span>
              <div className="w-[180px] h-[6.4vh] my-[1.6em] mx-[1.6vw] rounded-[50px] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function FlowingMenu({ items }: { items: MenuItemData[] }) {
  return (
    <div className="w-full h-full overflow-hidden bg-surface">
      <nav className="flex flex-col h-full m-0 p-0">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} isFirst={idx === 0} />
        ))}
      </nav>
    </div>
  );
}
