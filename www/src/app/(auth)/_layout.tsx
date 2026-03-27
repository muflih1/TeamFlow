import {getCurrentUser} from '@/features/auth/lib/auth.functions';
import {createFileRoute, Outlet, redirect} from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)/_layout')({
  beforeLoad: async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      throw redirect({to: '/'});
    }
  },
  component: AuthRootLayout,
});

function AuthRootLayout() {
  return (
    <div className='min-h-screen h-full flex items-center justify-center bg-[#5c3b58]'>
      <div className='md:h-auto md:w-105'>
        <Outlet />
      </div>
    </div>
  );
}
