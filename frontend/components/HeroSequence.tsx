"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";

/** Exact frame count: ls frames/ | wc -l */
const FRAME_COUNT = 288;

/** Exact filenames from frames/: frame_000_delay-0.063s.jpg … frame_287_delay-0.063s.jpg */
const FRAME_PATH = (i: number) =>
  `/sequence/frame_${String(i).padStart(3, "0")}_delay-0.063s.jpg`;

export default function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Array<HTMLImageElement | undefined>>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const drawFrame = useCallback((index: number, images?: Array<HTMLImageElement | undefined>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const imgs = images ?? imagesRef.current;
    const img = imgs[index];

    if (!canvas || !ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    // Use full device pixel ratio (cap 3) — capping at 2 was visibly soft on 2.5–3× displays.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // "Cover" (not "contain"): fill the viewport so there are no letterboxed black bars.
    // Crops edges of the frame when aspect ratio ≠ viewport — matches full-bleed hero behavior.
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offsetX = Math.round((W - drawW) / 2);
    const offsetY = Math.round((H - drawH) / 2);
    const rw = Math.round(drawW);
    const rh = Math.round(drawH);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, offsetX, offsetY, rw, rh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const images: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT);

    const bump = (i: number, img: HTMLImageElement | undefined) => {
      images[i] = img;
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      setLoadProgress(pct);
      if (loadedCount === FRAME_COUNT && !cancelled) {
        imagesRef.current = images;
        setLoaded(true);
      }
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = FRAME_PATH(i);
      const idx = i;
      img.onload = () => bump(idx, img);
      img.onerror = () => bump(idx, undefined);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    currentFrameRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawFrame(0));
  }, [loaded, drawFrame]);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (!loaded) return;
    const rawIndex = Math.floor(latest * (FRAME_COUNT - 1));
    const index = Math.min(Math.max(rawIndex, 0), FRAME_COUNT - 1);
    if (index === currentFrameRef.current) return;
    currentFrameRef.current = index;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawFrame(index));
  });

  useEffect(() => {
    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => drawFrame(currentFrameRef.current));
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, loaded]);

  return (
    <>
      <Nav />

      {/* Taller = more scroll distance for the same 0→1 progress (slower-feeling animation) */}
      <div ref={containerRef} className="relative" style={{ height: "1500vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505]">
          {!loaded && <LoadingScreen progress={loadProgress} />}

          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ display: loaded ? "block" : "none" }}
            aria-hidden
          />

          {loaded && (
            <>
              <HeroOpeningText scrollProgress={smoothProgress} />
              <ScrollBeat
                scrollProgress={smoothProgress}
                range={[0.12, 0.3]}
                title="Connect your LeetCode account"
                body="Er. Forge syncs your full submission history — every attempt, every failure, every accepted solution."
                align="center"
              />
              <ScrollBeat
                scrollProgress={smoothProgress}
                range={[0.3, 0.5]}
                title="Every submission gets analysed"
                body="Not just whether you passed — but why you failed. The root cause. The mental model you were missing."
                align="left"
              />
              <ScrollBeat
                scrollProgress={smoothProgress}
                range={[0.5, 0.68]}
                title="Skill gaps detected automatically"
                body="Er. Forge maps your failures to a skill taxonomy and builds your engineering profile from real evidence."
                align="right"
              />
              <ScrollBeat
                scrollProgress={smoothProgress}
                range={[0.68, 0.85]}
                title="Your instructor assigns the fix"
                body="Not 'learn hash maps.' The exact problem to solve next — targeted to your specific weakness."
                align="left"
              />
              <ScrollBeat
                scrollProgress={smoothProgress}
                range={[0.85, 0.97]}
                title="A growth portfolio you can prove"
                body="One shareable link. Your entire engineering journey — struggles, patterns, improvements. Open it in your next interview."
                align="center"
              />
              <ScrollHint scrollProgress={smoothProgress} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Nav() {
  return (
    <nav
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between px-6 py-4 md:px-10"
      style={{
        borderBottom: "0.5px solid rgba(62,207,142,0.08)",
        background: "rgba(5,5,5,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}
    >
      <div className="text-[17px] font-medium tracking-tight text-white/90">
        <span className="text-white/90">Er</span>
        <span style={{ color: "#3ECF8E" }}>.</span>
        <span className="text-white/90">Forge</span>
      </div>
      <div className="flex items-center gap-5 md:gap-7">
        {[
          { href: "#features", label: "Features" },
          { href: "#how-it-works", label: "How it works" },
          { href: "#pricing", label: "Pricing" }
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden cursor-pointer text-[13px] text-white/40 transition-colors hover:text-white sm:inline"
          >
            {link.label}
          </a>
        ))}
        <Link
          href="/login"
          className="rounded-[8px] px-[18px] py-2 text-[13px] font-semibold"
          style={{ background: "#3ECF8E", color: "#050505" }}
        >
          Get started free
        </Link>
      </div>
    </nav>
  );
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#050505]">
      <div className="text-[13px] uppercase tracking-widest text-white/30">Loading</div>
      <div className="h-px w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${progress}%`, background: "#3ECF8E" }}
        />
      </div>
      <div className="text-[11px] text-white/20">{progress}%</div>
    </div>
  );
}

function HeroOpeningText({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollProgress, [0, 0.08], [1, 0]);
  const y = useTransform(scrollProgress, [0, 0.08], [0, -32]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
    >
      <div
        className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-[5px] text-[11px]"
        style={{
          background: "rgba(62,207,142,0.08)",
          border: "0.5px solid rgba(62,207,142,0.25)",
          color: "#3ECF8E"
        }}
      >
        <div className="h-[5px] w-[5px] rounded-full bg-[#3ECF8E]" />
        AI-powered engineering intelligence
      </div>

      <h1
        className="mb-4 font-medium leading-[1.1] tracking-tight text-white/90"
        style={{ fontSize: "clamp(36px, 6vw, 80px)" }}
      >
        Every bug you fix.
        <br />
        <span style={{ color: "#3ECF8E" }}>Every skill you build.</span>
      </h1>

      <p className="mb-8 max-w-md text-[15px] leading-relaxed text-white/50">
        Er. Forge turns your LeetCode history into a structured growth portfolio — diagnosing your gaps, assigning what to
        fix, building a career you can prove.
      </p>

      <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg px-6 py-3 text-[13px] font-semibold"
          style={{ background: "#3ECF8E", color: "#050505" }}
        >
          Connect LeetCode free
        </Link>
        <a
          href="#how-it-works"
          className="rounded-lg border border-white/[0.12] bg-transparent px-6 py-3 text-[13px] text-white/50 transition-colors hover:text-white/80"
        >
          See how it works ↓
        </a>
      </div>
    </motion.div>
  );
}

function ScrollBeat({
  scrollProgress,
  range,
  title,
  body,
  align
}: {
  scrollProgress: MotionValue<number>;
  range: [number, number];
  title: string;
  body: string;
  align: "left" | "center" | "right";
}) {
  const fadeIn = range[0] + (range[1] - range[0]) * 0.1;
  const fadeOut = range[1] - (range[1] - range[0]) * 0.1;

  const opacity = useTransform(scrollProgress, [range[0], fadeIn, fadeOut, range[1]], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [range[0], fadeIn, fadeOut, range[1]], [20, 0, 0, -20]);

  const rowClass =
    align === "left"
      ? "justify-start pl-[5%]"
      : align === "right"
        ? "justify-end pr-[5%]"
        : "justify-center";

  const textAlign = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  return (
    <div
      className={`pointer-events-none absolute bottom-[8%] left-0 right-0 z-10 flex ${rowClass}`}
    >
      <motion.div
        style={{ opacity, y }}
        className={`w-[min(420px,calc(100%-2rem))] max-w-[420px] ${textAlign}`}
      >
      <div
        className="rounded-xl px-6 py-4"
        style={{
          background: "rgba(5,5,5,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "0.5px solid rgba(62,207,142,0.18)",
          boxShadow: "0 0 32px rgba(62,207,142,0.05)"
        }}
      >
        <p className="mb-[6px] text-[15px] font-medium tracking-tight text-white/90">{title}</p>
        <p className="text-[13px] leading-relaxed text-white/50">{body}</p>
      </div>
    </motion.div>
    </div>
  );
}

/** Bouncing arrow only (no “Scroll to explore” label). */
function ScrollHint({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollProgress, [0, 0.06], [1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-[4%] left-1/2 z-10 flex -translate-x-1/2 items-center justify-center"
      aria-hidden
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        style={{ color: "#3ECF8E", fontSize: "18px", lineHeight: 1 }}
      >
        ↓
      </motion.div>
    </motion.div>
  );
}
