import {UserButton} from '@/features/auth/components/user-button';
import {useCreateWorkspaceDialog} from '@/features/workspaces/hooks/use-create-workspace-dialog';
import {useTRPC} from '@/lib/trpc';
import {useSuspenseQuery} from '@tanstack/react-query';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {useEffect, useRef} from 'react';

export const Route = createFileRoute('/_protected/')({
  component: App,
  loader: async ({context}) =>
    context.queryClient.prefetchQuery(
      context.trpc.workspaces.list.queryOptions(),
    ),
});

function App() {
  const navigate = useNavigate();

  const trpc = useTRPC();
  const {data: workspaces, isLoading} = useSuspenseQuery(
    trpc.workspaces.list.queryOptions(),
  );
  const workspaceId = workspaces?.[0]?.id;
  const workspaceIdRef = useRef(workspaceId);

  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const openCreateWorkspaceDialog = useCreateWorkspaceDialog({
    onClose: () => {
      if (!workspaceIdRef.current) {
        openCreateWorkspaceDialog();
      }
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (workspaceId) {
      navigate({
        to: '/workspaces/$id',
        params: {id: workspaceId},
        replace: true,
      });
    } else {
      openCreateWorkspaceDialog();
    }
  }, [isLoading, workspaceId, navigate, openCreateWorkspaceDialog]);

  return (
    <div>
      <UserButton />
    </div>
  );
}
