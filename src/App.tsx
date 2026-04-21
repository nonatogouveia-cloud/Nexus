/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Home, 
  MessageSquare, 
  Terminal, 
  Shield, 
  Zap,
  ChevronRight,
  User,
  Activity,
  MapPin,
  TrendingUp,
  FileText,
  LogOut,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Menu,
  X,
  Wifi,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy
} from './lib/firebase';

// Initialize Gemini lazily
let aiInstance: any = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// --- Types ---
interface Listing {
  id: string;
  name: string;
  area: string;
  type: string;
  price: string;
  investorInterest: string;
  coords: string;
  proximity: string;
}

interface AIHistory {
  id: string;
  prompt: string;
  response: string;
  createdAt: any;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, ...props }: { icon: any, label: string, active: boolean, onClick: () => void, [key: string]: any }) => (
  <button 
    {...props}
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-4 transition-all duration-300 group rounded-xl ${active ? 'text-white bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
  >
    <Icon size={22} className={active ? '' : 'transition-transform group-hover:scale-110'} />
    <span className="font-semibold text-sm tracking-wide">{label}</span>
    {active && (
      <motion.div 
        layoutId="activePill"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-white" 
      />
    )}
  </button>
);

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div {...props} className={`bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Modules ---

const AutomationModule = ({ voiceLog, isListening, speak }: { voiceLog: string[], isListening: boolean, speak: (text: string) => void }) => {
  const [tasks] = useState([
    { id: 1, name: 'Magisk Daemon', status: 'Active', uptime: '142h 12m' },
    { id: 2, name: 'Tasker Profile: Home', status: 'Standby', uptime: 'N/A' },
    { id: 3, name: 'AutoVoice Nexus', status: 'Listening', uptime: '24h 05m' },
    { id: 4, name: 'Root Permission Manager', status: 'Secure', uptime: 'Ongoing' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Automation</h2>
          <p className="text-gray-400 text-sm mt-1">Nexus Sombra Control Center • Root Access Established</p>
        </div>
        <div className="hidden sm:flex gap-2">
            <button 
              onClick={() => speak("Teste de áudio do sistema Nexus estabilizado.")}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest hover:border-[var(--accent)] hover:text-white transition-all"
            >
              <Zap size={10} className="text-[var(--accent)]" />
              Testar Voz
            </button>
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2 text-[10px] text-green-500 uppercase font-bold tracking-widest">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Sincronizado
            </div>
            {isListening && (
              <div className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full flex items-center gap-2 text-[10px] text-[var(--accent)] uppercase font-bold tracking-widest">
                <Mic size={10} className="animate-pulse" />
                Mic Active
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map(task => (
          <Card key={task.id} className="p-5 group hover:border-[var(--accent)]/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:bg-[var(--accent)]/20 transition-colors">
                <Activity size={18} className="text-[var(--accent)]" />
              </div>
              <span className="text-[10px] font-mono text-gray-500">#{task.id.toString().padStart(2, '0')}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-4">{task.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 uppercase tracking-wider font-semibold">Status</span>
                <span className="px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded font-bold uppercase">{task.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 uppercase tracking-wider font-semibold">Uptime</span>
                <span className="text-white font-mono">{task.uptime}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <Terminal size={16} className="text-[var(--accent)]" /> Console Logs
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">Kernel Session</span>
          </div>
          <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-[var(--accent)] space-y-1.5 border border-white/5 h-40 overflow-y-auto">
            <p className="opacity-50">[{new Date().toLocaleTimeString()}] nexus_sombra kernel: initialized v2.5.0</p>
            <p className="opacity-70">[{new Date().toLocaleTimeString()}] security: checking Magisk integrity... OK</p>
            <p className="opacity-90">[{new Date().toLocaleTimeString()}] network: node Juazeiro_01 established</p>
            <p className="animate-pulse">_</p>
          </div>
        </Card>

        {isListening && (
          <Card className="p-6 border-[var(--accent)]/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <Mic size={16} className="text-[var(--accent)] animate-pulse" /> Nexus Voice Feed
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">Live Transcript</span>
            </div>
            <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-white/80 space-y-2 border border-white/5 h-40 overflow-y-auto">
              {voiceLog.length === 0 ? (
                <p className="text-gray-600 italic">Aguardando comando de voz...</p>
              ) : voiceLog.map((log, i) => (
                <motion.p 
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={i} 
                  className={i === 0 ? "text-[var(--accent)]" : "text-gray-500"}
                >
                  &gt; {log}
                </motion.p>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const RealEstateModule = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      // Fallback data if empty
      if (data.length === 0) {
        setListings([
          { 
            id: '1',
            name: 'Residencial Juazeiro Prime', 
            area: 'Lagoa Seca', 
            type: 'High End', 
            price: 'R$ 850.000', 
            investorInterest: 'BSPAR Potential',
            coords: "-7.2345, -39.3121",
            proximity: "350m da FAP • 800m do Cariri Shopping" 
          },
          { 
            id: '2',
            name: 'Loteamento Santa Maria', 
            area: 'Triângulo', 
            type: 'Lot', 
            price: 'R$ 220.000', 
            investorInterest: 'High',
            coords: "-7.2189, -39.3056",
            proximity: "Em frente ao Hospital Clínica Santa Maria" 
          }
        ]);
      } else {
        setListings(data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Real Estate</h2>
          <p className="text-gray-400 text-sm mt-1">Gestão de Ativos em Juazeiro do Norte</p>
        </div>
        <button className="bg-[var(--accent)] text-black p-3 rounded-full shadow-lg hover:scale-105 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      <AnimatePresence>
        {selectedListing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-48 bg-gradient-to-br from-[var(--accent)]/20 to-blue-500/20 flex items-center justify-center">
                  <MapPin size={64} className="text-[var(--accent)]" />
                  <button 
                    onClick={() => setSelectedListing(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded text-[10px] font-bold uppercase">{selectedListing.type}</span>
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{selectedListing.id}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{selectedListing.name}</h3>
                  <p className="text-gray-400 font-medium">{selectedListing.area}, Juazeiro do Norte</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-6">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Valor de Ativo</p>
                    <p className="text-xl font-bold text-white">{selectedListing.price}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Status de Investimento</p>
                    <p className="text-xl font-bold text-[var(--accent)] uppercase tracking-tighter">{selectedListing.investorInterest}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Terminal size={16} className="text-[var(--accent)] mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Geolocalização</p>
                      <p className="text-xs font-mono text-white mt-1">{selectedListing.coords}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp size={16} className="text-white/40 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Ponto de Referência</p>
                      <p className="text-xs text-white mt-1">{selectedListing.proximity}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedListing(null)}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase text-sm hover:bg-[var(--accent)] transition-colors mt-4"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center p-12 text-[var(--accent)] animate-spin">
            <RefreshCw size={32} />
          </div>
        ) : listings.map((l) => (
          <Card key={l.id} className="p-6 group hover:border-[var(--accent)]/40 transition-all">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[var(--accent)]/10 transition-colors">
                <MapPin size={32} className="text-[var(--accent)]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">{l.name}</h3>
                  <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 font-bold uppercase">{l.type}</span>
                </div>
                <p className="text-sm text-gray-500 font-medium">{l.area} • Juazeiro do Norte</p>
                <div className="pt-2 space-y-1">
                   <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--accent)]/70">
                      <Terminal size={12} /> {l.coords}
                   </div>
                   <div className="text-[11px] text-white/50 uppercase tracking-widest font-bold">
                      Landmark: {l.proximity}
                   </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{l.price}</div>
                  <div className="text-[10px] text-[var(--accent)] uppercase font-black tracking-widest">{l.investorInterest}</div>
                </div>
                <button 
                  onClick={() => setSelectedListing(l)}
                  className="w-full lg:w-40 bg-white text-black py-2.5 rounded-xl text-xs font-bold uppercase transition-all hover:bg-[var(--accent)] hover:shadow-xl"
                >
                  Detalhes
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-5 text-center bg-[var(--accent)]/5">
          <TrendingUp className="mx-auto mb-3 text-[var(--accent)]" />
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Valorização</p>
          <p className="text-2xl font-bold text-white">+12.4%</p>
        </Card>
        <Card className="p-5 text-center">
          <User className="mx-auto mb-3 text-white/40" />
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Investidores</p>
          <p className="text-2xl font-bold text-white">42</p>
        </Card>
        <Card className="p-5 text-center col-span-2 md:col-span-1">
          <Home className="mx-auto mb-3 text-white/40" />
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Pendentes</p>
          <p className="text-2xl font-bold text-white">08</p>
        </Card>
      </div>
    </div>
  );
};

const AIAssistantModule = ({ user, voiceLog, speak, location }: { user: any, voiceLog: string[], speak: (text: string) => void, location: any }) => {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<AIHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestResponse, setLatestResponse] = useState('');
  const [engine, setEngine] = useState<'gemini' | 'openrouter'>('gemini');
  const [orModel, setOrModel] = useState('google/gemini-2.0-flash-exp:free');

  const useLastVoice = () => {
    if (voiceLog.length > 0) {
      setPrompt(voiceLog[0]);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "ai_history"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIHistory)));
    });
    return () => unsubscribe();
  }, [user]);

  const generateLetter = async (overridePrompt?: string) => {
    const currentPrompt = overridePrompt || prompt;
    if (!currentPrompt) return;
    setLoading(true);
    setLatestResponse(''); 
    let fullText = '';
    
    const locationContext = location ? `Localização GPS: Lat ${location.lat}, Lng ${location.lng}.` : "";
    const systemPrompt = "Você é o assistente 'Sombra'. Responda AGORA de forma adaptativa e estratégica. 1. Se houver GPS, trate como sua base local imediata. 2. Use Google Search em tempo real para fatos externos. 3. Use pontuação clara (vírgulas e pontos) para criar pausas naturais na leitura. 4. Seja conciso e use um tom de autoridade técnica.";

    try {
      if (engine === 'gemini') {
        const ai = getAI();
        const stream = await ai.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents: `${locationContext}\n\n${currentPrompt}`,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ googleSearch: {} }]
          }
        });

        for await (const chunk of stream) {
          const textChunk = chunk.text;
          fullText += textChunk;
          setLatestResponse(prev => prev + textChunk);
        }
      } else {
        // OpenRouter via Backend Proxy
        const response = await fetch("/api/openrouter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: orModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${locationContext}\n\n${currentPrompt}` }
            ],
            stream: true
          })
        });

        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices[0]?.delta?.content || "";
                fullText += text;
                setLatestResponse(prev => prev + text);
              } catch (e) { /* partial json */ }
            }
          }
        }
      }
      
      if (user) {
        await addDoc(collection(db, "ai_history"), {
          prompt: currentPrompt,
          response: fullText,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      
      speak(fullText);
      if (!overridePrompt) setPrompt('');
    } catch (err) {
      console.error(err);
      setLatestResponse('Falha na infraestrutura Nexus (OpenRouter Connection).');
      speak("Falha na conexão com Open Router.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Nexus AI</h2>
        <p className="text-gray-400 text-sm mt-1">Estratégia e Redação para Real Estate Juazeiro</p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setEngine('gemini')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${engine === 'gemini' ? 'bg-[var(--accent)] text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Gemini Direct
          </button>
          <button 
            onClick={() => setEngine('openrouter')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${engine === 'openrouter' ? 'bg-[var(--accent)] text-black' : 'text-gray-500 hover:text-white'}`}
          >
            OpenRouter (Free)
          </button>
        </div>

        {engine === 'openrouter' && (
          <select 
            value={orModel}
            onChange={(e) => setOrModel(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-[var(--accent)] outline-none"
          >
            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
            <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</option>
            <option value="huggingfaceh4/zephyr-7b-beta:free">Zephyr 7B (Free)</option>
            <option value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Free)</option>
          </select>
        )}
      </div>

      <Card className="p-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {voiceLog.length > 0 && (
            <button 
              onClick={useLastVoice}
              className="text-[10px] font-bold whitespace-nowrap bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-3 py-1.5 rounded-full text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all flex items-center gap-1"
            >
              <Mic size={10} /> USAR VOZ: {voiceLog[0].substring(0, 15)}...
            </button>
          )}
          {["Terreno Lagoa Seca próximo à FAP", "Loteamento Investidor BSPAR", "Salas Nexus Centro Juazeiro"].map((t) => (
            <button 
              key={t}
              onClick={() => { setPrompt(t); generateLetter(t); }}
              className="text-[10px] font-bold whitespace-nowrap bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-400 hover:text-white hover:border-[var(--accent)] transition-all"
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <textarea 
          placeholder="Descreva o ativo ou o objetivo do anúncio..."
          className="w-full h-32 bg-black/30 border border-white/5 rounded-2xl p-4 font-medium text-sm text-gray-200 focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          onClick={generateLetter}
          disabled={loading || !prompt}
          className="mt-4 w-full bg-[var(--accent)] text-black py-3.5 rounded-2xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--accent)]/20 disabled:opacity-50 transition-all"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <><Zap size={18} /> Processar Protocolo</>}
        </button>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">Histórico de Operações</h3>
        {latestResponse && (
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Card className="p-6 border-[var(--accent)]/50 bg-[var(--accent)]/5">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                  <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Geração Recente</span>
                  <FileText size={16} className="text-[var(--accent)]" />
                </div>
                <div className="text-sm leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
                  {latestResponse}
                </div>
              </Card>
           </motion.div>
        )}

        <div className="space-y-3">
          {history.map((h) => (
            <Card key={h.id} className="p-4 bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer" onClick={() => setLatestResponse(h.response)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <MessageSquare size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{h.prompt}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-black">{h.createdAt?.toDate().toLocaleDateString() || 'Recent'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState('automation');
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Voice & Location State
  const [isListening, setIsListening] = useState(true);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Erro GPS de Alta Precisão:", error),
        options
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Interromper qualquer ciclo de fala anterior
    window.speechSynthesis.cancel();

    // Filtros e limpeza de texto (remover emojis e marcas de formatação pesadas para a voz)
    const cleanText = text.replace(/[*#_\[\]]/g, '').trim();
    
    // Dividir o texto em sentenças para processamento individual (Prosódia Fracionária)
    const sentences = cleanText.split(/(?<=[.!?])\s+/);

    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      
      let chosenVoice = voices.find(v => 
        v.lang.startsWith('pt') && 
        (v.name.toLowerCase().includes('daniel') || 
         v.name.toLowerCase().includes('ricardo') || 
         v.name.toLowerCase().includes('natural') ||
         v.name.toLowerCase().includes('neural'))
      );

      if (!chosenVoice) {
        chosenVoice = voices.find(v => v.lang === 'pt-BR') || voices.find(v => v.lang.startsWith('pt'));
      }

      let sentenceIndex = 0;

      const speakNextSentence = () => {
        if (sentenceIndex >= sentences.length) return;

        const sentence = sentences[sentenceIndex];
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'pt-BR';
        if (chosenVoice) utterance.voice = chosenVoice;

        // Ajustes de Entonação e Velocidade para Sombra (Ar de autoridade estratégica)
        utterance.rate = 0.92; // Um pouco mais lento para clareza
        utterance.pitch = 0.82; // Tom mais grave e sério
        utterance.volume = 1.0;

        // Pausa Natural: Pequeno silêncio entre as frases
        utterance.onend = () => {
          sentenceIndex++;
          setTimeout(speakNextSentence, 250); // Pausa de 250ms "respiração"
        };

        utterance.onerror = (e) => {
          console.error("Erro na síntese Nexus:", e);
          sentenceIndex++;
          speakNextSentence();
        };

        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      };

      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          if (updatedVoices.length > 0) speakNextSentence();
        };
      } else {
        speakNextSentence();
      }
    }, 150);
  };

  const handleVoiceCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    if (cmd.includes('olá') || cmd.includes('oi') || command === 'ativação base') {
      speak("estou contigo, o que vamos fazer hoje");
    } else if (command.length > 3) {
      speak("Acessando rede global para fundar resposta.");
      setActiveTab('ai');
      // Prompt will be available in voiceLog for AIAssistantModule to pick up
    } else {
      speak(`Recebido: ${command}.`);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // Continuous Recognition Logic
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      if (event.results[event.results.length - 1].isFinal) {
        const finalTranscript = event.results[event.results.length - 1][0].transcript.trim();
        setVoiceLog(prev => [finalTranscript, ...prev].slice(0, 5));
        
        if (finalTranscript.toLowerCase().includes('sombra')) {
          const parts = finalTranscript.toLowerCase().split('sombra');
          const command = parts[parts.length - 1].trim();
          handleVoiceCommand(command || 'ativação base');
        }
      }
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => recognition.stop();
  }, [isListening]);

  const menuItems = [
    { id: 'automation', icon: Cpu, label: 'Automação' },
    { id: 'realestate', icon: Home, label: 'Real Estate' },
    { id: 'ai', icon: MessageSquare, label: 'Nexus AI' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[var(--accent)] selection:text-black">
      {/* Visual background layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>
      
      {/* Mobile Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-[var(--accent)]" size={20} />
            <span className="font-black uppercase tracking-tighter text-lg">Nexus Sombra</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="lg:hidden fixed inset-0 z-40 bg-black pt-20 px-6 space-y-2"
          >
            {menuItems.map(item => (
              <SidebarItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={activeTab === item.id} 
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} 
              />
            ))}
            <div className="pt-8 mt-8 border-t border-white/10">
               {user ? (
                 <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 text-red-400 font-bold">
                    <LogOut size={20} /> Logout
                 </button>
               ) : (
                 <button onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 text-[var(--accent)] font-bold">
                    <LogIn size={20} /> Autenticar
                 </button>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen relative z-10 pt-16 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex-col sticky top-0 h-screen p-8">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-[var(--accent)]" size={28} />
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Nexus Sombra</h1>
            </div>
            <div className="px-3 py-1 bg-white/5 inline-block rounded-full border border-white/10">
               <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Protocolo v2.4.1 active</p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-2">
            {menuItems.map(item => (
              <SidebarItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={activeTab === item.id} 
                onClick={() => setActiveTab(item.id)} 
              />
            ))}
          </nav>

          <div className="mt-auto space-y-6 pt-8 border-t border-white/5">
            {/* Voice Link Toggle */}
            <button 
              onClick={() => setIsListening(!isListening)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${isListening ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-white/5 border-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isListening ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-gray-500'}`}>
                  {isListening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
                </div>
                <div className="text-left">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isListening ? 'text-[var(--accent)]' : 'text-gray-500'}`}>Nexus Voice</p>
                  <p className="text-[9px] text-gray-600 font-bold">{isListening ? 'LISTENING_MODE' : 'LINK_OFFLINE'}</p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-[var(--accent)] animate-ping' : 'bg-gray-800'}`} />
            </button>

            {user ? (
               <div className="flex items-center gap-3 group px-2">
                  <img src={user.photoURL} className="w-10 h-10 rounded-xl border border-white/20 group-hover:border-[var(--accent)] transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-white uppercase">{user.displayName}</p>
                    <button onClick={logout} className="text-[10px] text-red-400 font-bold uppercase hover:underline">Sair do Link</button>
                  </div>
               </div>
            ) : (
                <button 
                  onClick={loginWithGoogle}
                  className="w-full bg-[var(--accent)] text-black py-3 rounded-xl font-bold uppercase text-xs hover:scale-105 transition-transform"
                >
                  Autenticar
                </button>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--accent)]/60 uppercase tracking-widest">
                <div className="p-1 bg-[var(--accent)]/10 rounded">
                   <Wifi size={12} />
                </div>
                <span>Node: Juazeiro-01</span>
              </div>
              <div className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 leading-relaxed">
                7°12'S 39°18'W <br/>
                Sombra Operations
              </div>
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-black/20 pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {activeTab === 'automation' && <AutomationModule voiceLog={voiceLog} isListening={isListening} speak={speak} />}
                {activeTab === 'realestate' && <RealEstateModule />}
                {activeTab === 'ai' && <AIAssistantModule user={user} voiceLog={voiceLog} speak={speak} location={location} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modern Status Footer (Desktop Only) */}
      <footer className="hidden lg:flex fixed bottom-6 right-8 z-50">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-[var(--accent)] tracking-widest">Firebase Live</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase font-black">
             <span>v2.4.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
