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
      password : string ;
    }
  }
}

export interface User {
  username: string;
  password: string;
}

export interface SafeUser {
  _id : ObjectId ;
  username : string ;
}

export const ItemZ = z.string() ;
export type Item = z.infer<typeof ItemZ> ;

export const ItemsZ = z.array(ItemZ) ;
export type Items = z.infer<typeof ItemsZ> ;
export const TodolistZ = z.object({
  user_id : ObjectIdZ ,
  content : ItemsZ ,
})
export type Todolist = z.infer<typeof TodolistZ>

export const ChatMessageZ = z.object({
  author : ObjectIdZ ,
  date : z.coerce.date() ,
  text : z.string() ,
}) ;
export type ChatMessage = z.infer<typeof ChatMessageZ> ;

export const ChatMessageUserZ = z.object({
  author : z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  }) ,
  date : z.coerce.date() ,
  text : z.string() ,
}) ;
export type ChatMessageUser = z.infer<typeof ChatMessageUserZ> ;

export const ThreadZ = z.object({
  author : ObjectIdZ ,
  date : z.coerce.date() ,
  title : z.string() ,
  text : z.string() ,
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
  owner : ObjectIdZ ,
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
})
export type FolderFull = z.infer<typeof FolderFullZ> ;


export const FileZ = z.object({
  owner : ObjectIdZ ,
  name : z.string() ,
  text : z.string() ,
  parent : ObjectIdZ ,
}) ;
export type File = z.infer<typeof FileZ> ;

export const FileUserZ = FileZ.extend({
  _id : ObjectIdZ ,
}) ;
export type FileUser = z.infer<typeof FileUserZ> ;