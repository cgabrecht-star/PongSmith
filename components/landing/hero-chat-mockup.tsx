"use client";

/**
 * Live-Typing-Chat-Mockup im Hero.
 *
 * State Machine: 3 Konversationen im Loop (Marco/Allround, Tobias/Offensiv,
 * Werner/Material). Phasen: idle → user-typing → ai-typing → showing → reset
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTypewriter } from "@/components/effects/use-typewriter";

interface Conversation {
  id: string;
  user: string;
  aiIntro: string;
  setup: { holz: string; vh: string; rh: string };
  meta: { synergy: number; control: number; ttr: string };
}

const conversations: Conversation[] = [
  {
    id: "marco",
    user: "TTR 1280, Allround, mein Block fliegt mir zu oft weg.",
    aiIntro:
      "Klassisch, Setup ist dir zu schnell. Drei Optionen die dir Kontrolle ohne Tempo-Verlust geben:",
    setup: {
      holz: "Stiga Allround Classic",
      vh: "Donic Acuda S2 (max)",
      rh: "Donic Acuda S2 (max)",
    },
    meta: { synergy: 87, control: 82, ttr: "1200-1400" },
  },
  {
    id: "tobias",
    user: "TTR 1550, Offensiv-Topspin, Vorhand fühlt sich tot an.",
    aiIntro: "Du brauchst mehr Katapult auf VH ohne zu viel Härte. Mein Top-Pick:",
    setup: {
      holz: "Butterfly Innerforce Layer ALC",
      vh: "Tibhar Evolution MX-P (max)",
      rh: "Tibhar Aurus Soft (1.9)",
    },
    meta: { synergy: 91, control: 76, ttr: "1400-1700" },
  },
  {
    id: "werner",
    user: "TTR 1320, Materialspieler mit langen Noppen RH.",
    aiIntro: "Defensiv-Holz das die Noppen-Effekte verstärkt, VH mit moderater Spitze:",
    setup: {
      holz: "Donic Defplay Senso",
      vh: "DHS Hurricane 3 Neo (39°)",
      rh: "TSP Curl P1-R OX (lange Noppen)",
    },
    meta: { synergy: 84, control: 88, ttr: "1100-1500" },
  },
];

const USER_SPEED = 22;
const AI_SPEED = 18;
const PAUSE_AFTER_USER = 700;
const HOLD_AFTER_SHOWING = 4800;

type Phase = "user" | "ai" | "showing";

export function HeroChatMockup() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("user");
  const conv = conversations[idx]!;

  const { output: userOut, done: userDone } = useTypewriter(conv.user, USER_SPEED, phase === "user");
  const { output: aiOut, done: aiDone } = useTypewriter(conv.aiIntro, AI_SPEED, phase === "ai");

  // Phase-Übergänge
  useEffect(() => {
    if (phase === "user" && userDone) {
      const t = setTimeout(() => setPhase("ai"), PAUSE_AFTER_USER);
      return () => clearTimeout(t);
    }
    if (phase === "ai" && aiDone) {
      const t = setTimeout(() => setPhase("showing"), 200);
      return () => clearTimeout(t);
    }
    if (phase === "showing") {
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % conversations.length);
        setPhase("user");
      }, HOLD_AFTER_SHOWING);
      return () => clearTimeout(t);
    }
  }, [phase, userDone, aiDone]);

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-4 shadow-2xl shadow-black/50 backdrop-blur-md md:p-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-neutral-700 pb-3">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 rounded-full bg-primary" />
          <span className="text-sm font-semibold text-neutral-50">PongSmith Chat</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-400">
          <motion.span
            className="block h-1.5 w-1.5 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          live
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-[280px] flex-col gap-3 md:min-h-[340px]">
        {/* User Bubble */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-on-primary">
            {userOut}
            {phase === "user" && !userDone && (
              <motion.span
                className="ml-0.5 inline-block w-0.5 bg-on-primary"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                style={{ height: "0.9em" }}
              />
            )}
          </div>
        </div>

        {/* AI Bubble */}
        <AnimatePresence>
          {(phase === "ai" || phase === "showing") && (
            <motion.div
              key={`ai-${conv.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                PS
              </div>
              <div className="max-w-[85%] flex-1 rounded-xl rounded-tl-sm border border-neutral-700 bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-50">
                <p>
                  {aiOut}
                  {phase === "ai" && !aiDone && (
                    <motion.span
                      className="ml-0.5 inline-block w-0.5 bg-neutral-50"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                      style={{ height: "0.9em" }}
                    />
                  )}
                </p>

                {/* Setup-Block, fadet staggered ein wenn phase = showing */}
                <AnimatePresence>
                  {phase === "showing" && (
                    <motion.div
                      key={`setup-${conv.id}`}
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.08 } },
                      }}
                      className="mt-3 flex flex-col gap-1.5 border-t border-neutral-700 pt-3 text-xs"
                    >
                      <motion.div
                        variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                        className="flex gap-2"
                      >
                        <span className="w-12 shrink-0 font-mono uppercase text-neutral-400">Holz</span>
                        <span className="text-neutral-50">{conv.setup.holz}</span>
                      </motion.div>
                      <motion.div
                        variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                        className="flex gap-2"
                      >
                        <span className="w-12 shrink-0 font-mono uppercase text-neutral-400">VH</span>
                        <span className="text-neutral-50">{conv.setup.vh}</span>
                      </motion.div>
                      <motion.div
                        variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                        className="flex gap-2"
                      >
                        <span className="w-12 shrink-0 font-mono uppercase text-neutral-400">RH</span>
                        <span className="text-neutral-50">{conv.setup.rh}</span>
                      </motion.div>
                      <motion.div
                        variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                        className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-700 pt-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400"
                      >
                        <span>
                          Synergie <span className="text-primary">{conv.meta.synergy}</span>
                        </span>
                        <span>
                          Kontrolle <span className="text-primary">{conv.meta.control}</span>
                        </span>
                        <span>
                          TTR <span className="text-neutral-200">{conv.meta.ttr}</span>
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Indicator-Dots */}
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-700 pt-3">
        {conversations.map((c, i) => (
          <span
            key={c.id}
            className={`block h-1 w-6 rounded-full transition-colors duration-300 ${
              i === idx ? "bg-primary" : "bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
