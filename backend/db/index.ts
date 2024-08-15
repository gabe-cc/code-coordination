import dotenv from 'dotenv';
dotenv.config();
export * as Schemas from '../iso/schemas' ;
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import { ChatMessage, ChatMessageUser, File, Folder, FolderFull, Space, Team, TeamRequest, TeamRequestFull, TeamRequestFullZ, Thread, ThreadComment, ThreadFull, ThreadListed, Todolist, User, UserFull } from '../iso/schemas';

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const mongoClient = new MongoClient(process.env.MONGO_URL!);
export const db = mongoClient.db(`main`) ;

export const users = db.collection<User>('users') ;
export const usersFull = db.collection<UserFull>('users-full') ;
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
export const teams = db.collection<Team>('teams') ;
export const teamRequests = db.collection<TeamRequest>('team-requests') ;
export const teamRequestsFull = db.collection<TeamRequestFull>('team-requests-full') ;

// async function listAllIndexes() {
//   const collections = await db.listCollections().toArray();
//   const indexesByCollection : any = {};

//   for (const collectionInfo of collections) {
//     const collectionName = collectionInfo.name;
//     const collection = db.collection(collectionName);
//     if (collectionInfo.type === 'collection') {
//       const indexes = await collection.listIndexes().toArray();
//       indexesByCollection[collectionName] = indexes;  
//     }
//   }

//   return indexesByCollection;
// }

// // Usage
// async function printAllIndexes() {
//   try {
//     const allIndexes = await listAllIndexes();
//     console.log(JSON.stringify(allIndexes, null, 2));
//   } catch (error) {
//     console.error("Error listing indexes:", error);
//   }
// }

export const main = async () => {
  if (process.env.DEV === 'true') {
    await Promise.all([
      db.dropCollection('chat-messages-users') ,
      db.dropCollection('threads-full') ,
      db.dropCollection('threads-listed') ,
      db.dropCollection('folders-full') ,
      db.dropCollection('users-full') ,
      // teams.dropIndex('teamname_1') ,
      // users.dropIndex('user_id_1') ,
    ]) ;
  }
  console.log(`Connecting to REDIS and MongoDB`) ;
  await Promise.all([
    redisClient.connect() ,
    mongoClient.connect() ,
  ]) ;
  console.log(`Connected to REDIS and MongoDB`) ;
  console.log(`Setting up indexes`) ;
  // await printAllIndexes() ;
  await Promise.all([
    users.createIndex({ username : 1 } , { unique : true }) ,
    users.createIndex({ teams : 1 }) ,
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
    teams.createIndex({ teamname : 1 } , { unique : true }) ,
    teamRequests.createIndex({ team : 1 }) ,
    teamRequests.createIndex({ user : 1 }) ,
  ]) ;
  console.log(`Indexes set up`) ;
  console.log(`Creating Views`) ;
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
    db.createCollection<UserFull>('users-full' , {
      viewOn : 'users' ,
      pipeline : [
        { $lookup: {
          from: "teams",
          localField: "teams",
          foreignField: "_id",
          as: "teams",
        } } ,
      ]
    }) ,
    db.createCollection<TeamRequestFull>('team-requests-full' , {
      viewOn : 'team-requests' ,
      pipeline : [
        { $lookup: {
          from: 'teams' ,
          localField : 'team' ,
          foreignField : '_id' ,
          as:'team' ,
        } } ,
        { $unwind : '$team' } ,
      ] ,
    })
  ]) ;
  console.log(`Views Created`) ;
} ;
