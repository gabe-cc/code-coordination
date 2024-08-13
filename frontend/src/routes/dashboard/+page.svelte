<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getLoggedUser , loggedUser$ } from '$lib/user' ;
  import type { SafeUser } from '$iso/schemas';

  export const load = () => ({
    requireAuthentication : true ,
  })

  let user : SafeUser ;
  $: user = $loggedUser$! ;
</script>

<h1>All User Information</h1>
<p
  style="
    white-space : pre-wrap ;
  "
>{JSON.stringify(user , null , 2)
}</p>