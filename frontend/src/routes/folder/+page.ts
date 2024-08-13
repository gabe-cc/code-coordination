import { browser } from '$app/environment';
import { getFolder } from './folder';

export const load = async ({url , fetch}) => {
  if (browser) {
    const id = url.searchParams.get('id')! ;
    try {
      const folder = await getFolder({ id , fetch }) ;
      return { folder } ;  
    } catch (_) {
      return { folder : undefined }
    }  
  } else {
    return { folder : undefined } ;
  }
} ;