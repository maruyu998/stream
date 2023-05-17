import express from "express";
import config from "config";
import session from "express-session";
import connect_mongo_session from "connect-mongodb-session";
import mongoose from 'mongoose';
import path from 'path';
import 'dotenv/config';
import register from './register';

import router from './router';
import * as maruyuOAuthClient from './utils/oauth';
import { sendMessage } from "./utils/express";
import { PermissionError } from "./utils/errors";

if(config.hls_root_path == undefined) throw new Error("config.hls_root_path is undefined");

const PORT = (process.env.NODE_ENV == "production") ? process.env.PRODUCTION_PORT : 3000

declare module 'express-session' {
  interface SessionData {
    maruyuOAuth: maruyuOAuthClient.SessionType
  }
}

mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_path);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

const MongoDBStore = connect_mongo_session(session);
const app: express.Express = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: config.session_secret,
  store: new MongoDBStore({
    uri: config.mongo_session_path,
    collection: config.mongo_session_collection,
    autoRemove: 'native'
  }),
  resave: false,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: config.session_keep_duration
  }
}))
app.use('/manifest.json', express.static(path.join(__dirname, '..', 'client', 'public', 'manifest.json')))

app.use(config.oauth_callback_path, maruyuOAuthClient.addCors)
app.get(config.oauth_callback_path, maruyuOAuthClient.processCallbackThenRedirect);
app.get('/signin', maruyuOAuthClient.redirectToSignin);
app.use(maruyuOAuthClient.redirectIfNotSignedIn);
app.get('/signout', maruyuOAuthClient.signoutThenRedirectTop);
app.get('/refresh', maruyuOAuthClient.refreshUserInfo);
app.use(async (req,res,next)=>{
  await maruyuOAuthClient.getData(req).then(({status})=>{
    const message = [
      "Permission required. Please contact application owner to add permission.",
      "Access /signout to signout or /refresh to refresh user info"
    ].join(" ");
    if(status != "approved") throw new PermissionError(message);
    next()
  }).catch(error=>sendMessage(res, error.name, error.message))
});

app.use(express.static(path.join(__dirname, '..', 'client', 'public')))
app.use(express.static(config.hls_root_path))
app.use('/api', router)

app.listen(PORT, ()=>{
  console.log(`starting: listening port ${PORT}`)
})

register()