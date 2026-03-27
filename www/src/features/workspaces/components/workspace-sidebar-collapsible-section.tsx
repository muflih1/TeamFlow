import type React from 'react';
import {Button} from '@/components/ui/button';
import {ChevronDownIcon, PlusIcon} from 'lucide-react';
import {Tooltip} from '@/components/tooltip';
import {useToggle} from '@/hooks/use-toggle';
import {cn} from '@/lib/utils';
import {createContext, useContext, useId} from 'react';

interface WorkspaceSidebarSectionProps {
  children: React.ReactNode;
  label: string;
  trailingActionProps?: {
    tooltip: string;
    onClick?: () => void;
  };
}

const WorkspaceSidebarCollapsibleSectionContext = createContext<{
  id: string;
  open: boolean;
}>(undefined!);

export function useWorkspaceSidebarCollapsibleSectionContext() {
  const context = useContext(WorkspaceSidebarCollapsibleSectionContext);
  if (context == null) {
    throw new Error(
      '<WorkspaceSidebarCollapsibleList /> should be used within <WorkspaceSidebarCollapsibleSection />',
    );
  }
  return context;
}

export function WorkspaceSidebarCollapsibleSection({
  children,
  label,
  trailingActionProps,
}: WorkspaceSidebarSectionProps) {
  const [open, toggle] = useToggle(true);
  const controls = useId();

  return (
    <>
      <div className='flex flex-col px-2 mt-3'>
        <div className='flex items-center px-1.5 group'>
          <Button
            type='button'
            variant='transparent'
            className='p-0.5 text-sm text-[#f9edffcc] shrink-0 size-6'
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup='listbox'
            {...(open && {'aria-controls': controls})}
          >
            <ChevronDownIcon
              size={16}
              className={cn('transition-transform', !open && '-rotate-90')}
            />
          </Button>
          <Button
            variant='transparent'
            size='sm'
            className='group px-1.5 text-sm text-[#f9edffcc] h-7 justify-start overflow-hidden items-center flex'
          >
            <span className='truncate'>{label}</span>
          </Button>
          {trailingActionProps != null && (
            <Tooltip tooltip={trailingActionProps.tooltip}>
              <Button
                type='button'
                variant='transparent'
                size='icon-sm'
                className='opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-0.5 text-sm text-[#f9edffcc] size-6 shrink-0'
                onClick={trailingActionProps.onClick}
              >
                <PlusIcon size={20} />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
      <WorkspaceSidebarCollapsibleSectionContext.Provider
        value={{open, id: controls}}
      >
        {open && children}
      </WorkspaceSidebarCollapsibleSectionContext.Provider>
    </>
  );
}
