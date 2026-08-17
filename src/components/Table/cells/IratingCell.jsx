import React, { memo } from 'react';
import { TableCell } from '../Table';
import { formatIrating } from '../../../utils/tableFormatters';

export const IratingCell = memo(({ irating, isPlayer }) => (
  <TableCell 
    align="text-center" 
    className={`font-semibold ${isPlayer ? 'text-white' : 'text-brand-10/90'}`}
  >
    {formatIrating(irating)}
  </TableCell>
));
IratingCell.displayName = 'IratingCell';
