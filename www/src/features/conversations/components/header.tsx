import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {ChevronDownIcon} from 'lucide-react';
import type {AppRouter} from '../../../../../api/src/trpc/routers/_app';
import type React from 'react';

type HeaderProps = {
  member: Awaited<ReturnType<AppRouter['memberships']['get']>>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function Header({member, onClick}: HeaderProps) {
  return (
    <div className='bg-white border-b h-12.25 flex items-center px-4 overflow-hidden'>
      <Button
        variant='ghost'
        className='text-lg font-semibold px-2 overflow-hidden w-auto'
        size='sm'
        onClick={onClick}
      >
        <Avatar className='size-6 mr-2'>
          <AvatarImage src={member?.image ?? undefined} alt='' />
          <AvatarFallback>{member?.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span>{member?.name}</span>
        <ChevronDownIcon size={10} className='ml-2' />
      </Button>
    </div>
  );
}
