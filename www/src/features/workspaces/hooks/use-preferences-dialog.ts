import {useDialog} from '@/contexts/dialog-context';
import {PreferencesDialog} from '../components/preferences-dialog';

export function usePreferencesDialog({workspace}: {workspace: any}) {
  const pushDialog = useDialog();

  return () =>
    pushDialog(PreferencesDialog, {workspace}, null, {replace: true});
}
