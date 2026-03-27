import {useDialog} from '@/contexts/dialog-context';
import {CreateChannelDialog} from '../components/create-channel-dialog';

export function useCreateChannelDialog() {
  const pushDialog = useDialog();
  return () => pushDialog(CreateChannelDialog, {}, null, {replace: true});
}
