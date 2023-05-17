import cron from 'node-cron';
import config from 'config';
import { promises as fs } from 'fs';
import MDate from '../mutils/mdate';

export default function(){
  const root_path = config.hls_root_path;
  cron.schedule('* * * * *', ()=> {
    fs.stat(`${root_path}/index.m3u8`)
    .then(stats=>{
      if(new MDate(stats.mtime.getTime()).time > MDate.now().add(-5,'minute').time) throw Error("No error");
      return fs.stat(`${root_path}/index-0.ts`).then(stat=>new MDate(stat.mtime.getTime()).format("YYYY-MM-DD_HH-mm-ss")).catch(e=>{throw e});
    })
    .then(time=>fs.mkdir(`${root_path}/${time}`)
      .then(()=>fs.readdir(`${root_path}`))
      .then(files=>{
        for(let filename of files){
          if(filename.startsWith('index')){
            fs.rename(`${root_path}/${filename}`, `${root_path}/${time}/${filename}`)
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
}