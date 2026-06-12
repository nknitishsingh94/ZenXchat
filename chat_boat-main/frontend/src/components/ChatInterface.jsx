import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, ImagePlus, X, Menu, Square } from 'lucide-react';
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
  const abortControllerRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !activeSessionId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'users', currentUser.uid, 'sessions', activeSessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data({ serverTimestamps: 'estimate' })
      }));
      setMessages(msgs);
    }, (error) => {
      console.error("Firestore error in ChatInterface:", error);
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

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (isLoading) {
      handleStopGeneration();
      return;
    }
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
    
    abortControllerRef.current = new AbortController();

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

      // --- Image Generation Logic ---
      const generateKeywords = ["generate image", "create image", "draw", "make an image", "image of", "picture of", "photo of"];
      const isImageGen = userMessage && generateKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
      
      let generatedImageUrl = null;
      if (isImageGen) {
          const safePrompt = encodeURIComponent(userMessage.trim());
          const seed = Math.floor(Math.random() * 100000);
          generatedImageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=800&height=600&nologo=true&seed=${seed}`;
      }

      // --- Gemini Chat Logic ---
      const systemPrompt = `You are Nitish AI, an extremely intelligent and friendly AI assistant. You are an expert software engineer. 1. Provide clean, well-documented code in Markdown format. 2. If the user shares an image, analyze it perfectly and help them. 3. Be conversational and human-like. Use Hindi/English mix if asked.`;
      
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
      
      const parts = [];
      if (userMessage) {
          parts.push({ text: userMessage });
      } else {
          parts.push({ text: "Please analyze this image." });
      }
      
      if (imageToSend) {
          const mimeType = imageToSend.split(';')[0].split(':')[1];
          const base64Data = imageToSend.split(',')[1];
          parts.push({
              inlineData: {
                  mimeType: mimeType,
                  data: base64Data
              }
          });
      }

      const payload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: parts }]
      };

      const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
          const errText = await response.text();
          console.error("Gemini API Error:", errText);
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      let apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
      
      if (generatedImageUrl) {
          apiResponse += `\n\n![Generated Image](${generatedImageUrl})\n\n*Here is your requested image!*`;
      }

      await addDoc(messagesCollection, {
        role: 'bot',
        content: apiResponse,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error('Error in chat:', error);
      if (activeSessionId) {
        const messagesCollection = collection(db, 'users', currentUser.uid, 'sessions', activeSessionId, 'messages');
        const errMessage = error.name === 'AbortError' ? 'Generation stopped.' : 'Sorry, something went wrong. Please try again later.';
        await addDoc(messagesCollection, {
          role: 'bot',
          content: errMessage,
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
              {isLoading ? (
                <button type="button" onClick={handleStopGeneration} className="send-button" style={{ background: '#ef4444' }}>
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                <button type="submit" className="send-button" disabled={!inputValue.trim() && !selectedImage}>
                  <Send size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
