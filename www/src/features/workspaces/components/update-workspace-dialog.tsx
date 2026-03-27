import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {PropsWithOnClose} from '@/contexts/dialog-context';
import {useTRPC} from '@/lib/trpc';
import {useForm} from '@tanstack/react-form';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {z} from 'zod';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';

const schema = z.object({
  name: z.string().nonempty().min(3),
});

export function UpdateWorkspaceDialog({
  onClose,
  onSuccess,
  initialValue,
}: PropsWithOnClose<{
  initialValue: string;
  onSuccess?: (data: unknown) => void;
}>) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const trpc = useTRPC();
  const {mutateAsync: updateWorkspace, isPending} = useMutation(
    trpc.workspaces.update.mutationOptions({}),
  );

  const form = useForm({
    defaultValues: {
      name: initialValue,
    },
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async props => {
      await updateWorkspace(
        {name: props.value.name, id: workspaceId},
        {
          onSuccess: async data => {
            if (onSuccess) {
              onSuccess(data);
            }

            toast.success('Workspace updated');

            await queryClient.invalidateQueries(
              trpc.workspaces.get.queryOptions({id: workspaceId}),
            );

            onClose();
          },
          onError: () => {
            toast.error('Failed to update workspace');
          },
        },
      );
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename this workspace</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className='space-y-4'
        >
          <form.Field name='name'>
            {field => (
              <div className='flex flex-col space-y-0 5'>
                <Input
                  disabled={isPending}
                  type='text'
                  name={field.name}
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  autoFocus
                  placeholder="Workspace name e.g. 'Work', 'Personal', 'Home'"
                />
              </div>
            )}
          </form.Field>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' className='px-10' disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
