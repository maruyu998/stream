import express from 'express';
import { convertPacket } from 'mutils/packet';

export async function saveSession(req:express.Request){
  await new Promise<void>((resolve,reject)=>req.session.save(()=>resolve()));
}

export async function regenerateSession(req:express.Request){
  await new Promise<void>((resolve,reject)=>req.session.regenerate(()=>{resolve()}));
}

export function sendMessage(res:express.Response, title:string, message:string){
  console.info(`[${title}]: ${message}`)
  res.json(convertPacket({title, message}))
}

export function sendData(res:express.Response, title:string, message:string, data:any){
  console.info(`[${title}]: ${message}`)
  res.json(convertPacket({title, message, data}))
}

export function sendError(res:express.Response, error:Error, data?:any){
  const title = error.name;
  const message = error.message;
  console.error(`[${title}]: ${message}`)
  res.json(convertPacket({title, message, error, data}))
}

export function getIPAddress(req:express.Request):string{
  if(req.headers['x-real-ip']){
    if(Array.isArray(req.headers['x-real-ip'])) return req.headers['x-real-ip'][0]
    return req.headers['x-real-ip']
  }
  if(req.headers['x-forwarded-for']){
    if(Array.isArray(req.headers['x-forwarded-for'])) return req.headers['x-forwarded-for'][0];
    return req.headers['x-forwarded-for']
  }
  if(req.socket && req.socket.remoteAddress){
    return req.socket.remoteAddress;
  }
  return '0.0.0.0';
};