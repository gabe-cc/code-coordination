<script lang="ts">
  import { goto } from '$app/navigation';
  import { loggedUser$, logout } from '$lib/user';
  import { onMount } from 'svelte';

  onMount(async () => {
    await logout() ;
    await new Promise(res => setTimeout(res , 500)) ;
    goto('/') ;
  }) ;
</script>

<h1>Logging Out...</h1>