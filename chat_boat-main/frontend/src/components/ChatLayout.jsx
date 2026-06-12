import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatInterface from './ChatInterface';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ChatLayout() {
  const { currentUser } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <Sidebar 
        activeSessionId={activeSessionId} 
        setActiveSessionId={setActiveSessionId} 
      />
      <div className="flex-1 flex flex-col h-full relative">
        <ChatInterface 
          activeSessionId={activeSessionId} 
          setActiveSessionId={setActiveSessionId} 
        />
      </div>
    </div>
  );
}
