import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(workspace)/_layout/workspaces/$id/members/$memberId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/(workspace)/_layout/workspaces/$id/members/$memberId"!</div>
  )
}
