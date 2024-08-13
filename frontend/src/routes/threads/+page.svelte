<script lang="ts">
  import { onMount } from 'svelte' ;
  import { type Thread, type ThreadListed } from '$iso/schemas' ;
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import type { ObjectId } from '$iso/bson-objectid/objectid';
  import { requireAuthentication } from '$lib/user';
  import { afterNavigate } from '$app/navigation';

  let threads : Array<ThreadListed & {_id : ObjectId}> | undefined = undefined ;
  let creating = false ;

  const getThreads = async () => {
    const response = await fetch(`${PUBLIC_BACKEND_URL}/threads/all` , {
      credentials : 'include' ,
      method : 'POST' ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      return flashPush('error' , `Could not load threads`) ;
    }
    const json = await response.json() ;
    threads = json.threads ;
  } ;

  export let title = '' ;
  export let text = '' ;
  const postThread = async () => {
    if (!title) {
      return flashPush('error' , `Can't create thread with empty title`) ;
    }
    if (!text) {
      return flashPush('error' , `Can't create thread with empty text`) ;
    }
    const body = JSON.stringify({
      title , text ,
    }) ;
    creating = true ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/threads/create` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      return flashPush('error' , `Could not create thread`) ;
    }
    await getThreads() ;
    title = '' ;
    text = '' ;
    creating = false ;
  } ;

  onMount(async () => {
    await Promise.all([
      getThreads() ,
    ]) ;
  });

  afterNavigate(() => {
    $requireAuthentication = true ;
  }) ;
</script>

{#if threads !== undefined}
  <h1>All Threads</h1>
  <ul>{#each threads as {date , author , title , _id} , i}
    <li>
      <div>{author.username} at {date}</div>
      <div><a href="/thread?id={_id}">{title}</a></div>
    </li>
  {/each}</ul>
  <h1>Create Thread</h1>
  <h2>Title</h2>
  <div contenteditable="plaintext-only" bind:textContent={title}></div>
  <h2>Text</h2>
  <div contenteditable="plaintext-only" bind:textContent={text}></div>
  <button on:click={postThread} disabled={creating}>Send</button>
{:else}
  <p>Loading threads...</p>
{/if}