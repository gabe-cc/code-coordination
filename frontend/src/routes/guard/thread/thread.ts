import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { ThreadFullZ } from "$iso/schemas";
import { flashPush } from "$lib/flash-messages";

export const getThread = async ({id , fetch} : { id : string | null , fetch : typeof window.fetch }) => {
  const body = JSON.stringify({
    _id : id ,
  }) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/threads/view` , {
    credentials : 'include' ,
    method : 'POST' ,
    body ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  }) ;
  if (!response.ok) {
    flashPush('error' , `Could not get thread`) ;
    throw new Error(`Could not get thread`) ;
  }
  const json = await response.json() ;
  // console.log('raw json' , json) ;
  const parsed = ThreadFullZ.safeParse(json) ;
  if (parsed.success) {
    return parsed.data ;
  } else {
    // console.log('error') ;
    console.error(parsed.error.issues)
    throw new Error(`bad thread shape in answer`)
  }
} ;