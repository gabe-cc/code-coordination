import { browser } from '$app/environment';
import { getDashboard } from './dashboard';

export const load = async ({url , fetch}) => {
  if (browser) {
    try {
      const dashboard = await getDashboard({ fetch }) ;
      return { dashboard } ;  
    } catch (_) {
      return { dashboard : undefined }
    }  
  } else {
    return { dashboard : undefined } ;
  }
} ;