import {UserButton} from '@/features/auth/components/user-button';
import { WorkspaceSwitcher } from './workspace-switcher';

export function Sidebar() {
  return (
    <div
      role='navigation'
      className='w-17.5 bg-[#481349] h-full gap-y-4 flex flex-col items-center pt-2.25 pb-4'
    >
      <WorkspaceSwitcher />
      <div className='flex flex-col items-center justify-center gap-y-1 mt-auto'>
        <UserButton />
      </div>
    </div>
  );
}
