import React, { useState } from 'react';
import { X, ShieldAlert, FileText, Bot, Gift, Loader2, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Stripe公钥：从环境变量获取
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY';
const stripePromise = loadStripe(STRIPE_KEY);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => void; // 保留以防未来使用
  onFreeAccess: () => Promise<void>; // 改为返回 Promise
  onManualCheck: () => Promise<void>; // 新增：手动检查支付状态的回调
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPay, onFreeAccess, onManualCheck }) => {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isFreeAccessLoading, setIsFreeAccessLoading] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false); // 新增：检查支付状态的加载状态
  const [stripeLinkOpened, setStripeLinkOpened] = useState(false); // 新增：跟踪Stripe链接是否已打开

  if (!isOpen) return null;

  // 处理Stripe支付
  const handleStripeCheckout = async () => {
    try {
      setIsPaymentLoading(true);
      console.log('准备直接跳转到Stripe支付页面...');
      const stripeCheckoutUrl = import.meta.env.VITE_STRIPE_PAYMENT_LINK || "https://buy.stripe.com/14kaGL2LZ2vC2RyfYY";
      console.log('跳转到Stripe支付页面:', stripeCheckoutUrl);
      window.open(stripeCheckoutUrl, '_blank', 'noopener,noreferrer');

      // 不再自动关闭，而是标记链接已打开，并停止初始加载状态
      setStripeLinkOpened(true);
      setIsPaymentLoading(false);
      // 可选：给用户提示
      // alert("支付页面已在新标签页打开。完成支付后，请返回此页面点击 '我已完成支付' 按钮。");

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
      await onFreeAccess(); // 等待父组件处理完成
      // 成功后，父组件会关闭模态框
    } catch (error) {
      // 如果父组件的 onFreeAccess 抛出错误，这里可以处理
      console.error("处理免费访问时出错:", error);
    } finally {
      setIsFreeAccessLoading(false);
    }
  };

  // 新增：处理手动检查支付按钮点击
  const handleManualCheck = async () => {
    setIsCheckingPayment(true);
    try {
      await onManualCheck(); // 调用父组件传递的检查函数
      // 如果支付成功，父组件应该会关闭模态框
      // 如果支付未成功，保持模态框打开，并停止加载状态
    } catch (error) {
      console.error("手动检查支付状态时出错:", error);
      alert("检查支付状态失败，请稍后再试。");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // 重置状态以便下次打开模态框时是初始状态
  const handleCloseAndReset = () => {
    setStripeLinkOpened(false);
    setIsPaymentLoading(false);
    setIsFreeAccessLoading(false);
    setIsCheckingPayment(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-xl shadow-2xl w-full max-w-lg border border-gray-700/50 relative overflow-hidden animate-fade-in-up">
        {/* Close Button - 使用 handleCloseAndReset */} 
        <button
          onClick={handleCloseAndReset}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-200 transition-colors z-10"
          aria-label="关闭支付窗口"
          disabled={isPaymentLoading || isFreeAccessLoading || isCheckingPayment}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */} 
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-amber-300">支付流程说明</h2>

          {/* Payment/Check Buttons Section */} 
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            {!stripeLinkOpened ? (
              // --- 初始状态：显示支付和免费按钮 --- 
              <>
                {/* Payment Button */}
                <button
                  onClick={handleStripeCheckout}
                  disabled={isPaymentLoading || isFreeAccessLoading}
                  className={`w-full sm:w-auto ${isPaymentLoading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${!isPaymentLoading && !isFreeAccessLoading && 'hover:scale-105'} shadow-md`}
                  title="通过信用卡或微信支付"
                >
                  {isPaymentLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      正在准备...
                    </>
                  ) : (
                    <span>信用卡/微信支付</span>
                  )}
                </button>
                
                {/* Limited Time Free Button */}
                <button
                  onClick={handleFreeAccess}
                  disabled={isPaymentLoading || isFreeAccessLoading}
                  className={`w-full sm:w-auto ${isFreeAccessLoading ? 'bg-green-800 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${!isPaymentLoading && !isFreeAccessLoading && 'hover:shadow-lg hover:scale-105'}`}
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
              </>
            ) : (
              // --- Stripe 链接已打开：显示手动检查按钮 --- 
              <button
                onClick={handleManualCheck}
                disabled={isCheckingPayment}
                className={`w-full sm:w-auto ${isCheckingPayment ? 'bg-yellow-700 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'} text-black font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 shadow-md ${!isCheckingPayment && 'hover:scale-105'}`}
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    正在检查状态...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>我已完成支付</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {stripeLinkOpened && (
             <p className="text-xs text-yellow-400 text-center mb-6">
               支付页面已在另一标签页打开。如果您已完成支付，请点击上方按钮检查状态。
             </p>
          )}

          {/* Informational Steps (No changes needed here) */}
          <div className="space-y-5 text-gray-300">
             <p className="text-center text-sm">支付或免费激活后，我们将引导您完成后续步骤：</p>
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

          <p className="text-xs text-gray-500 text-center mt-6">
            选择一种方式继续。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 