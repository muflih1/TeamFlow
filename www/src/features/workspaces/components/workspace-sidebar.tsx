import {useCurrentMembershipQuery} from '@/features/memberships/hooks/use-current-membership-query';
import {useWorkspaceId} from '../hooks/use-workspace-id';
import {useGetWorkspace} from '../hooks/use-get-workspace';
import {
  AlertCircleIcon,
  HashIcon,
  LoaderIcon,
  MessageSquareTextIcon,
  SendHorizonalIcon,
} from 'lucide-react';
import {WorkspaceSidebarHeader} from './workspace-sidebar-header';
import {WorkspaceSidebarList} from './workspace-sidebar-list';
import {useListChannelsQuery} from '@/features/channels/hooks/use-list-channels-query';
import {WorkspaceSidebarCollapsibleSection} from './workspace-sidebar-collapsible-section';
import {useListMembers} from '@/features/memberships/hooks/use-list-members';
import {WorkspaceSidebarListItem} from './workspace-sidebar-list-item';
import {WorkspaceSidebarListUserItem} from './workspace-sidebar-list-user-item';
import {WorkspaceSidebarCollapsibleList} from './workspace-sidebar-collapsible-list';
import {useCreateChannelDialog} from '@/features/channels/hooks/use-create-channel-dialog';

export function WorkspaceSidebar() {
  const workspaceId = useWorkspaceId();

  const openCreateChannelDialog = useCreateChannelDialog();

  const {data: memebership, isLoading: membershipLoading} =
    useCurrentMembershipQuery({workspaceId});
  const {data: workspace, isLoading: workspaceLoading} =
    useGetWorkspace(workspaceId);
  const {data: channels, isLoading: channelsLoading} = useListChannelsQuery({
    workspaceId,
  });
  const {data: members, isLoading: membersLoading} = useListMembers({
    workspaceId,
  });

  if (workspaceLoading || membershipLoading) {
    return (
      <div className='flex flex-col bg-[#5e2c5f] h-full items-center justify-center'>
        <LoaderIcon size={20} className='animate-spin text-white' />
      </div>
    );
  }

  if (!workspace || !memebership) {
    return (
      <div className='flex flex-col gap-y-2 bg-[#5e2c5f] h-full items-center justify-center'>
        <AlertCircleIcon size={20} className='text-white' />
        <p className='text-sm text-white'>Workspace not found</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col bg-[#5e2c5f] h-full'>
      <WorkspaceSidebarHeader
        workspace={workspace}
        canManageOrgMemberships={memebership.permissions.has(
          'org:memberships:manage',
        )}
        canManageOrgProfile={memebership.permissions.has('org:profile:manage')}
      />
      <WorkspaceSidebarList>
        <WorkspaceSidebarListItem
          label='Threads'
          icon={MessageSquareTextIcon}
          id='threads'
        />
        <WorkspaceSidebarListItem
          label='Drafts & Sent'
          icon={SendHorizonalIcon}
          id='drafts'
        />
      </WorkspaceSidebarList>
      <WorkspaceSidebarCollapsibleSection
        label='Channels'
        trailingActionProps={
          memebership.permissions.has('org:channels:create')
            ? {
                tooltip: 'Create new channel',
                onClick: openCreateChannelDialog,
              }
            : undefined
        }
      >
        <WorkspaceSidebarCollapsibleList>
          {channels?.map(c => (
            <WorkspaceSidebarListItem
              key={c.id}
              icon={HashIcon}
              label={c.name}
              id={c.id}
            />
          ))}
        </WorkspaceSidebarCollapsibleList>
      </WorkspaceSidebarCollapsibleSection>
      <WorkspaceSidebarCollapsibleSection
        label='Direct messages'
        trailingActionProps={{tooltip: 'New direct message', onClick: () => {}}}
      >
        <WorkspaceSidebarCollapsibleList>
          {members?.map(m => (
            <WorkspaceSidebarListUserItem
              key={m.id}
              image={null}
              label={m.user.name}
              id={m.user.id}
            />
          ))}
        </WorkspaceSidebarCollapsibleList>
      </WorkspaceSidebarCollapsibleSection>
    </div>
  );
}
