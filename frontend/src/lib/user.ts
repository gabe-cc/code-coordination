import { get, writable } from "svelte/store";
import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
import type { SafeUserFull } from "$iso/schemas";

export type LoggedUser = null | undefined | SafeUserFull // null -> no user, undefined -> loading

export let loggedUser$ = writable<LoggedUser>(undefined) ;

export const getLoggedUser = async () : Promise<LoggedUser> => {
  const loggedUser = get(loggedUser$) ;
  if (loggedUser !== undefined) return loggedUser ;
  try {
    const response = await fetch(`${PUBLIC_BACKEND_URL}/user` , {
      credentials: 'include' ,    
    }) ;
    if (response.ok) {
      const json = await response.json();
      loggedUser$.set(json.user) ;
      return json.user ;  
    } else {
      throw new Error(`Bad Response`) ;
    }
  } catch(_) {
    loggedUser$.set(null) ;
    return null ;
  }
}

export const login = async (username : string , password : string) => {
  const response = await fetch(`${PUBLIC_BACKEND_URL}/login`, {
    method: 'POST' ,
    headers: { 'Content-Type': 'application/json' } ,
    body: JSON.stringify({ username, password }) ,
    credentials: 'include' ,
  });
  const json = await response.json() ;
  if (response.ok) {
    loggedUser$.set(json.user) ;
    return { ok : true as const }
  } else {
    loggedUser$.set(null) ;
    return { ok : false as const , error : json.message } ;
  }
}

export const logout = async () => {
  const response = await fetch(`${PUBLIC_BACKEND_URL}/logout` , {
    method : 'POST' ,
    credentials : 'include' ,
  }) ;
  const json = await response.json() ;
  loggedUser$.set(null) ;
} ;