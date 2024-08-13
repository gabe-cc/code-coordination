<script lang="ts">
  import { loggedUser$ } from '$lib/user' ;
</script>

<h1>Welcome to The Website</h1>
{#if $loggedUser$}
  <h2>Welcome, {$loggedUser$.username}!</h2>
{:else}
  <h2>You are not logged in</h2>
{/if}