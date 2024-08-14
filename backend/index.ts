import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { Document, ObjectId, WithId } from 'mongodb';
import bcrypt from 'bcrypt';
import cors from 'cors';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { redisClient, users, main as dbMain, todolists, Schemas, chatMessages, chatMessagesUsers, threads, threadComments, threadsListed, threadsFull, folders, files, foldersFull, spaces, usersFull, teams, teamRequests, teamRequestsFull } from './db';
import { z } from 'zod';
import { ChatMessage, ObjectIdZ, Space, SpaceIdEz, SpaceIdEzZ, User } from './iso/schemas';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Session middleware
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await usersFull.findOne({ username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (!await bcrypt.compare(password, user.password)) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    // @ts-ignore
    delete user.password ;
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await usersFull.findOne({ _id: new ObjectId(id) } ,
      {projection : {password : 0}});
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

app.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (typeof username !== 'string')
    return res.status(400).json({message : `username should be a string`})
  if (typeof password !== 'string')
    return res.status(400).json({message : `password should be a string`})
  const hashedPassword = await bcrypt.hash(password, 10);
  const space = await spaces.insertOne({}) ;
  await users.insertOne({ username, password: hashedPassword , space : space.insertedId , teams : [] });
  res.json({ message: 'User registered successfully' });
});

app.post('/team/create', isAuthenticated , async (req, res) => {
  const { teamname } = req.body;
  if (typeof teamname !== 'string') return res.status(400).json({message : `teamname should be a string`})
  const space = await spaces.insertOne({}) ;
  const team = await teams.insertOne({
    admin : req.user!._id ,
    space : space.insertedId ,
    teamname ,
  }) ;
  res.json({ message: 'Team created successfully' , _id : team.insertedId }) ;
}) ;

app.post('/team/invite', isAuthenticated , async (req, res) => {
  const { teamId : teamIdRaw , userId : userIdRaw } = req.body ;
  const teamIdParsed = ObjectIdZ.safeParse(teamIdRaw) ;
  const userIdParsed = ObjectIdZ.safeParse(userIdRaw) ;
  if (!teamIdParsed.success || !userIdParsed.success)
    return res.status(400).json({message : `wrong id for team or user`}) ;
  const team = await teams.findOne({_id : teamIdParsed.data}) ;
  if (!team)
    return res.status(400).json({message : `wrong id for team or user`}) ;
  if (team.admin !== req.user!._id)
    return res.status(401).json({message : `not team admin`}) ;
  const teamRequest = await teamRequests.insertOne({
    user : userIdParsed.data ,
    team : teamIdParsed.data ,
  }) ;
  res.json({ message: 'Team request created successfully' , _id : teamRequest.insertedId }) ;
}) ;

app.post('/team/invite-accept', isAuthenticated , async (req, res) => {
  const { teamId : teamIdRaw } = req.body ;
  const teamIdParsed = ObjectIdZ.safeParse(teamIdRaw) ;
  if (!teamIdParsed.success)
    return res.status(400).json({message : `wrong id for team`}) ;
  const request = await teamRequests.findOne({
    team : teamIdParsed.data ,
    user : req.user!._id ,
  }) ;
  if (!request)
    return res.status(401).json({message : `no team request`}) ;
  const response = await users.updateOne(
    {_id : req.user!._id} ,
    {$addToSet : {teams : teamIdParsed.data}} ,
  ) ;
  if (!response.acknowledged)
    return res.status(500).json({message : `error while accepting team request`}) ;
  res.json({message: 'Team request accepted successfully'}) ;
}) ;


app.post('/login', passport.authenticate('local'), (req: Request, res: Response): void => {
  res.json({ message: 'Logged in successfully', user: req.user });
});

app.post('/logout', (req: Request, res: Response): void => {
  req.logout((err: any) => {
    if (err) {
      res.status(500).json({ message: 'Could not log out' });
    } else {
      res.json({ message: 'Logged out successfully' });
    }
  });
});

app.get('/user', isAuthenticated, (req: Request, res: Response): void => {
  res.json({ user : req.user! });
});

app.post('/dashboard', isAuthenticated, async (req , res) => {
  console.log('dashboard' , req.user!) ;
  const requests = await teamRequestsFull.find({user : req.user!._id}).toArray() ;
  res.json({ requests });
});


app.post('/todo/view' , isAuthenticated , async (req , res) => {
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;

  const todolist = await todolists.findOneAndUpdate(
    { space : spaceId } ,
    { $setOnInsert : { space : spaceId , content : [] } } ,
    { upsert : true , returnDocument : 'after' } ,
  ) ;
  if (!todolist) return res.status(500).json({message : 'could not fetch todolist'}) ;
  return res.json({...todolist , ok : true}) ;
}) ;

app.post('/chat/view' , isAuthenticated , async (req , res) => {
  const DAY_MS = 1000 * 3600 * 24 ;
  const last_date = z.coerce.date().safeParse(req.body.last_date).data ;
  const reference_timestamp = Math.max(
    last_date ? last_date.getTime() : 0 ,
    new Date().getTime() - DAY_MS ,
  ) ;
  // console.log('reference date' , new Date(reference_timestamp)) ;
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const query = {
    space: spaceId,
    date: { $gte: new Date(reference_timestamp) },
  };
  const messages = await chatMessagesUsers.find(query).toArray() ;
  // console.log('chat/view' , query , messages) ;
  return res.json({messages , ok : true}) ;
}) ;

app.post('/chat/send-message' , isAuthenticated , async (req , res) => {
  if (typeof req.body.text !== 'string') {
    return res.status(400).json({ message : `Expected a string 'text' field in body`}) ;  
  }
  const text = req.body.text ;
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const message : ChatMessage = {
    author : req.user!._id ,
    date : new Date() ,
    text , space : spaceId ,
  }
  const response = await chatMessages.insertOne(message) ;
  // console.log('chat/send' , message) ;
  if (response.acknowledged) {
    return res.json({ok : true}) ;
  } else {
    return res.status(500).json({ message : `Error while trying to add the message`}) ;
  }
}) ;

app.post('/threads/all' , isAuthenticated , async (req , res) => {
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const response = await threadsListed.find({space : spaceId}).toArray() ;
  console.log(`all threads` , response , spaceId) ;
  return res.json({ok : true , threads : response}) ;
}) ;

app.post(`/threads/create` , isAuthenticated , async (req , res) => {
  const title = req.body.title ;
  const text = req.body.text ;
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  if (typeof text !== 'string') {
    return res.status(400).json({ message : `Expected a string 'text' field in body`}) ;  
  }
  if (typeof title !== 'string') {
    return res.status(400).json({ message : `Expected a string 'title' field in body`}) ;  
  }
  const thread = {
    author: req.user!._id,
    space : spaceId ,
    date: new Date(),
    text, title ,
  } ;
  console.log('create thread' , thread , spaceId) ;
  const response = await threads.insertOne(thread) ;
  if (response.acknowledged) {
    return res.json({ok : true}) ;
  } else {
    return res.status(500).json({ message : `Error while trying to create the thread`}) ;
  }
}) ;
app.post('/threads/view' , isAuthenticated , async (req , res) => {
  const _idParse = ObjectIdZ.safeParse(req.body._id) ;
  if (!_idParse.success) {
    return res.status(400).json({ message : `Expected an '_id' field in body`}) ;  
  }
  const response = await threadsFull.findOne({_id: _idParse.data}) ;
  if (!response || !isUserSpaceAuthorised(req.user! , response.space)) {
    return res.status(400).json({ message : `Wrong Thread`}) ;
  }

  // const response = await threads.findOne({_id: _idParse.data}) ;
  // console.log(`view thread response`, {_id : _idParse.data , type : typeof _idParse.data} , response) ;
  return res.json({...response}) ;
}) ;
app.post('/threads/comment' , isAuthenticated , async (req , res) => {
  const thread_root_parse = ObjectIdZ.safeParse(req.body.thread_root) ;
  if (!thread_root_parse.success) {
    return res.status(400).json({ message : `Expected a valid 'thread_root' field in body`}) ;  
  }
  const thread_root = thread_root_parse.data ;
  const parent_parse = ObjectIdZ.safeParse(req.body.parent) ;
  if (!parent_parse.success) {
    return res.status(400).json({ message : `Expected a valid 'parent' field in body`}) ;
  }
  const parent = parent_parse.data ;
  const text = req.body.text ;
  if (typeof text !== 'string') {
    return res.status(400).json({ message : `Expected a valid 'text' field in body`}) ;
  }
  const response = await threadComments.insertOne({
    author : req.user!._id ,
    date : new Date() ,
    text , parent , thread_root ,
  }) ;
  if (response.acknowledged) {
    return res.json({ok : true}) ;
  } else {
    return res.status(500).json({ message : `Error while trying to submit the comment`}) ;
  }
}) ;

app.post(`/folder/create` , isAuthenticated , async (req , res) => {
  const spaceIdEzRaw = req.body.spaceId ;
  const parsedSpaceIdEz = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsedSpaceIdEz.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsedSpaceIdEz.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const name = req.body.name ;
  if (typeof name !== 'string') {
    return res.status(400).json({ message : `Expected a string name`}) ;
  }
  const parentRaw = req.body.parent ;
  let parent : null | ObjectId ;
  if (parentRaw !== undefined) {
    const parsed = ObjectIdZ.safeParse(parentRaw) ;
    if (!parsed.success) {
      return res.status(400).json({message : `Expected an ObjectID parent`}) ;
    }
    parent = parsed.data ;
  } else {
    parent = null ;
  }
  const new_folder = {
    owner : req.user!._id ,
    name , parent , space : spaceId ,
  } ;
  // console.log(`Creating new folder` , new_folder) ;
  const response = await folders.insertOne(new_folder) ;
  if (response.acknowledged) {
    return res.json({ ok : true}) ;
  } else {
    return res.status(500).json({message : `Error while creating folder`}) ;
  }
}) ;

app.post(`/folder/roots` , isAuthenticated , async (req , res) => {
  const spaceIdEzRaw = req.body.spaceId ;
  const parsedSpaceIdEz = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsedSpaceIdEz.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsedSpaceIdEz.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const roots = await folders.find({
    space : spaceId ,
    parent : null ,
  }).toArray() ;
  return res.json({roots}) ;
}) ;

app.post(`/folder/view` , isAuthenticated , async (req , res) => {
  const _idRaw = req.body._id ;
  const parsed = ObjectIdZ.safeParse(_idRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected an ObjectID _id`}) ;
  }
  const response = await foldersFull.findOne({
    _id : parsed.data ,
  }) ;
  if (response === null || !isUserSpaceAuthorised(req.user! , response.space))
    return res.status(404).json({message : `No folder with given id`}) ;
  return res.json({folder : response}) ;
}) ;

app.post(`/folder/edit` , isAuthenticated , async (req, res) => {
  const _idRaw = req.body._id ;
  const parsed = ObjectIdZ.safeParse(_idRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected an ObjectID _id`}) ;
  }
  let new_name : string | undefined ;
  const nameRaw = req.body.name ;
  if (nameRaw === undefined) {
    new_name = undefined ;
  } else if (typeof nameRaw === 'string') {
    new_name = nameRaw ;
  } else {
    return res.status(400).json({message : `Expected a string 'name'`}) ;
  }
  let new_parent : ObjectId | null | undefined ;
  const parentRaw = req.body.parent ;
  if (parentRaw === undefined || parentRaw === null) {
    new_parent = parentRaw ;
  } else {
    const parentParsed = ObjectIdZ.safeParse(parentRaw) ;
    if (!parsed.success) {
      return res.status(400).json({message : `Expected null or ObjectID 'parent'`}) ;
    }
    new_parent = parentParsed.data ;
  }
  if (new_name === undefined && new_parent === undefined) return res.status(400).json({message : `no edit`}) ;
  const response = await folders.findOneAndUpdate({
    _id : parsed.data ,
    space : {$in : userAllowedSpaces(req.user!) } ,
  } , {$set:{
    ...(new_parent !== undefined ? { parent : new_parent } : {}) ,
    ...(new_name !== undefined ? { name : new_name } : {}) ,
  }}) ;
  if (response === null) return res.status(500).json({message : `Error while editing`}) ;
  return res.json({ok : true}) ;
}) ;

app.post(`/file/create` , isAuthenticated , async (req , res) => {
  const name = req.body.name ;
  if (typeof name !== 'string') {
    return res.status(400).json({ message : `Expected a string name`}) ;
  }
  const text = req.body.name ;
  if (typeof name !== 'string') {
    return res.status(400).json({ message : `Expected a string name`}) ;
  }
  const parentRaw = req.body.parent ;
  const parsed = ObjectIdZ.safeParse(parentRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected an ObjectID parent`}) ;
  }
  const parent = parsed.data ;
  const spaceIdEzRaw = req.body.spaceId ;
  const parsedSpaceIdEz = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsedSpaceIdEz.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsedSpaceIdEz.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const response = await files.insertOne({
    name , parent , text , space : spaceId ,
  }) ;
  if (response.acknowledged) {
    return res.json({ ok : true}) ;
  } else {
    return res.status(500).json({message : `Error while creating file`}) ;
  }
}) ;

app.post(`/file/view` , isAuthenticated , async (req , res) => {
  const _idRaw = req.body._id ;
  const parsed = ObjectIdZ.safeParse(_idRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected an ObjectID _id`}) ;
  }
  const response = await files.findOne({
    _id : parsed.data ,
    space : {$in : userAllowedSpaces(req.user!) } ,
  }) ;
  if (response === null) return res.status(404).json({message : `No file with given id`}) ;
  return res.json({file : response}) ;
}) ;

app.post(`/file/edit` , isAuthenticated , async (req, res) => {
  const _idRaw = req.body._id ;
  const parsed = ObjectIdZ.safeParse(_idRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected an ObjectID _id`}) ;
  }
  let new_name : string | undefined ;
  const nameRaw = req.body.name ;
  if (nameRaw === undefined) {
    new_name = undefined ;
  } else if (typeof nameRaw === 'string') {
    new_name = nameRaw ;
  } else {
    return res.status(400).json({message : `Expected a string 'name'`}) ;
  }
  let new_text : string | undefined ;
  const textRaw = req.body.text ;
  if (typeof textRaw === undefined) {
    new_text = undefined ;
  } else if (typeof textRaw === 'string') {
    new_text = textRaw ;
  } else {
      return res.status(400).json({message : `Expected 'text'`}) ;  
  }
  if (new_name === undefined && new_text === undefined) return res.status(400).json({message : `no edit`}) ;
  const query = {
    _id: parsed.data ,
    space : {$in : userAllowedSpaces(req.user!)} ,
  } ;
  // console.log('file/edit' , query , new_text , new_name) ;
  const response = await files.findOneAndUpdate(query , {$set:{
    ...(new_text !== undefined ? { text : new_text } : {}) ,
    ...(new_name !== undefined ? { name : new_name } : {}) ,
  }}) ;
  // const debug = await files.findOne({_id : parsed.data}) ;
  // console.log('debug' , debug) ;
  // console.log('response' , response) ;
  // console.log('file edit' , query) ;
  if (response === null) return res.status(500).json({message : `Error while editing`}) ;
  return res.json({ok : true}) ;
}) ;

const isUserSpaceAuthorised = (user : Express.User , spaceId : ObjectId) => {
  return user.space.equals(spaceId) ;
} ;

const userSpaceAuthorisedId = (user : Express.User , spaceIdEz : SpaceIdEz) : ObjectId | null => {
  if (spaceIdEz.type === 'id') {
    return user.space.equals(spaceIdEz.content) ? spaceIdEz.content : null ;
  } else if (spaceIdEz.type === 'user-name') {
    return user.username === spaceIdEz.content ? user.space : null ;
  } else if (spaceIdEz.type === 'team-name') {
    throw new Error(`team not supported yet`)
  } else {
    return spaceIdEz ;
  }
} ;

const userAllowedSpaces = (user : Express.User) => {
  return [user.space] ;
}

app.post(`/space/get` , isAuthenticated , async (req , res) => {
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  if (spaceIdEz.type === 'id') {
    const response = await spaces.findOne({_id : spaceId}) ;
    if (response === null)
      return res.status(400).json({message : `Wrong space id`}) ;
    return res.json({space : response}) ;
  } else if (spaceIdEz.type === 'user-name') {
    const response = await users.aggregate([
      {$match : { _id : req.user!._id }} ,
      {$lookup : {
        as : 'userSpaces' , localField : 'space' ,
        from : 'spaces' , foreignField : '_id' ,
      }} ,
      {$unwind : '$userSpaces'} ,
      {$replaceRoot : {newRoot : '$userSpaces'}} ,
    ]).toArray() ;
    console.log('response' , response) ;
    if (response === null) {
      return res.status(400).json({message : `Wrong space id`}) ;
    } else if (response.length === 0) {
      const spaceRaw = {} ;
      const space = await spaces.insertOne(spaceRaw) ;
      await users.findOneAndUpdate(
        {_id : req.user!._id} ,
        {$set : {space : space.insertedId}} ,
      ) ;
      return res.json({space : {...spaceRaw , _id : space.insertedId}}) ;
    } else if (response.length === 1) {
      return res.json({space : response[0]}) ;  
    } else {
      return res.status(400).json({message : `Wrong space id`}) ;
    }
  } else {
    res.status(500).json({message : 'team id not supported yet'}) ;
  }
}) ;

const PostTodoZ = z.object({
  new_content : Schemas.ItemsZ ,
}) ;

app.post('/todo/update' , isAuthenticated , async (req , res) => {
  const spaceIdEzRaw = req.body.spaceId ;
  const parsed = SpaceIdEzZ.safeParse(spaceIdEzRaw) ;
  if (!parsed.success) {
    return res.status(400).json({message : `Expected a 'space' id`}) ;
  }
  const spaceIdEz = parsed.data ;
  const spaceId = userSpaceAuthorisedId(req.user! , spaceIdEz) ;
  if (!spaceId)
      return res.status(400).json({message : `Wrong space id`}) ;
  const { new_content } = PostTodoZ.parse(req.body) ;
  const todolist = await todolists.findOneAndUpdate(
    { space : spaceId } ,
    { $set : { content : new_content } } ,
  ) ;
  if (!todolist) return res.status(500).json({message : 'could not fetch todolist'}) ;
  return res.json({ok : true}) ;
}) ;

const main = async () => {
  await dbMain() ;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} ;

main() ;