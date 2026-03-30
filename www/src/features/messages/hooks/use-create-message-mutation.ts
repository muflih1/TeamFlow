import {getAxios} from '@/lib/axios';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';

export function useCreateMessageMutation() {
  const trpc = useTRPC();

  const {mutate: createMessageMutationSync, isPending} = useMutation(
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

  function mutateSync({
    body,
    image,
    channelId,
    threadId,
    workspaceId,
    conversationId,
  }: {
    body: string;
    image: File | null;
    workspaceId: string;
    channelId?: string;
    threadId?: string;
    conversationId?: string;
  }) {
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
                          parentMessageId: threadId,
                          conversationId,
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
      createMessageMutationSync({
        body,
        workspaceId,
        channelId,
        parentMessageId: threadId,
        conversationId,
      });
    }
  }

  return {
    mutateSync,
    isPending,
  };
}
