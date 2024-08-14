import { browser } from '$app/environment';
import { getFolders } from './folders';

export const load = async ({url , fetch}) => {
  if (browser) {
    const spaceId = url.searchParams.get('s')! ;
    try {
      const folders = await getFolders({ spaceId , fetch }) ;
      return { folders } ;  
    } catch (_) {
      return { folders : undefined }
    }  
  } else {
    return { folders : undefined } ;
  }
} ;