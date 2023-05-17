import React, { useEffect, useState, useRef } from 'react';
import { useCookie, useStateRef, useCookieRef } from '../utils/ReactUse';
import { Button, Modal } from 'react-bootstrap';
import MDate from '../../../mutils/mdate';
import Hls from 'hls.js';

export default function Home() {
  
  const [ windowSize, setWindowSize ] = useState<{width:number,height:number}>({width:0,height:0});

  function updateWindowSize(){
    const width = window.innerWidth;
    const height = window.innerHeight;
    setWindowSize({width, height})
  }
  useEffect(()=>{
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, [])

  const videoRef = useRef<HTMLVideoElement|null>(null);

  const [ src, setSrc ] = useState<string|null>(null);

  useEffect(()=>{
    setSrc('index.m3u8')
  }, [])

  useEffect(()=>{
    if(videoRef.current == null) return;
    if(src == null) return;
    if(!Hls.isSupported()) return;
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(videoRef.current);
    return () => {
      hls.removeAllListeners()
      hls.stopLoad()
    }
  }, [src, videoRef.current])

  return (
    <div style={{...windowSize, background:"black", overflow:"hidden"}}>
      <video controls autoPlay style={{...windowSize}} ref={videoRef}></video>
    </div>
  )
}