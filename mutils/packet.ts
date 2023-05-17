// version 2023-05-15_01:42

import MDate from "./mdate";

export type DataType = string|number|boolean|Date|MDate|null
                      |{[key:string]:DataType}
                      |{[key:string]:DataType[]}

type KeyType = "string"|"number"|"boolean"|"date"|"mdate"|"array"|"object"|"null";
type ValueType = string|number|boolean|null|ValueType[]|ConvertedData[]|{[key:string]:ConvertedData}
type ConvertedData = {
  type: KeyType,
  data: ValueType
}

export type Packet = {
  title: string,
  message: string,
  error?: Error,
  convertedData?: ConvertedData
}

export function convertPacket({
  title,
  message,
  error,
  data
}:{
  title: string
  message: string
  error?: Error
  data?: DataType
}):Packet{
  function convert(data?:DataType):ConvertedData|undefined{
    if(data === undefined) return undefined
    if(typeof data == "string") return { type:"string", data: data as string }
    if(typeof data == "number") return { type:"number", data: data as number }
    if(typeof data == "boolean") return { type:"boolean", data: data as boolean }
    if(data instanceof Date) return { type:"date", data: data.getTime() }
    if(data instanceof MDate) return { type:"mdate", data: data.time }
    if(data instanceof Array) return { type:"array", data: data.map(o=>convert(o)) as Array<ConvertedData> }
    if(data instanceof Object) return {
      type:"object",
      data: Object.assign({}, ...Object.entries(data).map(([k,v])=>({[k]:convert(v)})))
    }
    if(data == null) return { type:"null", data: null }
    console.error({data}, typeof data);
    throw new Error("not implemented in packet conditions")
  }
  const error_converted = error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause
  } : undefined
  return { title, message, error: error_converted, convertedData: convert(data)};
}

export function deconvertPacket(packet:Packet){
  const { title, message, error, convertedData } = packet
  function deconvert(cdata?:ConvertedData){
    if(cdata === undefined) return undefined
    if(!(cdata instanceof Object)) {
      console.error("packet:", packet)
      throw new Error("packet parcing error")
    }
    if(cdata.type == "string") return cdata.data
    if(cdata.type == "number") return cdata.data
    if(cdata.type == "boolean") return cdata.data
    if(cdata.type == "date") return new Date(cdata.data as number)
    if(cdata.type == "mdate") return new MDate(cdata.data as number)
    if(cdata.type == "array") return (cdata.data as ConvertedData[]).map(o=>deconvert(o))
    if(cdata.type == "object") return Object.assign({}, 
      ...Object.entries(cdata.data as {[key:string]:ConvertedData}).map(([k,v])=>({[k]:deconvert(v)}))
    )
    if(cdata.type == "null") return null
    console.error(cdata, typeof cdata.data);
    throw new Error("not implemented in packet conditions");
  }
  let error_deconverted:Error|undefined;
  if(error){
    error_deconverted = new Error(error.message, { cause: error.cause });
    error_deconverted.name = error.name
    error_deconverted.stack = error.stack
  }
  return { title, message, error:error_deconverted, data: deconvert(convertedData)}
}