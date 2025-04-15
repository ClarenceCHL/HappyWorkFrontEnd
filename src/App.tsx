import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Shield, AlertTriangle, History, Image as ImageIcon, X, PlayCircle, MessageCircle, LogOut, Key } from 'lucide-react';
import { Auth } from './components/Auth';
import { Features } from './components/Features';
import { Chat } from './components/Chat';
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
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: Array<{
    id: string;
    url: string;
  }>;
}

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
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'changePassword'>('login');
  const [showFeatures, setShowFeatures] = useState(false);
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

  // 在切换页面时清理错误信息
  useEffect(() => {
    setError('');
  }, [showChat, showAuth, showFeatures]);

  // 添加点击外部关闭下拉菜单的功能
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSubmitMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
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
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 页面加载时的动画
  useEffect(() => {
    if (!showChat && !showAuth && !showFeatures) {
      // 获取各元素引用
      const nav = navRef.current;
      const hero = heroRef.current;
      const title = titleRef.current;
      const subtitle = subtitleRef.current;
      const heroImage = heroImageRef.current;
      
      // 设置初始状态
      if (nav) nav.style.opacity = '0';
      if (title) title.style.opacity = '0';
      if (subtitle) subtitle.style.opacity = '0';
      if (heroImage) heroImage.style.opacity = '0';
      
      // 依次执行动画
      setTimeout(() => {
        if (nav) {
          nav.style.opacity = '1';
          nav.style.transform = 'translateY(0)';
        }
      }, 300);
      
      setTimeout(() => {
        if (hero) {
          hero.style.opacity = '1';
          hero.style.transform = 'translateY(0)';
        }
      }, 600);
      
      setTimeout(() => {
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 900);
      
      setTimeout(() => {
        if (subtitle) {
          subtitle.style.opacity = '1';
          subtitle.style.transform = 'translateY(0)';
        }
      }, 1200);
      
      setTimeout(() => {
        if (heroImage) {
          heroImage.style.opacity = '1';
          heroImage.style.transform = 'translateY(0) scale(1)';
        }
      }, 1500);
    }
  }, [showChat, showAuth, showFeatures]);

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8000/user/info', {
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

  const handleOptionSelect = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      if (field === 'severity') {
        // 单选逻辑
        return {
          ...prev,
          [field]: value
        };
      } else if (field === 'description') {
        // 文本输入逻辑
        return {
          ...prev,
          [field]: value
        };
      } else {
        // 多选逻辑
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
      
      const response = await fetch('http://localhost:8000/chat/message', {
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
        
        // 更新聊天历史
        setChatHistory(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, preview: data.advice, messages: [...chat.messages, newMessage, assistantMessage] }
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
      const response = await fetch('http://localhost:8000/chat/history', {
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
      console.log('创建新对话，模式:', submitMode);  // 添加日志
      const response = await fetch('http://localhost:8000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: initialMessage.images,
          mode: submitMode,  // 确保mode参数被正确传递
          type: submitMode   // 添加type参数
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
        
        // 添加到聊天历史
        const newChat: ChatHistory = {
          id: Date.now().toString(),
          title: `${submitMode === 'simulation' ? '场景模拟' : '回复话术'} - ${formData.puaType.join(', ')}`,
          preview: data.advice,
          timestamp: new Date(),
          type: submitMode || 'solution',  // 保存对话类型
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
            setToken(token);
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
      ) : showFeatures ? (
        <Features onBack={() => setShowFeatures(false)} />
      ) : showChat ? (
        <Chat
          onBack={() => setShowChat(false)}
          currentMessages={currentMessages}
          chatHistory={chatHistory}
          onSendMessage={handleSendMessage}
          onSelectChat={handleSelectChat}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
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
                        className={`md:flex hidden items-center gap-1.5 px-2 sm:px-3 ${scrollY > 100 ? 'py-1' : 'py-1.5'} bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-sm`}
                      >
                        <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                        修改密码
                      </button>
                      <button 
                        onClick={() => setToken(null)} 
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 ${scrollY > 100 ? 'py-1' : 'py-1.5'} bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-sm`}
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
                        className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 transition-colors px-2 py-1"
                      >
                        登录
                      </button>
                      <button 
                        onClick={() => {
                          setShowAuth(true);
                          setAuthMode('register');
                        }} 
                        className={`bg-blue-400 text-black ${scrollY > 100 ? 'px-2 sm:px-3 py-1 sm:py-1.5' : 'px-3 sm:px-4 py-1.5 sm:py-2'} rounded-full font-medium hover:bg-blue-300 transition-all duration-300 text-xs sm:text-sm`}
                      >
                        注册
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Update Banner - 添加动画和移动端适配 */}
          <div 
            ref={heroRef}
            className="pt-20 md:pt-28 pb-3 md:pb-4 text-center px-4"
            style={{ 
              opacity: 0,
              transform: 'translateY(30px)',
              transition: 'all 0.7s ease-out',
              transitionDelay: '0.6s'
            }}
          >
            <button 
              onClick={() => setShowFeatures(true)}
              className="inline-flex flex-wrap justify-center sm:flex-nowrap items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 rounded-full border border-blue-400/30 text-gray-300 hover:border-blue-400/50 transition-colors relative overflow-hidden group mt-3 sm:mt-0"
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.3)_50%,transparent_75%)] bg-[length:300%_100%]" />
                <div className="absolute inset-0 animate-shimmer opacity-50 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_50%,transparent_75%)] bg-[length:300%_100%]" />
              </div>
              <span className="relative z-10 text-xs sm:text-sm md:text-base">匿名隐私，保驾护航，拒绝服从性测试</span>
              <span className="relative z-10 text-blue-400 text-xs sm:text-sm md:text-base whitespace-nowrap ml-1">了解更多 →</span>
            </button>
          </div>

          {/* Hero Section - 添加移动端适配 */}
          <header className="pt-12 pb-8 px-4 text-center">
            <h1 
              ref={titleRef}
              className="text-4xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-200 to-gray-400 text-transparent bg-clip-text transition-all duration-700 ease-out"
              style={{ 
                opacity: 0,
                transform: 'translateY(30px)'
              }}
            >
              F*ck 职场 PUA.
            </h1>
            <p 
              ref={subtitleRef}
              className="text-lg md:text-2xl text-gray-400 mb-12 transition-all duration-700 ease-out"
              style={{ 
                opacity: 0,
                transform: 'translateY(30px)'
              }}
            >
              为职场人提供AI驱动的情绪发泄与解决方案
            </p>
          </header>

          {/* Hero Image - 添加移动端适配 */}
          <div className="max-w-5xl mx-auto px-4 mb-12">
            <img 
              ref={heroImageRef}
              src={heroImage}
              alt="hero"
              className="w-full rounded-xl transition-all duration-1000 ease-out"
              style={{ 
                opacity: 0, 
                transform: 'translateY(30px) scale(0.97)'
              }}
            />
          </div>

          {/* Marketing Quote Section - 移动端适配 */}
          <div className="max-w-5xl mx-auto px-4 mb-20">
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-2xl p-4 md:p-8 backdrop-blur-sm border border-gray-800 relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.05)_50%,transparent_75%)] bg-[length:300%_100%]" />
              </div>
              <div className="space-y-8 md:space-y-12 relative">
                {/* 对话部分 - 适配移动端 */}
                <div className="space-y-6">
                  <div className="flex items-start gap-3 md:gap-4 opacity-0 animate-fade-slide-in message-bubble pua group" style={{ animationDelay: '0.2s' }}>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center avatar">
                      <span className="text-gray-400 text-xs md:text-sm">旁人</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-800/50 rounded-2xl rounded-tl-none p-3 md:p-4 text-gray-300 shadow-lg relative">
                        <div className="absolute inset-0 rounded-2xl rounded-tl-none bg-gradient-to-r from-gray-400/0 via-gray-400/5 to-gray-400/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative text-sm md:text-base">
                          事情已经过去了，你为什么还揪着不放呢？
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 justify-end opacity-0 animate-fade-slide-in message-bubble victim group" style={{ animationDelay: '1.2s' }}>
                    <div className="flex-1">
                      <div className="bg-blue-500/10 rounded-2xl rounded-tr-none p-4 text-gray-200 leading-relaxed shadow-lg relative">
                        <div className="absolute inset-0 rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <p className="mb-2">有些事情对别人来说是过去了，对我来说却没有，</p>
                          <p className="mb-2">因为受委屈的是我，而不是其他人。</p>
                          <p className="text-blue-400 font-medium">除了我自己能谈原谅二字，谁也不能劝我大度。</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex-shrink-0 flex items-center justify-center avatar animate-pulse-glow">
                      <span className="text-blue-400 text-sm">我</span>
                    </div>
                  </div>
                </div>

                {/* 对话网格 */}
                <div className="dialogue-grid" style={{ animationDelay: '2s' }}>
                  {/* 左侧对话组 */}
                  <div className="space-y-6">
                    <div className="opacity-0 animate-slide-from-left" style={{ animationDelay: '2.4s' }}>
                      <div className="flex items-start gap-4 message-bubble pua group">
                        <div className="w-8 h-8 rounded-full bg-red-900/30 border border-red-500/30 flex-shrink-0 flex items-center justify-center avatar">
                          <span className="text-red-400 text-sm">PUA</span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-red-500/5 rounded-2xl rounded-tl-none p-4 text-gray-300 shadow-lg border border-red-500/10 relative">
                            <div className="absolute inset-0 rounded-2xl rounded-tl-none bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative">
                              你是不是太敏感了？我只是开个玩笑，怎么这么认真？
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="opacity-0 animate-slide-from-right" style={{ animationDelay: '2.8s' }}>
                      <div className="flex items-start gap-4 justify-end message-bubble victim group">
                        <div className="flex-1">
                          <div className="bg-blue-500/10 rounded-2xl rounded-tr-none p-4 text-gray-200 relative">
                            <div className="absolute inset-0 rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative">
                              我觉得你说的话让我很不舒服。
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex-shrink-0 flex items-center justify-center avatar animate-pulse-glow">
                          <span className="text-blue-400 text-sm">我</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右侧对话组 */}
                  <div className="space-y-6">
                    <div className="opacity-0 animate-slide-from-left" style={{ animationDelay: '3.2s' }}>
                      <div className="flex items-start gap-4 message-bubble pua group">
                        <div className="w-8 h-8 rounded-full bg-red-900/30 border border-red-500/30 flex-shrink-0 flex items-center justify-center avatar">
                          <span className="text-red-400 text-sm">PUA</span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-red-500/5 rounded-2xl rounded-tl-none p-4 text-gray-300 shadow-lg border border-red-500/10 relative">
                            <div className="absolute inset-0 rounded-2xl rounded-tl-none bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative">
                              你怎么这么玻璃心？我都没觉得有什么问题。
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="opacity-0 animate-slide-from-right" style={{ animationDelay: '3.6s' }}>
                      <div className="flex items-start gap-4 justify-end message-bubble victim group">
                        <div className="flex-1">
                          <div className="bg-blue-500/10 rounded-2xl rounded-tr-none p-4 text-gray-200 relative">
                            <div className="absolute inset-0 rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative">
                              你昨天说的话让我很难过。
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex-shrink-0 flex items-center justify-center avatar animate-pulse-glow">
                          <span className="text-blue-400 text-sm">我</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 最后一组对话 - 强调部分 */}
                <div className="space-y-6 opacity-0 animate-scale-in" style={{ animationDelay: '4s' }}>
                  <div className="flex items-start gap-4 message-bubble pua group">
                    <div className="w-8 h-8 rounded-full bg-red-900/30 border border-red-500/30 flex-shrink-0 flex items-center justify-center avatar">
                      <span className="text-red-400 text-sm">PUA</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-red-500/5 rounded-2xl rounded-tl-none p-4 text-gray-300 shadow-lg border border-red-500/10 relative">
                        <div className="absolute inset-0 rounded-2xl rounded-tl-none bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <p>我这么做都是为了你好，你应该感激我。</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 justify-end message-bubble victim group">
                    <div className="flex-1">
                      <div className="bg-blue-500/10 rounded-2xl rounded-tr-none p-4 text-gray-200 leading-relaxed relative">
                        <div className="absolute inset-0 rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <p className="text-blue-400 font-medium">我并不觉得这样做对我有帮助。</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex-shrink-0 flex items-center justify-center avatar animate-pulse-glow">
                      <span className="text-blue-400 text-sm">我</span>
                    </div>
                  </div>
                </div>

                {/* 标语 */}
                <div className="text-center pt-8 opacity-0 animate-fade-slide-in" style={{ animationDelay: '4.5s' }}>
                  <p className="text-lg text-blue-400 font-medium mb-2 hover:scale-105 transition-transform">在这里，你的每一个感受都值得被倾听</p>
                  <p className="text-sm text-gray-400">不要让任何人否定你的情感</p>
                  <div className="mt-4 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot-1"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot-2"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot-3"></span>
                  </div>
                </div>
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
                setSubmitMode(null);
              }
            }} className="space-y-8">
              <div className="space-y-6 bg-gray-900/50 p-8 rounded-xl border border-gray-800 text-center">
                {/* 谁PUA你？ - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">谁PUA你？（可多选）</label>
                  <div className="flex flex-wrap justify-center gap-3 md:gap-8">
                    {['上司', '同事', '下属', '客户'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect('perpetrator', option)}
                        className={`w-auto px-4 md:w-40 md:px-6 py-3 rounded-full border-2 ${
                          formData.perpetrator.includes(option)
                            ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
                            : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-400/10'
                        } transition-all duration-200 text-sm md:text-base font-medium`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PUA类别 - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">PUA类别（可多选）</label>
                  <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                    {['工作成果', '人身攻击', '性骚扰', '生命威胁', '其他(在下面描述中补充)'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect('puaType', option)}
                        className={`w-auto px-4 md:w-40 md:px-6 py-3 rounded-full border-2 ${
                          formData.puaType.includes(option)
                            ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
                            : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-400/10'
                        } transition-all duration-200 text-sm md:text-base font-medium`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 创伤程度 - 移动端适配 */}
                <div className="space-y-3">
                  <label className="block text-lg font-medium text-gray-200">创伤程度（单选）</label>
                  <div className="flex flex-wrap justify-center gap-3 md:gap-8">
                    {['轻微', '中等', '严重'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect('severity', option)}
                        className={`w-auto px-4 md:w-40 md:px-6 py-3 rounded-full border-2 ${
                          formData.severity === option
                            ? 'border-blue-400 text-blue-400 bg-blue-400/10' 
                            : 'border-gray-700 text-gray-300 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-400/10'
                        } transition-all duration-200 text-sm md:text-base font-medium`}
                      >
                        {option}
                      </button>
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
                      placeholder="请详细描述或上传图片，告诉我您遭遇了什么，您不值得被这样对待"
                      className="w-full h-32 p-6 rounded-xl bg-gray-800/50 border border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none text-gray-100 placeholder-gray-500 text-base"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        className="bg-gray-600 hover:bg-gray-500 text-white rounded-full p-3 transition-colors duration-200"
                        title="查看历史记录"
                      >
                        <History className="w-6 h-6" />
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
                        className="bg-gray-600 hover:bg-gray-500 text-white rounded-full p-3 transition-colors duration-200"
                        title="上传图片"
                      >
                        <ImageIcon className="w-6 h-6" />
                      </button>
                      <div className="relative" ref={menuRef}>
                        <button
                          type="button"
                          onClick={() => setShowSubmitMenu(!showSubmitMenu)}
                          disabled={(!formData.description.trim() && uploadedImages.length === 0) || isTyping}
                          className={`bg-blue-400 hover:bg-blue-300 disabled:bg-gray-700 text-black rounded-full p-3 transition-all duration-200 relative group ${
                            showSubmitMenu ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''
                          }`}
                        >
                          <MessageSquare className={`w-6 h-6 ${showSubmitMenu ? 'animate-icon-pulse' : ''}`} />
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
            <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <p className="text-base text-gray-400">
                  本工具不提供法律建议，但提供基于心理分析的职场沟通策略。如果您正在经历严重的心理困扰，请寻求专业帮助。
                </p>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-6 mb-4">
              <p className="text-sm text-gray-600">© 2025 Happy Work. All rights reserved.</p>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;