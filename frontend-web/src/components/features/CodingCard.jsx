import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, Share2, Award, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';

// Mock Data
const studentData = {
  name: "Jane Doe",
  department: "B.Tech CSE",
  id: "C1-2023-456",
  section: "A",
  globalSolved: 1452,
  contestCount: 34
};

const platformStats = [
  { name: 'LeetCode', solved: 450, rating: '1850', colorClass: 'bg-orange-500/15 text-orange-400', borderClass: 'border-orange-500/30' },
  { name: 'CodeChef', solved: 320, rating: '3 Star', colorClass: 'bg-rose-500/15 text-rose-400', borderClass: 'border-rose-500/30' },
  { name: 'Codeforces', solved: 150, rating: '1400', colorClass: 'bg-blue-500/15 text-blue-400', borderClass: 'border-blue-500/30' },
  { name: 'HackerRank', solved: 210, rating: '5 Star', colorClass: 'bg-emerald-500/15 text-emerald-400', borderClass: 'border-emerald-500/30' },
  { name: 'Skillrack', solved: 300, rating: 'Gold', colorClass: 'bg-cyan-500/15 text-cyan-400', borderClass: 'border-cyan-500/30' },
  { name: 'GitHub', solved: 22, rating: 'Repos', colorClass: 'bg-violet-500/15 text-violet-400', borderClass: 'border-violet-500/30' }
];

export function CodingCard() {
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#0f172a', // Ensure dark bg for export
      });
      const link = document.createElement('a');
      link.download = `algolog-${studentData.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The Card to Export */}
      <div 
        ref={cardRef} 
        className="w-full max-w-2xl p-6 nav-shell !m-0 relative overflow-hidden"
      >
        {/* Subtle radial background inside card */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(192,132,252,0.1),transparent_50%)] pointer-events-none" />
        
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--border-subtle)] pb-4 mb-6 relative z-10 gap-4">
          <div>
            <h3 className="text-2xl font-bold brand-text text-[var(--text-primary)]">{studentData.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {studentData.department} • {studentData.id} • Sec {studentData.section}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                <Award size={12} className="text-[var(--brand-accent)]" /> Total Solved
              </span>
              <span className="text-xl font-bold font-mono text-[var(--text-primary)]">{studentData.globalSolved}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                <Trophy size={12} className="text-amber-400" /> Contests
              </span>
              <span className="text-xl font-bold font-mono text-[var(--text-primary)]">{studentData.contestCount}</span>
            </div>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
          {platformStats.map(platform => (
            <motion.div 
              key={platform.name}
              whileHover={{ scale: 1.03 }}
              className={`p-4 rounded-xl border ${platform.borderClass} ${platform.colorClass} backdrop-blur-md flex flex-col justify-between h-28`}
            >
              <span className="font-semibold text-sm opacity-90">{platform.name}</span>
              <div>
                <div className="text-2xl font-bold font-mono leading-none mb-1">{platform.solved}</div>
                <div className="text-xs opacity-80">{platform.rating}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons (Not Exported) */}
      <div className="flex gap-3">
        <Button onClick={handleExport} disabled={isExporting}>
          <Download size={16} />
          {isExporting ? 'Generating...' : 'Download Badge'}
        </Button>
        <Button variant="secondary">
          <Share2 size={16} />
          Share Profile
        </Button>
      </div>
    </div>
  );
}
