import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Shield, AlertTriangle, History, Image as ImageIcon, X, PlayCircle, MessageCircle, LogOut, Key, Crown, Heart } from 'lucide-react';
import { Auth } from './components/Auth';
import { Chat, Message as ChatMessage } from './components/Chat';
import heroImage from './assets/hero-image.png';
import './styles.css';

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  type: 'simulation' | 'solution';
  messages: {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    images?: Array<{
      id: string;
      url: string;
    }>;
  }[];
}

interface FormData {
  puaType: string[];
  severity: string;
  description: string;
  perpetrator: string[];
  mode?: 'simulation' | 'solution';
}

// 使用从Chat组件导入的Message类型
type Message = ChatMessage;

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface Chat {
  id: string;
  title: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  timestamp: Date;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 添加自定义 hook 用于滚动动画
function useScrollAnimation() {
  useEffect(() => {
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target); // 动画触发后不再观察
          }
        });
      }, {
        threshold: 0.15, // 元素出现15%时触发
        rootMargin: '0px 0px -100px 0px' // 在元素进入视口前100px触发
      });
      
      elements.forEach(el => {
        observer.observe(el);
      });
      
      return () => {
        elements.forEach(el => {
          observer.unobserve(el);
        });
      };
    };
    
    // 页面加载后开始观察
    const timeout = setTimeout(animateOnScroll, 800); // 调整延迟，平衡初始动画和滚动动画
    
    return () => {
      clearTimeout(timeout);
    };
  }, []);
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    puaType: [],
    severity: '',
    description: '',
    perpetrator: []
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string | null>(() => {
    // 从localStorage读取令牌
    return localStorage.getItem('userToken');
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'changePassword'>('login');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSubmitMenu, setShowSubmitMenu] = useState(false);
  const [submitMode, setSubmitMode] = useState<'simulation' | 'solution' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);

  // 记忆化选项按钮组件，避免整个表单重新渲染
  const OptionButton = React.memo(({ 
    option, 
    field, 
    isSelected, 
    onClick 
  }: { 
    option: string; 
    field: keyof FormData; 
    isSelected: boolean; 
    onClick: () => void; 
  }) => (
    <button
      type="button"
      data-option={option}
      data-field={field}
      onClick={onClick}
      className={`w-auto px-4 md:w-40 md:px-6 py-3 rounded-full border-2 ${
        isSelected
          ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
          : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-400/10'
      } transition-colors duration-50 text-sm md:text-base font-medium`}
      aria-pressed={isSelected}
    >
      {option}
    </button>
  ), (prevProps, nextProps) => {
    // 只有当选中状态发生变化时才重新渲染
    return prevProps.isSelected === nextProps.isSelected;
  });

  // 在切换页面时清理错误信息
  useEffect(() => {
    setError('');
  }, [showChat, showAuth]);

  // 添加点击外部关闭下拉菜单的功能
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSubmitMenu(false);
      }
    }

    // 添加passive选项，提高性能
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 在获取token后获取用户信息
  useEffect(() => {
    if (token) {
      fetchUserInfo();
      fetchChatHistory();
    }
  }, [token]);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // 修改为被动模式，提高滚动性能
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 页面加载时的动画
  useEffect(() => {
    if (!showChat && !showAuth) {
      // 获取各元素引用
      const nav = navRef.current;
      
      // 设置初始状态
      if (nav) nav.style.opacity = '0';
      
      // 依次执行动画
      setTimeout(() => {
        if (nav) {
          nav.style.opacity = '1';
          nav.style.transform = 'translateY(0)';
        }
      }, 300);
      
      // 不再处理其他元素的初始动画，由滚动动画接管
    }
  }, [showChat, showAuth]);

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/user/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setUserEmail(data.email);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 添加优化后的选项选择函数
  const handleOptionSelect = React.useCallback((field: keyof FormData, value: string) => {
    // 使用RAF (requestAnimationFrame) 延迟状态更新,但提供即时的视觉反馈
    if (field === 'severity' || field === 'perpetrator' || field === 'puaType') {
      // 获取当前按钮元素
      const buttonSelector = `button[data-option="${value}"][data-field="${field}"]`;
      const button = document.querySelector(buttonSelector) as HTMLButtonElement;
      
      if (button) {
        // 立即应用视觉样式变化
        const isCurrentlySelected = field === 'severity' 
          ? formData[field] === value
          : (formData[field] as string[]).includes(value);
        
        // 临时添加/移除选中效果
        if (isCurrentlySelected) {
          button.classList.remove('border-blue-400', 'text-blue-400', 'bg-blue-400/10');
          button.classList.add('border-gray-700', 'text-gray-300');
        } else {
          button.classList.add('border-blue-400', 'text-blue-400', 'bg-blue-400/10');
          button.classList.remove('border-gray-700', 'text-gray-300');
        }
      }
    }
    
    // 然后执行实际的状态更新
    requestAnimationFrame(() => {
      setFormData(prev => {
        if (field === 'severity') {
          // 单选逻辑，如果已选中则清除，否则设置新值
          return {
            ...prev,
            [field]: prev[field] === value ? '' : value
          };
        } else if (field === 'description') {
          // 文本输入逻辑
          return {
            ...prev,
            [field]: value
          };
        } else {
          // 多选逻辑 - 优化数组操作
          const currentValues = prev[field] as string[];
          const isSelected = currentValues.includes(value);
          
          // 直接使用展开操作符添加或使用filter移除，减少操作步骤
          return {
            ...prev,
            [field]: isSelected 
              ? currentValues.filter(v => v !== value)
              : [...currentValues, value]
          };
        }
      });
    });
  }, [formData]);

  // 处理表单描述更新
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    
    // 清空 input 的值，这样同一个文件可以重复选择
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // 释放已删除图片的 URL
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  const handleSelectChat = async (chatId: string) => {
    console.log('选择聊天:', chatId);
    
    // 先从本地chatHistory中查找对话
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (!selectedChat) {
      console.error('在本地找不到对话:', chatId);
      setError('找不到对话记录');
      return;
    }

    // 设置对话模式和ID
    setSubmitMode(selectedChat.type);
    setCurrentChatId(chatId);
    setShowChat(true);
    
    // 直接使用本地的消息记录
    const formattedMessages = selectedChat.messages.map(msg => ({
      id: msg.id || Date.now().toString(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      images: msg.images || []
    }));
    
    console.log('使用本地消息记录:', formattedMessages);
    setCurrentMessages(formattedMessages);
  };

  const handleSendMessage = async (message: string, images?: File[]) => {
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    if (images && images.length > 0) {
      const imagePromises = images.map(async (file) => {
        return new Promise<{ id: string; url: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              url: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      });

      newMessage.images = await Promise.all(imagePromises);
    }
    
    setCurrentMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
    
    try {
      // 确保使用当前对话设置的模式类型
      const currentChat = chatHistory.find(chat => chat.id === currentChatId);
      
      // 如果找到当前对话，使用其类型；否则使用当前设置的submitMode
      // 注意：不会修改submitMode，确保模式在整个对话过程中保持一致
      const mode = currentChat?.type || submitMode;
      
      console.log('发送消息，使用模式:', mode);  // 添加日志
      
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          images: newMessage.images,
          chatId: currentChatId,
          mode: mode  // 始终传递正确的模式
        })
      });
      
      console.log('服务器响应:', response);
      const data = await response.json();
      console.log('解析后的数据:', data);
      
      if (data.status === 'success') {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.advice,
          timestamp: new Date()
        };
        setCurrentMessages(prev => [...prev, assistantMessage]);
        
        // 更新submitMode以匹配服务器返回的模式
        if (data.mode) {
          console.log('服务器返回的模式:', data.mode);
          setSubmitMode(data.mode);
        }
        
        // 更新聊天历史
        setChatHistory(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { 
                ...chat, 
                preview: data.advice, 
                messages: [...chat.messages, newMessage, assistantMessage],
                // 同时更新聊天历史中的类型
                type: data.mode || chat.type
              }
            : chat
        ));
      } else {
        setError(data.message || '发生错误，请稍后重试');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined
      });
      setCurrentMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : '发生错误，请稍后重试',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 获取聊天历史
  const fetchChatHistory = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('获取到的聊天历史:', data);
      
      if (data.status === 'success' && Array.isArray(data.chats)) {
        const formattedHistory = data.chats.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          preview: chat.preview || chat.messages[chat.messages.length - 1]?.content || '',
          timestamp: new Date(chat.timestamp),
          type: chat.type,
          messages: chat.messages || []
        }));
        console.log('格式化后的聊天历史:', formattedHistory);
        setChatHistory(formattedHistory);
      }
    } catch (error) {
      console.error('获取聊天历史失败:', error);
    }
  };

  // 修改创建新对话的代码
  const createNewChat = async (formData: FormData, initialMessage: Message) => {
    try {
      console.log('创建新对话，模式:', formData.mode);  // 更新日志
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: initialMessage.images,
          mode: formData.mode || submitMode,  // 优先使用formData中的mode
          type: formData.mode || submitMode   // 添加type参数
        }),
      });

      console.log('服务器响应:', response);
      const data = await response.json();
      console.log('解析后的数据:', data);
      
      if (data.status === 'success') {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.advice,
          timestamp: new Date()
        };
        setCurrentMessages(prev => [...prev, assistantMessage]);
        
        // 更新submitMode以匹配服务器返回的模式
        if (data.mode) {
          console.log('服务器返回的模式:', data.mode);
          setSubmitMode(data.mode);
        }
        
        // 使用服务器返回的模式创建新聊天
        const actualMode = data.mode || formData.mode || 'solution';
        
        // 添加到聊天历史
        const newChat: ChatHistory = {
          id: data.chatId || Date.now().toString(),  // 优先使用服务器返回的chatId
          title: `${actualMode === 'simulation' ? '场景模拟' : '回复话术'} - ${formData.puaType.join(', ')}`,
          preview: data.advice,
          timestamp: new Date(),
          type: actualMode,  // 使用服务器返回的模式
          messages: [initialMessage, assistantMessage]
        };
        setChatHistory(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
      } else {
        setError(data.message || '发生错误，请稍后重试');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否运行');
    }
  };

  // 更新setToken函数，同时更新localStorage
  const handleSetToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('userToken', newToken);
    } else {
      localStorage.removeItem('userToken');
    }
    setToken(newToken);
  };

  // 激活滚动动画
  useScrollAnimation();

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Message Toast */}
      <div
        className={`fixed top-16 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 transition-all duration-300 ease-in-out transform ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <span className="text-sm font-medium">{successMessage}</span>
      </div>

      {showAuth ? (
        <Auth 
          onSuccess={(token) => {
            handleSetToken(token);
            setShowAuth(false);
            setSuccessMessage('登录成功！');
            setShowSuccessToast(true);
            // 稍后开始淡出
            setTimeout(() => {
              setShowSuccessToast(false);
            }, 2700); 
            // 动画结束后清除消息
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000); 
          }}
          onClose={() => setShowAuth(false)}
          defaultMode={authMode}
          userEmail={userEmail}
          token={token}
        />
      ) : showChat ? (
        <Chat
          onBack={() => setShowChat(false)}
          currentMessages={currentMessages}
          chatHistory={chatHistory}
          onSendMessage={handleSendMessage}
          onSelectChat={handleSelectChat}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          setCurrentMessages={setCurrentMessages}
          setCurrentChatId={setCurrentChatId}
          onNewChat={async (formData) => {
            const initialMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              content: `遭遇类型：${formData.puaType.join(', ')}\n严重程度：${formData.severity}\n施害者：${formData.perpetrator.join(', ')}\n\n${formData.description}`,
              timestamp: new Date(),
              images: uploadedImages.map(img => ({
                id: img.id,
                url: img.preview
              }))
            };
            
            setCurrentMessages([initialMessage]);
            setIsTyping(true);
            
            try {
              await createNewChat(formData, initialMessage);
            } catch (err) {
              setError('网络错误，请检查后端服务是否运行');
            } finally {
              setIsTyping(false);
              // 清理图片预览
              uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
              setUploadedImages([]);
            }
          }}
          submitMode={submitMode}
          currentChatId={currentChatId}
        />
      ) : (
        <>
          {/* Navigation - 灵动岛效果导航栏 */}
          <div 
            ref={navRef}
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
            style={{
              opacity: 0,
              transform: 'translateY(-20px)'
            }}
          >
            <div 
              className={`max-w-5xl mx-auto transition-all duration-300 ease-in-out ${
                scrollY > 100 
                  ? 'mt-2 sm:mt-4 px-2 sm:px-4 rounded-full bg-[#111111]/95 backdrop-blur-lg shadow-lg border border-gray-800/30 animate-nav-glow' 
                  : 'mt-3 sm:mt-6 px-3 sm:px-6'
              }`}
              style={{
                width: scrollY > 100 ? 'calc(100% - 1rem)' : '100%',
                transform: scrollY > 100 ? 'scale(0.95)' : 'scale(1)'
              }}
            >
              <div className="py-2 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Shield className={`${scrollY > 100 ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} text-blue-400 transition-all duration-300`} />
                  <span className={`${scrollY > 100 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-medium transition-all duration-300`}>Happy Work</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 导航按钮也添加滚动动画效果，但每个按钮有不同的延迟 */}
                  <button 
                    className={`hidden md:flex items-center gap-1.5 px-3 ${scrollY > 100 ? 'py-1 text-xs' : 'py-1.5 text-sm'} 
                    bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-medium rounded-full 
                    transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)] hover:shadow-[0_0_15px_rgba(251,191,36,0.7)] 
                    hover:scale-105 group relative overflow-hidden animate-fadeIn animation-delay-300`}
                  >
                    {/* 光效背景 */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_100%]" />
                    </div>
                    <Crown className={`${scrollY > 100 ? 'w-3 h-3' : 'w-4 h-4'} text-amber-800 group-hover:animate-pulse`} />
                    <span className="relative z-10">专属会员服务</span>
                    {/* 移动端显示的简化版本 */}
                  </button>
                  <button 
                    className={`md:hidden flex items-center justify-center ${scrollY > 100 ? 'w-6 h-6' : 'w-7 h-7'} 
                    bg-gradient-to-r from-amber-500 to-yellow-300 text-black rounded-full 
                    transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)] hover:shadow-[0_0_15px_rgba(251,191,36,0.7)] 
                    hover:scale-105`}
                  >
                    <Crown className="w-3 h-3 text-amber-800" />
                  </button>
                  
                  {token ? (
                    <>
                      <button 
                        onClick={() => {
                          if (!userEmail) {
                            setError('正在获取用户信息，请稍后重试');
                            fetchUserInfo(); // 尝试重新获取用户信息
                            return;
                          }
                          setShowAuth(true);
                          setAuthMode('changePassword');
                        }}
                        className={`md:flex hidden items-center gap-1.5 px-2 sm:px-3 ${scrollY > 100 ? 'py-1' : 'py-1.5'} bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-sm animate-fadeIn animation-delay-400`}
                      >
                        <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                        修改密码
                      </button>
                      <button 
                        onClick={() => handleSetToken(null)} 
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 ${scrollY > 100 ? 'py-1' : 'py-1.5'} bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-sm animate-fadeIn animation-delay-500`}
                      >
                        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="md:inline hidden">退出登录</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setShowAuth(true);
                          setAuthMode('login');
                        }} 
                        className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 animate-fadeIn animation-delay-400"
                      >
                        登录
                      </button>
                      <button 
                        onClick={() => {
                          setShowAuth(true);
                          setAuthMode('register');
                        }} 
                        className={`bg-blue-400 text-black ${scrollY > 100 ? 'px-2 sm:px-3 py-1 sm:py-1.5' : 'px-3 sm:px-4 py-1.5 sm:py-2'} rounded-full font-medium hover:bg-blue-300 transition-all duration-300 text-xs sm:text-sm animate-fadeIn animation-delay-500`}
                      >
                        注册
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 健康提示横幅 */}
          <div 
            ref={heroRef}
            className="pt-20 md:pt-28 pb-3 md:pb-4 text-center px-4 scroll-animate"
            style={{ 
              opacity: 0,
              transform: 'translateY(30px)',
              transition: 'all 0.7s ease-out'
            }}
          >
            <div 
              className="inline-flex flex-wrap justify-center sm:flex-nowrap items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 rounded-full border border-blue-400/30 text-gray-300 hover:border-blue-400/50 transition-colors relative overflow-hidden group mt-3 sm:mt-0"
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.3)_50%,transparent_75%)] bg-[length:300%_100%]" />
                <div className="absolute inset-0 animate-shimmer opacity-50 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_50%,transparent_75%)] bg-[length:300%_100%]" />
              </div>
              <span className="relative z-10 text-xs sm:text-sm md:text-base">最新更新：会员付费功能开发中，敬请期待</span>
            </div>
          </div>

          {/* Hero Section */}
          <header className="pt-12 pb-8 px-4 text-center">
            <h1 
              ref={titleRef}
              className="text-4xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-200 to-gray-400 text-transparent bg-clip-text scroll-animate opacity-0 translate-y-[30px] transition-all duration-700 ease-out"
              style={{ 
                transform: 'translateY(30px)'
              }}
            >
              F*ck 职场 PUA.
            </h1>
            <p 
              ref={subtitleRef}
              className="text-lg md:text-2xl text-gray-400 mb-12 scroll-animate opacity-0 translate-y-[30px] transition-all duration-700 ease-out delay-[300ms]"
              style={{ 
                transform: 'translateY(30px)'
              }}
            >
              为职场人提供AI驱动的情绪发泄与解决方案
            </p>
          </header>

          {/* Hero Image */}
          <div className="max-w-5xl mx-auto px-4 mb-12">
            <img 
              ref={heroImageRef}
              src={heroImage}
              alt="hero"
              className="w-full rounded-xl scroll-animate opacity-0 scale-95 translate-y-[30px] transition-all duration-1000 ease-out delay-[400ms]"
              style={{ 
                transform: 'translateY(30px) scale(0.97)'
              }}
            />
          </div>

          {/* 新增：产品核心功能介绍区块 */}
          <div className="max-w-5xl mx-auto px-4 mb-20">
            <div className="text-center mb-10 scroll-animate opacity-0 translate-y-10 transition-all duration-1000 ease-out">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 text-transparent bg-clip-text inline-block">
                核心功能
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-300 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 功能1：PUA场景高度模拟还原 */}
              <div className="relative group scroll-animate opacity-0 translate-x-[-50px] transition-all duration-700 ease-out">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full transform transition-transform group-hover:scale-[1.01] group-hover:border-blue-500/30 overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
                    <Heart className="w-8 h-8 text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-blue-300 mb-4">PUA场景高度模拟还原</h3>
                  
                  <p className="text-gray-400 mb-4">
                    通过您的选择、详细描述（上传图片），高度模拟还原PUA场景，让您在加密、脱敏、匿名的环境中发泄情绪。
                  </p>
                  
                  <ul className="space-y-3 text-gray-400 mb-8">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      适合心存创伤却在现实职场中无力反抗的职场人
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      适合曾经遭遇但已翻篇却希望防范于未然的职场人
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      适合初入职场焦虑害怕又想提前了解职场PUA的新人
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* 功能2：职场PUA现实解决方案 */}
              <div className="relative group scroll-animate opacity-0 translate-x-[50px] transition-all duration-700 ease-out">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full transform transition-transform group-hover:scale-[1.01] group-hover:border-blue-500/30 overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
                    <PlayCircle className="w-8 h-8 text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-blue-300 mb-4">职场PUA现实解决方案</h3>
                  
                  <p className="text-gray-400 mb-4">
                    通过您提供的信息，结合您的情况，给出最符合您切身利益的反PUA解决方案。
                  </p>
                  
                  <ul className="space-y-3 text-gray-400 mb-8">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      基于您的情境给出最适合的应对思路
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      提供专业的话术技巧，助您快速有效回应PUA行为
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      站在您的立场，为您从长远发展上提供最优战略规划
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 专属会员服务板块 - 添加在Marketing Quote Section和Main Chat Interface之间 */}
          <div className="max-w-5xl mx-auto px-4 mb-20">
            <div className="text-center mb-10 scroll-animate opacity-0 translate-y-10 transition-all duration-1000 ease-out">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-transparent bg-clip-text inline-block">
                专属会员服务
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 第一个服务卡片 */}
              <div className="relative group scroll-animate opacity-0 translate-y-[30px] transition-all duration-700 ease-out delay-[200ms]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full transform transition-transform group-hover:scale-[1.01] group-hover:border-amber-500/30 overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
                    <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 3V7C13 8.10457 13.8954 9 15 9H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-amber-300 mb-4">AI证据链整理与匿名邮件举报</h3>
                  
                  <ul className="space-y-3 text-gray-400 mb-8">
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      一键上传截图、邮件、录音、视频等，AI审核与整理
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      快速生成举报邮件内容模版，清晰、准确、有理有据
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      匿名发送邮件至指定邮箱，最大化保护隐私
                    </li>
                  </ul>
                  
                  {/* 移除按钮，改为悬浮提示 */}
                  <div className="text-center text-amber-400/70 text-sm italic">
                    <span className="animate-pulse">✨ 尊享会员专属功能 ✨</span>
                  </div>
                </div>
              </div>
              
              {/* 第二个服务卡片 */}
              <div className="relative group scroll-animate opacity-0 translate-y-[30px] transition-all duration-700 ease-out delay-[400ms]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full transform transition-transform group-hover:scale-[1.01] group-hover:border-amber-500/30 overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
                    <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 10L11 14L9 12M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-amber-300 mb-4">职场黑幕分享与查询平台</h3>
                  
                  <ul className="space-y-3 text-gray-400 mb-8">
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      匿名分享职场PUA行为，无需担心身份泄露
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      AI智能审核内容，确保信息真实、可靠、合规
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      一键查询企业PUA记录，入职前先知先觉
                    </li>
                  </ul>
                  
                  {/* 移除按钮，改为悬浮提示 */}
                  <div className="text-center text-amber-400/70 text-sm italic">
                    <span className="animate-pulse">✨ 尊享会员专属功能 ✨</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 付费服务底部横幅 - 改为主要的查看详情按钮 */}
            <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-amber-500/20 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 scroll-animate opacity-0 scale-95 transition-all duration-700 ease-out delay-[600ms]">
              {/* 增强的背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl -ml-32 -mb-32"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-amber-300">会员专享服务</h3>
                  <p className="text-gray-400 mt-2">尊享高级功能，提升职场竞争力</p>
                </div>
                <button className="w-full md:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-medium hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-105 whitespace-nowrap relative overflow-hidden group">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_100%]"></div>
                  </div>
                  <span className="relative flex items-center justify-center gap-2 text-base">
                    <Crown className="w-5 h-5 text-amber-800" />
                    查看详情
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <main className="max-w-5xl mx-auto px-4 pb-20 -mt-8">
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!token) {
                setAuthMode('login');
                setShowAuth(true);
                return;
              }
              if (!submitMode) {
                setError('请选择提交模式');
                return;
              }
              setShowChat(true);
              setIsTyping(true);

              const initialMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: `遭遇类型：${formData.puaType.join(', ')}\n严重程度：${formData.severity}\n施害者：${formData.perpetrator.join(', ')}\n\n${formData.description}`,
                timestamp: new Date(),
                images: uploadedImages.map(img => ({
                  id: img.id,
                  url: img.preview
                }))
              };
              setCurrentMessages([initialMessage]);

              try {
                await createNewChat(formData, initialMessage);
              } catch (err) {
                setError('网络错误，请检查后端服务是否运行');
              } finally {
                setIsTyping(false);
                // 清理图片预览
                uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
                setUploadedImages([]);
              }
            }} className="space-y-8 scroll-animate opacity-0 translate-y-[30px] transition-all duration-700 ease-out">
              <div className="space-y-6 bg-gray-900/50 p-8 rounded-xl border border-gray-800 text-center">
                {/* 谁PUA你？ - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">谁PUA你？（可多选）</label>
                  <div className="flex flex-wrap justify-center gap-3 md:gap-8">
                    {['上司', '同事', '下属', '客户'].map((option) => (
                      <OptionButton
                        key={option}
                        option={option}
                        field="perpetrator"
                        isSelected={formData.perpetrator.includes(option)}
                        onClick={() => handleOptionSelect('perpetrator', option)}
                      />
                    ))}
                  </div>
                </div>

                {/* PUA类别 - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">PUA类别（可多选）</label>
                  <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                    {['工作成果', '人身攻击', '性骚扰', '生命威胁', '其他(在下面描述中补充)'].map((option) => (
                      <OptionButton
                        key={option}
                        option={option}
                        field="puaType"
                        isSelected={formData.puaType.includes(option)}
                        onClick={() => handleOptionSelect('puaType', option)}
                      />
                    ))}
                  </div>
                </div>

                {/* 创伤程度 - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">创伤程度（单选）</label>
                  <div className="flex flex-wrap justify-center gap-3 md:gap-8">
                    {['轻微', '中等', '严重'].map((option) => (
                      <OptionButton
                        key={option}
                        option={option}
                        field="severity"
                        isSelected={formData.severity === option}
                        onClick={() => handleOptionSelect('severity', option)}
                      />
                    ))}
                  </div>
                </div>

                {/* 输入框 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">详细描述</label>
                  <div className="relative">
                    {uploadedImages.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-3 justify-center">
                        {uploadedImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.preview}
                              alt="上传预览"
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder="👉 请在这里描述您遭遇了什么"
                      className="w-full h-32 p-6 rounded-xl bg-gray-800/50 border border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none text-gray-100 placeholder-gray-400 text-base"
                    />
                    
                    {/* 将按钮移到输入框下方 */}
                    <div className="flex justify-end mt-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        className="bg-gray-600 hover:bg-gray-500 text-white rounded-full p-2.5 transition-colors duration-200"
                        title="查看历史记录"
                      >
                        <History className="w-5 h-5" />
                      </button>
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
                        className="bg-gray-600 hover:bg-gray-500 text-white rounded-full p-2.5 transition-colors duration-200"
                        title="上传图片"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <div className="relative" ref={menuRef}>
                        <button
                          type="button"
                          onClick={() => setShowSubmitMenu(!showSubmitMenu)}
                          disabled={(!formData.description.trim() && uploadedImages.length === 0) || isTyping}
                          className={`bg-blue-400 hover:bg-blue-300 disabled:bg-gray-700 text-black rounded-full p-2.5 transition-all duration-200 relative group ${
                            showSubmitMenu ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''
                          }`}
                        >
                          <MessageSquare className={`w-5 h-5 ${showSubmitMenu ? 'animate-icon-pulse' : ''}`} />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            选择回复模式
                          </span>
                        </button>
                        {showSubmitMenu && (
                          <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden animate-menu-in">
                            <div className="p-2 bg-gray-900/50 border-b border-gray-700">
                              <p className="text-sm text-gray-400 text-center">选择回复模式</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSubmitMenu(false);
                                setSubmitMode('simulation');
                                // 使用setTimeout确保submitMode被设置后再提交
                                setTimeout(() => {
                                  const form = document.querySelector('form');
                                  if (form) {
                                    form.requestSubmit();
                                  }
                                }, 0);
                              }}
                              className="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3 group menu-item-hover"
                            >
                              <PlayCircle className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                              <div>
                                <div className="font-medium">场景模拟</div>
                                <div className="text-sm text-gray-400">体验真实PUA场景</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSubmitMenu(false);
                                setSubmitMode('solution');
                                // 使用setTimeout确保submitMode被设置后再提交
                                setTimeout(() => {
                                  const form = document.querySelector('form');
                                  if (form) {
                                    form.requestSubmit();
                                  }
                                }, 0);
                              }}
                              className="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3 group menu-item-hover"
                            >
                              <MessageCircle className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                              <div>
                                <div className="font-medium">回复话术</div>
                                <div className="text-sm text-gray-400">获取专业应对建议</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Status Message */}
            {isTyping && (
              <div className="mt-6 text-center text-gray-400">
                {(() => {
                  // 优先使用当前聊天历史中的类型
                  const currentChat = currentChatId ? chatHistory.find(chat => chat.id === currentChatId) : null;
                  const chatType = currentChat?.type || submitMode;
                  return chatType === 'solution' ? '正在构思解决方案' : '正在还原PUA对话';
                })()}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 text-center text-red-400">
                {error}
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800 scroll-animate opacity-0 translate-y-[20px] transition-all duration-700 ease-out">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <p className="text-base text-gray-400">
                  本产品不提供法律建议，如果您正在经历严重的心理困扰，请寻求专业帮助。
                </p>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-6 mb-4 scroll-animate opacity-0 transition-all duration-700 ease-out delay-[300ms]">
              <p className="text-sm text-gray-600">© 2025 Happy Work. All rights reserved.</p>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;