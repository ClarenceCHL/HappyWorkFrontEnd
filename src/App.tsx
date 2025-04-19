import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Shield, AlertTriangle, History, Image as ImageIcon, X, PlayCircle, MessageCircle, LogOut, Key, Crown, Heart } from 'lucide-react';
import { Auth } from './components/Auth';
import { Chat, Message as ChatMessage } from './components/Chat';
import PaidFeaturePage from './components/PaidFeaturePage';
import QuestionnairePage from './components/QuestionnairePage';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
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

// 定义页面类型
type PageType = 'home' | 'chat' | 'auth' | 'paidFeature' | 'questionnaire' | 'paymentSuccess' | 'paymentCancel';

// 定义认证模式类型 (AuthMode)
type AuthMode = 'login' | 'register' | 'changePassword';

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
  const [isUserPaid, setIsUserPaid] = useState<boolean>(false);
  const [hasUserPDF, setHasUserPDF] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'changePassword'>('login');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSubmitMenu, setShowSubmitMenu] = useState(false);
  const [submitMode, setSubmitMode] = useState<'simulation' | 'solution' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPaidFeaturePage, setShowPaidFeaturePage] = useState(false);
  const [showQuestionnairePage, setShowQuestionnairePage] = useState(false);
  const [loginRedirectTarget, setLoginRedirectTarget] = useState<string | null>(null);
  const [loginReturnTarget, setLoginReturnTarget] = useState<PageType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const memberSectionRef = useRef<HTMLDivElement>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<boolean>(false);
  const [showPaymentCancel, setShowPaymentCancel] = useState<boolean>(false);

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
  }, [showChat, showAuth, showPaidFeaturePage, showQuestionnairePage]);

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

  // 在获取token后获取用户信息（包括 is_paid 和 has_pdf）
  useEffect(() => {
    if (token) {
      fetchUserInfo();
      fetchChatHistory();
    } else {
      // 如果没有 token（用户未登录或已登出），重置状态
      setIsUserPaid(false);
      setHasUserPDF(false);
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

  // 处理浏览器返回按钮
  useEffect(() => {
    // 监听返回按钮
    const handlePopState = () => {
      // 强制重置页面状态
      setShowChat(false);
      setShowAuth(false);
      setShowPaidFeaturePage(false);
      setShowQuestionnairePage(false);
      
      // 强制页面重新渲染主要内容
      const mainSection = document.querySelector('main');
      if (mainSection) {
        // 触发重绘
        mainSection.style.display = 'none';
        setTimeout(() => {
          mainSection.style.display = 'block';
        }, 10);
      }
      
      // 重置滚动位置
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 处理页面初始加载和切换
  useEffect(() => {
    if (!showChat && !showAuth && !showPaidFeaturePage && !showQuestionnairePage) {
      // 确保主页内容在返回时可见
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.display = 'block';
      }
      
      // 刷新页面动画
      const nav = navRef.current;
      if (nav) {
        nav.style.opacity = '1';
        nav.style.transform = 'translateY(0)';
      }
    }
  }, [showChat, showAuth, showPaidFeaturePage, showQuestionnairePage]);

  // 在应用加载时处理从登录页刷新的情况
  useEffect(() => {
    // 检查是否是通过强制刷新解决UI问题
    if (localStorage.getItem('force_reload_fix') === 'true') {
      // 清除标志
      localStorage.removeItem('force_reload_fix');
      
      // 检查是否有登录成功的标志
      if (localStorage.getItem('login_success') === 'true') {
        localStorage.removeItem('login_success');
        
        // 显示登录成功消息
        setSuccessMessage('登录成功！');
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 2700);
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
      
      // 强制重绘主页内容
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // 确保元素可见
        mainElement.style.display = 'block';
        mainElement.style.visibility = 'visible';
        mainElement.style.opacity = '1';
        
        // 触发重绘
        document.body.classList.add('force-visible');
      }
    }
  }, []);

  // 获取用户信息 (更新)
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
        setIsUserPaid(data.is_paid);
        setHasUserPDF(data.has_pdf);
      } else {
        // 获取失败或 token 失效等情况，重置状态
        setUserEmail(null);
        setIsUserPaid(false);
        setHasUserPDF(false);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setUserEmail(null);
      setIsUserPaid(false);
      setHasUserPDF(false);
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

  // 更新 setToken 函数，登出时重置 isUserPaid 和 hasUserPDF
  const handleSetToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('userToken', newToken);
    } else {
      localStorage.removeItem('userToken');
      setIsUserPaid(false);
      setHasUserPDF(false);
      setUserEmail(null);
    }
    setToken(newToken);
  };

  // 将滚动动画逻辑移入 App 组件
  useEffect(() => {
    // 仅当显示主页时才设置滚动动画
    if (!showChat && !showAuth && !showPaidFeaturePage && !showQuestionnairePage) {
      const elements = document.querySelectorAll('.scroll-animate');
      
      // 重置动画状态，以便返回时能重新播放
      elements.forEach(el => {
        el.classList.remove('animate-in'); 
        // 可能需要根据你的 CSS 重置其他样式，例如 opacity 和 transform
        (el as HTMLElement).style.opacity = '0'; 
        // 你可能需要更具体的 transform 重置，取决于你的 .scroll-animate 初始样式
        // (el as HTMLElement).style.transform = 'translateY(30px)'; 
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // 保持观察，允许动画在滚动时重复触发，或者根据需要取消观察
            // observer.unobserve(entry.target); 
          }
        });
      }, {
        threshold: 0.1, // 稍微降低阈值，确保更容易触发
        rootMargin: '0px 0px -50px 0px' // 调整 rootMargin
      });
      
      elements.forEach(el => {
        observer.observe(el);
      });
      
      // 清理函数：当组件卸载或依赖项变化时停止观察
      return () => {
        elements.forEach(el => {
          observer.unobserve(el);
        });
        observer.disconnect(); // 确保完全断开观察器
      };
    }
    // 当页面状态变化时（切换到/离开主页），重新运行此 effect
  }, [showChat, showAuth, showPaidFeaturePage, showQuestionnairePage]); 

  // 添加平滑滚动到会员服务区域的函数
  const scrollToMemberSection = () => {
    if (memberSectionRef.current) {
      // 获取目标元素的位置
      const elementPosition = memberSectionRef.current.getBoundingClientRect().top;
      // 当前滚动位置
      const offsetPosition = elementPosition + window.pageYOffset;
      // 添加偏移量(导航栏高度 + 额外空间)
      const offset = 80; // 根据导航栏实际高度调整
      
      // 使用window.scrollTo代替scrollIntoView，提供更精确的控制
      window.scrollTo({
        top: offsetPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  // 添加处理主页面元素可见性的效果
  useEffect(() => {
    if (!showChat && !showAuth && !showPaidFeaturePage && !showQuestionnairePage) {
      // 这是主页状态，确保所有元素可见
      // 给页面添加loaded类，用于CSS控制可见性
      document.body.classList.add('home-loaded');
      
      // 添加用户交互监听
      const handleUserInteraction = () => {
        document.body.classList.add('user-interacted');
      };
      
      // 监听用户交互
      window.addEventListener('click', handleUserInteraction);
      window.addEventListener('scroll', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);
      
      return () => {
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('scroll', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };
    } else {
      // 非主页状态，移除类
      document.body.classList.remove('home-loaded');
    }
  }, [showChat, showAuth, showPaidFeaturePage, showQuestionnairePage]);

  // 新增：处理支付成功的回调函数
  const handlePaymentSuccess = () => {
    console.log("App: Payment successful, updating UI state.");
    setIsUserPaid(true);
    // 可选：如果支付成功意味着 PDF 肯定还没生成，也可以在这里重置
    // setHasUserPDF(false); 
  };

  // --- 身份验证相关处理 ---
  const handleAuthSuccess = (email: string, newToken: string, message: string) => {
    // 1. 更新 Token (会同步更新 localStorage)
    handleSetToken(newToken);
    setUserEmail(email);
    setShowAuth(false); // 关闭认证模态框

    // 2. 显示成功消息
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2700);
    setTimeout(() => setSuccessMessage(''), 3000);

    // 3. 导航到目标页面
    if (loginReturnTarget === 'paidFeature') {
      setShowPaidFeaturePage(true); // 明确显示付费页面
      setShowChat(false);
      setShowQuestionnairePage(false);
    } else {
      // 默认行为或处理其他可能的 returnTarget
      // 当前默认留在主页，关闭其他页面
      setShowPaidFeaturePage(false);
      setShowChat(false);
      setShowQuestionnairePage(false);
    }
    setLoginReturnTarget(null); // 清除返回目标
    window.scrollTo(0, 0); // 滚动到顶部

    // 4. 刷新用户信息和聊天记录 (异步)
    fetchUserInfo();
    fetchChatHistory();
  };

  const handleLogout = () => {
    handleSetToken(null); // 清除 token 和相关状态
    setCurrentMessages([]);
    setChatHistory([]);
    setShowChat(false);
    setShowAuth(false);
    setShowPaidFeaturePage(false);
    setShowQuestionnairePage(false);
    setLoginReturnTarget(null);
    console.log("用户已登出");
    setSuccessMessage('您已成功登出。');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2700);
    setTimeout(() => setSuccessMessage(''), 3000);
    window.scrollTo(0, 0);
  };

  const handleAuthClose = () => {
    setShowAuth(false);
    // 如果是从特定页面要求登录后关闭了登录框，则返回该页面
    if (loginReturnTarget === 'paidFeature') {
      setShowPaidFeaturePage(true);
      // 确保其他页面关闭
      setShowChat(false);
      setShowQuestionnairePage(false);
    } else {
      // 否则，默认返回主页 (确保其他页面关闭)
      setShowPaidFeaturePage(false);
      setShowChat(false);
      setShowQuestionnairePage(false);
    }
    setLoginReturnTarget(null); // 清除返回目标
    window.scrollTo(0, 0);
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'changePassword', returnTo?: PageType) => {
    setAuthMode(mode);
    setLoginReturnTarget(returnTo || null); // 设置返回目标
    // 关闭所有其他页面，显示认证页面
    setShowChat(false); 
    setShowPaidFeaturePage(false);
    setShowQuestionnairePage(false);
    setShowAuth(true);
    window.scrollTo(0, 0);
  };

  // --- 页面导航 --- 
  const handleNavigateToPaidFeature = () => {
    if (!token) {
      handleOpenAuth('login', 'paidFeature'); 
    } else {
      setShowPaidFeaturePage(true);
      setShowChat(false);
      setShowAuth(false);
      setShowQuestionnairePage(false);
      window.scrollTo(0, 0);
    }
  };

  // 4. 实现导航到问卷页面的函数
  const handleNavigateToQuestionnaire = () => {
    setShowQuestionnairePage(true);
    setShowPaidFeaturePage(false);
    setShowChat(false);
    setShowAuth(false);
    window.scrollTo(0, 0);
  };

  // 5. 实现从问卷页面返回的函数
  const handleQuestionnaireBack = () => {
    setShowQuestionnairePage(false);
    setShowPaidFeaturePage(true);
    window.scrollTo(0, 0);
  };

  // 6. 实现处理问卷提交的函数 (Placeholder)
  const handleQuestionnaireSubmit = (answers: any) => {
    console.log("问卷已提交，答案:", answers);
    // TODO: 在这里添加调用后端 API 生成报告的逻辑
    // 假设 API 调用成功后...
    setHasUserPDF(true); // 更新状态，表示用户现在有 PDF 了
    setShowQuestionnairePage(false);
    setShowPaidFeaturePage(true);
    // 显示成功消息
    setSuccessMessage('报告生成请求已提交！请稍后在付费页面查看。');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    setTimeout(() => setSuccessMessage(''), 3300);
  };

  // 修改 PaidFeaturePage 的 onLoginRequired 回调
  const handleLoginRequiredForPaidFeature = (returnTo: PageType) => {
    // 这个函数在 PaidFeaturePage 中被调用
    handleOpenAuth('login', returnTo); 
  };

  // 检查URL路径，处理支付回调
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    if (currentPath === '/payment-success') {
      setShowPaymentSuccess(true);
      // 隐藏其他页面
      setShowChat(false);
      setShowAuth(false);
      setShowPaidFeaturePage(false);
      setShowQuestionnairePage(false);
    } else if (currentPath === '/payment-cancel') {
      setShowPaymentCancel(true);
      // 隐藏其他页面
      setShowChat(false);
      setShowAuth(false);
      setShowPaidFeaturePage(false);
      setShowQuestionnairePage(false);
    }
  }, []);
  
  // 处理支付成功后的操作
  const handlePaymentSuccessContinue = () => {
    // 刷新用户信息，更新支付状态
    fetchUserInfo();
    
    // 关闭支付成功页面，前往问卷页面
    setShowPaymentSuccess(false);
    setShowQuestionnairePage(true);
    
    // 更新浏览器历史记录，不改变URL
    window.history.pushState(null, '', '/');
  };
  
  // 处理支付取消后的操作
  const handlePaymentRetry = () => {
    // 关闭支付取消页面，重新打开付费功能页面
    setShowPaymentCancel(false);
    setShowPaidFeaturePage(true);
    
    // 更新浏览器历史记录，不改变URL
    window.history.pushState(null, '', '/');
  };
  
  const handlePaymentBack = () => {
    // 关闭支付取消页面，返回首页
    setShowPaymentCancel(false);
    
    // 更新浏览器历史记录，不改变URL
    window.history.pushState(null, '', '/');
  };

  return (
    <div 
      className="min-h-screen bg-[#111111] text-gray-100"
    >
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

      {showQuestionnairePage ? (
        <QuestionnairePage 
          onBack={handleQuestionnaireBack}
          onSubmit={handleQuestionnaireSubmit}
        />
      ) : showPaidFeaturePage ? (
        <PaidFeaturePage 
          onClose={() => {
            setShowPaidFeaturePage(false);
            // 返回主页，确保其他页面关闭
            setShowChat(false);
            setShowAuth(false);
            setShowQuestionnairePage(false);
          }}
          onLoginRequired={handleLoginRequiredForPaidFeature}
          isUserPaid={isUserPaid}
          hasUserPDF={hasUserPDF}
          onPaymentSuccess={handlePaymentSuccess}
          onNavigateToQuestionnaire={handleNavigateToQuestionnaire}
        />
      ) : showAuth ? (
        <Auth 
          mode={authMode} 
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          onSwitchMode={(newMode: AuthMode) => setAuthMode(newMode)}
        />
      ) : showChat ? (
        <Chat
          onBack={() => {
            setShowChat(false);
            window.scrollTo(0, scrollY);
          }}
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
                  {/* 付费功能按钮 (根据 isUserPaid 修改文本) */}
                  <button 
                    onClick={scrollToMemberSection}
                    className={`hidden md:flex items-center gap-1.5 px-3 ${scrollY > 100 ? 'py-1 text-xs' : 'py-1.5 text-sm'} 
                    bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-medium rounded-full 
                    transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)] hover:shadow-[0_0_15px_rgba(251,191,36,0.7)] 
                    hover:scale-105 group relative overflow-hidden animate-fadeIn animation-delay-300`}
                  >
                    {/* 光效背景 */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_100%]"></div>
                    </div>
                    <Crown className={`${scrollY > 100 ? 'w-3 h-3' : 'w-4 h-4'} text-amber-800 group-hover:animate-pulse`} />
                    {/* 条件渲染文本 */}
                    <span className="relative z-10">{isUserPaid ? '已开通专属付费功能' : '专属付费功能'}</span>
                  </button>
                  {/* 移动端简化按钮 */}
                  <button 
                    onClick={scrollToMemberSection}
                    className={`md:hidden flex items-center justify-center ${scrollY > 100 ? 'w-6 h-6' : 'w-7 h-7'} 
                    bg-gradient-to-r from-amber-500 to-yellow-300 text-black rounded-full 
                    transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)] hover:shadow-[0_0_15px_rgba(251,191,36,0.7)] 
                    hover:scale-105`}
                    title={isUserPaid ? '已开通专属付费功能' : '专属付费功能'}
                  >
                    <Crown className="w-3 h-3 text-amber-800" />
                  </button>
                  
                  {token ? (
                    <>
                      <button 
                        onClick={() => {
                          if (!userEmail) {
                            setError('正在获取用户信息，请稍后重试');
                            fetchUserInfo();
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

          {/* 提示横幅 */}
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
              <span className="relative z-10 text-xs sm:text-sm md:text-base">UPDATE: 专属付费功能限时免费中</span>
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
              AI驱动的职场PUA解决方案
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
              {/* 功能1：模拟场景发泄 */}
              <div className="relative group scroll-animate opacity-0 translate-x-[-50px] transition-all duration-700 ease-out">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full transform transition-transform group-hover:scale-[1.01] group-hover:border-blue-500/30 overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
                    <Heart className="w-8 h-8 text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-blue-300 mb-4">模拟场景发泄</h3>
                  
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
              
              {/* 功能2：当下场景解决 */}
              <div className="relative group scroll-animate opacity-0 translate-x-[50px] transition-all duration-700 ease-out">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full transform transition-transform group-hover:scale-[1.01] group-hover:border-blue-500/30 overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
                    <PlayCircle className="w-8 h-8 text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-blue-300 mb-4">当下场景解决</h3>
                  
                  <p className="text-gray-400 mb-4">
                    根据您正在面对的职场PUA，给出最符合您切身利益的当下场景解决方案。
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
                      为您从长远发展上提供战略建议
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 专属付费功能板块 - 添加在Marketing Quote Section和Main Chat Interface之间 */}
          <div ref={memberSectionRef} className="max-w-5xl mx-auto px-4 mb-20">
            <div className="text-center mb-10 scroll-animate opacity-0 translate-y-10 transition-all duration-1000 ease-out">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-transparent bg-clip-text inline-block">
                专属付费功能
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid">
              {/* 会员服务卡片 */}
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
                  
                  <h3 className="text-xl md:text-2xl font-bold text-amber-300 mb-4">人设经营，高人智慧，战略破局</h3>
                  
                  <ul className="space-y-3 text-gray-400 mb-8">
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      根据您正在经历的职场困扰，AI梳理PUA风险与心理痛点
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      定制化《人设战略破局职场PUA》PDF方案，包含符合您实际情况的人设策略、情境话术、破局练习
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-400 mr-2">✓</span>
                      学习用高人的智慧去说话、做事、立边界，拒绝成为职场炮灰
                    </li>
                  </ul>
                  
                  {/* 移除按钮，改为悬浮提示 */}
                  <div className="text-center text-amber-400/70 text-sm italic">
                    <span className="animate-pulse">✨ 一次付费，永久下载 ✨</span>
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
                  <h3 className="text-xl font-bold text-amber-300">专享定制化服务</h3>
                  <p className="text-gray-400 mt-2">提升职场竞争力</p>
                </div>
                <button 
                  onClick={() => {
                    setShowPaidFeaturePage(true);
                    window.scrollTo(0, 0);
                  }}
                  className="w-full md:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-medium hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-105 whitespace-nowrap relative overflow-hidden group">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_100%]"></div>
                  </div>
                  <span className="relative flex items-center justify-center gap-2 text-base">
                    <Crown className="w-5 h-5 text-amber-800" />
                    {/* 条件渲染按钮文本 */} 
                    {isUserPaid ? '查看我的方案' : '查看详情'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Marketing Quote Section - PUA话术展示 */}
          <div className="max-w-5xl mx-auto px-4 mb-20">
            <div className="text-center mb-10 scroll-animate opacity-0 translate-y-10 transition-all duration-1000 ease-out">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-300 to-red-500 text-transparent bg-clip-text inline-block">
                听起来熟悉吗？
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-400 to-red-300 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* PUA话术卡片 */}
              <div className="relative group scroll-animate opacity-0 translate-y-[20px] transition-all duration-700 ease-out delay-[200ms]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full flex items-center transform transition-transform group-hover:scale-[1.01] group-hover:border-red-500/30">
                  <div className="text-2xl text-gray-400 font-serif mr-4 opacity-50">"</div>
                  <p className="text-xl text-red-200 italic">我当初就是顶着压力招了你，现在让我怎么向上面交代？</p>
                </div>
              </div>
              
              <div className="relative group scroll-animate opacity-0 translate-y-[20px] transition-all duration-700 ease-out delay-[300ms]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full flex items-center transform transition-transform group-hover:scale-[1.01] group-hover:border-red-500/30">
                  <div className="text-2xl text-gray-400 font-serif mr-4 opacity-50">"</div>
                  <p className="text-xl text-red-200 italic">你是不是不太适合职场？</p>
                </div>
              </div>
              
              <div className="relative group scroll-animate opacity-0 translate-y-[20px] transition-all duration-700 ease-out delay-[400ms]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full flex items-center transform transition-transform group-hover:scale-[1.01] group-hover:border-red-500/30">
                  <div className="text-2xl text-gray-400 font-serif mr-4 opacity-50">"</div>
                  <p className="text-xl text-red-200 italic">我本来是很看好你的。</p>
                </div>
              </div>
              
              <div className="relative group scroll-animate opacity-0 translate-y-[20px] transition-all duration-700 ease-out delay-[500ms]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full flex items-center transform transition-transform group-hover:scale-[1.01] group-hover:border-red-500/30">
                  <div className="text-2xl text-gray-400 font-serif mr-4 opacity-50">"</div>
                  <p className="text-xl text-red-200 italic">我对你是有些失望的，当初给你定级是高于你面试时的水平。</p>
                </div>
              </div>
              
              <div className="relative group scroll-animate opacity-0 translate-y-[20px] transition-all duration-700 ease-out delay-[600ms] md:col-span-2 mx-auto max-w-lg">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 h-full flex items-center transform transition-transform group-hover:scale-[1.01] group-hover:border-red-500/30">
                  <div className="text-2xl text-gray-400 font-serif mr-4 opacity-50">"</div>
                  <p className="text-xl text-red-200 italic">我都是为了你好才跟你说这些。</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <main 
            className={`max-w-5xl mx-auto px-4 pb-20 -mt-8 ${!showChat && !showAuth && !showPaidFeaturePage && !showQuestionnairePage ? 'main-content-visible' : 'main-content-hidden'}`}
          >
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!token) {
                setAuthMode('login');
                setShowAuth(true);
                window.history.pushState({page: 'auth'}, '', '#auth');
                return;
              }
              if (!submitMode) {
                setError('请选择提交模式');
                return;
              }
              setShowChat(true);
              window.history.pushState({page: 'chat'}, '', '#chat');
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
      
      {showPaymentSuccess && (
        <PaymentSuccess onContinue={handlePaymentSuccessContinue} />
      )}
      
      {showPaymentCancel && (
        <PaymentCancel 
          onRetry={handlePaymentRetry}
          onBack={handlePaymentBack}
        />
      )}
    </div>
  );
}

export default App;