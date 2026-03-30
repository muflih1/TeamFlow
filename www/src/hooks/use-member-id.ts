import {useParams} from '@tanstack/react-router';

export function useMemberId() {
  return useParams({
    from: '/(workspace)/_layout/workspaces/$id/members/$memberId',
    select: p => p.memberId,
  });
}
