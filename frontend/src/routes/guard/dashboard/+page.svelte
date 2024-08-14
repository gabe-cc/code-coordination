<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { getLoggedUser , loggedUser$ } from '$lib/user' ;
  import type { SafeUserFull, TeamRequest, TeamRequestFull } from '$iso/schemas';
  import type { PageData } from './$types';
  import { getDashboard } from './dashboard';
  import type { ObjectId } from '$iso/bson-objectid';
  import { flashPush } from '$lib/flash-messages';
    import { PUBLIC_BACKEND_URL } from '$env/static/public';

  export let data : PageData ;

  let dashboard : PageData['dashboard'] | undefined = data.dashboard ;

  onMount(async () => {
    if (dashboard === undefined) {
      console.log('get dashboard')
      dashboard = await getDashboard({fetch}) ;
    }
    console.log('got dashboard' , dashboard);
  })

  const acceptInvite = async (teamRequest : TeamRequestFull) => {
    const body = JSON.stringify({teamId : teamRequest.team._id}) ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/team/invite-accept` , {
      method : 'POST' ,
      credentials : 'include' ,
      body ,
      headers : { 'Content-Type' : 'application/json' } ,
    }) ;
    if (!response.ok) {
      flashPush('error' , 'failed to accept invite') ;
      return ;
    }
    goto(`/team?t=${teamRequest.team.teamname}`) ;
  } ;

  export let teamName = '' ;

  const createTeam = async (teamName : string) => {
    if (teamName === '') {
      flashPush('error' , `can't create team with empty name`) ;
      return ;
    }
    const body = JSON.stringify({teamname : teamName}) ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/team/create` , {
      method : 'POST' ,
      credentials : 'include' ,
      body ,
      headers : { 'Content-Type' : 'application/json' } ,
    }) ;
    if (!response.ok) {
      flashPush('error' , 'failed to create team') ;
      return ;
    }
    goto(`/guard/team?t=${teamName}`) ;
  } ;

  let user : SafeUserFull = $loggedUser$! ;
  $: user = $loggedUser$! ;
</script>

<h1>Space</h1>
<ul>
  <li><a href="/guard/todo?s={user.space}">Todolist</a></li>
  <li><a href="/guard/chat?s={user.space}">Chat</a></li>
  <li><a href="/guard/threads?s={user.space}">Threads</a></li>
  <li><a href="/guard/folders?s={user.space}">Roots</a></li>
</ul>

<h1>Teams</h1>
<ul>{#each user.teams as team}
  <li><a href="/guard/team?t={team.teamname}">{team.teamname}</a></li>
{/each}</ul>

<h1>Team Requests</h1>
{#if dashboard !== undefined && dashboard.requests !== undefined }
  <ul>{#each dashboard.requests as request}
    <li>
      <div>
        <a href="/guard/team?t={request.team.teamname}">{request.team.teamname}</a>    
      </div>
      <div>
        <button on:click={() => acceptInvite(request)}></button>
      </div>
    </li>
  {/each}</ul>
{:else}
  <p>Loading requests...</p>
{/if}

<h1>Create Team</h1>
<h2>Team Name</h2>
<div
  contenteditable="plaintext-only"
  bind:textContent={teamName}
></div>
<button on:click={() => createTeam(teamName)}>Create Team</button>

<h1>Debug Information</h1>
<p
  style="
    white-space : pre-wrap ;
  "
>{JSON.stringify(user , null , 2)
}</p>