import dotenv from 'dotenv';
dotenv.config();
export * as Schemas from '../iso/schemas' ;
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import { ChatMessage, ChatMessageUser, File, Folder, FolderFull, Space, Thread, ThreadComment, ThreadFull, ThreadListed, Todolist, User } from '../iso/schemas';
import { pipeline } from 'zod';

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const mongoClient = new MongoClient(process.env.MONGO_URL!);
export const db = mongoClient.db(`main`) ;

export const users = db.collection<User>('users') ;
export const todolists = db.collection<Todolist>('todolists') ;
export const chatMessages = db.collection<ChatMessage>('chat-messages') ;
export const chatMessagesUsers = db.collection<ChatMessageUser>('chat-messages-users') ;
export const threads = db.collection<Thread>('threads') ;
export const threadComments = db.collection<ThreadComment>('thread-comments') ;
export const threadsListed = db.collection<Thread>('threads-listed') ;
export const threadsFull = db.collection<ThreadFull>('threads-full') ;
export const folders = db.collection<Folder>('folders') ;
export const foldersFull = db.collection<FolderFull>('folders-full') ;
export const files = db.collection<File>('files') ;
export const spaces = db.collection<Space>('spaces') ;

export const main = async () => {
  console.log(`Connecting to REDIS and MongoDB`) ;
  await Promise.all([
    redisClient.connect() ,
    mongoClient.connect() ,
  ]) ;
  console.log(`Connected to REDIS and MongoDB`) ;
  console.log(`Setting up indexes`) ;
  await Promise.all([
    users.createIndex({ username : 1 } , { unique : true }) ,
    todolists.createIndex({ space : 1 } , { unique : true }) ,
    chatMessages.createIndex({ space : 1 , date : 1 }) ,
    chatMessages.createIndex({ space : 1 , author : 1 }) ,
    threads.createIndex({ space : 1 , date : 1 }) ,
    threads.createIndex({ space : 1 }) ,
    threadComments.createIndex({ thread_root : 1 }) ,
    threadComments.createIndex({ thread_root : 1 , date : 1 }) ,
    folders.createIndex({ parent : 1 }) ,
    folders.createIndex({ space : 1 , parent : 1 }) , // important to quickly find top-level folders
    files.createIndex({ parent : 1 }) ,
    spaces.createIndex({ owner : 1 , owner_type : 1 }) ,
  ]) ;
  console.log(`Indexes set up`) ;
  console.log(`Creating Views`) ;
  if (process.env.DEV === 'true') {
    await Promise.all([
      db.dropCollection('chat-messages-users') ,
      db.dropCollection('threads-full') ,
      db.dropCollection('threads-listed') ,
      db.dropCollection('folders-full') ,
    ]) ;
  }
  await Promise.all([
    db.createCollection<ChatMessageUser>('chat-messages-users' , {
      viewOn : 'chat-messages' ,
      pipeline : [{
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author' ,
          pipeline : [{
            $project : { password : 0 } ,
          }] ,
        }
      } , {
        $unwind: '$author'
      } , {
        $project: {
          author: 1 ,
          date: 1 ,
          text: 1 ,
          space: 1,
        }
      }] ,
    }) ,
    db.createCollection<ThreadFull>('threads-full' , {
      viewOn : 'threads' ,
      pipeline : [{
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author' ,
          pipeline : [{
            $project : { password : 0 } ,
          }] ,
        }
      } , {
        $unwind : '$author' ,
      } , {
        $lookup: {
          from: "thread-comments",
          localField: "_id",
          foreignField: "thread_root",
          as: "comments" ,
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author",
                pipeline : [{
                  $project : { password : 0 } ,
                }] ,
              }
            } , 
            { $unwind : '$author' }
          ]
        }
      } ,
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "comments.author",
      //     foreignField: "_id",
      //     as: "comment_authors",
      //     pipeline : [{
      //       $project : { password : 0 } ,
      //     }] ,
      //   }
      // } ,
      ]
    }) ,
    db.createCollection<ThreadListed>('threads-listed' , {
      viewOn : 'threads' ,
      pipeline : [{
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline : [{
            $project : { password : 0 } ,
          }] ,
        }
      } , {
        $unwind : '$author' ,
      } ,
      {
        $project: {
          author: 1 ,
          date: 1,
          title: 1,
          space: 1,
        }
      }
      ]
    }) ,
    db.createCollection<FolderFull>('folders-full' , {
      viewOn : 'folders' ,
      pipeline : [{
        $lookup: {
          from: "folders",
          localField: "_id",
          foreignField: "parent",
          as: "folder_children",
        }
      } , {
        $lookup: {
          from: "files",
          localField: "_id",
          foreignField: "parent",
          as: "file_children",
        }
      } ]
    }) ,
  ]) ;
  console.log(`Views Created`) ;
} ;
