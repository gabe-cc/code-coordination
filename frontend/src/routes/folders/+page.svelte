<script lang="ts">
  import { onMount } from 'svelte' ;
  import { afterNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$, requireAuthentication } from '$lib/user' ;
  import { type Folder } from '$iso/schemas' ;
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import type { ObjectId } from '$iso/bson-objectid/objectid';
  import { page } from '$app/stores';
  import { getFolders } from './folders';
  import type { PageData } from './$types';

  export let data : PageData ;
  let folders : Array<Folder & {_id : ObjectId}> | undefined = data.folders ;
  let creating = false ;

  export let name = '' ;
  const postFolder = async () => {
    if (!name) {
      return flashPush('error' , `Can't create folder with empty name`) ;
    }
    const body = JSON.stringify({name ,
      spaceId : $page.url.searchParams.get('s')
    }) ;
    creating = true ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/folder/create` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      return flashPush('error' , `Could not create folder`) ;
    }
    folders = await getFolders({
      spaceId : $page.url.searchParams.get('s') ,
      fetch ,
    }) ;
    name = '' ;
    creating = false ;
  } ;

  afterNavigate(() => {
    $requireAuthentication = true ;
  }) ;

  onMount(async () => {
    folders = await getFolders({
      spaceId : $page.url.searchParams.get('s') ,
      fetch ,
    }) ;
  });
</script>

{#if folders !== undefined}
  <h1>All Root Folders</h1>
  <ul>{#each folders as {name , _id} , i}
    <li>
      <div><a href="/folder?s={$page.url.searchParams.get('s')}&id={_id}">{name}</a></div>
    </li>
  {/each}</ul>
  <h1>Create Root Folder</h1>
  <h2>Name</h2>
  <div contenteditable="plaintext-only" bind:textContent={name}></div>
  <button on:click={postFolder} disabled={creating}>Send</button>
{:else}
  <p>Loading folders...</p>
{/if}