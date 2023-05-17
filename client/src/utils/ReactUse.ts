import { useState, useRef, useEffect } from 'react';
import { Dispatch, SetStateAction, MutableRefObject } from 'react'
import { useCookies } from 'react-cookie';

export function useCookie(name:string, defaultValue:string|undefined=undefined):[string, (v:string)=>void]{
    const [cookie, setCookie] = useCookies([name])
    const new_cookie = cookie[name]
    const new_setCookie = (v:string) => setCookie(name, v)
    if(new_cookie===undefined && defaultValue!==undefined) new_setCookie(defaultValue)
    return [new_cookie, new_setCookie]
}

export function useCookieRef(name:string, defaultValue:string|undefined=undefined):[string, (v:string)=>void, MutableRefObject<any>]{
    const [cookie, setCookie] = useCookies([name])
    const new_cookie = cookie[name]
    const ref = useRef<string>(new_cookie)
    const new_setCookie = (v:string) => {setCookie(name, v); ref.current = v}
    if(new_cookie===undefined && defaultValue!==undefined) new_setCookie(defaultValue)
    return [new_cookie, new_setCookie, ref]
}

type Encoder<T> = {(param:T):string}
type Decoder<T> = {(param:string):T}
export function useSCookieType<T>(
    name:string,
    encoder:Encoder<T>,
    decoder:Decoder<T>,
    defaultValue:T|undefined=undefined
):[T, Dispatch<SetStateAction<T>>]{
    const [cookie, setCookie] = useCookies([name])
    const new_cookie = cookie[name]
    if(new_cookie===undefined && defaultValue!==undefined) setCookie(name, encoder(defaultValue))
    const [ state, setState ] = useState<T>(decoder(new_cookie))
    useEffect(()=>{ setCookie(name, encoder(state)) }, [state])
    return [state, setState]
}


export function useStateRef<T>(defaultValue:T):[T, (v:T)=>void, MutableRefObject<T>]{
    const [value, setter] = useState<T>(defaultValue)
    const ref = useRef<T>(value)
    const new_setter = (v:T) => {setter(v); ref.current = v}
    ref.current = value
    return [value, new_setter, ref]
}