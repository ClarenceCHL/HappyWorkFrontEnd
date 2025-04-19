import React, { useState } from 'react';
import { X, ShieldAlert, FileText, Bot, Gift, Loader2, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Stripe公钥：从环境变量获取
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY';
const stripePromise = loadStripe(STRIPE_KEY);

// 获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// 获取token
const getToken = () => localStorage.getItem('token');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => void; // 请保留，但我们会覆盖该功能
  onFreeAccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPay, onFreeAccess }) => {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isFreeAccessLoading, setIsFreeAccessLoading] = useState(false);
  const [showPaymentCompleteButton, setShowPaymentCompleteButton] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  if (!isOpen) return null;

  // 处理Stripe支付
  const handleStripeCheckout = async () => {
    try {
      setIsPaymentLoading(true);
      console.log('准备直接跳转到Stripe支付页面...');
      // 从环境变量获取支付链接
      const stripeCheckoutUrl = import.meta.env.VITE_STRIPE_PAYMENT_LINK || "https://buy.stripe.com/14kaGL2LZ2vC2RyfYY";
      console.log('跳转到Stripe支付页面:', stripeCheckoutUrl);
      // 修改为在新窗口打开，确保在移动设备上也有相同的行为
      window.open(stripeCheckoutUrl, '_blank', 'noopener,noreferrer');
      
      // 不再自动关闭模态框，而是显示"已完成支付"按钮
      setIsPaymentLoading(false);
      setShowPaymentCompleteButton(true);
    } catch (error: any) {
      console.error('支付过程中出错:', error);
      alert(`支付过程中出错: ${error.message || '未知错误'}`);
      setIsPaymentLoading(false);
    }
  };

  // 处理免费访问，添加加载状态
  const handleFreeAccess = async () => {
    setIsFreeAccessLoading(true);
    try {
      await onFreeAccess();
    } finally {
      // 无论是否成功，重置加载状态
      // onFreeAccess内部会关闭模态框，所以这里不需要额外处理
      setIsFreeAccessLoading(false);
    }
  };

  // 新增：处理"已完成支付"按钮点击
  const handlePaymentComplete = async () => {
    const token = getToken();
    if (!token) {
      alert('请先登录');
      return;
    }

    setIsCheckingPayment(true);
    
    try {
      console.log("手动检查支付状态...");
      
      const response = await fetch(`${API_BASE_URL}/api/check-payment-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.is_paid) {
        console.log("支付成功，更新状态");
        // 调用传入的onPay回调，该回调会触发App组件更新用户支付状态
        onPay();
        // 关闭模态框
        onClose();
      } else {
        alert('您的支付尚未确认，请稍后再试或刷新页面');
      }
    } catch (error) {
      console.error("检查支付状态出错:", error);
      alert('检查支付状态失败，请刷新页面后重试');
    } finally {
      setIsCheckingPayment(false);
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
          disabled={isPaymentLoading || isFreeAccessLoading || isCheckingPayment}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-amber-300">支付流程说明</h2>

          {!showPaymentCompleteButton ? (
            <>
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
                  disabled={isPaymentLoading || isFreeAccessLoading}
                  className={`w-full sm:w-auto ${isPaymentLoading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${!isPaymentLoading && 'hover:scale-105'} shadow-md`}
                  title="通过信用卡或微信支付"
                >
                  {isPaymentLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      正在跳转支付...
                    </>
                  ) : (
                    <span>信用卡/微信支付</span>
                  )}
                </button>
                
                {/* Limited Time Free Button */}
                <button
                  onClick={handleFreeAccess}
                  disabled={isPaymentLoading || isFreeAccessLoading}
                  className={`w-full sm:w-auto ${isFreeAccessLoading ? 'bg-green-800' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${!isFreeAccessLoading && 'hover:shadow-lg hover:scale-105'}`}
                >
                  {isFreeAccessLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      <span>限时免费</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                选择一种方式继续。
              </p>
            </>
          ) : (
            <>
              {/* 支付完成后的提示和按钮 */}
              <div className="text-center mb-8">
                <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 mb-6">
                  <p className="text-amber-300 mb-4 font-semibold">支付页面已在新窗口打开</p>
                  <p className="text-gray-300 mb-1">完成支付后，请点击下方的按钮确认：</p>
                  <p className="text-gray-400 text-sm">系统将检查您的支付状态并更新您的账户</p>
                </div>
                <button
                  onClick={handlePaymentComplete}
                  disabled={isCheckingPayment}
                  className={`w-full px-6 py-4 ${isCheckingPayment ? 'bg-green-800' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white font-bold rounded-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-md mx-auto ${!isCheckingPayment && 'hover:shadow-lg hover:scale-105'}`}
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在验证支付...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      我已完成支付
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  如果您还未完成支付，可以关闭此窗口继续支付
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 