import { writable, type Readable } from "svelte/store"

export type FlashTimeout = 
| { ms : number }
| { page : number }
| 'infinite'

export type FlashMessage = {
  type : 'error' | 'warning' | 'success' ,
  content : string ,
  timeout : FlashTimeout ,
}

export const FlashMessage = (
  x : FlashMessage['type'] , y : string ,
  z : FlashMessage['timeout'] = { page : 1 } ,
) : FlashMessage =>
  ({type : x , content : y , timeout : z}) ;

const flashMessagesRaw = writable(Array<FlashMessage>()) ;
export const flashPush = (x : FlashMessage['type'] , y : string , z? : FlashMessage['timeout']) => {
  const msg = FlashMessage(x , y , z) ;
  flashMessagesRaw.update(msgs => [...msgs , msg]) ;
  if (typeof msg.timeout === 'object' && 'ms' in msg.timeout) {
    setTimeout(() => flashRemove(msg) , msg.timeout.ms) ;
  }
} ;
export const flashRemove = (x : FlashMessage) => {
  flashMessagesRaw.update(msgs => msgs.filter(y => x !== y)) ;
}
export const flashMessages : Readable<Array<FlashMessage>> = flashMessagesRaw ;

export const beforeNavigateHook = () => {
  flashMessagesRaw.update(arr =>
    arr.map(x =>
      (typeof x.timeout === 'object' && 'page' in x.timeout ?
        {...x , timeout : { page : x.timeout.page - 1}} : x)
    ).filter(x =>
      (typeof x.timeout === 'object' && 'page' in x.timeout ?
        x.timeout.page >= 0 : true)
    )
    )
} ;
