import React from 'react';
import { Toaster } from 'react-hot-toast';
import QuizFunnel from './components/QuizFunnel';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
      <div className="container mx-auto px-4">
        <QuizFunnel />
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;