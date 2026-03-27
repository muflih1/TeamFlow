import * as React from 'react';
import {Avatar as AvatarPrimitive} from '@base-ui/react/avatar';

import {cn} from '@/lib/utils';

function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      data-size={size}
      className={cn(
        'group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({className, ...props}: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn(
        'aspect-square size-full rounded-full object-cover',
        className,
      )}
      {...props}
    />
  );
}

const AVATAR_COLORS = [
  {bg: 'bg-red-700', text: 'text-red-700'},
  {bg: 'bg-orange-700', text: 'text-orange-700'},
  {bg: 'bg-amber-700', text: 'text-amber-700'},
  {bg: 'bg-yellow-700', text: 'text-yellow-700'},
  {bg: 'bg-lime-700', text: 'text-lime-700'},
  {bg: 'bg-green-700', text: 'text-green-700'},
  {bg: 'bg-emerald-700', text: 'text-emerald-700'},
  {bg: 'bg-teal-700', text: 'text-teal-700'},
  {bg: 'bg-cyan-700', text: 'text-cyan-700'},
  {bg: 'bg-sky-700', text: 'text-sky-700'},
  {bg: 'bg-blue-700', text: 'text-blue-700'},
  {bg: 'bg-indigo-700', text: 'text-indigo-700'},
  {bg: 'bg-purple-700', text: 'text-purple-700'},
  {bg: 'bg-pink-700', text: 'text-pink-700'},
];

function getAvatarColor(seed?: string) {
  if (!seed) return AVATAR_COLORS[0];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function AvatarFallback({
  className,
  children,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  const seed = typeof children === 'string' ? children : undefined;

  const color = getAvatarColor(seed);

  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground group-data-[size=sm]/avatar:text-xs',
        color.bg,
        'text-white',
        className,
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({className, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='avatar-badge'
      className={cn(
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='avatar-group'
      className={cn(
        'group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='avatar-group-count'
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
};
