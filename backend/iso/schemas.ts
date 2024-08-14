import { ObjectId } from './bson-objectid' ;
import { z } from 'zod';

export const ObjectIdZ = z.custom<ObjectId>((val) => {
  return val instanceof ObjectId || (typeof val === 'string' && ObjectId.isValid(val));
}).transform(x => typeof x === 'string' ? ObjectId.createFromHexString(x) : x);

declare global {
  namespace Express {
    interface User {
      _id : ObjectId ;
      username : string ;
      space : ObjectId;
    }
  }
}

export type User = {
  username: string;
  password: string;
  space : ObjectId;
  teams: Array<ObjectId>;
}

export type UserFull = {
  _id : ObjectId ;
  password: string;
  username : string ;
  space : ObjectId ;
  teams : Array<Team> ;
}

export type SafeUserFull = {
  _id : ObjectId ;
  username : string ;
  space : ObjectId ;
  teams : Array<Team> ;
}

export const ItemZ = z.string() ;
export type Item = z.infer<typeof ItemZ> ;

export const ItemsZ = z.array(ItemZ) ;
export type Items = z.infer<typeof ItemsZ> ;
export const TodolistZ = z.object({
  content : ItemsZ ,
  space : ObjectIdZ ,
})
export type Todolist = z.infer<typeof TodolistZ>

export const ChatMessageZ = z.object({
  author : ObjectIdZ ,
  date : z.coerce.date() ,
  text : z.string() ,
  space : ObjectIdZ ,
}) ;
export type ChatMessage = z.infer<typeof ChatMessageZ> ;

export const ChatMessageUserZ = z.object({
  author : z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  }) ,
  date : z.coerce.date() ,
  text : z.string() ,
  space : ObjectIdZ ,
}) ;
export type ChatMessageUser = z.infer<typeof ChatMessageUserZ> ;

export const ThreadZ = z.object({
  author : ObjectIdZ ,
  date : z.coerce.date() ,
  title : z.string() ,
  text : z.string() ,
  space : ObjectIdZ ,
}) ;
export type Thread = z.infer<typeof ThreadZ> ;

export const ThreadListedZ = z.object({
  author : z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  }) ,
  date : z.coerce.date() ,
  title : z.string() ,
})
export type ThreadListed = z.infer<typeof ThreadListedZ> ;


export const ThreadCommentZ = z.object({
  author : ObjectIdZ ,
  date : z.coerce.date() ,
  text : z.string() ,
  thread_root : ObjectIdZ ,
  parent : ObjectIdZ , // Can be thread_root, or a comment that shares the thread_root
}) ;
export type ThreadComment = z.infer<typeof ThreadCommentZ> ;

export const ThreadCommentFullZ = z.object({
  author : z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  }) ,
  _id : ObjectIdZ ,
  date : z.coerce.date() ,
  text : z.string() ,
  thread_root : ObjectIdZ ,
  parent : ObjectIdZ , // Can be thread_root, or a comment that shares the thread_root
}) ;
export type ThreadCommentFull = z.infer<typeof ThreadCommentFullZ> ;

export const ThreadFullZ = z.object({
  author : z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  }) ,
  _id : ObjectIdZ ,
  date : z.coerce.date() ,
  text : z.string() ,
  title : z.string() ,
  comments : z.array(ThreadCommentFullZ) ,
  space : ObjectIdZ ,
})
export type ThreadFull = z.infer<typeof ThreadFullZ> ;

export const FolderZ = z.object({
  owner : ObjectIdZ ,
  name : z.string() ,
  parent : ObjectIdZ.nullable() , // null means top-level
})
export type Folder = z.infer<typeof FolderZ> ;

export const FolderFullZ = z.object({
  _id : ObjectIdZ ,
  name : z.string() ,
  parent : ObjectIdZ.nullable() , // null means top-level
  folder_children : z.array(z.object({
    _id : ObjectIdZ ,
    name : z.string() ,
  })) ,
  file_children : z.array(z.object({
    _id : ObjectIdZ ,
    name : z.string() ,
  })) ,
  space : ObjectIdZ ,
})
export type FolderFull = z.infer<typeof FolderFullZ> ;

export const FileZ = z.object({
  name : z.string() ,
  text : z.string() ,
  parent : ObjectIdZ ,
  space : ObjectIdZ ,
}) ;
export type File = z.infer<typeof FileZ> ;

export const FileUserZ = FileZ.extend({
  _id : ObjectIdZ ,
}) ;
export type FileUser = z.infer<typeof FileUserZ> ;

export const SpaceZ = z.object({
}) ;
export type Space = z.infer<typeof SpaceZ> ;

export type SpaceIdEz =
| {type : 'id' , content : ObjectId }
| {type : 'user-name' , content : string }
| {type : 'team-name' , content : string }
export const SpaceIdEzZ = z.custom<ObjectId | string>((val) => {
  if (val instanceof ObjectId) return true ;
  if (typeof val !== 'string') return false ;
  if (ObjectId.isValid(val)) return true ;
  if (val.startsWith('id-') && ObjectId.isValid(val.slice(3))) return true ;
  if (val.startsWith('u-') && val.length > 2) return true ;
  if (val.startsWith('t-') && val.length > 2) return true ;
  return false ;
}).transform((val : ObjectId | string) : SpaceIdEz => {
  if (val instanceof ObjectId)
    return {type : 'id' , content : val} ;
  if (ObjectId.isValid(val))
    return {type : 'id' , content : ObjectId.createFromHexString(val)} ;
  if (val.startsWith('id-') && ObjectId.isValid(val.slice(3)))
    return {type : 'id' , content : ObjectId.createFromHexString(val.slice(3))} ;
  if (val.startsWith('u-') && val.length > 2)
    return {type : 'user-name' , content : val.slice(2)} ;
  if (val.startsWith('t-') && val.length > 2)
    return {type : 'team-name' , content : val.slice(2)} ;
  throw new Error(`impossible`)
});

export const TeamZ = z.object({
  admin : ObjectIdZ , // user id
  space : ObjectIdZ ,
  teamname : z.string() ,
}) ;

export type Team = z.infer<typeof TeamZ> ;

export const TeamRequestZ = z.object({
  team : ObjectIdZ ,
  user : ObjectIdZ ,
}) ;

export type TeamRequest = z.infer<typeof TeamRequestZ> ;

export const TeamRequestFullZ = z.object({
  team : TeamZ.extend({_id : ObjectIdZ}) ,
  user : ObjectIdZ ,
}) ;

export type TeamRequestFull = z.infer<typeof TeamRequestFullZ> ;