<script lang="ts">
  import { onMount } from 'svelte' ;
  import { afterNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$, requireAuthentication } from '$lib/user' ;
  import { type Folder } from '$iso/schemas' ;
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import type { ObjectId } from '$iso/bson-objectid/objectid';

  let folders : Array<Folder & {_id : ObjectId}> | undefined = undefined ;
  let creating = false ;

  const getFolders = async () => {
    const response = await fetch(`${PUBLIC_BACKEND_URL}/folder/roots` , {
      credentials : 'include' ,
      method : 'POST' ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      return flashPush('error' , `Could not load folders`) ;
    }
    const json = await response.json() ;
    folders = json.roots ;
  } ;

  export let name = '' ;
  const postFolder = async () => {
    if (!name) {
      return flashPush('error' , `Can't create folder with empty name`) ;
    }
    const body = JSON.stringify({name}) ;
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
    await getFolders() ;
    name = '' ;
    creating = false ;
  } ;

  afterNavigate(() => {
    $requireAuthentication = true ;
  }) ;

  onMount(async () => {
    await Promise.all([
      getFolders() ,
    ]) ;
  });
</script>

{#if folders !== undefined}
  <h1>All Root Folders</h1>
  <ul>{#each folders as {name , _id} , i}
    <li>
      <div><a href="/folder?id={_id}">{name}</a></div>
    </li>
  {/each}</ul>
  <h1>Create Root Folder</h1>
  <h2>Name</h2>
  <div contenteditable="plaintext-only" bind:textContent={name}></div>
  <button on:click={postFolder} disabled={creating}>Send</button>
{:else}
  <p>Loading folders...</p>
{/if}