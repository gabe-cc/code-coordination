<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { getLoggedUser , loggedUser$ } from '$lib/user' ;
  import type { SafeUserFull, TeamDashboard, TeamRequest, TeamRequestFull } from '$iso/schemas';
  import type { PageData } from './$types';
  import { getTeamDashboard } from './team-dashboard';
  import type { ObjectId } from '$iso/bson-objectid';
  import { flashPush } from '$lib/flash-messages';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { page } from '$app/stores';

  export let data : PageData ;

  let dashboard : TeamDashboard | undefined = data.dashboard ;

  let invited_user_nickname = '' ;

  const invite = async () => {
    const body = JSON.stringify({
      teamId : dashboard?._id ,
      username : invited_user_nickname ,
    }) ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/team/invite` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (response.ok) {
      invited_user_nickname = '' ;
      dashboard = await getTeamDashboard({
        teamname : $page.url.searchParams.get('t') ,
        fetch}) ;
    } else {
      console.error('could not invite') ;
      const json = await response.json() ;
      console.error(json) ;
      flashPush('error' , `Could not invite`) ;
    }
  } ;

  onMount(async () => {
    if (dashboard === undefined) {
      console.log('get dashboard')
      dashboard = await getTeamDashboard({
        teamname : $page.url.searchParams.get('t') ,
        fetch}) ;
    }
    console.log('got team dashboard' , dashboard);
  }) ;
</script>

{#if dashboard !== undefined }

  <h1>Space</h1>
  <ul>
    <li><a href="/guard/todo?s={dashboard.space}">Todolist</a></li>
    <li><a href="/guard/chat?s={dashboard.space}">Chat</a></li>
    <li><a href="/guard/threads?s={dashboard.space}">Threads</a></li>
    <li><a href="/guard/folders?s={dashboard.space}">Roots</a></li>
  </ul>

  <h1>Users</h1>
  <ul>{#each dashboard.members as member}
    <li><a href="/guard/user?u={member.username}">{member.username}</a></li>
  {/each}</ul>

  <h1>User Requests</h1>
  <ul>{#each dashboard.requests as request}
    <li>
      <a href="/guard/user?u={request.user.username}">{request.user.username}</a>    
    </li>
  {/each}</ul>

  {#if dashboard.admin._id.equals($loggedUser$?._id) }
  <h1>Invite User</h1>
  <div
    contenteditable="plaintext-only"
    bind:textContent={invited_user_nickname}
  ></div>
  <button
    disabled={invited_user_nickname===''}
    on:click={invite}
  >Invite</button>
  {/if}


{:else}
  <p>Loading team dashboard...</p>
{/if}

<h1>Debug Information</h1>
<p
  style="
    white-space : pre-wrap ;
  "
>{JSON.stringify(dashboard , null , 2)
}</p>