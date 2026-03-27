import type React from 'react';
import {WorkspaceSidebarList} from './workspace-sidebar-list';
import {useWorkspaceSidebarCollapsibleSectionContext} from './workspace-sidebar-collapsible-section';

export function WorkspaceSidebarCollapsibleList(
  props: Omit<React.ComponentProps<'ul'>, 'id'>,
) {
  const sectionContext = useWorkspaceSidebarCollapsibleSectionContext();

  return (
    <WorkspaceSidebarList
      {...(sectionContext != null &&
        sectionContext.open && {id: sectionContext.id})}
      {...props}
    />
  );
}
