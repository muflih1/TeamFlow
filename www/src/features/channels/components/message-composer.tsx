import {BaseEditor} from '@/components/base-editor';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {getAxios} from '@/lib/axios';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';
import {ClientOnly, useParams} from '@tanstack/react-router';

export function MessageComposer() {
  const trpc = useTRPC();

  const workspaceId = useWorkspaceId();
  const channelId = useParams({
    from: '/(workspace)/_layout/workspaces/$id/channel/$channelId',
    select: params => params.channelId,
  });

  const {mutate: createMessageMutationSync} = useMutation(
    trpc.messages.create.mutationOptions(),
  );
  const {mutate: getUploadURLMutationSync} = useMutation(
    trpc.files.getUploadURL.mutationOptions(),
  );
  const {mutate: putObjectMutationSync} = useMutation({
    mutationKey: ['putObject'],
    mutationFn: ({uploadUrl, image}: {uploadUrl: string; image: File}) =>
      getAxios().put(uploadUrl, image, {
        headers: {'Content-Type': image.type},
        withCredentials: false,
      }),
  });
  const {mutate: uploadCompleteMutationSync} = useMutation(
    trpc.files.uploadComplete.mutationOptions(),
  );

  function handleSend({body, image}: {body: string; image: File | null}) {
    if (image != null) {
      getUploadURLMutationSync(
        {
          filename: image.name,
          size: image.size,
          mimetype: image.type,
          workspaceId,
        },
        {
          onSuccess: data => {
            putObjectMutationSync(
              {uploadUrl: data.uploadURL, image},
              {
                onSuccess: () => {
                  uploadCompleteMutationSync(
                    {file: data.file, workspaceId},
                    {
                      onSuccess: data => {
                        createMessageMutationSync({
                          body,
                          workspaceId,
                          channelId,
                          imageId: data.file.id,
                        });
                      },
                    },
                  );
                },
              },
            );
          },
        },
      );
    } else {
      createMessageMutationSync({body, workspaceId, channelId});
    }
  }

  return (
    <div className='px-5 w-full'>
      <ClientOnly fallback={'Editor'}>
        <BaseEditor
          withEmojiButton
          withImageButton
          withSendButton
          placeholder='Test placeholder'
          onSend={handleSend}
        />
      </ClientOnly>
    </div>
  );
}
