import {format} from 'date-fns';

type Props = {
  name: string;
  createdAt: Date;
};

export function ChannelHero({name, createdAt}: Props) {
  return (
    <div className='mt-22 mx-5 mb-4'>
      <div dir='ltr' className='text-2xl font-bold flex items-center mb-2'>
        # {name}
      </div>
      <div dir='ltr' className='font-normal text-slate-800 mb-4'>
        This channel was created on {format(createdAt, 'MMMM do, yyyy')}. This
        is the beginning of the <strong>{name}</strong> channel.
      </div>
    </div>
  );
}
