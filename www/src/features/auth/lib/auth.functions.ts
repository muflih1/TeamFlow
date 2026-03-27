import {createServerFn} from '@tanstack/react-start';

export const getCurrentUser = createServerFn({method: 'GET'}).handler(
  async ({context}) => {
    return context.currentUser;
  },
);
