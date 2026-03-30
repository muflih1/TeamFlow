import {Thread} from '@/components/thread';
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
import {usePanel} from '@/hooks/use-panel';
import {getSocket} from '@/lib/socket';
import {useTRPC} from '@/lib/trpc';
import {useQueryClient} from '@tanstack/react-query';
import {createFileRoute, Outlet, useNavigate} from '@tanstack/react-router';
import {LoaderIcon} from 'lucide-react';
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
  const {threadId, onClose} = usePanel();

  const panelVisible = !!threadId;

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

    socket.on('message_created', ({data}) => {
      queryClient.setQueryData(
        trpc.messages.list.infiniteQueryKey({
          channelId: data.channel ?? undefined,
          conversationId:
            data.parentMessage != null
              ? undefined
              : (data.conversation ?? undefined),
          parentMessageId: data.parentMessage ?? undefined,
          workspaceId,
        }),
        old => {
          if (!old) {
            return {
              pages: [{items: [data], nextCursor: null}],
              pageParams: [null],
            };
          }

          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                items: [data, ...old.pages[0].items],
              },
              ...old.pages.slice(1),
            ],
          };
        },
      );
    });

    socket.on('message_deleted', ({data}) => {
      queryClient.removeQueries(
        trpc.messages.get.queryOptions({messageId: data.id, workspaceId}),
      );
      queryClient.setQueryData(
        trpc.messages.list.infiniteQueryKey({
          channelId: data.channel ?? undefined,
          conversationId:
            data.parentMessage != null
              ? undefined
              : (data.conversation ?? undefined),
          parentMessageId: data.parentMessage ?? undefined,
          workspaceId,
        }),
        old => {
          if (!old) return old;

          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                items: old.pages[0].items.filter(m => m.id !== data.id),
              },
            ],
          };
        },
      );
    });

    socket.on('reaction_added', ({data}) => {
      queryClient.setQueryData(
        trpc.messages.get.queryKey({messageId: data.message, workspaceId}),
        msg => {
          if (!msg || msg.id !== data.message) return msg;
          let reactions = [...(msg.reactions ?? [])];
          const index = reactions.findIndex(r => r.value === data.value);
          if (index === -1) {
            reactions.push({
              value: data.value,
              users: [data.user],
              count: 1,
            });
          } else {
            const r = reactions[index];

            if (!r.users.includes(data.user)) {
              reactions[index] = {
                ...r,
                users: [...r.users, data.user],
                count: r.count + 1,
              };
            }
          }
          return {
            ...msg,
            reactions: reactions.length > 0 ? reactions : null,
          };
        },
      );
      queryClient.setQueryData(
        trpc.messages.list.infiniteQueryKey({
          channelId: data.channel ?? undefined,
          conversationId:
            data.parentMessage != null
              ? undefined
              : (data.conversation ?? undefined),
          parentMessageId: data.parentMessage ?? undefined,
          workspaceId,
        }),
        old => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              items: page.items.map(msg => {
                if (msg.id !== data.message) return msg;

                let reactions = [...(msg.reactions ?? [])];

                const index = reactions.findIndex(r => r.value === data.value);

                if (index === -1) {
                  reactions.push({
                    value: data.value,
                    users: [data.user],
                    count: 1,
                  });
                } else {
                  const r = reactions[index];

                  if (!r.users.includes(data.user)) {
                    reactions[index] = {
                      ...r,
                      users: [...r.users, data.user],
                      count: r.count + 1,
                    };
                  }
                }

                return {
                  ...msg,
                  reactions: reactions.length > 0 ? reactions : null,
                };
              }),
            })),
          };
        },
      );
    });

    socket.on('reaction_deleted', ({data}) => {
      queryClient.setQueryData(
        trpc.messages.get.queryKey({messageId: data.message, workspaceId}),
        msg => {
          if (!msg || msg.id !== data.message) return msg;
          let reactions = [...(msg.reactions ?? [])];
          const index = reactions.findIndex(r => r.value === data.value);
          if (index !== -1) {
            const r = reactions[index];
            const newUsers = r.users.filter(user => user !== data.user);
            if (newUsers.length === 0) {
              reactions.splice(index, 1);
            } else {
              reactions[index] = {
                ...r,
                users: newUsers,
                count: r.count - 1,
              };
            }
          }
          return {
            ...msg,
            reactions: reactions.length > 0 ? reactions : null,
          };
        },
      );
      queryClient.setQueryData(
        trpc.messages.list.infiniteQueryKey({
          channelId: data.channel ?? undefined,
          conversationId:
            data.parentMessage != null
              ? undefined
              : (data.conversation ?? undefined),
          parentMessageId: data.parentMessage ?? undefined,
          workspaceId,
        }),
        old => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              items: page.items.map(msg => {
                if (msg.id !== data.message) return msg;

                let reactions = [...(msg.reactions ?? [])];

                const index = reactions.findIndex(r => r.value === data.value);

                if (index !== -1) {
                  const r = reactions[index];

                  const newUsers = r.users.filter(
                    (user: string) => user !== data.user,
                  );

                  if (newUsers.length === 0) {
                    reactions.splice(index, 1);
                  } else {
                    reactions[index] = {
                      ...r,
                      users: newUsers,
                      count: r.count - 1,
                    };
                  }
                }

                return {
                  ...msg,
                  reactions: reactions.length > 0 ? reactions : null,
                };
              }),
            })),
          };
        },
      );
    });

    socket.on('workspace_deleted', ({data}) => {
      queryClient.setQueryData(
        trpc.workspaces.get.queryKey({id: workspaceId}),
        () => undefined,
      );
      queryClient.setQueryData(trpc.workspaces.list.queryKey(), old => {
        if (!old) return [];
        return old.filter(w => w.id !== data.workspaceId);
      });
      navigate({to: '/', replace: true});
    });

    return () => {
      socket.off('channel_updated');
      socket.off('channel_deleted');
      socket.off('channel_created');
      socket.off('member_joined');
      socket.off('message_created');
      socket.off('message_deleted');
      socket.off('reaction_added');
      socket.off('reaction_deleted');
      socket.off('workspace_deleted');
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
          {panelVisible && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={240} defaultSize={460}>
                {threadId !== null ? (
                  <Thread
                    threadId={threadId}
                    onClose={onClose}
                    workspaceId={workspaceId}
                  />
                ) : (
                  <div className='flex h-full items-center justify-center'>
                    <LoaderIcon
                      size={20}
                      className='animate-spin text-muted-foreground'
                    />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
