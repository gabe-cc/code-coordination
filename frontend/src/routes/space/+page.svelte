<script lang="ts">
  import { afterUpdate, onMount } from 'svelte' ;
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$, requireAuthentication } from '$lib/user' ;
  import { page } from '$app/stores' ;
  import { type Space} from '$iso/schemas' ;
  import { getSpace } from './space';
  import type { PageData } from './$types';

  export let data : PageData ;
  let my_space : Space | undefined = data.space ;
  let spaceId : string = '' ;

  spaceId = $page.url.searchParams.get('s') || '' ;

  onMount(async () => {
    if (my_space === undefined) {
      my_space = await getSpace({ spaceId : $page.url.searchParams.get('s') , fetch}) ;    
    }
  })

  afterNavigate(() => {
    $requireAuthentication = true ;
  }) ;
</script>


{#if my_space !== undefined}
  <a href="/todo?s={spaceId}">Todolist</a>
  <a href="/chat?s={spaceId}">Chat</a>
  <a href="/threads?s={spaceId}">Threads</a>
  <a href="/folders?s={spaceId}">Roots</a>
{:else}
  <p>Loading space...</p>
{/if}