<script lang="ts">
  import { onMount } from "svelte";
  import { beforeNavigate, goto } from "$app/navigation";
  import { getLoggedUser, loggedUser$ } from '$lib/user' ;
  import { beforeNavigateHook as flashHook, flashPush } from "$lib/flash-messages" ;
    import { page } from "$app/stores";

  beforeNavigate(async (url) => {
    flashHook() ;
    const to = url.to ;
    // console.log('navigate' , to?.url)
    if (to?.route.id?.startsWith(`/guard`)) {
      // console.log('guarded' , $loggedUser$) ;
      if ($loggedUser$ === undefined) {
        url.cancel() ;
        await mountPromise ;
        // console.log('mount promised') ;
        if ($loggedUser$ === null || $loggedUser$ === undefined) {
          flashPush(`warning` , `${to.route.id} requires authentication`) ;
          // console.log('goto login')
          goto('/login') ;
        } else {
          goto(to.url) ;
        }        
      }
    }
  }) ;

  let mountRes : Function ;
  let mountPromise = new Promise(res => mountRes = res) ;
  // console.log(mountPromise)
  onMount(async () => {
    // console.log('get user') ;
    await getLoggedUser() ;
    if ($page.url.pathname.startsWith('/guard') && $loggedUser$ === null) {
      flashPush(`warning` , `${$page.url.pathname} requires authentication`) ;
      // console.log('goto login')
      await goto('/login') ;
    }
    // console.log('got user' , $loggedUser$) ;
    mountRes() ;
  });
</script>

<nav>
  <a href="/">Home</a>
  {#if $loggedUser$ === undefined || $loggedUser$ === null}
    <a href="/login">Log In</a>
    <a href="/register">Register</a>
  {:else}
    <a href="/guard/dashboard">Dashboard</a>
    <a href="/logout">Log Out</a>
  {/if}
</nav>

{#await mountPromise}
  <div>Checking login...</div>
{:then}
  <slot />
{/await}