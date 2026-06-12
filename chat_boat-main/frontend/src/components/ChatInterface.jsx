import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, X, Menu } from 'lucide-react';
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

  // Load messages from Firestore for active session
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
      
      // If no session exists, create one first
      if (!sessionId) {
        const sessionRef = await addDoc(collection(db, 'users', currentUser.uid, 'sessions'), {
          title: userMessage.substring(0, 30) || 'New Chat',
          createdAt: serverTimestamp(),
        });
        sessionId = sessionRef.id;
        setActiveSessionId(sessionId);
      } else {
        // If it's the first message in this session, update title
        if (messages.length === 0) {
          const sessionDoc = doc(db, 'users', currentUser.uid, 'sessions', sessionId);
          await updateDoc(sessionDoc, { title: userMessage.substring(0, 30) });
        }
      }

      const messagesCollection = collection(db, 'users', currentUser.uid, 'sessions', sessionId, 'messages');
      
      // Save User Message to Firestore
      await addDoc(messagesCollection, {
        role: 'user',
        content: userMessage,
        image: imageToSend,
        timestamp: serverTimestamp()
      });

      // Call Backend API
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
      
      // Save Bot Message to Firestore
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
    <div className="flex-1 flex flex-col h-full bg-[#212121]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-[#212121]">
        <h1 className="text-xl font-bold tracking-tight text-white/90">
          Nitish <span className="text-blue-500">AI</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <h2 className="text-2xl font-bold">How can I help you today?</h2>
            <p className="text-sm max-w-md">Type a message below or upload an image to start chatting.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-[#2f2f2f] text-gray-100 rounded-bl-none'
                }`}
              >
                {msg.image && (
                  <img src={msg.image} alt="Uploaded" className="max-w-xs rounded-lg mb-3 object-contain" />
                )}
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2f2f2f] rounded-2xl rounded-bl-none px-5 py-4">
              <div className="flex space-x-2 items-center h-5">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#212121]">
        <div className="max-w-4xl mx-auto relative bg-[#2f2f2f] rounded-2xl border border-gray-700/50 shadow-sm focus-within:border-gray-500 transition-colors">
          {selectedImage && (
            <div className="absolute -top-24 left-4 p-2 bg-[#2f2f2f] rounded-xl border border-gray-700 shadow-lg">
              <div className="relative group">
                <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg object-contain bg-black/50" />
                <button 
                  onClick={handleRemoveImage} 
                  className="absolute -top-2 -right-2 p-1 bg-gray-800 text-white rounded-full hover:bg-red-500 transition-colors shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-end px-3 py-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()}
              className="p-2 text-gray-400 hover:text-white rounded-xl transition-colors hover:bg-gray-700/50 flex-shrink-0"
            >
              <ImagePlus size={22} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message Nitish AI..."
              className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-500 min-w-0"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={(!inputValue.trim() && !selectedImage) || isLoading}
              className="p-2 ml-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-colors flex-shrink-0"
            >
              <Send size={18} className={inputValue.trim() || selectedImage ? 'ml-0.5' : ''} />
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
