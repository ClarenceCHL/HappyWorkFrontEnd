import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Plus, Image as ImageIcon, X, Clock, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: { id: string; url: string }[];
}

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  type?: 'simulation' | 'solution';
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
}

interface FormData {
  puaType: string[];
  severity: string;
  description: string;
  perpetrator: string[];
  images?: File[];
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ChatProps {
  onBack: () => void;
  currentMessages: Message[];
  chatHistory: ChatHistory[];
  onSendMessage: (message: string, images?: File[]) => void;
  onSelectChat: (chatId: string) => void;
  isTyping: boolean;
  onNewChat: (formData: FormData) => void;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  submitMode: 'simulation' | 'solution' | null;
  currentChatId?: string | null;
}

export function Chat({ onBack, currentMessages, chatHistory, onSendMessage, onSelectChat, isTyping, onNewChat, setIsTyping, submitMode, currentChatId }: ChatProps) {
  const [message, setMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatForm, setNewChatForm] = useState<FormData>({
    puaType: [],
    severity: '',
    description: '',
    perpetrator: []
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [newChatImages, setNewChatImages] = useState<UploadedImage[]>([]);
  // 添加打字机效果状态
  const [animatedMessages, setAnimatedMessages] = useState<{[key: number]: string}>({});
  const [animationComplete, setAnimationComplete] = useState<{[key: number]: boolean}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newChatFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainChatRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping, animatedMessages]);

  // 添加入场动画效果
  useEffect(() => {
    // 获取各元素引用
    const sidebar = sidebarRef.current;
    const mainChat = mainChatRef.current;
    
    // 设置初始状态
    if (sidebar) {
      sidebar.style.opacity = '0';
      sidebar.style.transform = 'translateX(-30px)';
    }
    
    if (mainChat) {
      mainChat.style.opacity = '0';
      mainChat.style.transform = 'translateX(30px)';
    }
    
    // 执行动画
    setTimeout(() => {
      if (sidebar) {
        sidebar.style.opacity = '1';
        sidebar.style.transform = 'translateX(0)';
      }
    }, 50);
    
    setTimeout(() => {
      if (mainChat) {
        mainChat.style.opacity = '1';
        mainChat.style.transform = 'translateX(0)';
      }
    }, 150);
  }, []);

  // 监听消息变化，添加打字机效果
  useEffect(() => {
    // 对每个AI消息应用打字机效果
    currentMessages.forEach((msg, index) => {
      if (msg.role === 'assistant' && !animationComplete[index]) {
        // 如果这是一个新的AI消息且没有开始动画
        if (animatedMessages[index] === undefined) {
          setAnimatedMessages(prev => ({
            ...prev,
            [index]: ''
          }));
          
          let currentCharIndex = 0;
          const intervalId = setInterval(() => {
            if (currentCharIndex <= msg.content.length) {
              setAnimatedMessages(prev => ({
                ...prev,
                [index]: msg.content.substring(0, currentCharIndex)
              }));
              currentCharIndex++;
            } else {
              clearInterval(intervalId);
              setAnimationComplete(prev => ({
                ...prev,
                [index]: true
              }));
            }
          }, 15); // 调整速度
          
          return () => clearInterval(intervalId);
        }
      }
    });
  }, [currentMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || uploadedImages.length > 0) {
      const messageToSend = message; // 保存消息内容的副本
      setMessage(''); // 立即清空输入框
      setIsTyping(true);
      try {
        await onSendMessage(messageToSend, uploadedImages.map(img => img.file));
        uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
        setUploadedImages([]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleOptionSelect = (field: keyof FormData, value: string) => {
    setNewChatForm(prev => {
      if (field === 'severity') {
        return {
          ...prev,
          [field]: value
        };
      } else {
        const currentValues = prev[field] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        
        return {
          ...prev,
          [field]: newValues
        };
      }
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isNewChat: boolean = false) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));

    if (isNewChat) {
      setNewChatImages(prev => [...prev, ...newImages]);
      if (newChatFileInputRef.current) {
        newChatFileInputRef.current.value = '';
      }
    } else {
      setUploadedImages(prev => [...prev, ...newImages]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (id: string, isNewChat: boolean = false) => {
    const setImages = isNewChat ? setNewChatImages : setUploadedImages;
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  // 格式化时间展示
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // 格式化日期展示
  const formatDate = (date: Date) => {
    const now = new Date();
    const chatDate = new Date(date);
    
    if (now.toDateString() === chatDate.toDateString()) {
      return '今天';
    }
    
    if (now.getDate() - chatDate.getDate() === 1) {
      return '昨天';
    }
    
    return chatDate.toLocaleDateString();
  };

  // 获取显示内容（原内容或动画内容）
  const getDisplayContent = (message: Message, index: number) => {
    if (message.role === 'assistant' && !animationComplete[index]) {
      return animatedMessages[index] || '';
    }
    return message.content;
  };

  return (
    <div 
      className="flex h-screen bg-gray-950"
      ref={chatContainerRef}
    >
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className="w-80 bg-gray-900 border-r border-gray-800/50 flex flex-col shadow-xl transition-all duration-400 ease-out"
      >
        <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">咨询历史</h2>
        </div>
       
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {chatHistory.length > 0 ? (
            <div className="divide-y divide-gray-800/50">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className="w-full p-4 text-left hover:bg-gray-800/50 transition-colors duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-200 mb-1 truncate group-hover:text-blue-400 transition-colors">{chat.title}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {chat.preview.length > 40 ? chat.preview.slice(0, 40) + '...' : chat.preview}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500">
                      <span>{formatDate(chat.timestamp)}</span>
                      <span className="flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(chat.timestamp)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-gray-400 text-center flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <p>暂无历史记录</p>
              <p className="text-sm mt-2 text-gray-500">点击下方按钮开始咨询</p>
            </div>
          )}
        </div>
        
        {/* New Chat Button */}
        <div className="p-4 border-t border-gray-800/50">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            新建咨询窗口
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div 
        ref={mainChatRef}
        className="flex-1 flex flex-col overflow-hidden transition-all duration-400 ease-out"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-sm flex items-center shadow-sm">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800/80 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="ml-4 font-medium text-gray-100">返回主页</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-gray-950 to-gray-900 bg-opacity-60">
          {currentMessages.map((msg, index) => {
            const isUserMessage = msg.role === 'user';
            const isFirstInSequence = index === 0 || currentMessages[index - 1].role !== msg.role;
            const isLastInSequence = index === currentMessages.length - 1 || currentMessages[index + 1].role !== msg.role;
            
            return (
              <div
                key={index}
                className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} ${isFirstInSequence ? 'mt-6' : 'mt-2'} animate-fade-message`}
                style={{ animationDelay: `${150 + index * 100}ms` }}
              >
                <div
                  className={`max-w-[75%] ${isUserMessage ? 'order-1' : 'order-2'}`}
                >
                  <div className="flex items-end">
                    {!isUserMessage && isFirstInSequence && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 mr-2 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                    )}
                    <div
                      className={`p-4 rounded-2xl ${
                        isUserMessage
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none shadow-lg'
                          : 'bg-gray-800/80 text-gray-100 rounded-tl-none shadow'
                      } ${isLastInSequence ? '' : 'mb-1'}`}
                    >
                      <div className="whitespace-pre-wrap break-words">{getDisplayContent(msg, index)}</div>
                      {msg.images && msg.images.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.images.map((img) => (
                            <div key={img.id} className="relative group overflow-hidden rounded-lg border border-gray-700">
                              <img
                                src={img.url}
                                alt="用户上传"
                                className="max-w-[200px] max-h-[200px] object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`text-xs mt-1 ${isUserMessage ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                    {isUserMessage && isFirstInSequence && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 ml-2 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">我</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-message" style={{ animationDelay: '200ms' }}>
              <div className="flex items-end">
                <div className="w-8 h-8 rounded-full bg-indigo-600 mr-2 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <div className="bg-gray-800/80 text-gray-100 p-4 rounded-2xl rounded-tl-none shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2 text-sm text-gray-300">
                      {(() => {
                        // 优先使用当前聊天历史中的类型
                        const currentChat = currentChatId ? chatHistory.find(chat => chat.id === currentChatId) : null;
                        const chatType = currentChat?.type || submitMode;
                        return chatType === 'solution' ? '正在构思解决方案' : '正在还原PUA对话';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800/50 bg-gray-900/90 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '250ms' }}>
          {/* Image Preview Area */}
          {uploadedImages.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 p-2 bg-gray-800/50 rounded-lg">
              {uploadedImages.map((img) => (
                <div key={img.id} className="relative group overflow-hidden">
                  <img
                    src={img.preview}
                    alt="上传预览"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-700 transition-all duration-200 group-hover:brightness-75"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md transform hover:scale-110"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请在这里安心且尽情地释放您的情绪..."
              className="w-full p-4 pr-24 rounded-xl bg-gray-800/70 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-gray-100 placeholder-gray-500 shadow-inner transition-all duration-200"
              rows={3}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleImageUpload(e)}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full transition-colors shadow-md transform hover:scale-105"
                title="上传图片"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={(!message.trim() && uploadedImages.length === 0) || isTyping}
                className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50 text-white rounded-full transition-all duration-300 shadow-md transform hover:scale-105 disabled:transform-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gray-900 p-6 rounded-2xl w-[650px] max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-800/50 transform transition-all duration-300 animate-scale-in">
            <h2 className="text-xl font-semibold mb-6 text-blue-400 border-b border-gray-800/50 pb-4">请选择和描述您的遭遇</h2>
            
            {/* PUA类型 */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3 text-gray-300">PUA类型（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {['工作成果', '人身攻击', '性骚扰', '生命威胁', '其他'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleOptionSelect('puaType', type)}
                    className={`px-4 py-2.5 rounded-full border ${
                      newChatForm.puaType.includes(type)
                        ? 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-inner'
                        : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-300'
                    } transition-all duration-200 text-sm`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 施害者 */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3 text-gray-300">施害者（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {['上司', '同事', '下属', '客户'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleOptionSelect('perpetrator', type)}
                    className={`px-4 py-2.5 rounded-full border ${
                      newChatForm.perpetrator.includes(type)
                        ? 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-inner'
                        : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-300'
                    } transition-all duration-200 text-sm`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 严重程度 */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3 text-gray-300">严重程度（单选）</label>
              <div className="flex gap-2">
                {['轻微', '中等', '严重'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleOptionSelect('severity', level)}
                    className={`px-4 py-2.5 rounded-full border ${
                      newChatForm.severity === level
                        ? 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-inner'
                        : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-300'
                    } transition-all duration-200 text-sm`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* 图片预览区域 */}
            {newChatImages.length > 0 && (
              <div className="mb-6 p-3 bg-gray-800/50 rounded-xl border border-gray-800/70">
                <label className="block text-sm font-medium mb-2 text-gray-400">已上传图片</label>
                <div className="flex flex-wrap gap-3">
                  {newChatImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="上传预览"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-700 transition-all duration-200 group-hover:brightness-75"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id, true)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md transform hover:scale-110"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 详细描述 */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3 text-gray-300">详细描述</label>
              <div className="relative bg-gray-800/50 rounded-xl overflow-hidden border border-gray-800/70 shadow-inner transition-all duration-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <textarea
                  value={newChatForm.description}
                  onChange={(e) => setNewChatForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请详细描述您的遭遇..."
                  className="w-full h-36 p-4 pr-14 bg-transparent outline-none resize-none text-gray-100 placeholder-gray-500"
                />
                <div className="absolute bottom-3 right-3">
                  <input
                    type="file"
                    ref={newChatFileInputRef}
                    onChange={(e) => handleImageUpload(e, true)}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newChatFileInputRef.current?.click()}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full transition-colors shadow-md transform hover:scale-105"
                    title="上传图片"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 border-t border-gray-800/50 pt-5">
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setNewChatForm({
                    puaType: [],
                    severity: '',
                    description: '',
                    perpetrator: []
                  });
                  newChatImages.forEach(img => URL.revokeObjectURL(img.preview));
                  setNewChatImages([]);
                }}
                className="px-6 py-2.5 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onNewChat({
                    ...newChatForm,
                    images: newChatImages.map(img => img.file)
                  });
                  setShowNewChat(false);
                  setNewChatForm({
                    puaType: [],
                    severity: '',
                    description: '',
                    perpetrator: []
                  });
                  newChatImages.forEach(img => URL.revokeObjectURL(img.preview));
                  setNewChatImages([]);
                }}
                disabled={!newChatForm.description.trim() || !newChatForm.severity || newChatForm.puaType.length === 0 || newChatForm.perpetrator.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50 text-white rounded-lg shadow-md transition-all duration-300 font-medium disabled:cursor-not-allowed"
              >
                开始咨询
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 