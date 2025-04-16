import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Plus, Image as ImageIcon, X, Clock, MessageSquare } from 'lucide-react';

export interface Message {
  id: string;
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
  mode?: 'simulation' | 'solution';
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
  setCurrentMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function Chat({ onBack, currentMessages, chatHistory, onSendMessage, onSelectChat, isTyping, onNewChat, setIsTyping, submitMode, currentChatId, setCurrentMessages, setCurrentChatId }: ChatProps) {
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
  // 添加模式选择状态
  const [newChatMode, setNewChatMode] = useState<'simulation' | 'solution'>('solution');
  // 添加打字机效果状态
  const [animatedMessages, setAnimatedMessages] = useState<{[key: string]: string}>({});
  const [animationComplete, setAnimationComplete] = useState<{[key: string]: boolean}>({});
  
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
    // 查找新添加的AI消息
    currentMessages.forEach((msg) => {
      // 使用消息ID作为键，确保唯一性
      if (msg.role === 'assistant' && !animationComplete[msg.id]) {
        // 如果消息未完成动画，开始打字机效果
        setAnimatedMessages(prev => ({
          ...prev,
          [msg.id]: ''
        }));
        
        let currentCharIndex = 0;
        const content = msg.content;
        
        const intervalId = setInterval(() => {
          if (currentCharIndex <= content.length) {
            setAnimatedMessages(prev => ({
              ...prev,
              [msg.id]: content.substring(0, currentCharIndex)
            }));
            currentCharIndex++;
          } else {
            clearInterval(intervalId);
            setAnimationComplete(prev => ({
              ...prev,
              [msg.id]: true
            }));
          }
        }, 15);
        
        return () => clearInterval(intervalId);
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
    if (message.role === 'assistant' && !animationComplete[message.id]) {
      return animatedMessages[message.id] || '';
    }
    return message.content;
  };

  return (
    <div className="fixed inset-0 bg-[#111111] flex flex-col md:flex-row overflow-hidden">
      {/* 侧边栏 - 添加移动端适配 */}
      <div 
        ref={sidebarRef}
        className={`w-full md:w-80 border-r border-gray-800 flex-shrink-0 transition-all duration-500 ease-out ${showNewChat ? 'hidden md:block' : 'block md:block'} ${currentMessages.length > 0 && !showNewChat ? 'hidden md:block' : 'block'}`}
        style={{ opacity: 0, transform: 'translateX(-30px)' }}
      >
        {/* 移动端返回按钮 - 仅在小屏幕显示 */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>返回主页</span>
          </button>
          <div className="flex gap-2">
            {currentMessages.length > 0 && (
              <button
                onClick={() => setShowNewChat(false)}
                className="bg-blue-500 text-white p-2 rounded-full"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowNewChat(true)}
              className="bg-blue-500 text-white p-2 rounded-full"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h2 className="text-lg font-medium">历史对话</h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新对话
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-65px)] md:h-[calc(100vh-129px)]">
          {chatHistory.length > 0 ? (
            <div className="space-y-3 p-4">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-800 ${
                    currentChatId === chat.id ? 'bg-gray-800/60 ring-1 ring-blue-400' : 'bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      chat.type === 'simulation' ? 'bg-purple-500/20' : 'bg-green-500/20'
                    }`}>
                      <MessageSquare className={`w-5 h-5 ${
                        chat.type === 'simulation' ? 'text-purple-400' : 'text-green-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-200 truncate pr-2">{chat.title}</h3>
                        <time className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(new Date(chat.timestamp))}
                        </time>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {chat.preview}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <Clock className="w-12 h-12 mb-4 opacity-50" />
              <p>没有历史对话</p>
            </div>
          )}
        </div>
      </div>

      {/* 主聊天区域 - 添加移动端适配 */}
      <div 
        ref={mainChatRef}
        className={`flex-1 flex flex-col h-full transition-all duration-500 ease-out ${
          showNewChat ? 'block' : (currentMessages.length > 0 ? 'block md:flex' : 'hidden md:flex')
        }`}
        style={{ opacity: 0, transform: 'translateX(30px)' }}
      >
        {/* 页头 */}
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => {
                if (showNewChat) {
                  setShowNewChat(false);
                } else if (currentMessages.length > 0 && window.innerWidth < 768) {
                  // 在移动端，返回到历史对话列表
                  setCurrentMessages([]);
                  setCurrentChatId(null);
                } else {
                  onBack();
                }
              }}
              className="flex items-center text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>返回{showNewChat ? '聊天' : (currentMessages.length > 0 && window.innerWidth < 768 ? '历史' : '主页')}</span>
            </button>
          </div>
          <div className="text-sm">
            {submitMode && <span className={`px-2 py-1 rounded-full text-xs ${
              submitMode === 'simulation' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
            }`}>
              {submitMode === 'simulation' ? '场景模拟' : '回复话术'}
            </span>}
          </div>
        </div>

        {showNewChat ? (
          // 新建对话表单 - 添加移动端适配
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-medium mb-6 text-center">新建对话</h2>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newChatForm.puaType.length || !newChatForm.severity || !newChatForm.perpetrator.length || !newChatForm.description.trim()) {
                    alert('请填写所有必填信息');
                    return;
                  }
                  const formWithImages = {
                    ...newChatForm,
                    images: newChatImages.map(img => img.file),
                    mode: newChatMode  // 添加mode参数
                  };
                  onNewChat(formWithImages);
                  setShowNewChat(false);
                }} 
                className="space-y-6"
              >
                {/* 谁PUA你？ - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">谁PUA你？（可多选）</label>
                  <div className="flex flex-wrap gap-3">
                    {['上司', '同事', '下属', '客户'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect('perpetrator', option)}
                        className={`px-4 py-2 rounded-full text-sm border ${
                          newChatForm.perpetrator.includes(option)
                            ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
                            : 'border-gray-700 text-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PUA类别 - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">PUA类别（可多选）</label>
                  <div className="flex flex-wrap gap-3">
                    {['工作成果', '人身攻击', '性骚扰', '生命威胁', '其他'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect('puaType', option)}
                        className={`px-4 py-2 rounded-full text-sm border ${
                          newChatForm.puaType.includes(option)
                            ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
                            : 'border-gray-700 text-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 创伤程度 - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">创伤程度（单选）</label>
                  <div className="flex flex-wrap gap-3">
                    {['轻微', '中等', '严重'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect('severity', option)}
                        className={`px-4 py-2 rounded-full text-sm border ${
                          newChatForm.severity === option
                            ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
                            : 'border-gray-700 text-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 更多表单元素... */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">详细描述</label>
                  <div>
                    {newChatImages.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-3">
                        {newChatImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.preview}
                              alt="上传预览"
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(img.id, true)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={newChatForm.description}
                      onChange={(e) => setNewChatForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请详细描述您遭遇了什么..."
                      className="w-full h-32 p-4 rounded-xl bg-gray-800/50 border border-gray-700 focus:border-blue-400 outline-none resize-none text-gray-100 placeholder-gray-500"
                    />
                    
                    {/* 添加模式选择选项 */}
                    <div className="mt-4 space-y-3">
                      <label className="block text-base font-medium text-gray-200">选择回复模式</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setNewChatMode('simulation')}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            newChatMode === 'simulation' 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-400' 
                              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-purple-400'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full flex items-center justify-center border-2 border-current">
                            {newChatMode === 'simulation' && <span className="w-2 h-2 bg-current rounded-full"></span>}
                          </span>
                          <span>场景模拟</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewChatMode('solution')}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            newChatMode === 'solution' 
                              ? 'bg-green-500/20 text-green-400 border border-green-400' 
                              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-green-400'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full flex items-center justify-center border-2 border-current">
                            {newChatMode === 'solution' && <span className="w-2 h-2 bg-current rounded-full"></span>}
                          </span>
                          <span>回复话术</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
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
                        className="text-gray-400 hover:text-gray-300 flex items-center gap-1"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm">添加图片</span>
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowNewChat(false)}
                          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm"
                        >
                          提交
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* 消息区域 - 添加移动端适配 */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-2 md:py-4"
            >
              <div className="max-w-3xl mx-auto">
                <div className="space-y-6">
                  {currentMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                      <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                        <div 
                          className={`${
                            msg.role === 'user' 
                              ? 'bg-blue-500/10 text-gray-200 ml-auto' 
                              : 'bg-gray-800 text-gray-300'
                          } rounded-lg p-3 md:p-4`}
                        >
                          {msg.images && msg.images.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {msg.images.map((img) => (
                                <img
                                  key={img.id}
                                  src={img.url}
                                  alt="User uploaded"
                                  className="max-w-full h-auto rounded mb-2 max-h-48"
                                />
                              ))}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-sm md:text-base">
                            {getDisplayContent(msg, index)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex justify-end">
                          {formatTime(new Date(msg.timestamp))}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 order-2">
                          <span className="text-xs text-gray-300">我</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4 inline-flex items-center">
                        <span className="typing-dot bg-gray-500"></span>
                        <span className="typing-dot bg-gray-500"></span>
                        <span className="typing-dot bg-gray-500"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* 输入区域 - 添加移动端适配 */}
            <div className="border-t border-gray-800 p-3 md:p-4">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <div className="relative">
                    {uploadedImages.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {uploadedImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.preview}
                              alt="上传预览"
                              className="w-12 h-12 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 focus-within:border-blue-400 transition-colors">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="输入消息..."
                          className="w-full px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-100 resize-none h-10 max-h-32 text-sm md:text-base"
                          style={{ minHeight: '2.5rem' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-full"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="submit"
                          className={`p-2.5 rounded-full ${
                            message.trim() || uploadedImages.length > 0
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!message.trim() && uploadedImages.length === 0}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 