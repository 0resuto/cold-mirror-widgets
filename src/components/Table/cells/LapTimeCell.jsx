import React, { memo } from 'react';
import { TableCell } from '../Table';
import { formatLapTime } from '../../../utils/tableFormatters';

export const LapTimeCell = memo(({ seconds, isPlayer, opacity = '', isSessionBest = false }) => {
  let textColorClass = isPlayer ? 'text-white' : `text-brand-10/${opacity || '90'}`;
  if (isSessionBest) {
    textColorClass = 'text-purple-500 font-bold';
  }

  return (
    <TableCell 
      align="text-right" 
      className={`font-mono text-[10px] ${textColorClass}`}
    >
      {formatLapTime(seconds)}
    </TableCell>
  );
});
LapTimeCell.displayName = 'LapTimeCell';
