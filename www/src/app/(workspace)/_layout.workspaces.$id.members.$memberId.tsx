import {Conversation} from '@/features/conversations/components/conversation';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useMemberId} from '@/hooks/use-member-id';
import {usePanel} from '@/hooks/use-panel';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {AlertTriangleIcon, LoaderIcon} from 'lucide-react';
import {useEffect} from 'react';
import {toast} from 'sonner';

export const Route = createFileRoute(
  '/(workspace)/_layout/workspaces/$id/members/$memberId',
)({
  component: RouteComponent,
});

function RouteComponent() {
  const workspaceId = useWorkspaceId();
  const memberId = useMemberId();
  const trpc = useTRPC();
  const {threadId, onClose} = usePanel();

  const {
    mutate: createOrGetConversationMutationSync,
    data,
    isPending,
  } = useMutation(trpc.conversations.createOrGet.mutationOptions());

  useEffect(() => {
    return () => {
      if (threadId !== null) {
        onClose();
      }
    };
  }, [threadId, memberId]);

  useEffect(() => {
    createOrGetConversationMutationSync(
      {workspaceId, memberId},
      {
        onError: () => {
          toast.error('Failed to connect');
        },
      },
    );
  }, [workspaceId, memberId, createOrGetConversationMutationSync]);

  if (isPending) {
    return (
      <div className='flex h-full items-center justify-center'>
        <LoaderIcon size={24} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex h-full items-center justify-center space-x-1'>
        <AlertTriangleIcon size={20} className='text-muted-foreground' />
        <span className='text-sm text-muted-forground'>
          Hmm...this conversation does't exit.
        </span>
      </div>
    );
  }

  return <Conversation conversation={data} />;
}
