import {useDialog} from '@/contexts/dialog-context';

export function useConfirmationDialog() {
  const pushDialog = useDialog();

  return () => pushDialog(() => <></>, {}, null, {replace: false});
}
