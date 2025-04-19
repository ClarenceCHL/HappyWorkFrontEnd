import React from 'react';
import { X, ShieldAlert, FileText, Bot, Gift } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Stripe公钥：从环境变量获取
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY';
const stripePromise = loadStripe(STRIPE_KEY);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => void; // 请保留，但我们会覆盖该功能
  onFreeAccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPay, onFreeAccess }) => {
  if (!isOpen) return null;

  // 处理Stripe支付
  const handleStripeCheckout = async () => {
    try {
      console.log('开始创建Stripe支付会话...');
      // 调用后端API创建支付会话
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 根据需要传递产品信息，例如：
          productName: '人设战略破局职场PUA方案',
          amount: 4900, // 单位：分，49元
        }),
      });
      
      console.log('收到服务器响应:', response.status, response.statusText);
      
      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      // 检查响应内容是否为空
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('服务器返回了空响应');
      }
      
      // 尝试解析JSON
      let session;
      try {
        session = JSON.parse(responseText);
      } catch (error: any) {
        console.error('JSON解析失败:', error, '原始响应:', responseText);
        throw new Error(`无法解析服务器响应: ${error.message}`);
      }
      
      console.log('解析响应数据:', session);
      
      // 如果创建会话成功，重定向到Stripe Checkout页面
      if (session.url) {
        console.log('准备跳转到支付页面:', session.url);
        // 尝试使用window.open而不是location.href
        window.open(session.url, '_self');
      } else {
        console.error('支付会话响应中没有URL字段:', session);
        throw new Error(session.message || '支付会话创建失败');
      }
    } catch (error: any) {
      console.error('支付过程中出错:', error);
      alert(`支付过程中出错: ${error.message || '未知错误'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-xl shadow-2xl w-full max-w-lg border border-gray-700/50 relative overflow-hidden animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-200 transition-colors z-10"
          aria-label="关闭支付窗口"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-amber-300">支付流程说明</h2>

          <div className="space-y-5 text-gray-300 mb-8">
            <p className="text-center text-sm">请放心，支付完成后，我们将引导您完成后续步骤：</p>
            <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 mt-1">
                1
              </div>
              <div>
                <h3 className="font-semibold text-blue-300 mb-1">匿名问卷调研</h3>
                <p className="text-sm text-gray-400">
                  回答一份约20题的匿名问卷，深入了解您的职场痛点与期望 (预计 5-10 分钟)。
                </p>
              </div>
            </div>
             <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-300 mt-1">
                 2
               </div>
               <div>
                <h3 className="font-semibold text-green-300 mb-1">AI 定制方案生成</h3>
                <p className="text-sm text-gray-400">
                  AI 将基于您的问卷反馈，为您量身定制专属《人设战略破局职场PUA》PDF 方案，供您永久预览与下载。
                </p>
              </div>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {/* Payment Button */}
            <button
              onClick={handleStripeCheckout}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-300 shadow-md hover:scale-105"
              title="通过信用卡或微信支付"
            >
              <span>信用卡/微信支付</span>
            </button>
            
            {/* Limited Time Free Button */}
            <button
              onClick={onFreeAccess}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
            >
              <Gift className="w-5 h-5" />
              <span>限时免费</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            选择一种方式继续。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 