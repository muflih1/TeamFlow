import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {useTRPC} from '@/lib/trpc';
import {useForm} from '@tanstack/react-form';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {toast} from 'sonner';
import {z} from 'zod';

const schema = z.object({
  name: z.string().min(3),
});

export function CreateWorkspaceDialog({onClose}: {onClose(): void}) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const trpc = useTRPC();
  const {mutateAsync: createWorkspace, isPending} = useMutation(
    trpc.workspaces.create.mutationOptions({}),
  );

  const form = useForm({
    defaultValues: {name: ''},
    validators: {onChange: schema, onSubmit: schema},
    onSubmit: async props => {
      await createWorkspace(
        {name: props.value.name},
        {
          onSuccess: data => {
            form.reset();
            toast.success('Workspace created');
            queryClient.invalidateQueries(trpc.workspaces.list.queryOptions());
            navigate({to: '/workspaces/$id', params: {id: data.workspace.id}});
            onClose();
          },
        },
      );
    },
  });

  return (
    <Dialog
      open={true}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a workspace</DialogTitle>
        </DialogHeader>
        <form
          className='space-y-4'
          method='post'
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.Field name='name'>
            {field => {
              const invalid = !field.state.meta.isValid;
              const touched = field.state.meta.isTouched;
              const error = field.state.meta.errors[0]?.message;

              return (
                <div>
                  <Input
                    type='text'
                    disabled={isPending}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoFocus
                    placeholder="Workspace name e.g. 'Work', 'Personal', 'Home'"
                    {...(invalid &&
                      touched && {
                        'aria-invalid': true,
                        'aria-describedby': field.name,
                      })}
                  />

                  {invalid && touched && error != null && (
                    <div
                      id={field.name}
                      className='mt-0.75 text-sm text-destructive'
                    >
                      {error}
                    </div>
                  )}
                </div>
              );
            }}
          </form.Field>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
