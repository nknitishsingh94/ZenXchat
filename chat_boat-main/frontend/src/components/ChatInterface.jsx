import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, ImagePlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Image Selection and Convert to Base64
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage = inputValue.trim();
    const imageToSend = selectedImage;
    
    // Clear inputs immediately
    setInputValue('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage, image: imageToSend }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          image: imageToSend
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, something went wrong. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back
          </Link>
          <h1>Nitish <span>AI</span></h1>
          <div style={{ width: 60 }}></div> {/* Spacer */}
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
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
          ))}
          
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
                placeholder="Message AI or Upload Image..."
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
