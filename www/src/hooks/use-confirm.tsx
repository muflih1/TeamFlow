import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {useState} from 'react';

export function useConfirm({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [promise, setPromise] = useState<null | {
    resolve: (value: boolean) => void;
  }>(null);

  function confirm() {
    return new Promise<boolean>(resolve => setPromise({resolve}));
  }

  function handleClose() {
    setPromise(null);
  }

  function handleCancel() {
    promise?.resolve(false);
    handleClose();
  }

  function handleConfirm() {
    promise?.resolve(true);
    handleClose();
  }

  function ConfirmationDialog() {
    return (
      <AlertDialog open={promise !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return [ConfirmationDialog, confirm] as const;
}
