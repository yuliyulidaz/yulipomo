
import './index.css'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app'; // 확장자를 제거하여 Vite/TypeScript의 기본 해설을 따릅니다.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
