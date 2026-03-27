import {useDialog} from '@/contexts/dialog-context';
import {UpdateWorkspaceDialog} from '../components/update-workspace-dialog';

export function useUpdateWorkspaceDialog(
  props: {
    onSuccess?: (data: unknown) => void;
    initialValue: string
  },
) {
  const pushDialog = useDialog();
  return () => pushDialog(UpdateWorkspaceDialog, props, null, {replace: false});
}
