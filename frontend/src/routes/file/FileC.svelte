<script lang="ts">
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import { type File } from '$iso/schemas' ;
  import type { ObjectId } from '$iso/bson-objectid' ;
  import debounce from 'debounce';
    import { page } from '$app/stores';

  export let file : File & {_id : ObjectId} ;
  let content = file.text ;

  const editFileRaw = async () => {
    if (file === undefined) throw new Error('impossible') ;
    if (!content) {
      return flashPush('error' , `Can't make file empty`) ;
    }
    // console.log('editing file') ;
    const body = JSON.stringify({
      text : content , _id : file._id ,
    }) ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/file/edit` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      flashPush('error' , `Could not edit file`) ;
      response.json().then(x => console.log(x)) ;
      return ;
    }
    // console.log('file edited') ;
  } ;
  const editFileDebounce = debounce(editFileRaw , 500) ;
  const editFile = () => {
    // console.log('edit file raw') ;
    editFileDebounce() ;
  } ;
</script>

<h1>File {file.name}</h1>
<div
  contenteditable="plaintext-only" bind:textContent={content}
  on:input={editFile}
  style="
    white-space : pre-wrap
  "
></div>