<script lang="ts">
  import { onMount } from 'svelte' ;
  import { afterNavigate, goto } from '$app/navigation' ;
  import { getLoggedUser , loggedUser$ } from '$lib/user' ;
  import { ChatMessageUserZ, ChatMessageZ, type ChatMessageUser } from '$iso/schemas' ;
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import deepEqual from 'deep-equal';
  import { page } from '$app/stores';
  import type { ObjectId } from '$iso/bson-objectid';

  let messages : Array<ChatMessageUser & {optimistic? : boolean}> | undefined = undefined ;
  let messages_last_update = null as Date | null ;
  let message_to_send : string = '' ;
  let message_pending = false ;

  const getMessages = async () => {
    const request_date = new Date() ;
    const body = JSON.stringify({
      spaceId : $page.url.searchParams.get('s') ,
      ...(messages_last_update === null ? {} : { last_date : messages_last_update }) ,
    }) ;
    // console.log('get' , body) ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/chat/view` , {
      credentials : 'include' ,
      body ,
      method : 'POST' ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    const json = await response.json() ;
    console.log('got messages' , json) ;
    if (!json.ok) {
      flashPush('error' , `Could not load chat`) ;
      console.error('error' , json) ;
    }
    const new_messages = json.messages.map((x : any) => ChatMessageUserZ.parse(x)) as Array<ChatMessageUser> ;
    new_messages.sort((x , y) => x.date.getTime() - y.date.getTime()) ;
    // console.log({new_messages , ...(body ? JSON.parse(body) : {})})
    if (new_messages.length === 0) {
      messages_last_update =
        messages_last_update === null
        ? request_date
        : new Date(
          Math.max(
            messages_last_update.getTime() ,
            request_date.getTime() ,
          )
        ) ;
      if (messages === undefined) messages = [] ;
    } else {
      const last_msg_date = new_messages.at(-1)!.date ;
      messages_last_update =
        messages_last_update === null
        ? new Date(
          Math.max(
            last_msg_date.getTime() ,
            request_date.getTime() ,
          )
        ) : new Date(
          Math.max(
            messages_last_update.getTime() ,
            last_msg_date.getTime() ,
            request_date.getTime() ,
          )
        ) ;
      messages = [...(messages || []) , ...new_messages] ;
      messages = messages
        .filter(x => !(x.optimistic && x.date.getTime() <= messages_last_update!.getTime())) // remove optimistic messages older than what we got from the server
        .sort((x , y) => x.date.getTime() - y.date.getTime())
        .filter((x , i , self) => !(i > 0 && deepEqual(x , self[i - 1]))) // remove duplicates
    }
  } ;

  const sendMessage = async () => {
    if (message_pending) return ;
    if (message_to_send === '') return ;
    message_pending = true ;
    try {
      messages = [...messages! , {
        author : {
          _id : $loggedUser$!._id ,
          username : $loggedUser$!.username ,
        } ,
        date : new Date() ,
        optimistic : true ,
        text : message_to_send ,
        space : null as any ,
      }] ;
      const text = message_to_send ;
      message_to_send = '' ;
      const response = await fetch(`${PUBLIC_BACKEND_URL}/chat/send-message` , {
        credentials : 'include' ,
        body : JSON.stringify({text , spaceId : $page.url.searchParams.get('s')}) ,
        headers : {
          'Content-Type' : 'application/json' ,
        } ,
        method : 'POST' ,
      }) ;
      const json = await response.json() ;
      if (json.ok) {
        message_pending = false ;
      }
    } catch (e) {
      flashPush('error' , `Error while sending message` , { ms : 1000 }) ;
      message_pending = false ;
    }
  } ;

  onMount(() => {
    getMessages() ;
    const interval = setInterval(getMessages , 1000) ;
    return () => clearInterval(interval) ;
  });
</script>

{#if messages !== undefined}
  <h1>Todolist</h1>
  <ul>{#each messages as {date , author , text} , i}
    <li>
      <div>{author.username} at {date}</div>
      <div>{text}</div>
    </li>
  {/each}</ul>
  <div contenteditable="plaintext-only" bind:textContent={message_to_send}></div>
  <button on:click={sendMessage} disabled={message_pending}>Send</button>
{:else}
  <p>Loading todolist...</p>
{/if}