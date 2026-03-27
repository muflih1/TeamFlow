import {getAxios} from '@/lib/axios';
import {useMutation} from '@tanstack/react-query';

export function useSignOut() {
  const {
    mutate: signOutSync,
    mutateAsync: signOutAsync,
    isPending,
  } = useMutation({
    mutationFn: () => getAxios().delete('/auth/sign-out'),
    onSuccess: () => {
      window.location.reload();
    },
  });

  return {
    signOutSync,
    signOutAsync,
    isPending,
  };
}
