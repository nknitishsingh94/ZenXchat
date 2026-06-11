import React from 'react';
import { ArrowRight, Sparkles, Zap, Shield, MessageSquare, Bot, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
};

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Background Video */}
      <div className="video-background-container">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="background-video"
        >
          {/* Using a futuristic abstract technology network MP4 */}
          <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connection-background-loop-22530-large.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Aurora Background Effects */}
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      <div className="grid-overlay"></div>

      {/* Navigation */}
      <motion.nav 
        className="navbar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="logo">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="logo-icon" size={28} />
          </motion.div>
          <span>Nitish<span style={{ fontWeight: 300 }}>AI</span></span>
        </div>
        <Link to="/chat">
          <motion.button 
            className="nav-cta group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-cta-bg"></span>
            <span className="relative z-10">Launch Demo</span>
          </motion.button>
        </Link>
      </motion.nav>

      {/* Hero Section */}
      <motion.div 
        className="hero-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="badge" variants={itemVariants}>
          <span className="badge-glow"></span>
          <span className="badge-dot"></span>
          Powered by Gemini 1.5 Flash
        </motion.div>
        
        <motion.h1 className="hero-title" variants={itemVariants}>
          Chat with the <br/>
          <span className="text-gradient">Intelligence of Tomorrow</span>
        </motion.h1>
        
        <motion.p className="hero-subtitle" variants={itemVariants}>
          Unleash the power of state-of-the-art AI. From complex coding tasks to creative writing, get superhuman assistance instantly with our beautiful, glass-morphic interface.
        </motion.p>
        
        <motion.div className="hero-actions" variants={itemVariants}>
          <Link to="/chat" style={{ textDecoration: 'none' }}>
            <motion.button 
              className="primary-button"
              whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(99, 102, 241, 0.6)" }}
              whileTap={{ scale: 0.95 }}
            >
              Start Chatting <ArrowRight size={18} className="btn-icon" />
            </motion.button>
          </Link>
          <motion.button 
            className="secondary-button"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Code size={18} /> View Source
          </motion.button>
        </motion.div>
      </motion.div>

      {/* 3D Floating Element */}
      <motion.div 
        className="floating-bot"
        animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bot size={120} strokeWidth={1} color="rgba(255,255,255,0.1)" />
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="features-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, staggerChildren: 0.2 }}
      >
        <FeatureCard 
          icon={<Zap size={24} />} 
          title="Instant Generation" 
          desc="Experience zero-latency responses backed by optimized edge-routing technology."
          color="var(--gradient-1)"
        />
        <FeatureCard 
          icon={<Shield size={24} />} 
          title="Enterprise Security" 
          desc="Your data is encrypted end-to-end. We never use your conversations to train our models."
          color="var(--gradient-2)"
        />
        <FeatureCard 
          icon={<MessageSquare size={24} />} 
          title="Infinite Context" 
          desc="Drop in large documents or codebases. The AI reads and remembers everything seamlessly."
          color="var(--gradient-3)"
        />
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }) => {
  return (
    <motion.div 
      className="feature-card"
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="card-glow" style={{ background: color }}></div>
      <div className="feature-icon-wrapper" style={{ color: color, borderColor: color }}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
};

export default LandingPage;
