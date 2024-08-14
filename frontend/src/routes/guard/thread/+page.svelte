<script lang="ts">
  import { onMount } from 'svelte' ;
  import { afterNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$ } from '$lib/user' ;
  import { ChatMessageUserZ, ChatMessageZ, ThreadFullZ, type ChatMessageUser, type ThreadFull } from '$iso/schemas' ;
  import { page } from '$app/stores' ;
  import Tree from './Tree.svelte' ;
  import { fullToTree } from '$lib/thread-tree' ;
  import type { PageData } from './$types';
    import { getThread } from './thread';

  export let data : PageData ;
  let thread : ThreadFull | undefined = data.thread ;

  onMount(async () => {
    if (thread === undefined) {
      thread = await getThread({
        id : $page.url.searchParams.get('id') ,
        fetch ,
      }) ;
    }
  });
</script>

{#if thread !== undefined}
  <h1>View Thread</h1>
  <p
    style="
      white-space : pre-wrap ;
    "
  >{JSON.stringify(thread , null , 2)}</p>
  <Tree tree={fullToTree(thread)} root={fullToTree(thread)} on:submit-comment={() => getThread({
    id : $page.url.searchParams.get('id') ,
    fetch ,
  })}></Tree>
{:else}
  <p>Loading thread...</p>
{/if}