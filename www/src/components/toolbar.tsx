import {
  MessageCircleIcon,
  PencilIcon,
  SmilePlusIcon,
  TrashIcon,
} from 'lucide-react';
import {Button} from './ui/button';
import {Tooltip} from './tooltip';
import {EmojiPickerTrigger} from './emoji-picker';
import {cn} from '@/lib/utils';

type Props = {
  canDelete?: boolean;
  canEdit?: boolean;
  isPending?: boolean;
  onEditClick?: React.MouseEventHandler<HTMLButtonElement>;
  onThreadClick?: React.MouseEventHandler<HTMLButtonElement>;
  onDeleteClick?: React.MouseEventHandler<HTMLButtonElement>;
  onReactionChange?: (value: string) => void;
  withThreadButton?: boolean;
  isCompact?: boolean;
};

export function Toolbar({
  canEdit = false,
  canDelete = false,
  isPending = false,
  onEditClick,
  onDeleteClick,
  onReactionChange,
  onThreadClick,
  withThreadButton = true,
  isCompact = false,
}: Props) {
  return (
    <div
      role='toolbar'
      className={cn('absolute -top-5 right-5', isCompact && '-top-6')}
    >
      <div className='group-hover:opacity-100 opacity-0 transition-opacity border bg-white shadow-md rounded-lg p-0.5 flex items-center'>
        <EmojiPickerTrigger
          tooltip='Add reaction...'
          tooltipProps={{
            position: 'top',
            align: 'center',
          }}
          onEmojiSelect={data => onReactionChange?.(data.emoji)}
        >
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            disabled={isPending}
            tabIndex={isPending ? -1 : 0}
          >
            <SmilePlusIcon size={16} />
          </Button>
        </EmojiPickerTrigger>
        {withThreadButton && (
          <Tooltip tooltip='Reply in thread' position='top' align='center'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              disabled={isPending}
              tabIndex={isPending ? -1 : 0}
              onClick={onThreadClick}
            >
              <MessageCircleIcon size={16} />
            </Button>
          </Tooltip>
        )}
        {canEdit && (
          <Tooltip tooltip='Edit message' position='top' align='center'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              disabled={isPending}
              tabIndex={isPending ? -1 : 0}
              onClick={onEditClick}
            >
              <PencilIcon size={16} />
            </Button>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip tooltip='Delete message' position='top' align='center'>
            <Button
              type='button'
              variant='destructive'
              size='icon-sm'
              className='bg-transparent hover:bg-destructive/10'
              disabled={isPending}
              tabIndex={isPending ? -1 : 0}
              onClick={onDeleteClick}
            >
              <TrashIcon size={16} />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
