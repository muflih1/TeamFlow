import {Button} from '@/components/ui/button';
import {WorkspaceSidebarListCell} from './workspace-sidebar-list-cell';
import {Link} from '@tanstack/react-router';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';

interface WorkspaceSidebarListUserItemProps {
  id: string;
  label?: string;
  image?: {uri: string} | null;
}

export function WorkspaceSidebarListUserItem({
  id,
  image,
  label = 'Member',
}: WorkspaceSidebarListUserItemProps) {
  const workspaceId = useWorkspaceId();
  return (
    <WorkspaceSidebarListCell>
      <Button
        variant='transparent'
        size='sm'
        className='flex flex-row items-center justify-start text-start font-medium h-7 px-4 text-sm overflow-hidden touch-manipulation text-[#f9edffcc]'
        render={
          <Link
            role='link'
            tabIndex={0}
            to='/workspaces/$id/members/$memberId'
            params={{id: workspaceId, memberId: id}}
          />
        }
        nativeButton={false}
      >
        <Avatar className='size-5 mr-2'>
          <AvatarImage src={image?.uri} alt='Avatar' />
          <AvatarFallback className='text-xs'>{label.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className='text-sm truncate'>{label}</span>
      </Button>
    </WorkspaceSidebarListCell>
  );
}
