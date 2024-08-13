<script lang="ts">
  import { goto } from '$app/navigation';
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;

  let username = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    // console.log('Sending Register Request') ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    // console.log(`Register Request Sent`)

    if (response.ok) {
      // console.log(`Logging In`) ;
      const logResponse = await fetch(`${PUBLIC_BACKEND_URL}/register` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })      
      }) ;
      if (logResponse.ok) {
        goto('/') ;
      } else {
        goto('/login') ;
      }
    } else {
      error = 'Registration failed';
    }
  }
</script>

<h1>Register</h1>
<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={username} type="text" placeholder="Username" required>
  <input bind:value={password} type="password" placeholder="Password" required>
  <button type="submit">Register</button>
</form>
{#if error}
  <p>{error}</p>
{/if}