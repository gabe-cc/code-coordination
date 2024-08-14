<script lang="ts">
  import { onMount } from "svelte";
  import { beforeNavigate, goto } from "$app/navigation";
  import { getLoggedUser, loggedUser$, requireAuthentication } from '$lib/user' ;
  import { beforeNavigateHook as flashHook } from "$lib/flash-messages" ;

  beforeNavigate(() => {
    flashHook() ;
    $requireAuthentication = false ;
  })

  let mounted = false ;
  onMount(async () => {
    getLoggedUser() ;
    mounted = true ;
  });
  $: if (mounted && $loggedUser$ === null && $requireAuthentication) {
    setTimeout(() => goto('/login') , 2000) ;
  }
  $: console.log($loggedUser$) ;
  $: console.log('require auth' , $requireAuthentication) ;
</script>

<nav>
  <a href="/">Home</a>
  {#if $loggedUser$ === undefined || $loggedUser$ === null}
    <a href="/login">Log In</a>
    <a href="/register">Register</a>
  {:else}
    <a href="/dashboard">Dashboard</a>
    <a href="/space?s=u-{$loggedUser$.username}">My Space</a>
    <a href="/logout">Log Out</a>
  {/if}
</nav>

{#if $requireAuthentication}
  {#if $loggedUser$ === undefined}
    <div>Loading user...</div>
  {:else if $loggedUser$ === null}
    <div>Page requires authentication. Redirecting to login...</div>
  {:else }
    <slot />
  {/if}
{:else}
  <slot />
{/if}