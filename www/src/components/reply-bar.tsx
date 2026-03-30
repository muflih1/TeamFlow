import {useBatchMembersQuery} from '@/features/memberships/hooks/use-batch-members-query';
import type React from 'react';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import pluralize from 'pluralize';
import {formatDistanceToNowStrict, formatRelative} from 'date-fns';
import {ChevronRightIcon} from 'lucide-react';

type Props = {
  replyCount: number;
  replyUsersCount: number;
  replyUsers: string[];
  latestReplyAt: Date | null;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function ReplyBar({
  replyCount,
  replyUsersCount,
  replyUsers,
  latestReplyAt,
  onClick,
}: Props) {
  const {data: members, isLoading} = useBatchMembersQuery(replyUsers);

  if (isLoading) {
    return 'Loading...';
  }

  if (
    !replyCount ||
    !replyUsers ||
    !replyUsersCount ||
    !latestReplyAt ||
    !members
  )
    return null;

  return (
    <button
      type='button'
      tabIndex={0}
      onClick={onClick}
      className='p-1 rounded-md hover:bg-white border border-transparent hover:border-border flex items-center justify-start group/reply-bar transition max-w-150 touch-manipulation text-start cursor-pointer'
    >
      <div className='flex items-center space-x-2 overflow-hidden grow'>
        {members.map(member => (
          <>
            <Avatar className='size-6 shrink-0 basis-6'>
              <AvatarImage
                src={member.image ?? undefined}
                alt={`Profile picture of ${member.name}`}
              />
              <AvatarFallback>
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className='shrink-0 text-xs text-sky-700 hover:underline font-bold truncate'>
              {pluralize('reply', replyCount, true)}
            </span>
          </>
        ))}
        <div className='text-muted-foreground relative overflow-hidden whitespace-nowrap shrink grow'>
          <span className='text-xs truncate group-hover/reply-bar:opacity-0 opacity-100 transition-opacity duration-200'>
            {replyCount <= 1
              ? formatDistanceToNowStrict(latestReplyAt)
              : 'Last reply ' + formatRelative(latestReplyAt, new Date())}
          </span>
          <span className='text-xs truncate group-hover/reply-bar:opacity-100 opacity-0 absolute inset-0 transition-opacity duration-200 inline-flex items-center'>
            View thread
          </span>
        </div>
        <ChevronRightIcon
          size={16}
          className='text-muted-foreground ml-auto shrink-0 opacity-0 group-hover/reply-bar:opacity-100 transition-opacity duration-200'
        />
      </div>
    </button>
  );
}
