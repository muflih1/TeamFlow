import {createFileRoute, Link} from '@tanstack/react-router';
import {z} from 'zod';
import VerificationInput from 'react-verification-input';
import {Button} from '@/components/ui/button';
import {ArrowLeftIcon} from 'lucide-react';
import {useTRPC} from '@/lib/trpc';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {useForm} from '@tanstack/react-form';
import {toast} from 'sonner';
import {useEffect} from 'react';

export const Route = createFileRoute('/(workspace)/join/$workspaceId')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    await context.queryClient.prefetchQuery(
      context.trpc.workspaces.getPublicInfo.queryOptions({
        workspaceId: params.workspaceId,
      }),
    );
  },
});

const schema = z.object({
  code: z.string().nonempty().length(6),
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const workspaceId = Route.useParams({select: param => param.workspaceId});
  const trpc = useTRPC();

  const {data} = useSuspenseQuery(
    trpc.workspaces.getPublicInfo.queryOptions({workspaceId}),
  );

  const isMember = !!data?.isMember;

  useEffect(() => {
    if (isMember) {
      navigate({to: '/workspaces/$id', params: {id: data.id}, replace: true});
    }
  }, [isMember, data?.id, navigate]);

  const {mutate, isPending} = useMutation(
    trpc.workspaces.join.mutationOptions(),
  );

  const form = useForm({
    defaultValues: {
      code: '',
    },
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async props => {
      mutate(
        {workspaceId, code: props.value.code},
        {
          onSuccess: data => {
            navigate({
              to: '/workspaces/$id',
              params: {id: data.id},
              replace: true,
            });
            toast.success('Workspace joined');
          },
          onError: err => {
            toast.error(err.message);
          },
        },
      );
    },
  });

  return (
    <div className='h-full flex flex-col gap-y-8 items-center justify-center bg-white p-8 rounded-lg shadow-md'>
      <div className='flex flex-col gap-y-4 items-center justify-center max-w-md'>
        <div className='flex flex-col gap-y-2 items-center justify-center'>
          <h1 className='text-2xl font-bold'>Join {data?.name}</h1>
          <p className='text-md text-muted-foreground'>
            Enter the workspace code to join
          </p>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
          method='POST'
          className='space-y-1'
        >
          <form.Field name='code'>
            {field => {
              const invalid =
                !field.state.meta.isValid && field.state.meta.isTouched;

              return (
                <>
                  <VerificationInput
                    autoFocus
                    length={6}
                    classNames={{
                      container:
                        'flex gap-x-2 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed',
                      character:
                        'uppercase h-auto rounded-md border border-gray-300 flex items-center justify-center text-lg font-medium text-gray-500',
                      characterInactive: 'bg-muted',
                      characterSelected: 'bg-white text-black',
                      characterFilled: 'bg-white text-black',
                    }}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    onComplete={() => {
                      form.handleSubmit();
                    }}
                    inputProps={{id: field.name, name: field.name}}
                    containerProps={{
                      'aria-invalid': invalid ? true : undefined,
                      'aria-description': invalid ? field.name : undefined,
                      'aria-disabled': isPending,
                    }}
                  />
                </>
              );
            }}
          </form.Field>
        </form>
      </div>
      <div className='flex gap-x-4'>
        <Button
          size='lg'
          variant='outline'
          className='px-10'
          render={<Link to='/' role='link' tabIndex={0} />}
          nativeButton={false}
        >
          <ArrowLeftIcon />
          Back to home
        </Button>
      </div>
    </div>
  );
}
