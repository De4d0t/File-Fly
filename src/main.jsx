import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FileFlyProvider } from './context/FileFlyContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FileFlyProvider>
      <App />
    </FileFlyProvider>
  </React.StrictMode>
);
