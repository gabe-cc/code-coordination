<script lang="ts">
  import { onMount } from 'svelte' ;
  import { afterNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$, requireAuthentication } from '$lib/user' ;
  import { type Items , ItemsZ } from '$iso/schemas' ;
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import debounce from 'debounce' ;

  let items : Items | undefined = undefined ;

  const getItems = async () => {
    const response = await fetch(`${PUBLIC_BACKEND_URL}/todo` , {
      credentials : 'include' ,
    });
    const json = await response.json() ;
    if (!json.ok) {
      flashPush('error' , `Could not load todolist`) ;
      goto('/') ;
    }
    items = json.content ;
  } ;

  const postItemsRaw = async () => {
    // console.log('posting items' , items_loaded)
    if (items === null) return ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/todo` , {
      credentials : 'include' ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
      body : JSON.stringify({ new_content : items }) ,
      method : 'POST' ,
    }) ;
    // console.log('response from posting') ;
    const json = await response.json() ;
    // console.log('json response from posting' , json) ;
    if (!json.ok) {
      flashPush('error' , `Could not update todolist`) ;
    }
  } ;
  const postItems = debounce(postItemsRaw , 500) ;
  $: items && postItems() ;

  const addItem = async () => {
    items = [...items! , ''] ;
  } ;
  const removeItem = async (i : number) => {
    items = items!.filter((_ , j) => j !== i) ;
  } ;

  afterNavigate(() => {
    $requireAuthentication = true ;
  }) ;

  onMount(async () => {
    await Promise.all([
      getItems() ,
    ])
  });
</script>

{#if items !== undefined}
  <h1>Todolist</h1>
  <ul>{#each items as item , i}
    <li>
      <div contenteditable="plaintext-only" bind:textContent={item}></div>
      <button on:click={() => removeItem(i)}>Remove</button>
    </li>
  {/each}</ul>
  <button on:click={addItem}>Add Item</button>
{:else}
  <p>Loading todolist...</p>
{/if}