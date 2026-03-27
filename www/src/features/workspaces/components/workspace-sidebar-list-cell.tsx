export function WorkspaceSidebarListCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <li>
      <div className='px-2'>{children}</div>
    </li>
  );
}
