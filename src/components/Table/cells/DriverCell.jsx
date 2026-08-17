import React, { memo } from 'react';
import { TableCell } from '../Table';

export const DriverCell = memo(({ name, isPlayer, maxWidth = 'max-w-[140px]' }) => (
  <TableCell>
    <div className="flex items-center gap-2">
      <span className={`font-sans truncate inline-block ${maxWidth} align-middle ${isPlayer ? 'font-black text-white text-[13px] drop-shadow-md' : 'font-semibold text-brand-10'}`}>
        {name || 'Unknown'}
      </span>
    </div>
  </TableCell>
));
DriverCell.displayName = 'DriverCell';
