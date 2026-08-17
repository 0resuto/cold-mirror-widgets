import React, { memo } from 'react';
import { TableCell } from '../Table';
import { ClassBadge } from '../../DriverBadges';

export const ClassCell = memo(({ colorInt, shortName }) => (
  <TableCell align="text-center">
    <ClassBadge colorInt={colorInt} shortName={shortName} />
  </TableCell>
));
ClassCell.displayName = 'ClassCell';
