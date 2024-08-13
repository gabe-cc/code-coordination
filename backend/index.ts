import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { ObjectId, WithId } from 'mongodb';
import bcrypt from 'bcrypt';
import cors from 'cors';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { redisClient, users, main as dbMain, todolists, Schemas, chatMessages, chatMessagesUsers, threads, threadComments, threadsListed, threadsFull, folders, files, foldersFull } from './db';
import { z } from 'zod';
import { ChatMessage, ObjectIdZ, User } from './iso/schemas';

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
    const user = await users.findOne({ username });
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
    const user = await users.findOne({ _id: new ObjectId(id) } ,
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

app.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await users.insertOne({ username, password: hashedPassword });
  res.json({ message: 'User registered successfully' });
});

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
  res.json({ user : { username : req.user!.username , _id : req.user!._id } });
});

app.get('/todo' , isAuthenticated , async (req , res) => {
  const _id = req.user!._id ;
  const todolist = await todolists.findOneAndUpdate(
    { user_id : _id } ,
    { $setOnInsert : { user_id : _id , content : [] } } ,
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
  const messages = await chatMessagesUsers.find({
    date : { $gte : new Date(reference_timestamp) } ,
  }).toArray() ;
  // console.log(messages) ;
  return res.json({messages , ok : true}) ;
}) ;
app.post('/chat/send-message' , isAuthenticated , async (req , res) => {
  if (typeof req.body.text !== 'string') {
    return res.status(400).json({ message : `Expected a string 'text' field in body`}) ;  
  }
  const text = req.body.text ;
  const message : ChatMessage = {
    author : req.user!._id ,
    date : new Date() ,
    text ,
  }
  const response = await chatMessages.insertOne(message) ;
  if (response.acknowledged) {
    return res.json({ok : true}) ;
  } else {
    return res.status(500).json({ message : `Error while trying to add the message`}) ;
  }
}) ;

app.post('/threads/all' , isAuthenticated , async (req , res) => {
  const response = await threadsListed.find({}).toArray() ;
  // console.log(`all threads` , response) ;
  return res.json({ok : true , threads : response}) ;
}) ;
app.post(`/threads/create` , isAuthenticated , async (req , res) => {
  const title = req.body.title ;
  const text = req.body.text ;
  if (typeof text !== 'string') {
    return res.status(400).json({ message : `Expected a string 'text' field in body`}) ;  
  }
  if (typeof title !== 'string') {
    return res.status(400).json({ message : `Expected a string 'title' field in body`}) ;  
  }
  const thread = {
    author: req.user!._id,
    date: new Date(),
    text, title ,
  } ;
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
    name , parent ,
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
  const roots = await folders.find({
    owner : req.user!._id ,
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
    owner : req.user!._id ,
    _id : parsed.data ,
  }) ;
  if (response === null) return res.status(404).json({message : `No folder with given id`}) ;
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
    owner : req.user!._id ,
    _id : parsed.data ,
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
  const response = await files.insertOne({
    owner : req.user!._id ,
    name , parent , text ,
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
    owner : req.user!._id ,
    _id : parsed.data ,
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
    owner: req.user!._id,
    _id: parsed.data,
  } ;
  const response = await files.findOneAndUpdate(query , {$set:{
    ...(new_text !== undefined ? { text : new_text } : {}) ,
    ...(new_name !== undefined ? { name : new_name } : {}) ,
  }}) ;
  // console.log('file edit' , query) ;
  if (response === null) return res.status(500).json({message : `Error while editing`}) ;
  return res.json({ok : true}) ;
}) ;

const PostTodoZ = z.object({
  new_content : Schemas.ItemsZ ,
}) ;

app.post('/todo' , isAuthenticated , async (req , res) => {
  const _id = req.user!._id ;
  const { new_content } = PostTodoZ.parse(req.body) ;
  const todolist = await todolists.findOneAndUpdate(
    { user_id : _id } ,
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