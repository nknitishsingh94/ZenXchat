import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, ImagePlus, X, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ChatInterface = ({ activeSessionId, setActiveSessionId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !activeSessionId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'users', currentUser.uid, 'sessions', activeSessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentUser, activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() && !selectedImage) return;

    if (!currentUser) {
      alert("You must be logged in to send messages.");
      return;
    }

    const userMessage = inputValue.trim();
    const imageToSend = selectedImage;
    
    setInputValue('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      let sessionId = activeSessionId;
      
      if (!sessionId) {
        const sessionRef = await addDoc(collection(db, 'users', currentUser.uid, 'sessions'), {
          title: userMessage.substring(0, 30) || 'New Chat',
          createdAt: serverTimestamp(),
        });
        sessionId = sessionRef.id;
        setActiveSessionId(sessionId);
      } else {
        if (messages.length === 0) {
          const sessionDoc = doc(db, 'users', currentUser.uid, 'sessions', sessionId);
          await updateDoc(sessionDoc, { title: userMessage.substring(0, 30) });
        }
      }

      const messagesCollection = collection(db, 'users', currentUser.uid, 'sessions', sessionId, 'messages');
      
      await addDoc(messagesCollection, {
        role: 'user',
        content: userMessage,
        image: imageToSend,
        timestamp: serverTimestamp()
      });

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          image: imageToSend
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      await addDoc(messagesCollection, {
        role: 'bot',
        content: data.reply,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error('Error in chat:', error);
      if (activeSessionId) {
        const messagesCollection = collection(db, 'users', currentUser.uid, 'sessions', activeSessionId, 'messages');
        await addDoc(messagesCollection, {
          role: 'bot',
          content: 'Sorry, something went wrong. Please try again later.',
          timestamp: serverTimestamp()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-wrapper" style={{ height: '100%', padding: '0', background: 'transparent' }}>
      <div className="chat-container" style={{ height: '100%', maxWidth: '100%', borderRadius: '0', border: 'none', boxShadow: 'none' }}>
        <div className="chat-header">
          <h1>Nitish <span>AI</span></h1>
          <div style={{ width: 60 }}></div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
              <h2>How can I help you today?</h2>
              <p>Type a message below or upload an image to start chatting.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}>
                <div className="message-content markdown-body">
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded" className="chat-uploaded-image" />
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-wrapper">
          {selectedImage && (
            <div className="image-preview-container">
              <img src={selectedImage} alt="Preview" className="image-preview" />
              <button onClick={handleRemoveImage} className="remove-image-btn">
                <X size={14} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="chat-input-area">
            <div className="input-container">
              <button 
                type="button" 
                className="upload-btn" 
                onClick={() => fileInputRef.current.click()}
              >
                <ImagePlus size={20} />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message Nitish AI..."
                disabled={isLoading}
              />
              <button type="submit" className="send-button" disabled={(!inputValue.trim() && !selectedImage) || isLoading}>
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
