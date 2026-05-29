"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export function Landing() {
  const t = useTranslations("Home");
  const features = [
    { emoji: "📍", label: t("feature1Title") },
    { emoji: "🎯", label: t("feature2Title") },
    { emoji: "🔄", label: t("feature3Title") },
  ];

  return (
    <div className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-amber-200 text-zinc-900 flex flex-col justify-center">
      <FloatingEmojis />

      <section className="relative z-10 mx-auto max-w-2xl w-full px-5 py-8 sm:py-14 flex flex-col items-center text-center">
        <div className="relative">
          <SpeechBubble text={t("title")} />
          <div className="text-[7rem] sm:text-[10rem] leading-none select-none animate-bounce-slow">
            🍜
          </div>
          <Sparkles />
        </div>

        <h1 className="mt-4 sm:mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-balance">
          {t("heroLead")}
          <span className="relative inline-block ml-1">
            <Squiggle />
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-lg font-medium text-zinc-700 max-w-md text-balance">
          {t("heroSub")}
        </p>

        <div className="mt-7 flex flex-col gap-3 w-full max-w-xs">
          <SignUpButton mode="modal">
            <button className="rounded-full bg-zinc-950 text-amber-200 font-bold text-base sm:text-lg py-4 active:translate-y-0.5 hover:bg-zinc-800 transition shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">
              {t("primaryCta")} →
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="rounded-full bg-white/80 ring-2 ring-zinc-950/10 text-zinc-900 font-semibold text-sm py-3 hover:bg-white transition">
              {t("secondaryCta")}
            </button>
          </SignInButton>
        </div>

        <div className="mt-8 sm:mt-10 w-full max-w-[16rem] sm:max-w-[20rem] grid grid-cols-3 gap-1.5 sm:gap-2">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-1.5 min-w-0"
            >
              <div className="size-10 sm:size-12 rounded-2xl bg-white ring-2 ring-zinc-950/10 flex items-center justify-center text-xl sm:text-2xl shadow-[0_3px_0_0_rgba(0,0,0,0.08)]">
                {f.emoji}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-700 text-center leading-tight">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.6s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 14s linear infinite;
        }
      `}</style>
    </div>
  );
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="absolute -top-2 -right-6 sm:-right-10 rotate-6 z-20">
      <div className="relative bg-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl ring-2 ring-zinc-950/10 shadow-[0_3px_0_0_rgba(0,0,0,0.08)]">
        <span className="text-xs sm:text-sm font-bold text-zinc-900 whitespace-nowrap">
          {text}
        </span>
        <span className="absolute -bottom-1.5 left-4 size-3 bg-white ring-2 ring-zinc-950/10 rotate-45" />
      </div>
    </div>
  );
}

function Sparkles() {
  return (
    <div aria-hidden className="pointer-events-none">
      <span className="absolute -left-6 top-4 text-2xl animate-spin-slow">
        ✨
      </span>
      <span className="absolute right-2 bottom-2 text-xl">⭐</span>
    </div>
  );
}

function Squiggle() {
  return (
    <svg
      aria-hidden
      width="48"
      height="10"
      viewBox="0 0 48 10"
      className="absolute -bottom-1 left-0 text-zinc-950"
      fill="none"
    >
      <path
        d="M0 5 C 6 0, 12 10, 18 5 S 30 0, 36 5 S 42 10, 48 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FloatingEmojis() {
  const items = [
    { emoji: "🥟", top: "8%", left: "6%", size: "text-3xl", rotate: "-12deg" },
    { emoji: "🍖", top: "22%", right: "8%", size: "text-2xl", rotate: "10deg" },
    { emoji: "🍣", bottom: "30%", left: "4%", size: "text-3xl", rotate: "8deg" },
    {
      emoji: "🍝",
      bottom: "12%",
      right: "6%",
      size: "text-3xl",
      rotate: "-6deg",
    },
    { emoji: "🍜", top: "50%", left: "2%", size: "text-xl", rotate: "14deg" },
    { emoji: "🥢", top: "60%", right: "3%", size: "text-2xl", rotate: "-20deg" },
  ];
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {items.map((it, i) => (
        <span
          key={i}
          className={`absolute opacity-50 ${it.size} select-none`}
          style={{
            top: it.top,
            left: it.left,
            right: it.right,
            bottom: it.bottom,
            transform: `rotate(${it.rotate})`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
