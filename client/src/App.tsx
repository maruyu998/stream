import React from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import './App.scss';
import Home from './pages/Home';

export default function App() {
  return (
    <div>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
        </Routes>
      </HashRouter>
    </div>
  );
}