import {useCurrentMembershipQuery} from '@/features/memberships/hooks/use-current-membership-query';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {cn} from '@/lib/utils';
import {Tooltip} from './tooltip';
import {EmojiPickerTrigger} from './emoji-picker';
import {SmilePlusIcon} from 'lucide-react';

type ReactionsProps = {
  reactions: Array<{
    value: string;
    count: number;
    users: string[];
  }> | null;
  onReactionChange: (value: string) => void;
};

export function Reactions({reactions, onReactionChange}: ReactionsProps) {
  const workspaceId = useWorkspaceId();
  const {data: currentMember} = useCurrentMembershipQuery({workspaceId});
  const currentMemberId = currentMember?.id;

  if (!reactions?.length || !currentMemberId) {
    return null;
  }

  return (
    <div className='flex items-center my-1 space-x-1'>
      {reactions?.map((reaction, index) => (
        <Tooltip
          key={index}
          tooltip={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reaction.value}`}
        >
          <button
            type='button'
            tabIndex={0}
            className={cn(
              'h-6 px-2 rounded-full bg-slate-200/70 border border-transparent text-slate-800 inline-flex items-center space-x-0.5 cursor-pointer select-none touch-manipulation',
              reaction.users.includes(currentMemberId) &&
                'bg-blue-100/70 border-blue-500',
            )}
            onClick={() => onReactionChange(reaction.value)}
          >
            <span className='text-sm leading-6'>{reaction.value}</span>
            <span
              className={cn(
                'text-xs font-bold text-muted-foreground',
                reaction.users.includes(currentMemberId) && 'text-blue-500',
              )}
            >
              {reaction.count}
            </span>
          </button>
        </Tooltip>
      ))}
      <EmojiPickerTrigger
        tooltip='Add reactions...'
        onEmojiSelect={data => onReactionChange(data.emoji)}
      >
        <button
          type='button'
          tabIndex={0}
          className='h-6 px-3 rounded-full bg-slate-200/70 border border-transparent hover:border-slate-500 text-slate-800 inline-flex items-center space-x-1'
        >
          <SmilePlusIcon size={16} />
        </button>
      </EmojiPickerTrigger>
    </div>
  );
}
