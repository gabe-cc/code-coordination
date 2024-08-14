<script lang="ts">
  import { afterUpdate, onMount } from 'svelte' ;
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
</script>


{#if my_space !== undefined}
  <a href="/guard/todo?s={spaceId}">Todolist</a>
  <a href="/guard/chat?s={spaceId}">Chat</a>
  <a href="/guard/threads?s={spaceId}">Threads</a>
  <a href="/guard/folders?s={spaceId}">Roots</a>
{:else}
  <p>Loading space...</p>
{/if}