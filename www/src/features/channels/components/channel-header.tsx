import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {useCurrentMembershipQuery} from '@/features/memberships/hooks/use-current-membership-query';
import {useConfirm} from '@/hooks/use-confirm';
import {useTRPC} from '@/lib/trpc';
import {useForm} from '@tanstack/react-form';
import {useMutation} from '@tanstack/react-query';
import {useParams} from '@tanstack/react-router';
import {ChevronDownIcon, TrashIcon} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {z} from 'zod';

type ChannelHeaderProps = {
  channel: any;
};

const schema = z.object({
  name: z.string().min(3).max(80),
});

export function ChannelHeader({channel}: ChannelHeaderProps) {
  const [editChannelDialogOpen, setEditChannelDialogOpen] = useState(false);
  const {channelId, id: workspaceId} = useParams({
    from: '/(workspace)/_layout/workspaces/$id/channel/$channelId',
  });
  const [DeleteConfirmationDialog, confirm] = useConfirm({
    title: 'Delete this channel?',
    description:
      'You are about to delete this channel. This action cannot be undone',
  });

  const trpc = useTRPC();

  const {data: membership} = useCurrentMembershipQuery({workspaceId});
  const {mutate: updateChannelMutationSync, isPending: isChannelUpdating} =
    useMutation(trpc.channels.update.mutationOptions());
  const {mutate: deleteChannelMutationSync, isPending: isChannelDeleting} =
    useMutation(trpc.channels.delete.mutationOptions());

  const form = useForm({
    defaultValues: {
      name: channel.name,
    },
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: props => {
      updateChannelMutationSync(
        {id: channelId, name: props.value.name},
        {
          onSuccess: () => {
            toast.success('Channel updated');
            setEditChannelDialogOpen(false);
          },
          onError: () => {
            toast.error('Failed to update channel');
          },
        },
      );
    },
  });

  useEffect(() => {
    form.reset();
  }, [channel.id]);

  async function handleDelete() {
    const ok = await confirm();
    if (!ok) {
      return;
    }
    deleteChannelMutationSync(
      {id: channelId},
      {
        onSuccess: async () => {
          toast.success('Channel deleted');
        },
        onError: () => {
          toast.error('Failed to delete the channel');
        },
      },
    );
  }

  return (
    <div className='bg-white border-b h-12.25 flex items-center px-4 overflow-hidden'>
      <Dialog>
        <DialogTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              className='text-lg font-semibold px-2 overflow-hidden w-auto'
              size='sm'
            />
          }
        >
          <span className='truncate'># {channel.name}</span>
          <ChevronDownIcon size={12} className='ml-2' />
        </DialogTrigger>
        <DialogContent className='p-0 bg-gray-50 overflow-hidden'>
          <DialogHeader className='p-4 border-b bg-white'>
            <DialogTitle># {channel.name}</DialogTitle>
          </DialogHeader>
          <div className='px-4 pb-4 flex flex-col gap-y-2'>
            <Dialog
              open={editChannelDialogOpen}
              onOpenChange={
                membership?.permissions.has('org:channels:update')
                  ? setEditChannelDialogOpen
                  : undefined
              }
            >
              <DialogTrigger
                render={
                  <button
                    className='px-5 py-4 bg-white rounded-lg cursor-pointer border hover:bg-gray-50 touch-manipulation flex flex-col items-start justify-center'
                    type='button'
                    tabIndex={0}
                  />
                }
              >
                <div className='flex flex-row items-center justify-between grow w-full'>
                  <p className='text-sm font-semibold'>Channel name</p>
                  {membership?.permissions.has('org:channels:update') && (
                    <p className='text-sm font-medium touch-manipulation select-none hover:underline text-[#1264a3] inline'>
                      Edit
                    </p>
                  )}
                </div>
                <p className='text-sm'># {channel.name}</p>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename this channel</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                  }}
                  noValidate
                >
                  <form.Field name='name'>
                    {field => {
                      return (
                        <Input
                          type='text'
                          id={field.name}
                          name={field.name}
                          disabled={isChannelUpdating}
                          value={field.state.value}
                          onChange={e => {
                            const value = e.target.value.replace(/\s+/g, '-');
                            field.handleChange(value);
                          }}
                          onBlur={field.handleBlur}
                          placeholder='e.g. plan-budget'
                        />
                      );
                    }}
                  </form.Field>
                  <DialogFooter className='mt-4'>
                    <DialogClose
                      render={
                        <Button
                          type='button'
                          variant='outline'
                          disabled={isChannelUpdating}
                        />
                      }
                    >
                      Cancel
                    </DialogClose>
                    <Button
                      type='submit'
                      tabIndex={isChannelUpdating ? -1 : 0}
                      disabled={isChannelUpdating}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {membership?.permissions.has('org:channels:delete') && (
              <>
                <button
                  type='button'
                  tabIndex={isChannelDeleting ? -1 : 0}
                  disabled={isChannelDeleting}
                  className='flex items-center justify-center space-x-2 px-5 py-4 bg-white hover:bg-gray-50 rounded-lg cursor-pointer select-none touch-manipulation text-sm font-semibold text-destructive border border-solid border-border'
                  onClick={handleDelete}
                >
                  <TrashIcon size={16} />
                  <span>Delete channel</span>
                </button>
                <DeleteConfirmationDialog />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
