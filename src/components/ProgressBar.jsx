import React from 'react';

export function ProgressBar({ 
  value = 0, 
  max = 100, 
  limit, 
  colorClass = 'bg-brand-30', 
  warningColorClass = 'bg-red-500',
  isWarning = false,
  className = '',
  orientation = 'horizontal',
  showGlow = false
}) {
  // Safeguard against NaN or infinity
  const safeValue = isNaN(value) ? 0 : value;
  const safeMax = isNaN(max) || max <= 0 ? 100 : max;
  
  const fillPct = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));
  const limitPct = limit !== undefined && !isNaN(limit) ? Math.min(100, Math.max(0, (limit / safeMax) * 100)) : null;

  const activeColorClass = isWarning ? warningColorClass : colorClass;
  
  // Extract base color for glow effect if needed (rough approximation)
  // We can just rely on the colorClass to have a shadow if glow is needed, 
  // or apply a generic white/accent glow.
  const glowClass = showGlow ? 'shadow-[0_0_12px_currentColor]' : '';

  if (orientation === 'vertical') {
    return (
      <div 
        className={`w-full bg-brand-60/30 relative overflow-hidden flex items-end ${className || 'rounded-t-sm h-full'}`}
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div 
          className={`w-full transition-all ${activeColorClass} ${glowClass}`}
          style={{ height: `${fillPct}%`, transitionDuration: '33ms' }}
        />
        {limitPct !== null && (
          <div 
            className="absolute left-0 right-0 h-[2px] bg-white shadow-sm z-10"
            style={{ bottom: `${limitPct}%` }}
          />
        )}
      </div>
    );
  }

  // Horizontal (LiveFuel style)
  return (
    <div 
      className={`w-full bg-brand-60/30 rounded-full relative overflow-hidden ${className || 'h-2'}`}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
    >
      <div 
        className={`h-full transition-all duration-300 ${activeColorClass} ${glowClass}`}
        style={{ width: `${fillPct}%` }}
      />
      {limitPct !== null && (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm z-10"
          style={{ left: `${limitPct}%` }}
        />
      )}
    </div>
  );
}
