import {createIsomorphicFn} from '@tanstack/react-start';
import {getRequestHeaders} from '@tanstack/react-start/server';
import Axios from 'axios';

const baseURL = import.meta.env.VITE_APP_SERVER_URL;

export const getAxios = createIsomorphicFn()
  .client(() => Axios.create({baseURL, withCredentials: true}))
  .server(() =>
    Axios.create({
      baseURL,
      headers: {...Object.fromEntries(getRequestHeaders())},
    }),
  );
