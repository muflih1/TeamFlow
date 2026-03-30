import {useThreadMessageContext} from '@/contexts/thread-message-context';

export function usePanel() {
  const {threadId, onThreadIdChange} = useThreadMessageContext();

  function onOpenChange(threadId: string | null) {
    onThreadIdChange(threadId);
  }

  function onClose() {
    onOpenChange(null);
  }

  return {
    threadId,
    onOpenChange,
    onClose,
  };
}
