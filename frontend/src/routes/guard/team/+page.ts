import { browser } from '$app/environment';
import { getTeamDashboard } from './team-dashboard';

export const load = async ({url , fetch}) => {
  if (browser) {
    try {
      const dashboard = await getTeamDashboard({
        teamname : url.searchParams.get('s') ,
        fetch }) ;
      return { dashboard } ;  
    } catch (_) {
      return { dashboard : undefined }
    }  
  } else {
    return { dashboard : undefined } ;
  }
} ;