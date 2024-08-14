<script lang=ts>
  import { PUBLIC_BACKEND_URL } from "$env/static/public" ;
  import { flashPush } from "$lib/flash-messages" ;
  import type { ThreadTree } from "$lib/thread-tree" ;
  import { createEventDispatcher } from "svelte";

  export let root : ThreadTree ;
  export let tree : ThreadTree ;

  const dispatch = createEventDispatcher<{'submit-comment' : true}>()

  let comment = '' ;
  let submitting = false ;
  const sendComment = async () => {
    const body = JSON.stringify({
      thread_root : root._id ,
      parent : tree._id ,
      text : comment ,
    }) ;
    submitting = true ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/threads/comment` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    }) ;
    if (!response.ok) {
      return flashPush('error' , 'Could not submit comment') ;
    }
    comment = '' ;
    submitting = false ;
    dispatch('submit-comment' , true) ;
  } ;
</script>

<div
  style="
    padding : 5px ;
    border : 1px solid black ;
  "
>
  {#if tree.title}
  <h1>{tree.title}</h1>
  {/if}
  <div>Author: {tree.author}</div>
  <div>{tree.text}</div>
  <div>
    {#if tree.children.length > 0}
      <div>Comments</div>
      <div>{#each tree.children as child}
        <svelte:self tree={child} {root} on:submit-comment></svelte:self>
      {/each}</div>
    {/if}
    <div>
      <div>Add Comment</div>
      <div contenteditable="plaintext-only" bind:textContent={comment}></div>
      <button on:click={sendComment}>Submit</button>
    </div>
  </div>
</div>
