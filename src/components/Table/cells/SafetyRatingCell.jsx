import React, { memo } from 'react';
import { TableCell } from '../Table';
import { SafetyRatingBadge } from '../../DriverBadges';

export const SafetyRatingCell = memo(({ licLevel, licString }) => (
  <TableCell align="text-center">
    <SafetyRatingBadge licLevel={licLevel} licString={licString} />
  </TableCell>
));
SafetyRatingCell.displayName = 'SafetyRatingCell';
