import {useParams} from '@tanstack/react-router';

export function useChannelId() {
  return useParams({
    from: '/(workspace)/_layout/workspaces/$id/channel/$channelId',
    select: p => p.channelId,
    shouldThrow: false
  });
}
