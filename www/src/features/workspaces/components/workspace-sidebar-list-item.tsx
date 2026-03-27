import {Button} from '@/components/ui/button';
import {Link} from '@tanstack/react-router';
import type {LucideIcon} from 'lucide-react';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {WorkspaceSidebarListCell} from './workspace-sidebar-list-cell';

interface WorkspaceSidebarListItemProps {
  label: string;
  id: string;
  icon: LucideIcon;
}

export function WorkspaceSidebarListItem({
  label,
  icon: Icon,
  id,
}: WorkspaceSidebarListItemProps) {
  const workspaceId = useWorkspaceId();
  return (
    <WorkspaceSidebarListCell>
      <Button
        variant='transparent'
        size='sm'
        className='w-full overflow-hidden touch-manipulation inline-flex items-center justify-start text-start'
        render={
          <Link
            role='link'
            tabIndex={0}
            to='/workspaces/$id/channel/$channelId'
            params={{id: workspaceId, channelId: id}}
          />
        }
        nativeButton={false}
      >
        <Icon size={14} className='mr-1 shrink-0' />
        <span className='mx-w-full block truncate text-sm'>{label}</span>
      </Button>
    </WorkspaceSidebarListCell>
  );
}
