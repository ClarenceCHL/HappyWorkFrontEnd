import React, { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';

interface PaymentSuccessProps {
  onContinue: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onContinue }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [countdown, setCountdown] = useState(10); // 倒计时：10秒

  useEffect(() => {
    // 尝试关闭打开支付的窗口（如果是由opener打开的）
    if (window.opener && !window.opener.closed) {
      try {
        // 使用postMessage通知父窗口支付成功
        window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
      } catch (e) {
        console.error('通知父窗口时出错:', e);
      }
    }

    // 支付成功页面加载时验证支付状态
    verifyPayment();
    
    // 启动倒计时，10秒后自动关闭当前标签页并回到原页面
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // 自动关闭当前标签页
          if (verificationComplete) {
            window.close();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [verificationComplete]);

  // 验证支付状态的函数
  const verifyPayment = async () => {
    try {
      setIsVerifying(true);
      // 从URL获取会话ID，如果有的话
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        console.log('验证支付会话ID:', sessionId);
      }
      
      // 从localStorage获取token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('未找到用户token，无法验证支付状态');
        setIsVerifying(false);
        return;
      }
      
      // 调用API验证支付状态
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.is_paid) {
        console.log('支付验证成功，用户已付费');
        setVerificationComplete(true);
        
        // 通知全局状态已支付(自动调用onContinue)
        // 如果是在独立窗口中，则尝试关闭此窗口
        if (window.opener) {
          try {
            // 通过postMessage发送支付成功消息给父窗口
            window.opener.postMessage({ type: 'PAYMENT_COMPLETED' }, '*');
            // 1.5秒后关闭此窗口
            setTimeout(() => {
              window.close();
            }, 1500);
          } catch (e) {
            console.error('无法关闭支付窗口:', e);
            // 如果无法关闭，则回调onContinue
            setTimeout(() => {
              onContinue();
            }, 1500);
          }
        } else {
          // 正常流程：不是在新窗口打开的情况
          setTimeout(() => {
            onContinue();
          }, 1500);
        }
      } else if (verificationAttempts < 3) {
        // 如果验证不成功且尝试次数少于3次，5秒后重试
        console.log(`支付验证未成功，${5}秒后重试...`);
        setVerificationAttempts(prev => prev + 1);
        setTimeout(verifyPayment, 5000);
      } else {
        // 达到最大尝试次数，但仍然允许用户继续
        console.log('支付验证多次尝试未成功，但仍允许用户继续');
        setVerificationComplete(true);
      }
    } catch (error) {
      console.error('验证支付时出错:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // 手动继续并关闭当前窗口
  const handleContinue = () => {
    // 如果是独立窗口，则先通知父窗口然后关闭自己
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'PAYMENT_COMPLETED' }, '*');
        window.close();
      } catch (e) {
        console.error('无法与父窗口通信:', e);
      }
    }
    // 无论如何都调用onContinue
    onContinue();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-700/50">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">支付成功！</h1>
        
        <p className="text-gray-300 mb-4">
          您的支付已成功处理。{verificationComplete ? '现在可以继续使用我们的服务了。' : '正在验证支付状态...'}
        </p>
        
        {verificationComplete && window.opener && (
          <p className="text-yellow-400 mb-6">
            此页面将在 {countdown} 秒后自动关闭并回到应用...
          </p>
        )}
        
        <button
          onClick={handleContinue}
          disabled={isVerifying}
          className={`w-full ${isVerifying ? 'bg-gray-600' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center`}
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              验证支付状态...
            </>
          ) : (
            '继续前往问卷'
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 