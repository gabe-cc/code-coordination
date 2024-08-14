import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { FolderFullZ } from "$iso/schemas";
import { flashPush } from "$lib/flash-messages";

export const getFolder = async ({id , fetch} : { id : (string | null) , fetch : typeof window.fetch } ) => {
  const body = JSON.stringify({_id : id}) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/folder/view` , {
    credentials : 'include' ,
    method : 'POST' ,
    body ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  }) ;
  if (!response.ok) {
    flashPush('error' , `Could not get folder`) ;
    console.log(await response.json()) ;
    throw new Error(`Could not get folder`) ;
  }
  const json = await response.json() ;
  // console.log('raw json' , json) ;
  const parsed = FolderFullZ.safeParse(json.folder) ;
  if (parsed.success) {
    return parsed.data ;
    // console.log('folder' , my_folder) ;
  } else {
    flashPush('error', `Error while receiving folder`) ;
    // console.log('error') ;
    console.error(parsed.error.issues)
    throw new Error(`Error while receiving folder`) ;
  }
} ;
