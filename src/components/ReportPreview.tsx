import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { marked } from 'marked';

interface ReportPreviewProps {
  content: string;
  timestamp?: string;
  onClose: () => void;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ content, timestamp, onClose }) => {
  // 处理打印功能
  const handlePrint = () => {
    window.print();
  };

  // 将Markdown转换为HTML
  const createMarkup = () => {
    return { __html: marked(content) };
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 overflow-y-auto">
      {/* 打印样式 - 只在打印时显示 */}
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #333;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .report-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            max-width: none !important;
            width: 100% !important;
            overflow: visible !important;
            position: static !important;
          }
          .fixed {
            position: static !important;
          }
          .inset-0 {
            position: static !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            left: auto !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
          }
          .report-content.prose {
            color: #333 !important;
            page-break-inside: auto !important;
          }
          .report-content.prose h1,
          .report-content.prose h2,
          .report-content.prose h3 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .report-content.prose p, 
          .report-content.prose li {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* 确保打印时内容可见 */
          * {
            overflow: visible !important;
          }
          /* 确保分页正确 */
          .my-16 {
            margin-top: 1cm !important;
            margin-bottom: 1cm !important;
          }
          .p-10 {
            padding: 0.5cm !important;
          }
        `}
      </style>

      {/* 返回按钮 - 不打印 */}
      <button
        onClick={onClose}
        className="no-print fixed top-4 left-4 z-50 flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors bg-gray-800 rounded-full px-3 py-2"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">返回</span>
      </button>

      {/* 打印按钮 - 不打印 */}
      <button
        onClick={handlePrint}
        className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors bg-gray-800 rounded-full px-3 py-2"
      >
        <Printer className="w-5 h-5" />
        <span className="text-sm font-medium">打印/保存PDF</span>
      </button>

      {/* 主内容区域 - 使用div而不是更复杂的布局 */}
      <div className="report-container max-w-4xl mx-auto my-16 p-10 bg-gray-800 rounded-xl shadow-xl">
        {/* 报告头部 */}
        <div className="brand-logo flex items-center justify-center mb-6">
          <div className="shield-logo w-12 h-12 mr-3 text-amber-400">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-amber-400">Happy Work</h2>
        </div>
        
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-3">职场人设战略破局PUA</h1>
          <p className="text-gray-300">专属定制方案</p>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-transparent rounded mx-auto mt-4"></div>
        </header>
        
        {/* 时间戳 */}
        {timestamp && (
          <div className="no-print flex justify-between items-center mb-8 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
            <p className="text-sm text-gray-300">生成时间：{timestamp}</p>
          </div>
        )}
        
        {/* 打印时显示时间戳 */}
        {timestamp && (
          <div className="print-only hidden mb-6">
            <p className="text-sm text-gray-600">生成时间：{timestamp}</p>
          </div>
        )}
        
        {/* 报告内容 - 确保内容可打印 */}
        <div className="report-content prose prose-invert prose-amber max-w-none overflow-visible">
          <div dangerouslySetInnerHTML={createMarkup()} />
        </div>
        
        {/* 报告页脚 */}
        <footer className="text-center text-gray-400 mt-12 pt-6 border-t border-gray-700">
          <div className="brand-logo flex items-center justify-center mb-3">
            <div className="shield-logo w-8 h-8 mr-2 text-amber-400">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-400">Happy Work</h3>
          </div>
          <p>© Happy Work · 赋能您的职场</p>
          <p className="mt-1 text-sm">本报告由AI生成，仅供参考</p>
        </footer>
      </div>
    </div>
  );
};

export default ReportPreview; 