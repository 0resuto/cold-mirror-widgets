import React from 'react';
import { motion } from 'framer-motion';

export const TableContainer = ({ children, isLocked, className = '' }) => (
  <div 
    className={`flex flex-col w-full h-fit max-h-full rounded-xl overflow-hidden transition-all duration-300 ${
      isLocked ? 'border-transparent shadow-none' : 'border border-brand-60/60 shadow-xl backdrop-blur-sm'
    } ${className}`}
    style={{
      backgroundColor: 'var(--widget-bg-color, rgba(30, 30, 36, 0.6))'
    }}
  >
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  </div>
);

export const TableHead = ({ children, isLocked, className = '' }) => (
  <thead className={`sticky top-0 z-10 shadow-sm transition-colors ${isLocked ? 'bg-brand-60/95 backdrop-blur-md' : 'bg-brand-60/80'} ${className}`}>
    <tr>{children}</tr>
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`text-xs font-mono ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, isPlayer, isPaceCar, className = '', ...props }) => (
  <motion.tr 
    layout
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className={`border-b transition-colors ${
      isPaceCar ? 'opacity-50 border-brand-60/20' : 
      isPlayer ? 'bg-gradient-to-r from-white/20 to-white/5 border-transparent shadow-[0_3px_8px_rgba(0,0,0,0.4),0_1px_0_#2b2d34,0_-1px_0_#2b2d34,inset_0_1px_0_rgba(255,255,255,0.15)] relative z-20' : 
      'border-brand-60/20'
    } ${className}`}
    {...props}
  >
    {children}
  </motion.tr>
);

export const TableHeadCell = ({ children, width = 'w-auto', align = 'text-left', title, className = '' }) => {
  const hasPx = className.includes('px-') || className.includes('p-');
  return (
    <th className={`py-1 ${hasPx ? '' : 'px-2'} first:pl-2.5 last:pr-2.5 font-condensed text-[9px] font-normal text-brand-10/50 tracking-tight whitespace-nowrap align-middle ${width} ${align} ${className}`} title={title}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, align = 'text-left', className = '', ...props }) => {
  const hasPx = className.includes('px-') || className.includes('p-');
  return (
    <td className={`py-1 ${hasPx ? '' : 'px-2'} first:pl-2.5 last:pr-2.5 align-middle ${align} ${className}`} {...props}>
      {children}
    </td>
  );
};
