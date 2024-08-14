import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { FileUserZ } from "$iso/schemas";
import { flashPush } from "$lib/flash-messages";

export const getFile = async ({id , fetch} : {id : string | null , fetch : typeof window.fetch}) => {
  const body = JSON.stringify({
    _id : id ,
  }) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/file/view` , {
    credentials : 'include' ,
    method : 'POST' ,
    body ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  }) ;
  if (!response.ok) {
    flashPush('error' , `Could not get file`) ;
    throw new Error(`could not get file`)
  }
  const json = await response.json() ;
  // console.log('raw json' , json) ;
  const parsed = FileUserZ.safeParse(json.file) ;
  if (parsed.success) {
    return parsed.data ;
  } else {
    flashPush('error', `Error while receiving file`) ;
    // console.log('error') ;
    console.error(parsed.error.issues)
    throw new Error(`error while receifing file`)
  }
} ;