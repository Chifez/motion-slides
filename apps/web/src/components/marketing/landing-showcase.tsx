import { useState, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  ArrowLeft,
  Sparkles,
  GitBranch,
  Film,
  Type,
  Square,
  Minus,
  ChevronRight,
  Layers,
  MousePointer2,
  ZoomIn,
  AlignCenter,
  Palette,
  LayoutTemplate,
} from "lucide-react";
import {
  buildElbowPoints,
  buildRoundedPath,
  getPathMidpoint,
} from "@/components/editor/elements/line-helpers";
import { getArrow } from "perfect-arrows";

// ─── Canvas constants ────────────────────────────────────────────────────────
const BASE_WIDTH = 1000;
const BASE_HEIGHT = 562.5;

// ─── Mini shape renderers ────────────────────────────────────────────────────
function CircleShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#09090b"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}
function ServerShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
      <rect
        x="8"
        y="10"
        width="84"
        height="22"
        rx="3.5"
        fill="#09090b"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y="39"
        width="84"
        height="22"
        rx="3.5"
        fill="#09090b"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y="68"
        width="84"
        height="22"
        rx="3.5"
        fill="#09090b"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="80" cy="21" r="3.5" fill={color} />
      <circle cx="80" cy="50" r="3.5" fill={color} />
      <circle cx="80" cy="79" r="3.5" fill={color} />
    </svg>
  );
}
function DatabaseShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
      <ellipse
        cx="50"
        cy="18"
        rx="38"
        ry="9"
        fill="#09090b"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M12 18 L12 82 A38 9 0 0 0 88 82 L88 18"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M12 18 L12 82 L88 82 L88 18 Z" fill="#09090b" stroke="none" />
      <ellipse
        cx="50"
        cy="82"
        rx="38"
        ry="9"
        fill="#09090b"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}
function AwsIconShape({ iconPath }: { iconPath: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-lg">
      <img
        src={`/${encodeURI(iconPath)}`}
        alt="AWS Icon"
        className="max-w-[80%] max-h-[80%] object-contain pointer-events-none"
      />
    </div>
  );
}

// ─── Code token data ─────────────────────────────────────────────────────────
const CODE_SLIDE_4 = [
  { key: "fn-def", text: "function renderCanvas() {", type: "keyword" },
  { key: "const-stage", text: "  const stage = getStage();", type: "variable" },
  { key: "anim-stage", text: "  stage.animate();", type: "expression" },
  { key: "fn-end", text: "}", type: "keyword" },
];
const CODE_SLIDE_5 = [
  { key: "fn-def", text: "function renderCanvas() {", type: "keyword" },
  { key: "const-stage", text: "  const stage = getStage();", type: "variable" },
  {
    key: "comment-line",
    text: "  // Magic Move resolves transitions",
    type: "comment",
  },
  { key: "anim-stage", text: "  stage.animate();", type: "expression" },
  { key: "log-line", text: "  logState('rendered');", type: "expression" },
  { key: "fn-end", text: "}", type: "keyword" },
];

// ─── Slide data ───────────────────────────────────────────────────────────────
const MOCK_SLIDES = [
  {
    id: "slide-1",
    title: "Welcome",
    subtitle: "MotionSlides",
    background: "#09090b",
    elements: [
      {
        id: "text-hero",
        type: "text",
        role: "title",
        value: "MotionSlides",
        x: 200,
        y: 200,
        w: 600,
        h: 70,
        fontSize: "54px",
        color: "#ffffff",
        fontWeight: "bold",
      },
      {
        id: "text-sub",
        type: "text",
        role: "body",
        value: "Magic Move & Architecture Diagrams in the Browser",
        x: 150,
        y: 285,
        w: 700,
        h: 40,
        fontSize: "20px",
        color: "#a1a1aa",
      },
    ],
    inspector: {
      label: "Text Element",
      props: [
        { name: "Font", value: "DM Serif Display" },
        { name: "Size", value: "54px" },
        { name: "Color", value: "#ffffff" },
        { name: "Opacity", value: "100%" },
      ],
    },
  },
  {
    id: "slide-2",
    title: "Architecture",
    subtitle: "Service Blueprint",
    background: "#09090b",
    elements: [
      {
        id: "section-boundary",
        type: "section",
        label: "AWS VPC Subnet",
        x: 260,
        y: 70,
        w: 420,
        h: 280,
      },
      {
        id: "source-node",
        type: "shape",
        shape: "circle",
        label: "Client App",
        x: 100,
        y: 220,
        w: 90,
        h: 90,
        color: "#3b82f6",
      },
      {
        id: "db-node",
        type: "shape",
        shape: "database",
        label: "Main DB",
        x: 740,
        y: 220,
        w: 90,
        h: 90,
        color: "#3b82f6",
      },
      {
        id: "server-node",
        type: "aws-icon",
        label: "EC2 Server",
        x: 320,
        y: 120,
        w: 90,
        h: 90,
        iconPath:
          "icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg",
      },
      {
        id: "lambda-node",
        type: "aws-icon",
        label: "Lambda Fn",
        x: 530,
        y: 120,
        w: 90,
        h: 90,
        iconPath:
          "icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Lambda_32.svg",
      },
      {
        id: "conn-client-server",
        type: "line",
        from: "source-node",
        to: "server-node",
        label: "request",
        lineType: "elbow",
        style: "dashed",
        startConnection: { handleId: "right" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-server-lambda",
        type: "line",
        from: "server-node",
        to: "lambda-node",
        label: "invoke",
        lineType: "straight",
        style: "solid",
        startConnection: { handleId: "right" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-lambda-db",
        type: "line",
        from: "lambda-node",
        to: "db-node",
        label: "write",
        lineType: "elbow",
        style: "dashed",
        startConnection: { handleId: "right" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-client-db",
        type: "line",
        from: "source-node",
        to: "db-node",
        label: "sync",
        lineType: "elbow",
        style: "solid",
        startConnection: { handleId: "bottom" },
        endConnection: { handleId: "bottom" },
      },
    ],
    inspector: {
      label: "Shape · Circle",
      props: [
        { name: "Fill", value: "Transparent" },
        { name: "Stroke", value: "#3b82f6" },
        { name: "Width", value: "90px" },
        { name: "Height", value: "90px" },
      ],
    },
  },
  {
    id: "slide-3",
    title: "Scaled System",
    subtitle: "Scalable Architecture",
    background: "#09090b",
    elements: [
      {
        id: "section-boundary",
        type: "section",
        label: "AWS VPC Core Network",
        x: 240,
        y: 80,
        w: 700,
        h: 420,
      },
      {
        id: "source-node",
        type: "shape",
        shape: "circle",
        label: "Client App",
        x: 100,
        y: 220,
        w: 90,
        h: 90,
        color: "#3b82f6",
      },
      {
        id: "server-node",
        type: "shape",
        shape: "server",
        label: "App Server",
        x: 300,
        y: 220,
        w: 90,
        h: 90,
        color: "#3b82f6",
      },
      {
        id: "db-node",
        type: "shape",
        shape: "database",
        label: "Local Cache",
        x: 520,
        y: 345,
        w: 90,
        h: 90,
        color: "#3b82f6",
      },
      {
        id: "lambda-node",
        type: "aws-icon",
        label: "Lambda Fn",
        x: 520,
        y: 120,
        w: 90,
        h: 90,
        iconPath:
          "icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Lambda_32.svg",
      },
      {
        id: "rds-node",
        type: "aws-icon",
        label: "AWS RDS",
        x: 740,
        y: 345,
        w: 90,
        h: 90,
        iconPath:
          "icons/aws/Architecture-Service-Icons_01302026/Arch_Databases/32/Arch_Amazon-RDS_32.svg",
      },
      {
        id: "s3-node",
        type: "aws-icon",
        label: "S3 Store",
        x: 820,
        y: 230,
        w: 90,
        h: 90,
        iconPath:
          "icons/aws/Architecture-Service-Icons_01302026/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg",
      },
      {
        id: "conn-client-server",
        type: "line",
        from: "source-node",
        to: "server-node",
        label: "traffic-in",
        lineType: "elbow",
        style: "dashed",
        startConnection: { handleId: "right" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-server-lambda",
        type: "line",
        from: "server-node",
        to: "lambda-node",
        label: "invoke",
        lineType: "elbow",
        style: "solid",
        startConnection: { handleId: "top" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-server-db",
        type: "line",
        from: "server-node",
        to: "db-node",
        label: "read",
        lineType: "elbow",
        style: "solid",
        startConnection: { handleId: "bottom" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-client-db",
        type: "line",
        from: "source-node",
        to: "db-node",
        label: "sync",
        lineType: "elbow",
        style: "solid",
        startConnection: { handleId: "bottom" },
        endConnection: { handleId: "bottom" },
      },
      {
        id: "conn-lambda-rds",
        type: "line",
        from: "lambda-node",
        to: "rds-node",
        label: "write",
        lineType: "elbow",
        style: "solid",
        startConnection: { handleId: "right" },
        endConnection: { handleId: "left" },
      },
      {
        id: "conn-rds-s3",
        type: "line",
        from: "rds-node",
        to: "s3-node",
        label: "backup",
        lineType: "elbow",
        style: "dashed",
        startConnection: { handleId: "top" },
        endConnection: { handleId: "bottom" },
      },
    ],
    inspector: {
      label: "Connector · Elbow",
      props: [
        { name: "Style", value: "Dashed" },
        { name: "Stroke", value: "#ffffff / 80%" },
        { name: "Width", value: "1.5px" },
        { name: "Arrow", value: "End → " },
      ],
    },
  },
  {
    id: "slide-4",
    title: "Code Diffs",
    subtitle: "Code-Aware Transitions",
    background: "#09090b",
    elements: [
      {
        id: "code-block",
        type: "code",
        lines: CODE_SLIDE_4,
        x: 220,
        y: 130,
        w: 560,
        h: 300,
      },
    ],
    inspector: {
      label: "Code Block",
      props: [
        { name: "Language", value: "TypeScript" },
        { name: "Theme", value: "One Dark Pro" },
        { name: "Lines", value: "4" },
        { name: "Diff Mode", value: "LCS" },
      ],
    },
  },
  {
    id: "slide-5",
    title: "Line Morphing",
    subtitle: "Dynamic Line Morphing",
    background: "#09090b",
    elements: [
      {
        id: "code-block",
        type: "code",
        lines: CODE_SLIDE_5,
        x: 220,
        y: 130,
        w: 560,
        h: 300,
      },
    ],
    inspector: {
      label: "Code Block",
      props: [
        { name: "Language", value: "TypeScript" },
        { name: "Theme", value: "One Dark Pro" },
        { name: "Lines", value: "6 (+2 added)" },
        { name: "Diff Mode", value: "LCS" },
      ],
    },
  },
];

// ─── Connection point helper ──────────────────────────────────────────────────
function getConnectionPoint(
  node: any,
  handleId: "left" | "right" | "top" | "bottom",
) {
  if (handleId === "left") return { x: node.x, y: node.y + node.h / 2 };
  if (handleId === "right")
    return { x: node.x + node.w, y: node.y + node.h / 2 };
  if (handleId === "top") return { x: node.x + node.w / 2, y: node.y };
  if (handleId === "bottom")
    return { x: node.x + node.w / 2, y: node.y + node.h };
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

// ─── Mini slide thumbnail renderer — matches real SlideThumb design ──────────
function SlideThumbnail({
  slide,
  index,
  isActive,
  onClick,
}: {
  slide: (typeof MOCK_SLIDES)[number];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const elementCount = slide.elements.filter(
    (e) => (e as any).type !== "line",
  ).length;

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition group shadow-lg ${
        isActive
          ? "border-blue-500 ring-2 ring-blue-500/10"
          : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"
      }`}
    >
      {/* ── Canvas preview area — aspect-video ── */}
      <div
        className="aspect-video flex items-center justify-center relative bg-[#0a0a0a]"
        style={{ backgroundColor: slide.background }}
      >
        {/* Slide content preview */}
        {slide.elements.some((e) => (e as any).type === "code") && (
          <div className="absolute inset-0 p-3 flex flex-col gap-1 justify-center">
            {[55, 85, 38, 72, 55, 65].map((w, i) => (
              <div
                key={i}
                className="h-[2px] rounded-full"
                style={{
                  width: `${w}%`,
                  background:
                    i === 0
                      ? "rgba(96,165,250,0.6)"
                      : i === 2
                        ? "rgba(167,139,250,0.5)"
                        : i === 4
                          ? "rgba(113,113,122,0.4)"
                          : "rgba(161,161,170,0.3)",
                }}
              />
            ))}
          </div>
        )}

        {slide.elements.some(
          (e) => (e as any).type === "text" && (e as any).role === "title",
        ) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
            <div className="h-2.5 w-20 rounded bg-zinc-300/70" />
            <div className="h-1 w-28 rounded bg-zinc-600/60" />
          </div>
        )}

        {slide.elements.some(
          (e) => (e as any).type === "shape" || (e as any).type === "aws-icon",
        ) && (
          <div className="absolute inset-0 flex items-center justify-around px-6">
            {[
              ...Array(
                Math.min(
                  3,
                  slide.elements.filter(
                    (e) =>
                      (e as any).type === "shape" ||
                      (e as any).type === "aws-icon",
                  ).length,
                ),
              ),
            ].map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-blue-400/50 bg-blue-600/10"
              />
            ))}
          </div>
        )}

        {/* Slide number badge — top-right, exactly like the real editor */}
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
          <span className="text-[10px] text-white/70 font-bold leading-none">
            {index + 1}
          </span>
        </div>
      </div>

      {/* ── Footer: slide name + layer count ── */}
      <div
        className={`px-2 py-1.5 ${isActive ? "bg-blue-500/5" : "bg-transparent"} transition-colors`}
      >
        <span
          className={`text-[10px] font-medium block truncate ${isActive ? "text-white" : "text-zinc-500"}`}
        >
          {slide.subtitle}
        </span>
        <span className="text-[9px] text-zinc-700 block mt-0.5">
          {elementCount} layer{elementCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LandingShowcase() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive scale calculation
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(w / BASE_WIDTH, h / BASE_HEIGHT));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Autoplay
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % MOCK_SLIDES.length);
    }, 4500);
  };

  // Start autoplay on mount and when isPlaying changes
  useLayoutEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handleSlideClick = (i: number) => {
    setSlideIndex(i);
    // Reset autoplay timer when user manually navigates
    if (isPlaying) startAutoplay();
  };

  const activeSlide = MOCK_SLIDES[slideIndex];

  return (
    <div
      className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-zinc-800/70 shadow-[0_40px_120px_rgba(0,0,0,0.6)] select-none"
      style={{ background: "#0d0d0f" }}
    >
      {/* ── Fake Toolbar ─────────────────────────────────────────────────── */}
      <div className="h-11 flex items-center gap-2 px-3 border-b border-zinc-800/80 bg-zinc-950/80">
        {/* Left: back + logo + project name */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-600">
            <ArrowLeft size={12} />
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <span className="text-[11px] text-zinc-500 font-semibold ml-1">
            My Presentation
          </span>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md px-1.5 py-0.5 ml-1">
            <GitBranch size={9} className="text-blue-400" />
            <span className="text-[9px] text-zinc-500">main</span>
          </div>
        </div>

        {/* Center: element tool buttons */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {[
            { icon: <MousePointer2 size={12} />, active: true },
            { icon: <Type size={12} />, active: false },
            { icon: <Square size={12} />, active: false },
            { icon: <Minus size={12} />, active: false },
            { icon: <LayoutTemplate size={12} />, active: false },
          ].map((btn, i) => (
            <div
              key={i}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                btn.active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {btn.icon}
            </div>
          ))}
        </div>

        {/* Right: play + AI + share */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border-none cursor-pointer transition bg-emerald-600/15 text-emerald-400 border border-emerald-600/25 hover:bg-emerald-600/20"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="flex items-center gap-1 bg-blue-600/10 border border-blue-500/20 rounded-md px-2 py-1.5">
            <Sparkles size={10} className="text-blue-400" />
            <span className="text-[10px] text-blue-400 font-semibold">AI</span>
          </div>
        </div>
      </div>

      {/* ── Main Body: sidebar + canvas + inspector ──────────────────────── */}
      <div className="flex" style={{ height: 520 }}>
        {/* ── Left: Slide Panel ──────────────────────────────────────────── */}
        <aside className="w-[180px] shrink-0 flex flex-col bg-zinc-950 border-r border-zinc-800/70 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/50">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
              Slides &amp; Layers
            </span>
            <div className="w-5 h-5 flex items-center justify-center rounded text-zinc-700 hover:text-zinc-500 transition-colors cursor-pointer">
              <Layers size={10} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
            {MOCK_SLIDES.map((slide, i) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={i}
                isActive={slideIndex === i}
                onClick={() => handleSlideClick(i)}
              />
            ))}
          </div>
        </aside>

        {/* ── Center: Canvas ────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center bg-[#070708] relative overflow-hidden">
          {/* Subtle dot-grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Slide counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {MOCK_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSlideClick(i)}
                className={`rounded-full transition-all border-none cursor-pointer p-0 ${
                  i === slideIndex
                    ? "w-4 h-1.5 bg-blue-400"
                    : "w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>

          {/* Zoom badge */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-zinc-800 rounded-md px-2 py-1">
            <ZoomIn size={9} className="text-zinc-600" />
            <span className="text-[9px] text-zinc-500 font-mono">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Canvas Stage */}
          <div ref={containerRef} className="w-full h-full relative">
            <div
              style={{
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <div className="absolute inset-0 w-full h-full">
                {/* Sections */}
                <AnimatePresence mode="sync" initial={false}>
                  {activeSlide.elements
                    .filter((el) => el.type === "section")
                    .map((sec: any) => (
                      <motion.div
                        key={sec.id}
                        layoutId={`demo-${sec.id}`}
                        className="absolute border border-dashed border-white/10 rounded-2xl flex flex-col justify-start p-3"
                        style={{
                          left: sec.x,
                          top: sec.y,
                          width: sec.w,
                          height: sec.h,
                          background: "rgba(255,255,255,0.02)",
                          zIndex: 1,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 90,
                          damping: 16,
                        }}
                      >
                        <div className="inline-flex self-start text-[9px] font-black uppercase tracking-wider bg-[#101012] border border-white/10 rounded px-1.5 py-0.5 text-white/50">
                          {sec.label}
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {/* Connectors */}
                <AnimatePresence mode="sync" initial={false}>
                  {activeSlide.elements
                    .filter((el) => el.type === "line")
                    .map((line: any) => {
                      const fromEl = activeSlide.elements.find(
                        (e) => e.id === line.from,
                      ) as any;
                      const toEl = activeSlide.elements.find(
                        (e) => e.id === line.to,
                      ) as any;
                      if (!fromEl || !toEl) return null;
                      const p1 = line.startConnection?.handleId
                        ? getConnectionPoint(
                            fromEl,
                            line.startConnection.handleId,
                          )
                        : {
                            x: fromEl.x + fromEl.w / 2,
                            y: fromEl.y + fromEl.h / 2,
                          };
                      const p2 = line.endConnection?.handleId
                        ? getConnectionPoint(toEl, line.endConnection.handleId)
                        : { x: toEl.x + toEl.w / 2, y: toEl.y + toEl.h / 2 };

                      let pathD = "";
                      let labelX = (p1.x + p2.x) / 2;
                      let labelY = (p1.y + p2.y) / 2;

                      if (line.lineType === "straight") {
                        pathD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
                      } else if (line.lineType === "curved") {
                        try {
                          const arrow = getArrow(p1.x, p1.y, p2.x, p2.y, {
                            bow: 0.2,
                            stretch: 0.5,
                            padStart: 0,
                            padEnd: 0,
                            straights: false,
                          });
                          const [sx, sy, cx, cy, ex, ey] = arrow;
                          pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
                        } catch {
                          pathD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
                        }
                      } else {
                        const points = buildElbowPoints(
                          p1.x,
                          p1.y,
                          p2.x,
                          p2.y,
                          {
                            startConnection: line.startConnection,
                            endConnection: line.endConnection,
                          } as any,
                        );
                        pathD = buildRoundedPath(points, 16);
                        const mid = getPathMidpoint(points);
                        labelX = mid.x;
                        labelY = mid.y;
                      }

                      const strokeColor = "rgba(255,255,255,0.8)";
                      return (
                        <motion.svg
                          key={line.id}
                          className="absolute inset-0 w-full h-full pointer-events-none z-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <defs>
                            <marker
                              id={`arrow-${line.id}`}
                              markerWidth="12"
                              markerHeight="12"
                              refX="10"
                              refY="6"
                              orient="auto"
                              markerUnits="userSpaceOnUse"
                            >
                              <path d="M0,0 L0,12 L12,6 z" fill={strokeColor} />
                            </marker>
                          </defs>
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={
                              line.style === "dashed" ? "8 5" : undefined
                            }
                            markerEnd={`url(#arrow-${line.id})`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6, d: pathD }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                          <foreignObject
                            x={labelX - 35}
                            y={labelY - 10}
                            width="70"
                            height="20"
                          >
                            <div className="text-[8px] font-black uppercase text-center text-white/50 bg-[#0c0c0e] border border-white/10 px-1 py-0.5 rounded">
                              {line.label}
                            </div>
                          </foreignObject>
                        </motion.svg>
                      );
                    })}
                </AnimatePresence>

                {/* Nodes / Text / Code */}
                <AnimatePresence mode="sync" initial={false}>
                  {activeSlide.elements
                    .filter((el) => el.type !== "line" && el.type !== "section")
                    .map((el: any) => (
                      <motion.div
                        key={el.id}
                        layoutId={`demo-${el.id}`}
                        className="absolute flex flex-col items-center justify-center"
                        style={{
                          left: el.x,
                          top: el.y,
                          width: el.w,
                          height: el.h,
                          zIndex: 10,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 90,
                          damping: 16,
                        }}
                      >
                        {el.type === "shape" && (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="w-full h-full flex-1">
                              {el.shape === "circle" && (
                                <CircleShape color={el.color} />
                              )}
                              {el.shape === "server" && (
                                <ServerShape color={el.color} />
                              )}
                              {el.shape === "database" && (
                                <DatabaseShape color={el.color} />
                              )}
                            </div>
                            {el.label && (
                              <span className="text-[11px] font-bold tracking-tight text-white/80 mt-2 block whitespace-nowrap">
                                {el.label}
                              </span>
                            )}
                          </div>
                        )}
                        {el.type === "aws-icon" && (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="w-full h-full flex-1">
                              <AwsIconShape iconPath={el.iconPath} />
                            </div>
                            {el.label && (
                              <span className="text-[11px] font-bold tracking-tight text-white/85 mt-2 block whitespace-nowrap">
                                {el.label}
                              </span>
                            )}
                          </div>
                        )}
                        {el.type === "text" && (
                          <div className="w-full text-center">
                            <span
                              style={{
                                fontSize: el.fontSize,
                                fontFamily:
                                  el.role === "title"
                                    ? '"DM Serif Display", Georgia, serif'
                                    : "Inter, sans-serif",
                                fontStyle:
                                  el.role === "title" ? "italic" : "normal",
                                fontWeight: el.fontWeight || "normal",
                              }}
                              className="text-white tracking-tight leading-snug block"
                            >
                              {el.value}
                            </span>
                          </div>
                        )}
                        {el.type === "code" && (
                          <div className="w-full h-full bg-[#0a0a0c] border border-zinc-800/80 rounded-2xl p-5 font-mono text-[11px] text-zinc-300 overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex items-center gap-1.5 pb-2.5 mb-3 border-b border-zinc-800/40 opacity-60">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                              <span className="text-[9px] uppercase tracking-wider pl-2 text-zinc-400 font-bold">
                                typescript
                              </span>
                            </div>
                            <div className="relative flex-1 text-left">
                              <AnimatePresence mode="popLayout" initial={false}>
                                {el.lines.map((line: any, idx: number) => (
                                  <motion.div
                                    key={line.key}
                                    layoutId={`line-${line.key}`}
                                    className="flex items-center font-mono leading-relaxed"
                                    transition={{
                                      type: "spring",
                                      stiffness: 90,
                                      damping: 16,
                                    }}
                                  >
                                    <span className="text-zinc-700 w-4 text-right pr-2 text-[9px] font-mono select-none">
                                      {idx + 1}
                                    </span>
                                    <span
                                      className={
                                        line.type === "comment"
                                          ? "text-zinc-500 italic"
                                          : line.type === "keyword"
                                            ? "text-blue-400 font-semibold"
                                            : line.type === "variable"
                                              ? "text-purple-400"
                                              : "text-zinc-200"
                                      }
                                      style={{
                                        fontFamily: "ui-monospace, monospace",
                                      }}
                                    >
                                      {line.text}
                                    </span>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Inspector Panel ────────────────────────────────────── */}
        <aside className="w-[180px] shrink-0 flex flex-col bg-zinc-950 border-l border-zinc-800/70 overflow-hidden">
          {/* Header */}
          <div className="flex items-center px-3 py-2 border-b border-zinc-800/50 gap-2">
            <AlignCenter size={9} className="text-zinc-600 shrink-0" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
              Inspector
            </span>
          </div>

          {/* Selected element label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex flex-col"
            >
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-5 h-5 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Palette size={9} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-semibold truncate">
                    {activeSlide.inspector.label}
                  </span>
                </div>

                {/* Properties */}
                <div className="flex flex-col gap-2">
                  {activeSlide.inspector.props.map((prop) => (
                    <div key={prop.name} className="flex flex-col gap-0.5">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">
                        {prop.name}
                      </span>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5">
                        <span className="text-[10px] text-zinc-300 font-mono">
                          {prop.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transition section */}
              <div className="mx-3 mt-1 border-t border-zinc-800/60 pt-3">
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black block mb-2">
                  Transition
                </span>
                <div className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 flex items-center gap-1.5">
                  <Film size={9} className="text-blue-400 shrink-0" />
                  <span className="text-[10px] text-blue-400 font-semibold">
                    Magic Move
                  </span>
                </div>
              </div>

              {/* Slide info */}
              <div className="mx-3 mt-3 border-t border-zinc-800/60 pt-3">
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black block mb-2">
                  Slide
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-600">Index</span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {slideIndex + 1} / {MOCK_SLIDES.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-600">Duration</span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      4.5s
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      {/* ── Bottom status bar ────────────────────────────────────────────── */}
      <div className="h-7 flex items-center justify-between px-3 border-t border-zinc-800/60 bg-zinc-950">
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-zinc-600 font-mono">
            Slide {slideIndex + 1} · {activeSlide.subtitle}
          </span>
          <div
            className={`flex items-center gap-1 ${isPlaying ? "text-emerald-500" : "text-zinc-600"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`}
            />
            <span className="text-[8px] font-bold uppercase tracking-widest">
              {isPlaying ? "Auto" : "Paused"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-700 font-mono">
            MotionSlides
          </span>
          <ChevronRight size={8} className="text-zinc-800" />
        </div>
      </div>
    </div>
  );
}
