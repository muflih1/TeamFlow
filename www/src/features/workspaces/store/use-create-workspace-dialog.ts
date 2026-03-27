import {atom, useAtom} from 'jotai';

const dialogState = atom(false);

export function useCreateWorkspaceDialog() {
  return useAtom(dialogState);
}
