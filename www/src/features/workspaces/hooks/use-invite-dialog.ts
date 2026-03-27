import {useDialog} from '@/contexts/dialog-context';
import {
  InviteDialog,
  type InviteDialogProps,
} from '../components/invite-dialog';

export function useInviteDialog(props: InviteDialogProps) {
  const pushDialog = useDialog();
  return () => pushDialog(InviteDialog, props, null, {replace: true});
}
