import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import type {PropsWithOnClose} from '@/contexts/dialog-context';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useTRPC} from '@/lib/trpc';
import {useForm} from '@tanstack/react-form';
import {useMutation} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {z} from 'zod';

const schema = z.object({
  name: z.string().min(3),
});

export function CreateChannelDialog({onClose}: PropsWithOnClose) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

  const trpc = useTRPC();
  const {mutateAsync: createChannelMutationAsync, isPending} = useMutation(
    trpc.channels.create.mutationOptions(),
  );

  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async props => {
      await createChannelMutationAsync(
        {name: props.value.name, workspaceId},
        {
          onSuccess: async data => {
            navigate({
              to: '/workspaces/$id/channel/$channelId',
              params: {id: workspaceId, channelId: data.id},
              replace: false,
            });
            form.reset();
            onClose();
          },
        },
      );
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a channel</DialogTitle>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name='name'>
            {field => {
              const invalid =
                !field.state.meta.isValid && field.state.meta.isTouched;
              const error = field.state.meta.errors[0]?.message;

              return (
                <div className='flex flex-col space-y-1'>
                  <Input
                    type='text'
                    name={field.name}
                    value={field.state.value}
                    disabled={isPending}
                    onChange={e => {
                      const value = e.target.value
                        .replace(/\s+/g, '-')
                        .toLowerCase();
                      console.log({value});
                      field.handleChange(value);
                    }}
                    onBlur={field.handleBlur}
                    placeholder='e.g. plan-budget'
                    {...(invalid && {
                      'aria-invalid': true,
                      'aria-describedby': field.name,
                    })}
                  />
                  {invalid && error && (
                    <p className='text-sm text-destructive' id={field.name}>
                      {error}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>
          <div className='flex justify-end'>
            <Button type='submit' disabled={isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
