import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/(workspace)/_layout/workspaces/$id')({
  component: Outlet,
});
