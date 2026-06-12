import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Plus, LogOut } from 'lucide-react';

export default function Sidebar({ activeSessionId, setActiveSessionId }) {
  const [sessions, setSessions] = useState([]);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Listen to the user's chat sessions
    const sessionsRef = collection(db, 'users', currentUser.uid, 'sessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionData);

      // If there's no active session and we have sessions, maybe set the first one?
      // Or we let the user start a new one explicitly.
      if (!activeSessionId && sessionData.length > 0) {
        // setActiveSessionId(sessionData[0].id); // Optional: auto-load latest
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeSessionId]);

  const handleNewChat = async () => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'sessions'), {
        title: 'New Chat',
        createdAt: serverTimestamp(),
      });
      setActiveSessionId(docRef.id);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const groupSessionsByDate = (sessions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    sessions.forEach(session => {
      if (!session.createdAt) return;
      const sessionDate = session.createdAt.toDate();
      sessionDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today - sessionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        groups['Today'].push(session);
      } else if (diffDays === 1) {
        groups['Yesterday'].push(session);
      } else if (diffDays <= 7) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen border-r border-gray-700 flex-shrink-0">
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
          groupSessions.length > 0 && (
            <div key={groupName}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                {groupName}
              </h3>
              <div className="space-y-1">
                {groupSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeSessionId === session.id 
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <MessageSquare size={16} className="flex-shrink-0 opacity-70" />
                    <span className="truncate">{session.title || 'New Chat'}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col truncate pr-2">
            <span className="text-sm font-medium truncate">{currentUser?.displayName || 'User'}</span>
            <span className="text-xs text-gray-400 truncate">{currentUser?.email}</span>
          </div>
          <button 
            onClick={logout}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
