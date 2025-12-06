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
    <div className="flex flex-col h-full bg-white border-r border-stone-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-gray-700" />
        <h2 className="text-sm font-semibold text-gray-900">AI Assistant</h2>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
              msg.role === 'user' 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`py-3 px-4 rounded-lg text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-50 text-gray-800 border border-gray-200'
              }`}>
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-stone-900 border border-stone-200 flex items-center justify-center">
                    <Bot size={14} />
                </div>
                <div className="bg-stone-50 text-stone-500 py-3 px-4 rounded-lg text-xs border border-stone-100 italic flex items-center gap-2">
                   <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   <span className="ml-1">Rewriting content...</span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-gray-200 bg-white">
        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-xs">
                {file.type.startsWith('image/') ? (
                  <ImageIcon size={14} className="text-gray-600" />
                ) : (
                  <FileText size={14} className="text-gray-600" />
                )}
                <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.docx,.txt"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={attachedFiles.length >= 2 || globalProcessing}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            placeholder="Ask AI to edit, or attach reference files..."
            className="flex-1 pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none h-14 text-sm text-gray-800 placeholder-gray-400 transition-all"
            disabled={globalProcessing}
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <button
              onClick={handleSendMessage}
              disabled={isTyping || (!input.trim() && attachedFiles.length === 0) || globalProcessing}
              className="p-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:bg-gray-400 shadow-sm"
            >
              {isTyping ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Send size={16} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Attach up to 2 files (images or documents) as reference
        </div>
      </div>
    </div>
  );
};