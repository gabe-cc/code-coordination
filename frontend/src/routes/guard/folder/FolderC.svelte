<script lang="ts">
  import { PUBLIC_BACKEND_URL } from '$env/static/public' ;
  import { flashPush } from '$lib/flash-messages' ;
  import { FolderFullZ, type Folder, type FolderFull } from '$iso/schemas' ;
  import { ObjectId } from '$iso/bson-objectid' ;
    import { page } from '$app/stores';

  export let folder : FolderFull ;
  export let reloader : () => Promise<void> ;

  let new_child_folder_name = '' ;
  let new_child_file_name = '' ;
  let creating = false ;

  // console.log('folder component' , folder) ;

  const postChildFolder = async () => {
    if (!new_child_folder_name) {
      return flashPush('error' , `Can't create sub-folder with empty title`) ;
    }
    const body = JSON.stringify({
      name : new_child_folder_name ,
      parent : folder._id ,
      spaceId : $page.url.searchParams.get('s')
    }) ;
    creating = true ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/folder/create` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      return flashPush('error' , `Could not create folder`) ;
    }
    await reloader() ;
    new_child_folder_name = '' ;
    creating = false ;
  } ;

  const postChildFile = async () => {
    if (!new_child_file_name) {
      return flashPush('error' , `Can't create sub-file with empty title`) ;
    }
    const body = JSON.stringify({
      name : new_child_file_name ,
      parent : folder._id ,
      spaceId : $page.url.searchParams.get('s') ,
    }) ;
    creating = true ;
    const response = await fetch(`${PUBLIC_BACKEND_URL}/file/create` , {
      credentials : 'include' ,
      method : 'POST' ,
      body ,
      headers : {
        'Content-Type' : 'application/json' ,
      } ,
    });
    if (!response.ok) {
      return flashPush('error' , `Could not create file`) ;
    }
    await reloader() ;
    new_child_file_name = '' ;
    creating = false ;
  } ;
</script>

<h1>Folder {folder.name}</h1>
<h2>Sub Folders</h2>
<ul>{#each folder.folder_children as folder_child}
  <li><a href="/guard/folder?s={$page.url.searchParams.get('s')}&id={folder_child._id}">{folder_child.name}</a></li>
{/each}</ul>
<div contenteditable="plaintext-only" bind:textContent={new_child_folder_name}></div>
<button on:click={postChildFolder} disabled={creating}>Create Sub Folder</button>
<h2>Files</h2>
<ul>{#each folder.file_children as file_child}
  <li><a href="/guard/file?s={$page.url.searchParams.get('s')}&id={file_child._id}">{file_child.name}</a></li>
{/each}</ul>
<div contenteditable="plaintext-only" bind:textContent={new_child_file_name}></div>
<button on:click={postChildFile} disabled={creating}>Create File</button>