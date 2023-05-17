import { deconvertPacket, Packet } from "./packet";

function processFetch(fetchPromise:Promise<Response>){
  return fetchPromise
        .then(res=>res.json())
        .then(packet=>deconvertPacket(packet))
        .then(({title, message, data, error})=>{
          if(error) throw error
          return { title, message, data }
        })
}

type CorsType = "cors"|"no-cors"|"same-origin";
type OptionType = {
  access_token?: string,
  cors?: CorsType
}

function createHeader(option:OptionType){
  const { access_token, cors } = option;
  const mode = cors || "same-origin";
  const credential = cors == "cors" ? "include" : "same-origin";
  return {
    'Accept': 'application/json',
    "Content-Type": "application/json",
    'Authorization': access_token ? `Bearer ${access_token}` : "", 
    mode, credential
  }
}

export function getPacketWithOwnFetch(fetch, url:string, option:OptionType={}){
  const fetchPromise = fetch(url, {
    method: "GET",
    headers: createHeader(option)
  })
  return processFetch(fetchPromise)
}

export function getPacket(url:string, option:OptionType={}){
  const fetchPromise = fetch(url, {
    method: "GET",
    headers: createHeader(option)
  })
  return processFetch(fetchPromise)
}

export function postPacket(url:string, object:Object, option:OptionType={}){
  const fetchPromise = fetch(url, {
    method: "POST",
    headers: createHeader(option),
    body: JSON.stringify(object)
  })
  return processFetch(fetchPromise)
}

export function putPacket(url:string, object:Object, option:OptionType={}){
  const fetchPromise = fetch(url, {
    method: "PUT",
    headers: createHeader(option),
    body: JSON.stringify(object)
  })
  return processFetch(fetchPromise)
}

export function deletePacket(url:string, object:Object, option:OptionType={}){
  const fetchPromise = fetch(url, {
    method: "DELETE",
    headers: createHeader(option),
    body: JSON.stringify(object)
  })
  return processFetch(fetchPromise)
}