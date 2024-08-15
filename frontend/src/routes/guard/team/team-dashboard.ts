import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { TeamDashboardZ, TeamRequestFullZ } from "$iso/schemas";
import { flashPush } from "$lib/flash-messages";
import { z } from "zod";

export const getTeamDashboard = async ({teamname , fetch} : {teamname : string | null , fetch : typeof window.fetch}) => {
  const body = JSON.stringify({teamname}) ;
  const response = await fetch(`${PUBLIC_BACKEND_URL}/team/dashboard` , {
    credentials : 'include' ,
    method : 'POST' ,
    body ,
    headers : {
      'Content-Type' : 'application/json' ,
    } ,
  }) ;
  if (!response.ok) {
    flashPush('error' , `Could not load dashboard`) ;
    return ;
  }
  const json = await response.json() ;
  const teamDashboardParsed = TeamDashboardZ.safeParse(json.teamDashboard) ;
  if (!teamDashboardParsed.success) {
    flashPush('error' , `Wrong dashboard pulled`)
    console.error('dashboard format' , teamDashboardParsed.error.issues) ;
    console.error(json) ;
    return ;
  }
  return teamDashboardParsed.data ;
} ;