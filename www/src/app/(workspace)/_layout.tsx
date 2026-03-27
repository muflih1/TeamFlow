import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {Sidebar} from '@/features/workspaces/components/sidebar';
import {Toolbar} from '@/features/workspaces/components/toolbar';
import {WorkspaceSidebar} from '@/features/workspaces/components/workspace-sidebar';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useConnectSocket} from '@/hooks/use-connect-socket';
import {getSocket} from '@/lib/socket';
import {useTRPC} from '@/lib/trpc';
import {useQueryClient} from '@tanstack/react-query';
import {createFileRoute, Outlet, useNavigate} from '@tanstack/react-router';
import {useEffect} from 'react';

export const Route = createFileRoute('/(workspace)/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  useConnectSocket();
  const workspaceId = useWorkspaceId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getSocket();
    socket.emit('workspace_request_subscribe', {id: workspaceId});

    return () => {
      socket.emit('workspace_request_unsubscribe', {id: workspaceId});
    };
  }, [workspaceId]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('channel_updated', ({data}) => {
      queryClient.setQueryData(
        trpc.channels.get.queryKey({id: data.id}),
        () => data,
      );

      queryClient.setQueryData(
        trpc.channels.list.queryKey({workspaceId: data.workspaceId}),
        old => {
          if (!old) return [data];
          const exists = old.some(prev => prev.id === data.id);
          if (!exists) {
            return [...old, data];
          }
          const result = old.map(prev => (prev.id === data.id ? data : prev));
          console.log({old, new: result});
          return result;
        },
      );
    });

    socket.on('channel_deleted', ({data}) => {
      queryClient.setQueryData(
        trpc.channels.list.queryKey({workspaceId: data.workspaceId}),
        old => {
          if (!old) return [];
          return old.filter(c => c.id !== data.channelId);
        },
      );
      navigate({
        to: '/workspaces/$id',
        params: {id: workspaceId},
        replace: true,
      });
    });

    socket.on('channel_created', ({data}) => {
      queryClient.setQueryData(
        trpc.channels.list.queryKey({workspaceId: data.workspaceId}),
        old => {
          if (!old) return [data];
          return old ? [...old, data] : [data];
        },
      );
    });

    socket.on('member_joined', ({data}) => {
      queryClient.setQueryData(
        trpc.memberships.list.queryKey({workspaceId: data.workspaceId}),
        old => {
          if (!old || old.length === 0) return [data];
          return [...old, data];
        },
      );
    });

    socket.on('message', ({data}) => {
      queryClient.setQueryData(
        trpc.messages.list.queryKey({channelId: data.channel, workspaceId}),
        old => {
          return old ? [data, ...old] : [data];
        },
      );
    });

    return () => {
      socket.off('channel_updated');
      socket.off('channel_deleted');
      socket.off('channel_created');
      socket.off('member_joined');
      socket.off('message');
    };
  }, [workspaceId, queryClient]);

  return (
    <div className='h-full'>
      <Toolbar />
      <div className='h-[calc(100vh-40px)] flex flex-row'>
        <Sidebar />
        <ResizablePanelGroup orientation='horizontal'>
          <ResizablePanel
            defaultSize={360}
            minSize={240}
            className='bg-[#5e2c5f]'
          >
            <WorkspaceSidebar />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={360}>
            <Outlet />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
