import {getSocket} from '@/lib/socket';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';
import {useEffect} from 'react';

export function useConnectSocket() {
  const trpc = useTRPC();
  const {mutateAsync: getSocketAuthTokenMutationAsync} = useMutation(
    trpc.getSocketAuthToken.mutationOptions(),
  );

  useEffect(() => {
    const socket = getSocket();

    socket.auth = async cb => {
      const {token} = await getSocketAuthTokenMutationAsync();
      cb({token});
    };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);
}
