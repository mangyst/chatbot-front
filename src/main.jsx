import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Функция для установки favicon
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

// Устанавливаем аватарку из public
setFavicon('/avatar.png'); // путь относительно public

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
