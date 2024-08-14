import { browser } from '$app/environment';
import { getSpace } from './space.js';

export const load = async ({url , fetch}) => {
  if (browser) {
    const spaceId = url.searchParams.get('s')! ;
    try {
      const space = await getSpace({ spaceId : spaceId , fetch }) ;
      return { space } ;  
    } catch (_) {
      return { space : undefined }
    }  
  } else {
    return { space : undefined } ;
  }
} ;
