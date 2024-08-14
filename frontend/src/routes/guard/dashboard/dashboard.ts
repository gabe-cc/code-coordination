import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { TeamRequestFullZ } from "$iso/schemas";
import { flashPush } from "$lib/flash-messages";
import { z } from "zod";

export const getDashboard = async ({fetch} : {fetch : typeof window.fetch}) => {
  const response = await fetch(`${PUBLIC_BACKEND_URL}/dashboard` , {
    credentials : 'include' ,
    method : 'POST' ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  }) ;
  if (!response.ok) {
    flashPush('error' , `Could not load dashboard`) ;
    return ;
  }
  const json = await response.json() ;
  const requestsParsed = z.array(TeamRequestFullZ).safeParse(json.requests) ;
  if (!requestsParsed.success) {
    flashPush('error' , `Wrong dashboard pulled`)
    console.error('dashboard format' , requestsParsed.error.issues) ;
    console.error(json) ;
    return ;
  }
  return { requests : requestsParsed.data } ;
} ;