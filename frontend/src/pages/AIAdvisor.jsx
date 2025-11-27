import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Loader2, RefreshCw, Sprout, Send, Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api, { chatApi } from '../services/api';
import { useLocation } from '../context/LocationContext';

export default function AIAdvisor() {
  const [mode, setMode] = useState('analysis'); // 'analysis' or 'chat'
  const { location } = useLocation();

  // Analysis State
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chat State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile/desktop toggle

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await chatApi.getSessions();
      setSessions(data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const createNewChat = async () => {
    try {
      const { data } = await chatApi.createSession('New Chat');
      setSessions([data, ...sessions]);
      setCurrentSessionId(data.id);
      setChatMessages([]);
      setMode('chat');
      if (window.innerWidth < 1024) setSidebarOpen(false); // Close sidebar on mobile
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setCurrentSessionId(sessionId);
      setChatLoading(true);
      const { data } = await chatApi.getSessionMessages(sessionId);
      setChatMessages(data);
      setMode('chat');
      if (window.innerWidth < 1024) setSidebarOpen(false);
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      await chatApi.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setChatMessages([]);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const { data } = await api.post('/ai/analyze', {
        lat: location.lat,
        lon: location.lon
      });
      setAnalysis(data.analysis);
    } catch (err) {
      console.error("AI Error:", err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // If no session exists, create one first
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const { data } = await chatApi.createSession(inputMessage.substring(0, 30) + '...');
        setSessions([data, ...sessions]);
        setCurrentSessionId(data.id);
        sessionId = data.id;
      } catch (err) {
        console.error("Error creating initial session:", err);
        return;
      }
    }

    const newMessages = [...chatMessages, { role: 'user', content: inputMessage }];
    setChatMessages(newMessages);
    setInputMessage('');
    setChatLoading(true);

    try {
      // Send history + new message + sessionId + location
      const { data } = await api.post('/ai/analyze', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        sessionId: sessionId,
        lat: location.lat,
        lon: location.lon
      });

      if (data && data.analysis) {
        setChatMessages([...newMessages, { role: 'assistant', content: data.analysis }]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error("Chat Error:", err);
      setChatMessages([...newMessages, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">

      {/* Sidebar (History) */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-full absolute lg:relative z-20"
          >
            <div className="p-4 border-b border-gray-100">
              <Button onClick={createNewChat} className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                <Plus size={18} />
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">
                  No history yet.
                </div>
              )}
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={currentSessionId === session.id ? 'text-primary' : 'text-gray-400'} />
                    <span className="truncate text-sm font-medium">{session.title || 'Untitled Chat'}</span>
                  </div>
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Mobile Toggle */}
        <div className="lg:hidden absolute top-4 left-4 z-30">
          <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white shadow-md">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Bot className="text-primary" size={28} />
              AI Crop Advisor
            </h2>
          </div>

          <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${mode === 'analysis' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMode('analysis')}
            >
              <Sparkles size={16} />
              Analysis
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${mode === 'chat' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMode('chat')}
            >
              <Bot size={16} />
              Chat
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm relative">
          {mode === 'analysis' ? (
            <div className="h-full overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center h-full min-h-[400px]"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Bot size={24} className="text-primary/50" />
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-medium text-gray-700">Consulting AI Agronomist...</h3>
                    <p className="text-gray-400 mt-2 text-center max-w-md">
                      Analyzing soil moisture, temperature, and humidity levels to provide personalized recommendations.
                    </p>
                  </motion.div>
                ) : analysis ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="bg-primary/5 px-6 py-4 rounded-xl border border-primary/10 flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-primary-dark flex items-center gap-2">
                        <Sparkles size={18} />
                        Analysis Report
                      </h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-100">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                    <div className="prose prose-green max-w-none">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={generateAnalysis} className="text-gray-500 hover:text-primary">
                        <RefreshCw size={16} className="mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Bot size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Ready to Analyze</h3>
                    <p className="text-gray-500 max-w-md mb-8">
                      Click the button below to have our AI analyze your latest sensor data and provide recommendations.
                    </p>
                    <Button
                      onClick={generateAnalysis}
                      className="bg-gradient-to-r from-primary to-green-600 hover:from-primary-dark hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <Sparkles className="mr-2" size={20} />
                      Generate New Insights
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-400 mt-20">
                    <Bot size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Ask me anything about your farm's data!</p>
                    <p className="text-xs mt-2 opacity-60">Try: "How is the soil moisture in Zone 1?"</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                      }`}>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Button type="submit" disabled={chatLoading || !inputMessage.trim()} className="px-4">
                    <Send size={20} />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
