import React from 'react';
import { Heart, PlayCircle, ArrowLeft } from 'lucide-react';

interface FeaturesProps {
  onBack: () => void;
}

export const Features: React.FC<FeaturesProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 py-8 md:py-16 px-4">
      {/* 返回按钮 - 移动端适配 */}
      <button
        onClick={onBack}
        className="fixed top-4 md:top-6 left-4 md:left-6 px-3 md:px-4 py-1.5 md:py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-full 
        text-gray-400 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-400/10
        flex items-center gap-1 md:gap-2.5 transition-all duration-300 group shadow-lg z-50"
      >
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:-translate-x-1" />
        <span className="font-medium text-sm md:text-base">返回主页</span>
      </button>

      {/* 标题 - 移动端适配 */}
      <div className="max-w-4xl mx-auto text-center mb-8 md:mb-16 mt-12 md:mt-0 opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-gray-200 to-gray-400 text-transparent bg-clip-text relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine-slow"></div>
          产品介绍
        </h1>
        <p className="text-base md:text-xl text-gray-400">
          AI大模型驱动的职场PUA情绪发泄与解决方案咨询平台
        </p>
      </div>

      {/* 功能卡片 - 移动端适配 */}
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-12">
        {/* 功能1：PUA场景高度模拟还原供您发泄情绪 */}
        <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-800 transform hover:scale-[1.01] md:hover:scale-[1.02] hover:border-blue-400/30 transition-all duration-300 opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            <div className="bg-blue-400/10 p-3 md:p-4 rounded-lg md:rounded-xl group mx-auto md:mx-0 mb-3 md:mb-0">
              <Heart className="w-6 h-6 md:w-8 md:h-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 bg-gradient-to-r from-gray-200 to-gray-400 text-transparent bg-clip-text text-center md:text-left">PUA场景高度模拟还原供您发泄情绪</h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Happy Work通过读取您的选项、详细描述、以及上传图片，高度模拟还原PUA场景，让您在加密、脱敏、匿名的环境中发泄情绪。无论您是心存创伤在现实职场中无力反抗，还是曾经遭遇但已翻篇却希望未来能防范于未然，还是初入职场焦虑害怕又希望提前了解职场PUA，您所需要的价值Happy Work都能提供。
              </p>
            </div>
          </div>
        </div>

        {/* 功能2：职场PUA现实解决方案 */}
        <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-800 transform hover:scale-[1.01] md:hover:scale-[1.02] hover:border-blue-400/30 transition-all duration-300 opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            <div className="bg-blue-400/10 p-3 md:p-4 rounded-lg md:rounded-xl group mx-auto md:mx-0 mb-3 md:mb-0">
              <PlayCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 bg-gradient-to-r from-gray-200 to-gray-400 text-transparent bg-clip-text text-center md:text-left">职场PUA现实解决方案</h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Happy Work通过读取您提供的所有信息，结合您的具体情况、真实背景，给出最符合您当下利益的回复PUA施害者话术建议。请相信Happy Work永远会站在您的立场为您提供最优解。
              </p>
            </div>
          </div>
        </div>

        {/* 总结 */}
        <div className="bg-blue-400/10 rounded-xl md:rounded-2xl p-4 md:p-8 text-center transform hover:scale-[1.01] md:hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-slide-in relative overflow-hidden group" style={{ animationDelay: '0.8s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine-slow"></div>
          <p className="text-gray-300 text-sm md:text-base relative">
            职场PUA受害者会被长期压力影响免疫系统和大脑功能，导致焦虑和抑郁。
          </p>
        </div>
      </div>
    </div>
  );
}; 