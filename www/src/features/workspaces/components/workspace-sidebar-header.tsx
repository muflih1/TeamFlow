import {Tooltip} from '@/components/tooltip';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {ChevronDownIcon, ListFilterIcon, SquarePenIcon} from 'lucide-react';
import {usePreferencesDialog} from '../hooks/use-preferences-dialog';
import {useInviteDialog} from '../hooks/use-invite-dialog';

export function WorkspaceSidebarHeader({
  workspace,
  canManage,
  canInvite,
}: {
  workspace: {
    id: string;
    name: string;
    joinCode: string;
    createdAt: Date;
    updatedAt: Date;
  };
  canManage: boolean;
  canInvite: boolean;
}) {
  const openPreferencesDialog = usePreferencesDialog({
    workspace,
  });

  const openInviteDialog = useInviteDialog({
    name: workspace.name,
    joinCode: workspace.joinCode,
  });

  return (
    <div className='flex items-center justify-between px-4 h-12.25 gap-0.5'>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='transparent'
              size='sm'
              className='font-semibold text-lg overflow-hidden w-auto p-1.5'
            />
          }
        >
          <span>{workspace.name}</span>
          <ChevronDownIcon size={16} className='ml-1 shrink-0' />
        </DropdownMenuTrigger>
        <DropdownMenuContent side='bottom' align='start' className='w-64'>
          <DropdownMenuItem className='cursor-pointer capitalize'>
            <div className='size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-xl rounded-lg flex items-center justify-center mr-2'>
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className='flex flex-col items-start'>
              <p className='flex-bold'>{workspace.name}</p>
              <p className='text-xs text-muted-foreground'>Active workspace</p>
            </div>
          </DropdownMenuItem>
          {canInvite && (
            <>
              <DropdownMenuSeparator orientation='horizontal' />
              <DropdownMenuItem
                className='cursor-pointer py-2'
                onClick={openInviteDialog}
              >
                Invite people to {workspace.name}
              </DropdownMenuItem>
            </>
          )}
          {canManage && (
            <>
              <DropdownMenuSeparator orientation='horizontal' />
              <DropdownMenuItem
                className='cursor-pointer py-2'
                onClick={openPreferencesDialog}
              >
                Preferences
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className='flex items-center gap-0 5'>
        <Tooltip tooltip='Filter conversations' position='bottom'>
          <Button variant='transparent' size='icon-sm'>
            <ListFilterIcon size={16} />
          </Button>
        </Tooltip>
        <Tooltip tooltip='New message' position='bottom'>
          <Button variant='transparent' size='icon-sm'>
            <SquarePenIcon size={16} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
