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

    const sessionsRef = collection(db, 'users', currentUser.uid, 'sessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionData);
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
    const groups = { 'Today': [], 'Yesterday': [], 'Previous 7 Days': [], 'Older': [] };

    sessions.forEach(session => {
      if (!session.createdAt) return;
      const sessionDate = session.createdAt.toDate();
      sessionDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today - sessionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups['Today'].push(session);
      else if (diffDays === 1) groups['Yesterday'].push(session);
      else if (diffDays <= 7) groups['Previous 7 Days'].push(session);
      else groups['Older'].push(session);
    });
    return groups;
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button onClick={handleNewChat} className="new-chat-btn">
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div className="sidebar-sessions">
        {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
          groupSessions.length > 0 && (
            <div key={groupName} className="session-group">
              <div className="group-title">{groupName}</div>
              {groupSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`session-btn ${activeSessionId === session.id ? 'active' : ''}`}
                >
                  <MessageSquare size={16} />
                  <span className="session-title">{session.title || 'New Chat'}</span>
                </button>
              ))}
            </div>
          )
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentUser?.displayName || 'User'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentUser?.email}
          </div>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
