import React, { memo } from 'react';
import { TableCell } from '../Table';
import { formatLapTime } from '../../../utils/tableFormatters';

export const LapTimeCell = memo(({ seconds, isPlayer, opacity = '' }) => (
  <TableCell 
    align="text-right" 
    className={`font-mono text-[10px] ${isPlayer ? 'text-white' : `text-brand-10/${opacity || '90'}`}`}
  >
    {formatLapTime(seconds)}
  </TableCell>
));
LapTimeCell.displayName = 'LapTimeCell';
