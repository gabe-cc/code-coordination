<script lang="ts">
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import { page } from '$app/stores' ;
  import { FileUserZ, type File } from '$iso/schemas' ;
  import type { ObjectId } from '$iso/bson-objectid' ;
  import { afterNavigate } from '$app/navigation';
  import FileC from './FileC.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { getFile } from './file' ;

  export let data : PageData ;
  let file : File & {_id : ObjectId} | undefined = data.file ;

  onMount(async () => {
    file = await getFile({id : $page.url.searchParams.get('id') , fetch}) ;
  })
</script>

{#if file !== undefined}
  <FileC {file}></FileC>
{:else}
  <p>Loading file...</p>
{/if}