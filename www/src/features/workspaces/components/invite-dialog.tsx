import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {PropsWithOnClose} from '@/contexts/dialog-context';
import {CopyIcon, RefreshCcwIcon} from 'lucide-react';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {toast} from 'sonner';
import {useTRPC} from '@/lib/trpc';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useConfirm} from '@/hooks/use-confirm';
import {useState} from 'react';

export interface InviteDialogProps {
  name: string;
  joinCode: string;
}

export function InviteDialog({
  onClose,
  name,
  joinCode,
}: PropsWithOnClose<InviteDialogProps>) {
  const [value, setValue] = useState(joinCode);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [ConfirmationDialog, confirm] = useConfirm({
    title: 'Are you sure?',
    description:
      'This will deactivate the current invite code and generate a new one.',
  });

  const trpc = useTRPC();
  const {mutateAsync: newJoinCode, isPending} = useMutation(
    trpc.workspaces.newJoinCode.mutationOptions(),
  );

  async function handleNewCode() {
    const ok = await confirm();
    if (!ok) return;

    await newJoinCode(
      {
        workspaceId,
      },
      {
        onSuccess: async data => {
          toast.success('Invite code regenerated');
          await queryClient.invalidateQueries(
            trpc.workspaces.get.queryOptions({id: workspaceId}),
          );
          setValue(data.joinCode);
        },
        onError: () => {
          toast.error('Failed to regenerate invite code');
        },
      },
    );
  }

  function handleCopy() {
    const inviteLink = `${window.location.origin}/join/${workspaceId}`;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        toast.success('Link copied to clipboard.');
      })
      .catch(() => {});
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite people to {name}</DialogTitle>
            <DialogDescription>
              Use the below code to invite people to your workspace
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-y-4 items-center justify-center py-10'>
            <p className='text-4xl font-bold tracking-widest uppercase'>
              {value}
            </p>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleCopy}
            >
              Copy link
              <CopyIcon size={16} className='ml-2' />
            </Button>
          </div>
          <DialogFooter className='flex items-center justify-end'>
            <Button type='button' onClick={handleNewCode} disabled={isPending}>
              New code
              <RefreshCcwIcon size={16} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog />
    </>
  );
}
