import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';

type Props = {
  name: string;
  image?: string | null;
};

export function ConversationHero({name, image}: Props) {
  return (
    <div className='mt-22 mx-5 mb-4'>
      <div className='flex items-center space-x-1 mb-2'>
        <Avatar className='size-14 mr-2'>
          <AvatarImage src={image ?? undefined} alt='' />
          <AvatarFallback className='text-xl'>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div dir='ltr' className='text-2xl font-bold'>
          {name}
        </div>
      </div>
      <div dir='ltr' className='font-normal text-slate-800 mb-4'>
        This conversation is just between you and <strong>{name}</strong>
      </div>
    </div>
  );
}
