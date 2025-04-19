import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface PaymentSuccessProps {
  onContinue: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onContinue }) => {
  useEffect(() => {
    // 可选：在这里调用API验证支付状态
    const verifyPayment = async () => {
      try {
        // 从URL获取用户ID，如果有的话
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user_id');
        
        if (userId) {
          // 可以在这里进行额外的验证
          console.log('验证用户ID:', userId);
        }
      } catch (error) {
        console.error('验证支付时出错:', error);
      }
    };
    
    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-700/50">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">支付成功！</h1>
        
        <p className="text-gray-300 mb-8">
          您的支付已成功处理。现在可以继续使用我们的服务了。
        </p>
        
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          继续前往问卷
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 