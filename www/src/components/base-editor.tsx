import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import React, {useEffect, useRef, useState} from 'react';
import {Button} from './ui/button';
import {TextAaSVGIcon} from '@/icons/text-aa-svg-icon';
import {ImageIcon, SmileIcon, XIcon} from 'lucide-react';
import {SendSVGIcon} from '@/icons/send-svg-icon';
import {Tooltip} from './tooltip';
import {Kbd, KbdGroup} from './ui/kbd';
import {useStableCallback} from '@base-ui/utils/useStableCallback';
import {cn} from '@/lib/utils';
import {EmojiPickerTrigger} from './emoji-picker';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';

import type {Delta, Op, QuillOptions} from 'quill';

type BaseEditorProps = {
  innerRef?: React.RefObject<Quill | null>;
  disabled?: boolean;
  defaultValue?: Delta | Op[];
  onSend?: (data: {body: string; image: File | null}) => void;
  confirmationSuffixButtonsProps?: {
    onCancelClick?: React.MouseEventHandler<HTMLButtonElement>;
    onSaveClick?: React.MouseEventHandler<HTMLButtonElement>;
    isSaveDisabled?: boolean;
  };
  withImageButton?: boolean;
  withSendButton?: boolean;
  withEmojiButton?: boolean;
  placeholder?: string;
};

function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

export function BaseEditor({
  withImageButton = false,
  withEmojiButton = false,
  withSendButton = false,
  confirmationSuffixButtonsProps,
  placeholder,
  defaultValue,
  onSend: onSendProp,
}: BaseEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill>(null);
  const [isEditorEmpty, setIsEditorEmpty] = useState<boolean>(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const imageRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);

  const onSend = useStableCallback(onSendProp);

  const workspaceId = useWorkspaceId();

  const trpc = useTRPC();

  const {mutate: getUploadURLMutationSync, isPending} = useMutation(
    trpc.files.getUploadURL.mutationOptions(),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container !== null) {
      const editorContainer = container.appendChild(
        container.ownerDocument.createElement('div'),
      );
      const options: QuillOptions = {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['link', {list: 'ordered'}, {list: 'bullet'}],
            ['blockquote', 'code', 'code-block'],
          ],

          keyboard: {
            bindings: {
              enter: {
                key: 'Enter',
                handler: () => {
                  const isEmpty = !image && isTextEmpty();
                  if (isEmpty) return;
                  onSend({
                    body: JSON.stringify(quill.getContents() ?? []),
                    image,
                  });
                  quill.setContents([]);
                  setImage(null);
                  return false;
                },
              },
            },
          },
        },
      };
      const quill = new Quill(editorContainer, options);

      if (defaultValue != null) {
        quill.setContents(defaultValue);
      }

      quillRef.current = quill;

      function isTextEmpty() {
        return (
          quill
            .getText()
            .replace(/<(.|\n)*?>/g, '')
            .trim().length === 0
        );
      }

      setIsEditorEmpty(isTextEmpty());

      quill.on(Quill.events.TEXT_CHANGE, () => {
        setIsEditorEmpty(isTextEmpty());
      });

      return () => {
        quill.off(Quill.events.TEXT_CHANGE);
        container.innerHTML = '';
        quillRef.current = null;
      };
    }
  }, [placeholder, onSend, image, defaultValue]);

  return (
    <div className='flex flex-col'>
      <input
        ref={imageRef}
        type='file'
        hidden
        className='hidden'
        onChange={e => setImage(e.target.files![0])}
        accept='image/*'
      />
      <div className='flex flex-col border border-solid border-slate-200 overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white rounded-md'>
        <div ref={containerRef} className='h-full ql-custom' />
        {image != null && (
          <div className='p-2'>
            <div className='relative size-15.5 flex items-center justify-center group/image'>
              <Tooltip tooltip='Remove image' position='top' align='center'>
                <button
                  type='button'
                  onClick={() => {
                    setImage(null);
                    imageRef.current!.value = '';
                  }}
                  className='hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white touch-manipulation size-6 z-4 border-2 border-white items-center justify-center cursor-pointer select-none'
                >
                  <XIcon size={14} />
                </button>
              </Tooltip>
              <img
                src={URL.createObjectURL(image)}
                alt={image?.name}
                className='absolute top-0 left-0 size-full rounded-xl overflow-hidden object-cover border'
              />
            </div>
          </div>
        )}
        <div
          className='flex px-2 pb-2 z-5'
          role='toolbar'
          onClick={() => {
            quillRef.current?.focus();
          }}
        >
          <Tooltip
            tooltip={toolbarOpen ? 'Hide formatting' : 'Show formatting'}
          >
            <Button
              type='button'
              role='button'
              tabIndex={0}
              size='icon-sm'
              variant='ghost'
              onClick={e => {
                e.stopPropagation();
                setToolbarOpen(o => !o);
                containerRef.current
                  ?.querySelector('.ql-toolbar')
                  ?.classList.toggle('hidden');
              }}
              disabled={false}
            >
              <TextAaSVGIcon />
            </Button>
          </Tooltip>
          {withEmojiButton && (
            <EmojiPickerTrigger
              tooltip='Emoji'
              onEmojiSelect={data => {
                const quill = quillRef.current;
                if (quill !== null) {
                  const range = quill.getSelection(true);
                  const index = range?.index ?? 0;
                  console.log({range, index});
                  quill.insertText(index, data.emoji);
                  quill.setSelection(index + data.emoji.length);
                  quill.focus();
                }
              }}
            >
              <Button
                type='button'
                role='button'
                tabIndex={0}
                size='icon-sm'
                variant='ghost'
                onClick={e => {
                  e.stopPropagation();
                }}
                disabled={false}
              >
                <SmileIcon />
              </Button>
            </EmojiPickerTrigger>
          )}
          {withImageButton && (
            <Tooltip tooltip='Image'>
              <Button
                type='button'
                role='button'
                tabIndex={isPending ? -1 : 0}
                size='icon-sm'
                variant='ghost'
                onClick={e => {
                  e.stopPropagation();
                  imageRef.current?.click();
                }}
                disabled={isPending}
              >
                <ImageIcon />
              </Button>
            </Tooltip>
          )}
          {isEmpty(confirmationSuffixButtonsProps) ? (
            withSendButton && (
              <Button
                type='button'
                size='icon-sm'
                className={cn(
                  'ml-auto bg-[#007a5a] not-disabled:hover:bg-[#007a5a]/80 text-white',
                  isEditorEmpty && 'bg-white text-muted-foreground',
                )}
                disabled={!image && isEditorEmpty}
                onClick={e => {
                  e.stopPropagation();
                  onSend({
                    body: JSON.stringify(quillRef.current?.getContents() ?? []),
                    image,
                  });
                  quillRef.current?.setContents([]);
                  setImage(null);
                }}
              >
                <SendSVGIcon />
              </Button>
            )
          ) : (
            <div className='flex flex-row items-center gap-x-2 ml-auto'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={e => {
                  e.stopPropagation();
                  confirmationSuffixButtonsProps?.onCancelClick?.(e);
                }}
              >
                Cancel
              </Button>
              <Button
                type='button'
                tabIndex={
                  confirmationSuffixButtonsProps?.isSaveDisabled ? -1 : 0
                }
                size='sm'
                onClick={e => {
                  e.stopPropagation();
                  confirmationSuffixButtonsProps?.onSaveClick?.(e);
                }}
                disabled={confirmationSuffixButtonsProps?.isSaveDisabled}
                className='bg-[#007a5a] hover:bg-[#007a5a]/80 text-white'
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </div>
      {isEmpty(confirmationSuffixButtonsProps) && withSendButton && (
        <div className='p-2 flex justify-end'>
          <p
            className={cn(
              'text-[10px] leading-3 text-muted-foreground transition-opacity duration-300 opacity-0',
              !isEditorEmpty && 'opacity-100',
            )}
          >
            <KbdGroup>
              <Kbd>Shift</Kbd>
              <span>+</span>
              <Kbd>Enter</Kbd>
            </KbdGroup>
            &nbsp;to add new line
          </p>
        </div>
      )}
    </div>
  );
}
