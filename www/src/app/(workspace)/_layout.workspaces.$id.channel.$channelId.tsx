import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(workspace)/_layout/workspaces/$id/channel/$channelId',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
