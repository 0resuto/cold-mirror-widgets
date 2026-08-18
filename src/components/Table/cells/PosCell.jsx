import React, { memo } from 'react';
import { TableCell } from '../Table';

export const PosCell = memo(({ pos, isPlayer }) => (
  <TableCell 
    align="text-center" 
    className={`font-bold text-[13px] border-l-2 ${isPlayer ? 'text-white border-white/60 bg-white/5' : 'text-brand-10/90 border-transparent'}`}
  >
    {pos > 0 ? pos : '-'}
  </TableCell>
));
PosCell.displayName = 'PosCell';
