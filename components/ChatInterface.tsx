import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Wand2, X, Quote, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { Message } from '../types';
import { getDocumentEditSuggestions } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  documentHtml: string;
  onUpdateDocument: (newHtml: string) => void;
  isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  documentHtml, 
  onUpdateDocument, 
  isProcessing: globalProcessing
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: "I'm ready. I can read and write this document. Ask me to:\n- *\"Rewrite the introduction\"*\n- *\"Fix grammar in the second paragraph\"*\n- *\"Format the list as a table\"*\n\nYou can also upload images or documents as reference!",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Allow images and documents
      const isImage = file.type.startsWith('image/');
      const isDoc = file.type.includes('pdf') || file.type.includes('document') || 
                    file.name.endsWith('.docx') || file.name.endsWith('.txt');
      return isImage || isDoc;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only images and documents are allowed.');
    }

    // Limit to 2 files
    if (attachedFiles.length + validFiles.length > 2) {
      alert('Maximum 2 files allowed as reference.');
      return;
    }

    setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 2));
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isTyping) return;

    let messageContent = input;
    
    // Add file info to message
    if (attachedFiles.length > 0) {
      messageContent += '\n\n📎 Attached files:\n' + 
        attachedFiles.map(f => `- ${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join('\n');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent, 
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentFiles = [...attachedFiles];
    setAttachedFiles([]);
    setIsTyping(true);
    
    try {
      // Send the entire document HTML to Gemini
      const response = await getDocumentEditSuggestions(documentHtml, input);

      if (response.type === 'update') {
        onUpdateDocument(response.content);
        
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: "Done. I've updated the document.",
            timestamp: Date.now()
        }]);
      } else {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: response.content || "I couldn't process that request.",
            timestamp: Date.now()
        }]);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `❌ Error: ${errorMessage}\n\nPlease try again in a moment.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-zinc-800">
      <div className="p-3 md:p-4 border-b border-zinc-800 bg-[#0a0a0a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4 md:space-y-6 bg-[#111111]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
              msg.role === 'user' 
                ? 'bg-white text-black border-white' 
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`py-3 px-4 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white text-black' 
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
              }`}>
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center">
                    <Bot size={14} />
                </div>
                <div className="bg-zinc-900 text-zinc-400 py-3 px-4 rounded-lg text-xs border border-zinc-800 italic flex items-center gap-2">
                   <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   <span className="ml-1">Rewriting content...</span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-5 border-t border-zinc-800 bg-[#0a0a0a]">
        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg text-xs border border-zinc-800">
                {file.type.startsWith('image/') ? (
                  <ImageIcon size={14} className="text-zinc-400" />
                ) : (
                  <FileText size={14} className="text-zinc-400" />
                )}
                <span className="text-zinc-300 max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.docx,.txt"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex items-start gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={attachedFiles.length >= 2 || globalProcessing}
              className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Attach files (max 2)"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask AI to edit your document..."
              className="flex-1 bg-transparent border-none outline-none resize-none py-2 text-sm text-zinc-200 placeholder-zinc-500 min-h-[40px] max-h-[120px]"
              disabled={globalProcessing}
              rows={1}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={isTyping || (!input.trim() && attachedFiles.length === 0) || globalProcessing}
              className="p-2 bg-white text-black rounded-md hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 shadow-sm flex-shrink-0"
            >
              {isTyping ? (
                <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <Send size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-zinc-500 px-1">
          💡 Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};