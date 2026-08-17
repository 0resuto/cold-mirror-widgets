export const formatGap = (gap, isPlayer, isStandings = false) => {
  if (isPlayer) return isStandings ? '-' : '0.0';
  
  if (isStandings) {
    if (!gap || gap <= 0) return '-';
    return `+${gap.toFixed(1)}`;
  }
  
  // For relative, gap can be negative (behind)
  if (gap === undefined || gap === null) return '-';
  return `${gap > 0 ? '+' : ''}${Math.abs(gap).toFixed(1)}`;
};

export const getGapColor = (gap, isPlayer, isStandings = false) => {
  if (isPlayer) return 'text-white font-bold';
  if (isStandings) return 'text-amber-400';
  
  // For relative, highlight ahead/behind
  if (!gap || gap === 0) return 'text-white';
  return gap > 0 ? 'text-accent-red' : 'text-accent-green';
};

export const formatIrating = (irating) => {
  return irating && irating > 0 ? `${(irating / 1000).toFixed(1)}k` : '-';
};

export const formatLapTime = (seconds) => {
  if (!seconds || seconds <= 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return mins > 0 ? `${mins}:${secs}` : secs;
};

export const getTrackPctText = (pct, trackSurface, onPitRoad) => {
  if (trackSurface === -1) {
    return { text: 'OUT', color: 'text-brand-10/30' };
  }
  if (onPitRoad === 1 || trackSurface === 1 || trackSurface === 2) {
    return { text: 'PIT', color: 'text-amber-400/80' };
  }
  return { text: `${(pct * 100).toFixed(1)}%`, color: '' };
};
