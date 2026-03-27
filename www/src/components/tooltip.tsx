import * as TooltipImpl from '@/components/ui/tooltip';
import type React from 'react';

export function Tooltip({
  children,
  tooltip,
  position = 'bottom',
  align = 'center',
}: {
  children: React.ReactElement;
  tooltip: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}) {
  return (
    <TooltipImpl.Tooltip>
      <TooltipImpl.TooltipTrigger render={children} />
      <TooltipImpl.TooltipContent
        side={position}
        align={align}
        className='bg-black text-white border border-white/5'
      >
        <span className='text-xs font-medium block max-w-full'>{tooltip}</span>
      </TooltipImpl.TooltipContent>
    </TooltipImpl.Tooltip>
  );
}
