import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {useCurrentUser} from '../hooks/use-current-user';
import {LoaderIcon, LogOutIcon} from 'lucide-react';
import {useSignOut} from '../hooks/use-sign-out';

export function UserButton() {
  const {data, isLoading} = useCurrentUser();
  const {signOutSync} = useSignOut();

  if (isLoading) {
    return (
      <LoaderIcon size={20} className='animate-spin text-muted-foreground' />
    );
  }

  if (data == null) {
    return null;
  }

  const {image, name, email} = data;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className='outline-none relative'>
        <Avatar className='size-10 hover:opacity-75 transition-opacity'>
          <AvatarImage src={image?.uri} alt={name} />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='center' side='right' className='w-60'>
        <DropdownMenuItem onClick={() => signOutSync()}>
          <LogOutIcon size={4} className='mr-2' />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
