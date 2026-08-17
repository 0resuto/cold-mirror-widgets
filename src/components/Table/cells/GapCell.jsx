import React, { memo } from 'react';
import { TableCell } from '../Table';
import { formatGap, getGapColor } from '../../../utils/tableFormatters';

export const GapCell = memo(({ gap, isPlayer, isStandings = false }) => (
  <TableCell 
    align="text-right" 
    className={`font-mono font-bold text-[11px] ${getGapColor(gap, isPlayer, isStandings)}`}
  >
    {formatGap(gap, isPlayer, isStandings)}
  </TableCell>
));
GapCell.displayName = 'GapCell';
