import { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, User, Clock, Loader2, Link as LinkIcon, Paperclip, X, File as FileIcon, Download } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

type Peer = { id: number; username: string; avatarUrl?: string | null; };
type Conversation = { id: number; lastMessageAt: string; targetUser: Peer; };
type ChatMessage = { 
  id?: number; 
  senderId: number; 
  content: string; 
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt: string; 
};

export default function Messages() {
  const { user, isLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directory, setDirectory] = useState<Peer[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/chat/conversations').then(r => r.json()).then(setConversations);
    fetch('/api/chat/directory').then(r => r.json()).then(setDirectory);
  }, [user]);

  useEffect(() => {
    if (!activeConvo) return;
    
    setMessages([]);
    setIsWsConnecting(true);
    
    fetch(`/api/chat/messages/${activeConvo.id}`)
      .then(r => r.json())
      .then(data => { 
        if(!data.error) setMessages(data); 
        scrollToBottom(); 
      });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/chat/ws?conversationId=${activeConvo.id}`);
    
    ws.onopen = () => setIsWsConnecting(false);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };
    
    wsRef.current = ws;
    return () => {
      if(ws.readyState === 1) ws.close();
    };
  }, [activeConvo]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleStartChat = async (targetId: number) => {
    const res = await fetch('/api/chat/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: targetId })
    });
    
    if(!res.ok) return;
    const convo = await res.json();
    
    if (!conversations.find(c => c.id === convo.id)) {
      setConversations(prev => [convo, ...prev]);
    }
    setActiveConvo(convo);
    setSearchQuery('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Attachment exceeds the 5MB size limit.");
      return;
    }
    setSelectedFile(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || !activeConvo || !wsRef.current || !user) return;
    
    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
        const res = await fetch('/api/upload/chat', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          fileUrl = data.fileUrl;
          fileName = data.fileName;
          fileType = data.fileType;
        } else {
          alert(data.error || "File validation failed.");
          setIsUploading(false);
          return;
        }
      } catch (err) {
         setIsUploading(false);
         return;
      }
      setIsUploading(false);
      setSelectedFile(null);
    }

    const payload = { 
      type: 'chat_message', 
      conversationId: activeConvo.id, 
      senderId: user.id, 
      content: input.trim(),
      fileUrl, fileName, fileType
    };
    
    wsRef.current.send(JSON.stringify(payload));
    
    setMessages(prev => [...prev, { 
      senderId: user.id, 
      content: input.trim(), 
      fileUrl, fileName, fileType,
      createdAt: new Date().toISOString() 
    }]);
    
    setInput('');
    scrollToBottom();
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="size-8 animate-spin text-orange-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const filteredDirectory = directory.filter(d => d.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto md:py-6 h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] animation-fade-in flex flex-col">
      <SeoHead title="Secure Comm-Link" description="Real-time private messaging pipeline." />
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl shadow-xl shadow-zinc-200/20 dark:shadow-black/20 overflow-hidden flex flex-1 w-full">
        
        <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex-col bg-zinc-50/50 dark:bg-[#0a0a0a]/50 ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><LinkIcon className="size-5 text-orange-500" /> Comm-Link</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input type="text" placeholder="Search network..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-orange-500/50 shadow-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {searchQuery ? (
              <div className="space-y-1">
                <span className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Network Directory</span>
                {filteredDirectory.map(peer => (
                  <button key={peer.id} onClick={() => handleStartChat(peer.id)} className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                    <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {peer.avatarUrl ? <img src={peer.avatarUrl} alt="" className="w-full h-full object-cover"/> : <User className="size-4 text-zinc-500" />}
                    </div>
                    <span className="font-semibold text-sm">{peer.username}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center p-6 text-zinc-500 text-sm">
                    No active comms. Search directory to start a chat.
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button key={conv.id} onClick={() => setActiveConvo(conv)} className={`w-full flex items-center justify-between p-3 text-left rounded-xl transition-colors ${activeConvo?.id === conv.id ? 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'hover:bg-white dark:hover:bg-zinc-800/50 border border-transparent'}`}>
                      <div className="flex items-center gap-3 truncate w-full">
                        <div className="size-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {conv.targetUser?.avatarUrl ? <img src={conv.targetUser.avatarUrl} alt="" className="w-full h-full object-cover"/> : <User className="size-5 text-zinc-500" />}
                        </div>
                        <div className="flex flex-col truncate flex-1">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{conv.targetUser?.username || 'Unknown User'}</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-semibold uppercase tracking-wider mt-0.5"><Clock className="size-3" /> {new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-white dark:bg-zinc-900 relative ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
          {activeConvo ? (
            <>
              <div className="h-16 px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-[#0a0a0a]/50">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveConvo(null)} className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                    <span className="text-xs font-bold uppercase">Back</span>
                  </button>
                  <div className="size-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {activeConvo.targetUser?.avatarUrl ? <img src={activeConvo.targetUser.avatarUrl} alt="" className="w-full h-full object-cover"/> : <User className="size-5 text-zinc-500" />}
                  </div>
                  <span className="font-bold text-lg">{activeConvo.targetUser?.username}</span>
                </div>
                {isWsConnecting && <span className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest"><Loader2 className="size-3 animate-spin" /> Securing...</span>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar bg-zinc-50/30 dark:bg-[#0a0a0a]/30">
                {messages.length === 0 && !isWsConnecting && (
                   <div className="flex flex-col items-center justify-center h-full opacity-40 text-center">
                     <MessageSquare className="size-12 mb-3 text-zinc-500" />
                     <p className="text-sm font-semibold">End-to-end vector established.<br/>Start transmitting.</p>
                   </div>
                )}
                {messages.map((msg, idx) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animation-fade-in`}>
                      <div className={`max-w-[85%] md:max-w-[70%] px-5 py-3 text-sm ${isMine ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl rounded-br-sm shadow-md' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-sm border border-zinc-200 dark:border-zinc-700 shadow-sm'}`}>
                        
                        {msg.fileUrl && (
                          <div className="mb-3 mt-1">
                            {msg.fileType?.startsWith('image/') ? (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img src={msg.fileUrl} alt={msg.fileName || 'Attachment'} className="max-h-60 rounded-xl object-contain bg-black/10 dark:bg-white/10" />
                              </a>
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border ${isMine ? 'bg-zinc-800 border-zinc-700 dark:bg-zinc-200 dark:border-zinc-300' : 'bg-zinc-50 border-zinc-200 dark:bg-[#0a0a0a] dark:border-zinc-800'} transition-opacity hover:opacity-80`}>
                                <div className="p-2 bg-orange-500/10 rounded-lg"><FileIcon className="size-5 text-orange-500" /></div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-semibold text-sm truncate">{msg.fileName || 'Attachment'}</span>
                                  <span className="text-[10px] uppercase opacity-70 flex items-center gap-1"><Download className="size-3" /> Download payload</span>
                                </div>
                              </a>
                            )}
                          </div>
                        )}

                        {msg.content && <p className="whitespace-pre-wrap leading-relaxed break-words font-medium">{msg.content}</p>}
                        
                        <div className={`text-[9px] mt-1.5 opacity-60 font-mono tracking-wider ${isMine ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                {selectedFile && (
                  <div className="mb-3 flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {selectedFile.type.startsWith('image/') ? (
                         <div className="size-10 rounded-md overflow-hidden bg-black/10"><img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-full h-full object-cover" /></div>
                      ) : (
                         <FileIcon className="size-5 text-orange-500 shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-orange-500/20 rounded-lg text-orange-500 transition-colors"><X className="size-4" /></button>
                  </div>
                )}
                
                <form onSubmit={handleSend} className="flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-[#0a0a0a] dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl transition-all shadow-sm">
                    <Paperclip className="size-5" />
                  </button>
                  
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Transmit data payload..." className="flex-1 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-orange-500/50 focus:bg-white dark:focus:bg-zinc-900 shadow-inner transition-all" />
                  
                  <button disabled={(!input.trim() && !selectedFile) || isUploading} type="submit" className="bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white px-5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 font-bold flex items-center justify-center gap-2">
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 shrink-0" />} 
                    <span className="hidden sm:block text-sm">{isUploading ? 'Securing...' : 'Send'}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <div className="size-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                 <LinkIcon className="size-8 text-zinc-400" />
              </div>
              <p className="font-medium">Select a peer to establish a secure comm-link.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
