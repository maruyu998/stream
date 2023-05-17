import react, { Component } from 'react';
import Hls from 'hls.js';

const hls = new Hls();

export default class App extends Component {
  componentDidMount(){
    const video = document.getElementById('video')
    hls.loadSource('index.m3u8');
    hls.attachMedia(video);
  }
  render(){
    return (
      <div className="App" style={{background:"black",textAlign:"center",width:"95%"}}>
        <video controls autoplay id="video">
          
        </video>
      </div>
    );
  }
}