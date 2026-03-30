import {createIsomorphicFn} from '@tanstack/react-start';
import {getRequestHeaders} from '@tanstack/react-start/server';
import Axios from 'axios';

export const getAxios = createIsomorphicFn()
  .client(() =>
    Axios.create({
      baseURL: '/api',
      withCredentials: true,
    }),
  )
  .server(() =>
    Axios.create({
      baseURL: `${process.env.SERVER_URL}/api`,
      headers: {...Object.fromEntries(getRequestHeaders())},
    }),
  );
