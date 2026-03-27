import {Button} from '@/components/ui/button';
import {InfoIcon, SearchIcon} from 'lucide-react';

export function Toolbar() {
  return (
    <nav className='bg-[#481349] flex items-center justify-between h-10 p-1.5'>
      <div className='flex-1 ' />
      <div className='min-w-70 max-w-160.5 grow-2 shrink'>
        <Button
          type='button'
          size={'sm'}
          className='bg-accent/25 hover:bg-accent/25 w-full justify-start h-7 px-2'
        >
          <SearchIcon size={20} className='text-white mr-2' />
          <span className='text-white text-xs'>Search workspace</span>
        </Button>
      </div>
      <div className='ml-auto flex-1 flex items-center justify-end'>
        <Button type='button' variant='transparent' size={'icon-sm'}>
          <InfoIcon size={24} className='txet-white' />
        </Button>
      </div>
    </nav>
  );
}
