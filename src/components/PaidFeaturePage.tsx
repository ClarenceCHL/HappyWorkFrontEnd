import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, FileText, BrainCircuit, BarChart, Crown, Mail, Download, RefreshCw, Edit3 } from 'lucide-react';
import PaymentModal from './PaymentModal';

// 临时的 API URL 和 Token 获取方式，后续应替换为实际实现
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; 
// 修改 localStorage 的键名以匹配 App.tsx
const getToken = () => localStorage.getItem('userToken');

// 定义 App.tsx 中的 PageType 类型，确保一致
type PageType = 'home' | 'chat' | 'auth' | 'paidFeature';

interface PaidFeaturePageProps {
  onClose: () => void;
  // 修改 onLoginRequired 的类型，使其接受 PageType 参数
  onLoginRequired: (returnTo: PageType) => void;
  isUserPaid: boolean;
  hasUserPDF: boolean;
  onPaymentSuccess: () => void;
  onNavigateToQuestionnaire: () => void; // 新增：用于导航到问卷页面的回调
}

const PaidFeaturePage: React.FC<PaidFeaturePageProps> = ({ onClose, onLoginRequired, isUserPaid, hasUserPDF, onPaymentSuccess, onNavigateToQuestionnaire }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePayment = () => {
    // 新增：检查用户是否登录
    const token = getToken();
    if (!token) {
      // 调用登录回调，并指定返回目标为 'paidFeature'
      onLoginRequired('paidFeature'); 
      handleClosePaymentModal(); // 关闭支付弹窗
      return; // 阻止后续支付逻辑
    }

    // 原有支付逻辑 (当前是打开 PayPal 链接)
    const paypalMeLink = "https://www.paypal.com/paypalme/HappyWorkFkPUA";
    window.open(paypalMeLink, '_blank'); // 在新标签页打开支付链接
    // Consider closing the modal after opening the link, or providing user feedback
    // handleClosePaymentModal(); 
    // alert("正在打开 PayPal 支付页面...");
  };

  const handleFreeAccess = async () => {
    console.log("处理限时免费访问...");
    const token = getToken();

    if (!token) {
      // 调用登录回调，并指定返回目标为 'paidFeature'
      onLoginRequired('paidFeature'); 
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/activate-free-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}) // POST 请求通常需要 body，即使是空的
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        console.log("免费访问激活成功:", result.message);
        // 关闭模态框
        handleClosePaymentModal();
        
        // !!! 调用回调函数通知 App 更新状态 !!!
        onPaymentSuccess(); 

        // 显示成功提示
        setSuccessMessage('限时免费访问成功！即将进入下一步...');
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 2700);
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error("免费访问激活失败:", result.message);
        alert(`激活失败: ${result.message || '请稍后再试'}`);
      }
    } catch (error) {
      console.error("调用免费访问 API 时出错:", error);
      alert("请求失败，请检查网络连接或稍后再试。");
    }
  };

  const handleDownloadReport = async () => {
    console.log("触发下载/预览报告逻辑");
    const token = getToken();

    if (!token) {
      onLoginRequired('paidFeature'); 
      return;
    }

    try {
      // 首先获取用户提交的最新问卷
      const response = await fetch(`${API_BASE_URL}/user/questionnaires`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取问卷列表失败');
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        alert(`错误: ${data.message}`);
        return;
      }

      if (!data.questionnaires || data.questionnaires.length === 0) {
        alert('您还没有提交问卷，请先完成问卷');
        onNavigateToQuestionnaire(); // 跳转到问卷页面
        return;
      }

      // 获取最新的问卷报告
      const latestQuestionnaire = data.questionnaires[0];
      
      if (!latestQuestionnaire.has_report) {
        alert('您的报告还在生成中，请稍后再试');
        return;
      }

      const previewLink = latestQuestionnaire.preview_link;
      
      // 在当前页面跳转到预览页面，而不是新开标签页
      if (previewLink) {
        window.location.href = `${API_BASE_URL}${previewLink}`;
      } else {
        alert('预览链接不可用，请重新生成报告');
      }
    } catch (error) {
      console.error('获取报告失败:', error);
      alert('获取报告失败，请稍后再试');
    }
  };

  const handleGenerateAgain = () => {
    console.log("触发另外生成逻辑");
    // alert("重新生成功能需要引导用户返回问卷，正在开发中...");
    onNavigateToQuestionnaire(); // 跳转到问卷页面
  };

  const handleGenerateReport = () => {
    console.log("触发生成报告逻辑");
    // alert("生成报告功能需要引导用户完成问卷，正在开发中...");
    onNavigateToQuestionnaire(); // 跳转到问卷页面
    // 可能需要导航到问卷页面
  };

  return (
    <>
      <div
        className={`fixed top-16 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 transition-all duration-300 ease-in-out transform ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <span className="text-sm font-medium">{successMessage}</span>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#111111] text-gray-100 p-6 md:p-10 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] opacity-40 translate-x-1/3 translate-y-1/3"></div>

        {/* Back Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 md:top-10 md:left-10 z-20 flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">返回主页</span>
        </button>

        <div className="max-w-4xl mx-auto relative z-10 pt-16 md:pt-20">
          {/* Header */}
          <header className="text-center mb-12 md:mb-16 animate-fade-in-down">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-300 to-yellow-500 text-transparent bg-clip-text inline-block">
              职场定制化人设破局战略
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              只有贴合个人痛点的定制化职场人设，才能精准破解PUA困境，从容突围。
            </p>
          </header>

          {/* Core Selling Points */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10 text-amber-400 animate-fade-in animation-delay-200">三大核心价值</h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Point 1: AI Risk Scan */}
              <div className="bg-gray-900/50 p-6 rounded-xl border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up animation-delay-300">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-amber-300">AI 风险扫描</h3>
                <p className="text-gray-400 text-sm text-center">
                  AI 全面梳理您的心理痛点与被 PUA 风险，让您先知先觉，未雨绸缪。
                </p>
              </div>

              {/* Point 2: Customized PDF */}
              <div className="bg-gray-900/50 p-6 rounded-xl border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up animation-delay-400">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-amber-300">定制化人设经营方案</h3>
                <p className="text-gray-400 text-sm text-center">
                  专属《人设战略破局职场PUA》PDF，涵盖符合您实际情况的人设建立与运营策略、情境话术及破局练习，直击痛点，实操落地。
                </p>
              </div>

              {/* Point 3: Expert Wisdom */}
              <div className="bg-gray-900/50 p-6 rounded-xl border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up animation-delay-500">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-amber-300">高人智慧融会贯通</h3>
                <p className="text-gray-400 text-sm text-center">
                  学习以大佬的视角去说话、做事、立边界，快速提升职场竞争力，拒绝成为职场炮灰。
                </p>
              </div>
            </div>
          </section>

          {/* Scenario Examples / User Benefits */}
          <section className="mb-12 md:mb-16 animate-fade-in animation-delay-600">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10 text-blue-400">你将能够：</h2>
            <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl border border-blue-500/20 backdrop-blur-sm">
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <BarChart className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <span>当上司吃里扒外、用话术打压你时，你能<strong className="text-blue-300 font-semibold">当场拆招</strong>；</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <span>在团队协作、争取资源时，你能<strong className="text-blue-300 font-semibold">自信表达、赢得支持</strong>；</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <span>面对无理要求、加班暗示，你敢于<strong className="text-blue-300 font-semibold">设立清晰边界</strong>。</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 条件渲染 CTA 区域 */}
          {isUserPaid ? (
            hasUserPDF ? (
              // --- 已付费且已有 PDF 用户视图 ---
              <section className="flex flex-col items-center justify-center gap-4 mb-12 md:mb-16 animate-fade-in-up animation-delay-700">
                <h2 className="text-2xl font-semibold text-center text-amber-300 mb-4">
                  您已开通专属服务
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                  {/* 预览/下载按钮 */}
                  <button
                    onClick={handleDownloadReport}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-base hover:shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-300 hover:scale-105 relative overflow-hidden group flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5 group-hover:animate-bounce" />
                    预览/下载我的《人设战略破局职场PUA》
                  </button>
                  {/* 另外生成按钮 */}
                  <button
                    onClick={handleGenerateAgain}
                    className="w-full px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold text-base transition-all duration-300 hover:scale-105 relative flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    另外生成
                  </button>
                </div>
              </section>
            ) : (
              // --- 已付费但无 PDF 用户视图 ---
              <section className="flex flex-col items-center justify-center gap-4 mb-12 md:mb-16 animate-fade-in-up animation-delay-700">
                 <h2 className="text-2xl font-semibold text-center text-amber-300 mb-4">
                  您已开通专属服务
                </h2>
                <button
                  onClick={handleGenerateReport}
                  className="w-full max-w-md px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-base hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300 hover:scale-105 relative overflow-hidden group flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  生成属于我的《人设战略破局职场PUA》
                </button>
                 <p className="text-sm text-gray-400 mt-2">（需先完成一份匿名问卷）</p>
              </section>
            )
          ) : (
            // --- 未付费用户视图 (原始逻辑) ---
            <section className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-4 mb-12 md:mb-16 animate-fade-in-up animation-delay-700">
              {/* Price Box */}
              <div className="bg-gradient-to-r from-amber-500 to-yellow-300 p-1 rounded-lg shadow-lg relative group/price">
                <div className="bg-[#1a1a1a] px-6 py-4 rounded-md relative">
                  <p className="text-lg font-medium text-amber-300 mb-1">一次付费，永久下载</p>
                  <p className="text-4xl md:text-5xl font-bold text-white relative">
                    ¥20
                    <span 
                      className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 transform -translate-y-1/2 scale-x-0 group-hover/cta:scale-x-100 transition-transform duration-300 origin-left"
                      aria-hidden="true"
                    ></span>
                  </p>
                </div>
              </div>
              {/* CTA Button */}
              <button
                onClick={handleOpenPaymentModal}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-105 relative overflow-hidden group/cta"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 animate-shine bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_100%]" />
                </div>
                <span className="relative flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-amber-800" />
                  限时免费！<span className="line-through opacity-70">立即购买</span>
                </span>
              </button>
            </section>
          )}

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm animate-fade-in animation-delay-800 pb-6">
            <p className="mb-2">感谢信任 · 如有问题可发邮件至客服：</p>
            <a href="mailto:happyworkfkpua@gmail.com" className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-amber-300 transition-colors">
              <Mail className="w-4 h-4" />
              happyworkfkpua@gmail.com
            </a>
          </footer>
        </div>
      </div>

      {/* Payment Modal (仅在未付费时需要打开) */}
      {!isUserPaid && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          onPay={handlePayment}
          onFreeAccess={handleFreeAccess}
        />
      )}

      {/* Add CSS for modal animations (if not already globally defined) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-700 { animation-delay: 0.7s; }
        .animation-delay-800 { animation-delay: 0.8s; }

        /* Ensure elements are hidden before animation starts */
        .animate-fade-in, .animate-fade-in-down, .animate-fade-in-up {
          opacity: 0;
        }

        @keyframes shine {
          0% { background-position: -250% center; }
          100% { background-position: 250% center; }
        }
        .animate-shine {
          animation: shine 1.5s linear infinite;
        }
      `}} />
    </>
  );
};

export default PaidFeaturePage; 