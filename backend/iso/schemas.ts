import { ObjectId } from './bson-objectid' ;
import { z } from 'zod';

export const ObjectIdZ = z.custom<ObjectId>((val) => {
  return val instanceof ObjectId || (typeof val === 'string' && ObjectId.isValid(val));
}).transform(x => typeof x === 'string' ? ObjectId.createFromHexString(x) : x);

export const computeSkipGrams = (x : string) => {
  const results : Array<string> = [] ;
  for (let i = 0 ; i < x.length - 5; i++) {
    results.push(x.slice(i, i + 5));
  }
  for (let i = 0 ; i < x.length - 6 ; i++) {
    for (let skip = 0 ; skip < 5 ; skip++) {
      const skipGram = x.slice(i, i + skip) + x.slice(i + skip + 1, i + skip + 5) ;
      results.push(skipGram);
    }
  }
  return results ;
} ;

export const computeTextIndex = (text : string) => {
  const tokens = text.split(/\s+/).map(x => x.toLowerCase()) ;
  const words34 = tokens.filter(x => x.length === 3 || x.length === 4) ;
  const skip5grams = tokens.filter(x => x.length >= 5).flatMap(computeSkipGrams) ;
  return { words34 , skip5grams } ;
} ;

export const computeTextChunks = (text : string) => {
  const chunkTexts = text.split('\n') ;
  const chunks = chunkTexts.map((line_text , line_nb) => {
    const index = computeTextIndex(line_text) ;
    return { line_nb , line_text , ...index } ;
  }) ;
  return chunks ;
} ;

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

export const SearchIndexZ = z.object({
  words34 : z.array(z.string()) ,
  skip5grams : z.array(z.string()) ,
}) ;

export const SearchChunkZ = z.object({
  line_nb : z.number() ,
  line_text : z.string() ,
}).merge(SearchIndexZ) ;

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
}).merge(SearchIndexZ) ;
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

export const ThreadCommentChunkZ = z.object({
  thread_comment : ObjectIdZ ,
  space : ObjectIdZ ,
}).merge(SearchChunkZ) ;
export type ThreadCommentChunk = z.infer<typeof ThreadCommentChunkZ> ;


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

export const ThreadChunkZ = z.object({
  thread : ObjectIdZ ,
  space : ObjectIdZ ,
}).merge(SearchChunkZ) ;
export type ThreadChunk = z.infer<typeof ThreadChunkZ> ;


export const FolderZ = z.object({
  owner : ObjectIdZ ,
  name : z.object({
    text : z.string() ,
  }).merge(SearchIndexZ) ,
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
}) ;
export type FolderFull = z.infer<typeof FolderFullZ> ;

export const FileZ = z.object({
  name : z.object({
    text : z.string() ,
  }).merge(SearchIndexZ) ,
  text : z.string() ,
  parent : ObjectIdZ ,
  space : ObjectIdZ ,
}) ;
export type File = z.infer<typeof FileZ> ;

export const FileChunkZ = z.object({
  file : ObjectIdZ ,
  space : ObjectIdZ ,
}).merge(SearchChunkZ)
export type FileChunk = z.infer<typeof FileChunkZ> ;

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

export const TeamDashboardZ = z.object({
  _id : ObjectIdZ ,
  admin : z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  }) ,
  space : ObjectIdZ ,
  teamname : z.string() ,
  requests : z.array(z.object({
    _id : ObjectIdZ ,
    team : ObjectIdZ ,
    user : z.object({
      _id : ObjectIdZ ,
      username : z.string() ,  
    })
  })) ,
  members : z.array(z.object({
    _id : ObjectIdZ ,
    username : z.string() ,
  })) ,
}) ;

export type TeamDashboard = z.infer<typeof TeamDashboardZ> ;

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