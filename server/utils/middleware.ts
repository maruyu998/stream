import express from 'express';
import { sendError } from './express';
import { InvalidParamError, AuthenticationError } from './errors';
import { getUserInfo } from './oauth';

export async function requireSignin(
  request:express.Request, 
  response:express.Response, 
  next:express.NextFunction
){
  const current_user_info = await getUserInfo(request)
  if(current_user_info) {
    response.locals.current_user_info = current_user_info
    return next()
  }
  sendError(response, new AuthenticationError("Sign in is required"))
}

export function requireQueryParams(...param_names:string[]){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    response.locals.queries = {}
    for(let param_name of param_names){
      if(request.query[param_name] == undefined) return sendError(response, new InvalidParamError(param_name));
      response.locals.queries[param_name] = String(request.query[param_name])
    }
    next()
  }
}

export function requireBodyParams(...param_names:string[]){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    response.locals.bodies = {}
    for(let param_name of param_names){
      if(request.body[param_name] == undefined) return sendError(response, new InvalidParamError(param_name));
      response.locals.bodies[param_name] = request.body[param_name]
    }
    next()
  }
}