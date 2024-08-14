import { browser } from '$app/environment';
import { getFile } from './file';

export const load = async ({url , fetch}) => {
  if (browser) {
    const id = url.searchParams.get('id')! ;
    try {
      const file = await getFile({ id , fetch }) ;
      return { file } ;  
    } catch (_) {
      return { file : undefined }
    }  
  } else {
    return { file : undefined } ;
  }
} ;