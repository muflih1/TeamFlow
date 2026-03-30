import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {TrashIcon} from 'lucide-react';
import {useUpdateWorkspaceDialog} from '../hooks/use-update-workspace-dialog';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';
import {toast} from 'sonner';
import {useConfirm} from '@/hooks/use-confirm';

export function PreferencesDialog({
  workspace,
  onClose,
}: {
  onClose: () => void;
  workspace: any;
}) {
  const workspaceId = useWorkspaceId();
  const trpc = useTRPC();

  const {mutateAsync: deleteWorkspaceMutationAsync, isPending} = useMutation(
    trpc.workspaces.delete.mutationOptions(),
  );

  const [ConfirmationDialog, confirm] = useConfirm({
    title: 'Are you sure?',
    description: 'This action is irreversable.',
  });

  const openUpdateWorkspaceDialog = useUpdateWorkspaceDialog({
    onSuccess: data => {
      data;
    },
    initialValue: workspace.name,
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='p-0 bg-gray-50 overflow-hidden'>
        <DialogHeader className='p-4 border-b border-solid bg-white'>
          <DialogTitle>{workspace.name}</DialogTitle>
        </DialogHeader>
        <div className='px-4 pb-4 flex flex-col gap-y-2'>
          <div className='px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50'>
            <div className='flex flex-row items-center justify-between'>
              <p className='text-sm font-semibold'>Workspace name</p>
              <button
                type='button'
                tabIndex={0}
                className='inlne bg-transparent border-0 border-none select-none touch-manipulation text-sm font-semibold text-[#1264a3] hover:underline cursor-pointer'
                onClick={openUpdateWorkspaceDialog}
              >
                Edit
              </button>
            </div>
            <p className='text-sm'>{workspace.name}</p>
          </div>
          <button
            type='button'
            tabIndex={0}
            disabled={isPending}
            className='flex flex-row items-center space-x-2 px-5 py-4 bg-white rounded-lg cursor-pointer border border-solid border-border hover:bg-gray-50 text-destructive touch-manipulation select-none'
            onClick={async () => {
              if (!(await confirm())) return;

              await deleteWorkspaceMutationAsync(
                {id: workspaceId},
                {
                  onSuccess: () => {
                    toast.success('Workspace deleted');
                  },
                  onError: () => {
                    toast.error('Failed to delete workspace');
                  },
                },
              );
            }}
          >
            <TrashIcon size={16} />
            <p className='text-sm font-semibold'>Delete workspace</p>
          </button>
          <ConfirmationDialog />
        </div>
      </DialogContent>
    </Dialog>
  );
}
