import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {useNavigate} from '@tanstack/react-router';
import {LoaderIcon, PlusIcon} from 'lucide-react';
import {useCreateWorkspaceDialog} from '../hooks/use-create-workspace-dialog';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {useGetWorkspace} from '../hooks/use-get-workspace';
import {useListWorkspaces} from '../hooks/use-list-workspaces';

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const openCreateWorkspaceDialog = useCreateWorkspaceDialog();

  const workspaceId = useWorkspaceId();

  const {data: workspace, isLoading: workspaceLoading} =
    useGetWorkspace(workspaceId);
  const {data: workspaces, isLoading: workspacesLoading} = useListWorkspaces();

  const filteredWorkspaces = workspaces?.filter(
    workspace => workspace.id !== workspaceId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className='size-9 relative overflow-hidden bg-[#ababad] hover:bg-[#ababad]/80 text-slate-800 font-semibold text-xl' />
        }
      >
        {workspaceLoading ? (
          <LoaderIcon size={24} className='animate-spin shrink-0' />
        ) : (
          workspace?.name.charAt(0).toUpperCase()
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side='bottom' align='start' className='w-64'>
        <DropdownMenuItem
          className='cursor-pointer flex flex-col justify-start items-start capitalize gap-y-0'
          onClick={() =>
            navigate({
              to: '/workspaces/$id',
              params: {id: workspace?.id as string},
            })
          }
        >
          {workspace?.name}
          <span className='text-xs text-muted-foreground'>
            Active workspace
          </span>
        </DropdownMenuItem>

        {filteredWorkspaces?.map(workspace => (
          <DropdownMenuItem
            key={workspace.id}
            className='cursor-pointer capitalize'
            onClick={() =>
              navigate({to: '/workspaces/$id', params: {id: workspace.id}})
            }
          >
            <div className='size-9 relative overflow-hidden bg-[#616061] text-white text-lg font-semibold rounded-lg flex items-center justify-center mr-2'>{workspace.name.charAt(0).toUpperCase()}</div>
            {workspace.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem
          className='cursor-pointer'
          onClick={openCreateWorkspaceDialog}
        >
          <div className='size-9 relative overflow-hidden bg-[#f2f2f2] text-slate-800 text-lg font-semibold rounded-lg flex items-center justify-center mr-2'>
            <PlusIcon size={20} />
          </div>
          Create a new workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
