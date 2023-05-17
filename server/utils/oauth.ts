// version 2023-05-16_23:53

import config from 'config';
import express from 'express';
import ClientOAuth2 from "client-oauth2";
import { randomUUID } from "crypto";
import cors from 'cors';
import fetch from 'node-fetch';
import pkceChallenge from "pkce-challenge";
import { saveSession, regenerateSession, sendError } from './express';
import { getPacketWithOwnFetch } from 'mutils/fetch';
import { AuthenticationError, InvalidParamError, PermissionError } from './errors';

type AuthSessionType = { code_verifier?: string, state?: string, return_to?: string }
type TokenSessionType = { access_token:string, token_type:string, refresh_token:string, scope:string, expires_at:Date }
export type UserInfoType = {
  user_id: string, 
  user_name: string, 
  data: any,
  expires_at: Date
}
export type SessionType = { auth?: AuthSessionType, token?: TokenSessionType, user_info?: UserInfoType }

if(config.client_name == undefined) throw new Error("config.client_name is undefined");
if(config.client_id == undefined) throw new Error("config.client_id is undefined");
if(config.client_secret == undefined) throw new Error("config.client_secret is undefined");
if(config.oauth_domain == undefined) throw new Error("config.oauth_domain is undefined");
if(config.service_domain == undefined) throw new Error("config.service_domain is undefined");

if(config.oauth_callback_path == undefined) throw new Error("config.oauth_callback_path is undefined");
if(config.oauth_token_path == undefined) throw new Error("config.oauth_token_path is undefined");
if(config.oauth_authorize_path == undefined) throw new Error("config.oauth_authorize_path is undefined");
if(config.oauth_user_info_path == undefined) throw new Error("config.oauth_user_info_path is undefined");

if(config.userinfo_keep_duration == undefined) throw new Error("config.userinfo_keep_duration is undefined");

const CLIENT_NAME = config.client_name;
const CLIENT_ID = config.client_id;
const CLIENT_SECRET = config.client_secret;
const OAUTH_DOMAIN = config.oauth_domain;
const SERVICE_DOMAIN = config.service_domain;

const CALLBACK_PATH = config.oauth_callback_path;
const OAUTH_TOKEN_PATH = config.oauth_token_path;
const OAUTH_AUTHORIZE_PATH = config.oauth_authorize_path;
const OAUTH_USER_INFO_PATH = config.oauth_user_info_path;

const USERINFO_KEEP_DURATION = config.userinfo_keep_duration;

const SCOPES = ['user'];

const oauth2 = new ClientOAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  accessTokenUri: new URL(OAUTH_TOKEN_PATH, OAUTH_DOMAIN).toString(),
  authorizationUri: new URL(OAUTH_AUTHORIZE_PATH, OAUTH_DOMAIN).toString(),
  redirectUri: new URL(CALLBACK_PATH, SERVICE_DOMAIN).toString(),
  scopes: SCOPES
})

//////////////////////////////////// [ F U N C T I O N S ] ////////////////////////////////////
// sessions
function getSession(request:express.Request){
  const { auth, token, user_info } = request.session.maruyuOAuth || {};
  return { auth, token, user_info }
}
async function setSession(request:express.Request, { auth, token, user_info }:{
  auth?:AuthSessionType, token?:TokenSessionType, user_info?:UserInfoType
}){
  if(request.session.maruyuOAuth == undefined) {
    request.session.maruyuOAuth = {}
    await saveSession(request);
  }
  if(auth) request.session.maruyuOAuth.auth = auth;
  if(token) request.session.maruyuOAuth.token = token;
  if(user_info) request.session.maruyuOAuth.user_info = user_info;
  await saveSession(request);
}
async function clearSession(request:express.Request, keys:("auth"|"token"|"user_info")[]){
  if(request.session.maruyuOAuth == undefined) {
    request.session.maruyuOAuth = {}
    await saveSession(request);
  }
  if(keys.includes("auth")) request.session.maruyuOAuth.auth = undefined;
  if(keys.includes("token")) request.session.maruyuOAuth.token = undefined;
  if(keys.includes("user_info")) request.session.maruyuOAuth.user_info = undefined;
  await saveSession(request);
}

// tokens
async function refreshToken(request:express.Request){
  const { token } = getSession(request);
  if(token == undefined) throw new Error("token is not saved");
  const { access_token, token_type, refresh_token, scope, expires_at } = token;
  const token_client = new ClientOAuth2.Token(oauth2, {access_token, token_type, refresh_token, scope });
}

async function getAccessToken(request:express.Request){
  const { token } = getSession(request);
  if(token == undefined) throw new Error("token is not saved");
  const { access_token, token_type, refresh_token, scope, expires_at } = token;
  if(expires_at.getTime() > Date.now()) await refreshToken(request);
  return access_token
}

// userinfo
export async function getUserInfo(request:express.Request, reload:boolean=false):Promise<UserInfoType|null>{
  const { user_info } = getSession(request);
  if(reload == false && user_info != null && user_info.expires_at.getTime() > Date.now()) return user_info
  const access_token = await getAccessToken(request).catch(error=>null);
  if(access_token == null) return null
  const url = new URL(OAUTH_USER_INFO_PATH, OAUTH_DOMAIN);
  const fetchReturn = await getPacketWithOwnFetch(fetch, url.toString(), { access_token }).then(({data})=>data)
                      .catch(error=>{console.error(error);return null});
  if(fetchReturn == null) return null
  const { user_id, user_name, data } = fetchReturn;
  const expires_at = new Date(Date.now() + USERINFO_KEEP_DURATION);
  await setSession(request, { user_info:{ user_id, user_name, data, expires_at } });
  return { user_id, user_name, data, expires_at };
}

///////////////////////////////////// [ E N D P O I N T ] /////////////////////////////////////
export async function redirectToSignin(request:express.Request, response:express.Response){
  const return_to = "";
  const state = randomUUID();
  const { code_verifier, code_challenge } = await pkceChallenge();
  const code_challenge_method = "S256";
  await setSession(request, { auth:{ code_verifier, state, return_to } });
  const client_secret = CLIENT_SECRET;
  const uri = oauth2.code.getUri({ state, query: { client_secret, code_challenge, code_challenge_method } });
  // {authorization_uri} ? {client_id=} & {redirect_uri=(service_domain + /api/oauth/callback, etc)}
  //                     & {response_type=code} & {state=} & {scope=} & {code_challenge=} & {code_challenge_method=}
  response.redirect(uri);
}

export async function processCallbackThenRedirect(request:express.Request, response:express.Response){
  if(getSession(request).auth == undefined) return sendError(response, new AuthenticationError("Session is expired"));
  const { state, code_verifier, return_to } = getSession(request).auth!;
  await clearSession(request, ["auth"]);
  if(!state) return sendError(response, new AuthenticationError("state is empty."));
  if(!code_verifier) return sendError(response, new AuthenticationError("code_verifier is empty."));
  
  if(request.query.state == undefined) return sendError(response, new InvalidParamError("state"));
  const returned_state = String(request.query.state);
  if(state != returned_state) return sendError(response, new AuthenticationError("state is not match."));

  // post to access_token_uri with body { grant_type=authorization_code, code, redirect_uri, code_verifier }
  // response: { access_token, token_type, expires_in(second), refresh_token, scope }
  await oauth2.code.getToken(request.originalUrl, { body: { code_verifier } })
  .catch(error=>{sendError(response, error); throw error})
  .then(async token=>{
    const { access_token, token_type, refresh_token, scope, expires_at } = token.data;
    await regenerateSession(request);
    await setSession(request, { token:{ access_token, token_type, refresh_token, scope, expires_at:new Date(expires_at) } });
    return response.redirect(return_to || "/");
  })
  .catch(error=>null);
}

export async function signoutThenRedirectTop(request:express.Request, response:express.Response){
  await clearSession(request, ["auth", "token","user_info"]);
  await regenerateSession(request);
  response.redirect('/');
}

export async function refreshUserInfo(request:express.Request, response:express.Response){
  const refresh = true;
  await getUserInfo(request, refresh);
  response.redirect('/')
}
////////////////////////////////// [ M I D D L E W A R E S ] //////////////////////////////////
export async function redirectIfNotSignedIn(request:express.Request, response:express.Response, next:express.NextFunction){
  const current_user = await getUserInfo(request);
  if(current_user == null) return redirectToSignin(request, response);
  next()
}

export async function addCors(request:express.Request, response:express.Response, next:express.NextFunction){
  return cors({
    origin: OAUTH_DOMAIN,
    credentials: true,
    optionsSuccessStatus: 200
  })(request, response, next)
}

export async function getData(request:express.Request, reload:boolean=false){
  const user_info = await getUserInfo(request, reload);
  if(user_info == null) throw new PermissionError("user is invalid");
  return user_info.data || {}
}