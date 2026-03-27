import {Dialog, DialogContent, DialogTrigger} from './ui/dialog';

export function Thumbnile({uri}: {uri: string | null | undefined}) {
  if (!uri) return null;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <div
            role='button'
            tabIndex={0}
            className='relative overflow-hidden max-w-sm border rounded-lg my-2 cursor-zoom-in'
          />
        }
        nativeButton={false}
      >
        <img
          src={uri}
          alt='Message thumbnile'
          className='object-cover size-full'
        />
      </DialogTrigger>
      <DialogContent className='max-w-4xl border-none bg-transparent p-0 shadow-none'>
        <img
          src={uri}
          alt='Message thumbnile'
          className='object-cover size-full'
        />
      </DialogContent>
    </Dialog>
  );
}
