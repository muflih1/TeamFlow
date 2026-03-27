import {useDialog} from '@/contexts/dialog-context';
import {CreateWorkspaceDialog} from '../components/create-workspace-dialog';

export function useCreateWorkspaceDialog(props?: {
  onClose?: (...args: unknown[]) => void;
}) {
  const pushDialog = useDialog();

  return () =>
    pushDialog(CreateWorkspaceDialog, {}, props?.onClose, {replace: true});
}
