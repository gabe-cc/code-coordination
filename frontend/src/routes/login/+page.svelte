<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/user';

  let username = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    const response = await login(username , password) ;
    if (response.ok) {
      goto('/guard/dashboard')
    } else {
      error = response.error ;
    }
  }
</script>

<h1>Login</h1>
<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={username} type="text" placeholder="Username" required>
  <input bind:value={password} type="password" placeholder="Password" required>
  <button type="submit">Login</button>
</form>
{#if error}
  <p>{error}</p>
{/if}