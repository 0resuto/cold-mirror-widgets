import React, { memo } from 'react';
import { TableCell } from '../Table';
import { ClassBadge } from '../../DriverBadges';

export const ClassCell = memo(({ colorInt, shortName, showName = false }) => (
  <TableCell align="text-center" className={showName ? '' : 'px-[3px] w-[9px]'}>
    <ClassBadge colorInt={colorInt} shortName={shortName} showName={showName} />
  </TableCell>
));
ClassCell.displayName = 'ClassCell';
