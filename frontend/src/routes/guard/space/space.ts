import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { SpaceZ } from '$iso/schemas.js';
import { flashPush } from '$lib/flash-messages.js';

export const getSpace = async ({spaceId , fetch} : {spaceId : string | null , fetch : typeof window.fetch}) => {
  const body = JSON.stringify({spaceId}) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/space/get` , {
    credentials : 'include' ,
    method : 'POST' ,
    body ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  }) ;
  if (!response.ok) {
    flashPush('error' , `Could not get space`) ;
    console.log(await response.json()) ;
    throw new Error(`Could not get space`) ;
  }
  const json = await response.json() ;
  // console.log('raw json' , json) ;
  const parsed = SpaceZ.safeParse(json.space) ;
  if (parsed.success) {
    return parsed.data ;
    // console.log('space' , my_space) ;
  } else {
    flashPush('error', `Error while receiving space`) ;
    // console.log('error') ;
    console.error(parsed.error.issues)
    throw new Error(`Error while receiving space`) ;
  }
} ;