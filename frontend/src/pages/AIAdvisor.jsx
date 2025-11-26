import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Loader2, RefreshCw, Sprout, Send } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export default function AIAdvisor() {
  const [mode, setMode] = useState('analysis'); // 'analysis' or 'chat'

  // Analysis State
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const { data } = await api.post('/ai/analyze');
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

    const newMessages = [...chatMessages, { role: 'user', content: inputMessage }];
    setChatMessages(newMessages);
    setInputMessage('');
    setChatLoading(true);

    try {
      const { data } = await api.post('/ai/analyze', { messages: newMessages });
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <Bot className="text-primary" size={32} />
            AI Crop Advisor
          </h2>
          <p className="text-text-secondary mt-1">
            Get real-time, AI-powered insights for your farm based on sensor data.
          </p>
        </div>

        <div className="flex gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
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
            Chat Assistant
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Context/Visuals */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-200 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-primary rounded-full opacity-10 blur-xl"></div>

            <h3 className="font-semibold text-lg text-primary-dark mb-4 flex items-center gap-2">
              <Sprout size={20} />
              How it works
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 relative z-10">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-primary shadow-sm">1</span>
                <span>We collect real-time data from your deployed sensors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-primary shadow-sm">2</span>
                <span>Our advanced AI model analyzes patterns and anomalies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-primary shadow-sm">3</span>
                <span>You receive actionable advice to optimize crop health.</span>
              </li>
            </ul>
          </Card>

          {/* Placeholder for future features */}
          <div className="bg-white/50 rounded-2xl p-6 border border-dashed border-gray-200 text-center">
            <p className="text-sm text-gray-400">Historical Analysis & Trends coming soon</p>
          </div>
        </div>

        {/* Right Column: Analysis/Chat Result */}
        <div className="lg:col-span-2">
          {mode === 'analysis' ? (
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl p-12 border border-border shadow-sm flex flex-col items-center justify-center min-h-[400px]"
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
                  className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden"
                >
                  <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center justify-between">
                    <h3 className="font-semibold text-primary-dark flex items-center gap-2">
                      <Sparkles size={18} />
                      Analysis Report
                    </h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-100">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="p-8 prose prose-green max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
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
                  className="bg-white rounded-2xl p-12 border border-border shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center"
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
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden h-[600px] flex flex-col">
              <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
                <h3 className="font-semibold text-primary-dark flex items-center gap-2">
                  <Bot size={18} />
                  Chat Assistant
                </h3>
              </div>

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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"
            >
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
