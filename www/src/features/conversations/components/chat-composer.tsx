import {BaseEditor} from '@/components/base-editor';
import {useCreateMessageMutation} from '@/features/messages/hooks/use-create-message-mutation';
import {ClientOnly} from '@tanstack/react-router';

export function ChatComposer({
  workspaceId,
  conversationId,
}: {
  workspaceId: string;
  conversationId: string;
}) {
  const {mutateSync, isPending} = useCreateMessageMutation();

  return (
    <div className='px-4 w-full'>
      <ClientOnly fallback='ChatComposer'>
        <BaseEditor
          withEmojiButton
          withImageButton
          withSendButton
          placeholder='Just somthing down'
          onSend={data => mutateSync({...data, workspaceId, conversationId})}
          disabled={isPending}
        />
      </ClientOnly>
    </div>
  );
}
