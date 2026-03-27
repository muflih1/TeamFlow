import {useTRPC} from '@/lib/trpc';
import {useSuspenseQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/(workspace)/_layout/workspaces/$id/')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    await context.queryClient.prefetchQuery(
      context.trpc.workspaces.get.queryOptions({id: params.id}),
    );
    await context.queryClient.prefetchQuery(
      context.trpc.workspaces.list.queryOptions(),
    );
  },
});

function RouteComponent() {
  const workspaceId = Route.useParams({select: params => params.id});

  const trpc = useTRPC();
  const {data, isLoading} = useSuspenseQuery(
    trpc.workspaces.get.queryOptions({id: workspaceId}),
  );

  return (
    <div>
      <div>
        Data: <pre>{JSON.stringify(data, null, 4)}</pre>
      </div>
    </div>
  );
}
