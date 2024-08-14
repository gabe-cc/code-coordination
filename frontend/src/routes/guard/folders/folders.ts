import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { flashPush } from "$lib/flash-messages";

export const getFolders = async (
  {spaceId , fetch} : {spaceId : string | null , fetch : typeof window.fetch}
) => {
  const body = JSON.stringify({ spaceId }) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/folder/roots` , {
    credentials : 'include' ,
    method : 'POST' ,
    body ,
    headers : { 'Content-Type' : 'application/json' } ,
  });
  if (!response.ok) {
    return flashPush('error' , `Could not load folders`) ;
  }
  const json = await response.json() ;
  return json.roots ;
} ;