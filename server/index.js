import express from 'express';
import session from 'express-session';
import basicAuth from 'basic-auth';
import config from 'config';
import * as dt from 'date-utils';
import MongoStore from 'connect-mongo';
import { client as moauthClient} from 'moauth';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const moauth = new moauthClient({
  app_token_issue_server_uri: `${config.authserver}/api/get_app_token`,
  user_signin_server_uri: `${config.authserver}/signin`,
  access_token_validate_server_uri: `${config.authserver}/api/validate_access_token`,
  callback_path: '/callback',
  app_id: config.app_id, 
  app_secret: config.app_secret
})
const app = express()

app.use('/manifest.json', express.static(path.join(__dirname, "../build/manifest.json")))
app.use('/robots.txt', express.static(path.join(__dirname, "../build/robots.txt")))

app.use((request,response,next)=>{
  const user = basicAuth(request)
  const admins = {[config.basic.user]: { password: config.basic.pass }}
  if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
    // if (user && user.name == 'tmp0404' && user.pass == 'spif9aalkw') return next()
    // if (user && user.name == 'ogawasan' && user.pass == 'kM87L65d') return next()
    response.set('WWW-Authenticate', 'Basic realm="MY OWN PAGE"')
    return response.status(401).send()
  }
  return next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret:config.SESSION_SECRET,
  store: MongoStore.create({
      mongoUrl: config.mongo_session_path,
      collectionName: config.mongo_session_collection,
      autoRemove: 'native'
  }),
  rolling : true,
  name: config.app_id,
  cookie: { 
    secure:false, 
    httpOnly:false, 
    maxAge: 90*24*60*60*1000,
  }
}))
app.get('/callback', moauth.redirect_requested_page_from_callback_path)
app.use(moauth.redirect_signin_page_if_not_login)

app.use(express.static(path.join(__dirname, "../client")))
// app.use(express.static(path.join(__dirname, "../build")))
app.use(express.static('/mnt/share/live_hls/'))

app.listen(config.server.port, () => {
  console.log(`server starting -> [port] ${config.server.port} [env] ${process.env.NODE_ENV}`)
})

import { promises as fs } from 'fs'
import cron from 'node-cron';
const rootpath = '/mnt/share/live_hls'
cron.schedule('* * * * *', ()=> {
  fs.stat(`${rootpath}/index.m3u8`)
  .then(stats=>{
    if((new Date()).remove({minutes:3}).isBefore(stats.mtime)) throw Error("No error");
    return fs.stat(`${rootpath}/index-0.ts`).then(stat=>stat.mtime.toFormat("YYYY-MM-DD_HH24-MI-SS")).catch(e=>{throw e});
  })
  .then(time=>fs.mkdir(`${rootpath}/${time}`)
    .then(()=>fs.readdir(`${rootpath}`))
    .then(files=>{
      for(let filename of files){
        if(filename.startsWith('index')){
          fs.rename(`${rootpath}/${filename}`, `${rootpath}/${time}/${filename}`)
        }
      }
    })
    .catch(e=>{throw e})
  )
  .catch(e=>{
    if(e.errno==-2) return
    if(e.message=="No error") return
    console.error(e)
  })
})