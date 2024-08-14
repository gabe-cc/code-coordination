import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { flashPush } from "$lib/flash-messages";

export const getThreads = async (
  {spaceId , fetch } : { spaceId : string | null , fetch : typeof window.fetch }
) => {
  const body = JSON.stringify({ spaceId }) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/threads/all` , {
    credentials : 'include' ,
    body ,
    method : 'POST' ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  });
  if (!response.ok) {
    return flashPush('error' , `Could not load threads`) ;
  }
  const json = await response.json() ;
  return json.threads ;
} ;