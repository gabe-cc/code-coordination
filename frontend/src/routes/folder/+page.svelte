<script lang="ts">
  import { afterUpdate, onMount } from 'svelte' ;
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$, requireAuthentication } from '$lib/user' ;
  import { page } from '$app/stores' ;
  import { FolderFullZ, type Folder, type FolderFull } from '$iso/schemas' ;
  import FolderC from './FolderC.svelte' ;
  import { getFolder } from './folder';
  import type { PageData } from './$types';

  export let data : PageData ;
  let my_folder : FolderFull | undefined = data.folder ;

  onMount(async () => {
    if (my_folder === undefined) {
      my_folder = await getFolder({ id : $page.url.searchParams.get('id') , fetch}) ;    
    }
  })

  afterNavigate(() => {
    $requireAuthentication = true ;
  }) ;
</script>


{#if my_folder !== undefined}
  <FolderC folder={my_folder} reloader={() => getFolder({ id : $page.url.searchParams.get('id') , fetch }).then(x => {my_folder = x})}></FolderC>
{:else}
  <p>Loading folder...</p>
{/if}