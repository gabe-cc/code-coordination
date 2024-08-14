import { browser } from '$app/environment';
import { getThreads } from './threads';

export const load = async ({url , fetch}) => {
  if (browser) {
    const spaceId = url.searchParams.get('s')! ;
    try {
      const threads = await getThreads({ spaceId , fetch }) ;
      return { threads } ;  
    } catch (_) {
      return { threads : undefined }
    }  
  } else {
    return { threads : undefined } ;
  }
} ;