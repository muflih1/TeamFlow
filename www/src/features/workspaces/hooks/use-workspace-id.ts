import {useParams} from '@tanstack/react-router';

export function useWorkspaceId() {
  return useParams({
    from: '/(workspace)/_layout/workspaces/$id',
    select: params => params.id,
  });
}
