import type { ObjectId } from "$iso/bson-objectid" ;
import type { ThreadFull } from "$iso/schemas" ;

export type ThreadTree = {
  title : string ,
  author : string ,
  date : Date ,
  _id : ObjectId ,
  text : string ,
  children : Array<ThreadTree> ,
} ;

export const fullToTree = (x : ThreadFull) : ThreadTree => {
  const tree : ThreadTree = {
    title : x.title ,
    author : x.author.username ,
    date : x.date ,
    _id : x._id ,
    text : x.text ,
    children : [] ,
  } ;
  const map : Record<string , ThreadTree> = {
    [x._id.toString()] : tree ,
  } ;
  const chronologicalComments = x.comments.slice().sort((x,y) => x.date.getTime() - y.date.getTime()) ;
  for (let c of chronologicalComments) {
    const subTree : ThreadTree = {
      title : '' ,
      author : c.author.username ,
      date : c.date ,
      _id : c._id ,
      text : c.text ,
      children : [] ,
    } ;
    map[c._id.toString()] = subTree ;
    map[c.parent.toString()].children.push(subTree) ;
  }
  return tree ;
} ;