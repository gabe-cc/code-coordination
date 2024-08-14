import { browser } from '$app/environment';
import { getThread } from './thread';

export const load = async ({url , fetch}) => {
  if (browser) {
    const id = url.searchParams.get('id')! ;
    try {
      const thread = await getThread({ id , fetch }) ;
      return { thread } ;  
    } catch (_) {
      return { thread : undefined }
    }  
  } else {
    return { thread : undefined } ;
  }
} ;