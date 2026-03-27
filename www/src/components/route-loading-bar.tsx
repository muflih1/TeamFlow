import {cn} from '@/lib/utils';
import {useRouterState} from '@tanstack/react-router';

export function RouteLoadingBar() {
  const isLoading = useRouterState({select: state => state.isLoading});

  return (
    <div
      aria-valuetext='loading...'
      role='progress'
      className={cn(
        'h-1 w-screen pointer-events-none fixed top-0 bg-[#3d5d8e] inset-x-0 opacity-0 animate-navigation-fade-in z-999',
        !isLoading && 'hidden',
      )}
    >
      <div className='size-full animate-navigation-pulse bg-[#74a4f2]' />
    </div>
  );
}
