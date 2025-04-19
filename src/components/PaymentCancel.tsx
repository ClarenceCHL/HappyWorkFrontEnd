import React from 'react';
import { XCircle } from 'lucide-react';

interface PaymentCancelProps {
  onRetry: () => void;
  onBack: () => void;
}

const PaymentCancel: React.FC<PaymentCancelProps> = ({ onRetry, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-700/50">
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-amber-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">支付已取消</h1>
        
        <p className="text-gray-300 mb-8">
          您的支付过程已取消。如需继续，可以重新尝试支付流程。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:scale-105"
          >
            重新支付
          </button>
          
          <button
            onClick={onBack}
            className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:scale-105"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 