import {getCurrentUser} from '@/features/auth/lib/auth.functions';
import {createFileRoute, Outlet, redirect} from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw redirect({to: '/sign-in'});
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      Hello "/_protected"!
      <Outlet />
    </>
  );
}
