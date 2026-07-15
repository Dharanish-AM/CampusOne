import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

const LOADING_MESSAGES = [
  "Analyzing your technical DNA... 🧬",
  "Evaluating competitive grit... 📊",
  "Benchmarking against industry standards... 🏎️",
  "Consulting the logic oracles... 🔮",
  "Compiling skill matrix... ⚙️",
];

export function AIInsights() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const [score, setScore] = useState(null);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        const nextMsg =
          LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
        setLoadingText(nextMsg);
      }, 1200);

      // Simulate network request
      setTimeout(() => {
        setIsAnalyzing(false);
        setScore(8.4); // Mock score
        clearInterval(interval);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const getScoreColor = (val) => {
    if (val >= 8) return "text-emerald-400";
    if (val >= 6) return "text-amber-400";
    return "text-rose-400";
  };

  const getStrokeColor = (val) => {
    if (val >= 8) return "#34d399"; // emerald-400
    if (val >= 6) return "#fbbf24"; // amber-400
    return "#fb7185"; // rose-400
  };

  // Conic Score Ring calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score
    ? circumference - (score / 10) * circumference
    : circumference;

  return (
    <div className="nav-shell flex flex-col items-center justify-center min-h-[300px] text-center w-full max-w-md mx-auto">
      <div className="mb-4 p-3 bg-purple-500/10 rounded-full text-purple-400">
        <Brain size={32} />
      </div>

      <h3 className="text-xl font-bold brand-text mb-2 text-[var(--text-primary)]">
        AlgoLog AI Mentor
      </h3>

      {!isAnalyzing && score === null && (
        <div className="flex flex-col items-center animate-fade-in-up">
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-[250px]">
            Generate a personalized placement readiness report based on your
            recent platform activity.
          </p>
          <Button onClick={() => setIsAnalyzing(true)}>
            <Sparkles size={16} />
            Generate Report
          </Button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center w-full h-32 justify-center">
          <div className="w-8 h-8 border-2 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin mb-4" />
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm text-[var(--brand-accent)] font-mono font-medium"
            >
              {loadingText}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {!isAnalyzing && score !== null && (
        <div className="flex flex-col items-center animate-fade-in-up w-full">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="transform -rotate-90 w-32 h-32 absolute">
              {/* Background Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="var(--surface-soft)"
                strokeWidth="8"
                fill="none"
              />
              {/* Animated Score Ring */}
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                stroke={getStrokeColor(score)}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div
              className={`text-3xl font-bold font-mono z-10 ${getScoreColor(score)}`}
            >
              {score}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--glass-border)] w-full text-left">
            <p className="text-sm text-[var(--text-primary)] mb-2 font-medium">
              Excellent problem-solving pace! 🚀
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Your recent performance on LeetCode dynamic programming challenges
              indicates high placement readiness. Consider attempting more
              Hard-level Graph problems.
            </p>
          </div>

          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setScore(null);
                setIsAnalyzing(false);
              }}
            >
              Reset Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
