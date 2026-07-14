import { useState } from "react";
import "./App.css";

function App() {
  const [theme, setTheme] = useState("dark");
  const [clickCount, setClickCount] = useState(0);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 select-none">
      <header className="w-full max-w-5xl flex items-center justify-between py-6 mb-8 border-b border-[var(--glass-border)] animate-[nav-float-in_0.6s_ease-out]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-accent)] flex items-center justify-center shadow-[var(--shadow-glow)]">
            <span className="font-sans font-bold text-lg text-[var(--brand-bg)]">
              C1
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              CampusOne Admin
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Institutional Command Center
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--surface-soft)] border border-[var(--glass-border)] hover:bg-[var(--surface-soft-strong)] transition-all cursor-pointer"
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      <main className="w-full max-w-5xl flex flex-col gap-8">
        <section className="text-center md:text-left animate-fade-in-up">
          <h2 className="text-3xl font-extrabold font-serif mb-2">
            Welcome to the Campus Admin Dashboard
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl">
            Monitor institutional metrics, student coding leaderboards, live
            transport tracking, and system performance from a unified control
            panel.
          </p>
        </section>

        <div className="dashboard-grid animate-fade-in-up">
          {/* Card 1: Attendance Logs */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                Attendance Logs
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            </div>
            <div className="metric-number">92.4%</div>
            <p className="text-xs text-[var(--text-secondary)]">
              Average student presence across 18 departments
            </p>
          </div>

          {/* Card 2: Smart Bus Tracking */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                Active Bus Routes
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
            </div>
            <div className="metric-number">14 / 16</div>
            <p className="text-xs text-[var(--text-secondary)]">
              Buses broadcasting live coordinates via socket channel
            </p>
          </div>

          {/* Card 3: Coding Leaderboard */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                Top Platform
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
            </div>
            <div className="metric-number">LeetCode</div>
            <p className="text-xs text-[var(--text-secondary)]">
              2,419 total student profiles synced this week
            </p>
          </div>

          {/* Card 4: AI Career Guidance Logs */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                RAG Queries
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
            </div>
            <div className="metric-number">1.2k</div>
            <p className="text-xs text-[var(--text-secondary)]">
              Queries resolved by LangChain + Ollama pipeline
            </p>
          </div>
        </div>

        <section className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-[var(--surface-soft)] border border-[var(--glass-border)] animate-fade-in-up">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-base font-bold mb-1">
              Verify System Core Functions
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Perform mock analytics checks and trigger sync scripts
            </p>
          </div>
          <button
            onClick={() => setClickCount((prev) => prev + 1)}
            className="btn-primary text-sm shrink-0"
          >
            Run Sync Check ({clickCount})
          </button>
        </section>
      </main>

      <footer className="mt-16 text-center text-xs text-[var(--text-muted)] border-t border-[var(--glass-border)] pt-8 w-full max-w-5xl">
        <p>
          &copy; {new Date().getFullYear()} CampusOne Inc. Built with Vite,
          React 19, and Tailwind CSS v4.
        </p>
      </footer>
    </div>
  );
}

export default App;
