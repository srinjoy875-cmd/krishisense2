import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Loader2, RefreshCw, Send, Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api, { chatApi } from '../services/api';
import { useLocation } from '../context/LocationContext';

export default function AIAdvisor() {
  const [mode, setMode] = useState('analysis'); // 'analysis', 'chat', or 'crop-doctor'
  const { location } = useLocation();

  // Crop Doctor State
  const [cropInputs, setCropInputs] = useState({
    N: 50, P: 50, K: 50, ph: 6.5, temperature: 25, humidity: 50, moisture: 60,
    rainfall: 800, altitude: 200, soil_type: 'Loam'
  });
  const [cropResult, setCropResult] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);

  // Analysis State
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState('');

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

  const handleCropPredict = async (e) => {
    e.preventDefault();
    setDoctorLoading(true);
    setCropResult(null); // Clear previous results
    try {
      const { data } = await api.post('/ml/recommend', cropInputs);
      if (data.error) {
        console.error("ML Error Response:", data.error);
        alert(`ML Error: ${data.error}\n\nPlease check console for details.`);
      } else {
        setCropResult(data);
      }
    } catch (err) {
      console.error("Crop Doctor Error:", err);
      alert(`Failed to get predictions. Error: ${err.response?.data?.error || err.message}\n\nCheck console and ensure backend is running.`);
    } finally {
      setDoctorLoading(false);
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
              AgriMind Pro
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
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${mode === 'crop-doctor' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMode('crop-doctor')}
            >
              <Sparkles size={16} />
              Harvest Lab
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
          ) : mode === 'chat' ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-400 mt-20">
                    <Bot size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Ask me anything about your farm&apos;s data!</p>
                    <p className="text-xs mt-2 opacity-60">Try: &quot;How is the soil moisture in Zone 1?&quot;</p>
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
          ) : (
            // Harvest Lab UI
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto">
                <div className="bg-green-50 rounded-2xl p-6 mb-8 border border-green-100">
                  <h3 className="text-xl font-bold text-green-800 mb-2">Smart Crop Engine 🧠</h3>
                  <p className="text-green-700">
                    Enter your soil parameters below. Our ML model will analyze season, soil composition, and climate to recommend the optimal harvest.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Input Form */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Menu size={18} className="text-primary" /> Soil Parameters
                    </h4>
                    <form onSubmit={handleCropPredict} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Nitrogen (N)</label>
                          <input type="number" value={cropInputs.N} onChange={e => setCropInputs({ ...cropInputs, N: e.target.value })} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Phosphorous (P)</label>
                          <input type="number" value={cropInputs.P} onChange={e => setCropInputs({ ...cropInputs, P: e.target.value })} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Potassium (K)</label>
                          <input type="number" value={cropInputs.K} onChange={e => setCropInputs({ ...cropInputs, K: e.target.value })} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">pH Level</label>
                          <input type="number" step="0.1" value={cropInputs.ph} onChange={e => setCropInputs({ ...cropInputs, ph: e.target.value })} className="w-full p-2 border rounded-lg" />
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Temperature (°C)</label>
                        <input type="number" value={cropInputs.temperature} onChange={e => setCropInputs({ ...cropInputs, temperature: e.target.value })} className="w-full p-2 border rounded-lg mb-2" />

                        <label className="text-xs font-semibold text-gray-500 uppercase">Soil Moisture (%)</label>
                        <input type="number" value={cropInputs.moisture} onChange={e => setCropInputs({ ...cropInputs, moisture: e.target.value })} className="w-full p-2 border rounded-lg mb-2" />

                        <label className="text-xs font-semibold text-gray-500 uppercase">Rainfall (mm/year)</label>
                        <input type="number" value={cropInputs.rainfall} onChange={e => setCropInputs({ ...cropInputs, rainfall: e.target.value })} className="w-full p-2 border rounded-lg mb-2" />

                        <label className="text-xs font-semibold text-gray-500 uppercase">Altitude (meters)</label>
                        <input type="number" value={cropInputs.altitude} onChange={e => setCropInputs({ ...cropInputs, altitude: e.target.value })} className="w-full p-2 border rounded-lg mb-2" />

                        <label className="text-xs font-semibold text-gray-500 uppercase">Soil Type</label>
                        <select value={cropInputs.soil_type} onChange={e => setCropInputs({ ...cropInputs, soil_type: e.target.value })} className="w-full p-2 border rounded-lg">
                          <option>Loam</option>
                          <option>Clay</option>
                          <option>Sandy Loam</option>
                          <option>Clay Loam</option>
                          <option>Silt Loam</option>
                          <option>Black Soil</option>
                          <option>Red Soil</option>
                          <option>Alluvial</option>
                          <option>Laterite</option>
                        </select>
                      </div>
                      <Button type="submit" disabled={doctorLoading} className="w-full">
                        {doctorLoading ? <Loader2 className="animate-spin" /> : 'Predict Best Crop'}
                      </Button>
                    </form>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    {cropResult ? (
                      <AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                          {/* Header Info */}
                          {cropResult.current_season && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-900">
                                <strong>🌾 Season:</strong> {cropResult.current_season} |
                                <strong className="ml-2">📊 Analyzed:</strong> {cropResult.total_analyzed} crops |
                                <strong className="ml-2">🎯 Top Match:</strong> {cropResult.top_prediction}
                              </p>
                            </div>
                          )}

                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            🌟 Top Recommendations
                            <span className="text-xs font-normal text-gray-500">
                              ({cropResult.ml_method || 'ML-Powered'})
                            </span>
                          </h4>

                          {cropResult.recommended?.map((rec, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-3 relative overflow-hidden hover:shadow-md transition-shadow">
                              {/* Color indicator */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${rec.quality === 'Excellent' || rec.emoji === '🌟' ? 'bg-green-500' :
                                rec.quality === 'Good' || rec.emoji === '✅' ? 'bg-blue-500' :
                                  rec.quality === 'Fair' || rec.emoji === '⚡' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}></div>

                              <div className="flex justify-between items-start">
                                {/* Left side - Crop info */}
                                <div className="flex-1 ml-3">
                                  {/* Crop name and badges */}
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h5 className="font-bold text-gray-900 text-lg">{rec.emoji || '🌱'} {rec.crop}</h5>
                                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${rec.quality === 'Excellent' ? 'bg-green-100 text-green-700' :
                                      rec.quality === 'Good' ? 'bg-blue-100 text-blue-700' :
                                        rec.quality === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                      }`}>{rec.quality}</span>
                                    {rec.season && (
                                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                        {rec.season}
                                      </span>
                                    )}
                                  </div>

                                  {/* Description */}
                                  <p className="text-xs text-gray-600 mb-3">{rec.desc}</p>

                                  {/* Yield Potential */}
                                  {rec.yield_potential && (
                                    <div className="mb-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200">
                                      <p className="text-xs">
                                        <strong className="text-green-800">📈 Yield Potential:</strong>{' '}
                                        <span className="font-bold text-green-700">{rec.yield_potential.rating}</span>{' '}
                                        ({rec.yield_potential.percentage}% - Grade {rec.yield_potential.grade})
                                      </p>
                                    </div>
                                  )}

                                  {/* Match Reasons */}
                                  {rec.match_reasons && rec.match_reasons.length > 0 && (
                                    <div className="mb-2">
                                      {rec.match_reasons.map((reason, idx) => (
                                        <p key={idx} className="text-[10px] text-green-600 leading-relaxed">{reason}</p>
                                      ))}
                                    </div>
                                  )}

                                  {/* Warnings */}
                                  {rec.warnings && rec.warnings.length > 0 && (
                                    <div className="mb-2">
                                      {rec.warnings.map((warning, idx) => (
                                        <p key={idx} className="text-[10px] text-orange-600 leading-relaxed">{warning}</p>
                                      ))}
                                    </div>
                                  )}

                                  {/* Risk Factors */}
                                  {rec.risk_factors && rec.risk_factors.length > 0 && (
                                    <div className="mb-2 p-2 bg-red-50 rounded border border-red-100">
                                      <p className="text-[10px] font-semibold text-red-700 mb-1">⚠️ Risk Assessment:</p>
                                      {rec.risk_factors.map((risk, idx) => (
                                        <p key={idx} className="text-[9px] text-red-600 leading-tight">{risk}</p>
                                      ))}
                                    </div>
                                  )}

                                  {/* Additional Info */}
                                  <div className="mt-2 flex gap-2 flex-wrap">
                                    {rec.growth_duration && rec.growth_duration !== 'N/A' && (
                                      <span className="bg-purple-50 text-purple-700 text-[9px] px-2 py-1 rounded border border-purple-200">
                                        ⏱️ {rec.growth_duration} days
                                      </span>
                                    )}
                                    {rec.water_requirement && (
                                      <span className="bg-cyan-50 text-cyan-700 text-[9px] px-2 py-1 rounded border border-cyan-200">
                                        💧 {rec.water_requirement} water
                                      </span>
                                    )}
                                    {rec.estimated_roi && (
                                      <span className="bg-amber-50 text-amber-700 text-[9px] px-2 py-1 rounded border border-amber-200">
                                        💰 {rec.estimated_roi} ROI
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right side - Score */}
                                <div className="text-right ml-4">
                                  <span className="text-3xl font-bold text-primary">{Math.round(rec.score)}%</span>
                                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">ML Confidence</p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Feature Analysis */}
                          {cropResult.feature_analysis && cropResult.feature_analysis.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <h5 className="font-bold text-sm mb-3 text-gray-800">🔬 Top Influential Factors</h5>
                              <div className="space-y-2">
                                {cropResult.feature_analysis.map((feature, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700">{feature.feature}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">{feature.value}</span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${feature.impact === 'High' ? 'bg-red-100 text-red-700' :
                                        feature.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-green-100 text-green-700'
                                        }`}>{feature.importance}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                        <Sparkles size={40} className="mb-4 text-gray-300" />
                        <p className="text-center text-sm">Fill parameters to let the ML Engine find the perfect crop for your land.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
