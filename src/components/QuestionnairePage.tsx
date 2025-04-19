import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// 获取 token
const getToken = () => localStorage.getItem('userToken');

// 定义选项类型
interface QuestionOption {
  value: string;
  label: string;
}

// 定义问题类型
interface Question {
  id: string; // 使用唯一字符串 ID
  section: string;
  type: 'single' | 'multiple' | 'short';
  text: string;
  options?: QuestionOption[]; // 单选或多选的选项
  maxSelections?: number; // 多选题的最大可选数量
}

// 完整的问卷数据
const allQuestions: Question[] = [
  // --- 一、职场心理与PUA风险 --- 
  {
    id: 's1q1', section: '一、职场心理与PUA风险', type: 'single',
    text: '当你感觉到被上司批评或针对时，你最常见的反应是什么？',
    options: [
      { value: 'A', label: '沉默接受，心里却不舒服' },
      { value: 'B', label: '立即反驳，情绪较激烈' },
      { value: 'C', label: '表面淡定，事后反复回想' },
      { value: 'D', label: '尝试委婉解释，但效果不佳' },
    ]
  },
  {
    id: 's1q2', section: '一、职场心理与PUA风险', type: 'single',
    text: '面对职场上的无理要求（如无理由加班），你通常如何应对？',
    options: [
      { value: 'A', label: '委屈配合，害怕得罪人' },
      { value: 'B', label: '直接拒绝，明确表达态度' },
      { value: 'C', label: '委婉推脱，找借口' },
      { value: 'D', label: '犹豫不决，最后还是接受' },
    ]
  },
  {
    id: 's1q3', section: '一、职场心理与PUA风险', type: 'single',
    text: '当你发现自己的功劳被他人占据或弱化时，你的第一反应是？',
    options: [
      { value: 'A', label: '生闷气，但不知道怎么表达' },
      { value: 'B', label: '公开表达不满' },
      { value: 'C', label: '私下找机会澄清' },
      { value: 'D', label: '忍耐，不敢提出来' },
    ]
  },
  {
    id: 's1q4', section: '一、职场心理与PUA风险', type: 'multiple', maxSelections: 3,
    text: '你目前在职场中经常遇到哪些困扰？（最多选3项）',
    options: [
      { value: 'A', label: '上司或同事言语上的挖苦讽刺' },
      { value: 'B', label: '工作量分配明显不公平' },
      { value: 'C', label: '功劳被抢或责任被甩锅' },
      { value: 'D', label: '无休止的加班暗示或强制加班' },
      { value: 'E', label: '职场冷暴力或被孤立' },
      { value: 'F', label: '职业成长被上司压制' },
    ]
  },
  {
    id: 's1q5', section: '一、职场心理与PUA风险', type: 'multiple', maxSelections: 3,
    text: '下列哪些情景会使你内心感到焦虑或不安？（最多选3项）',
    options: [
      { value: 'A', label: '会议上被公开批评或质疑' },
      { value: 'B', label: '与上司或团队沟通时难以表达观点' },
      { value: 'C', label: '工作成果不被认可或忽视' },
      { value: 'D', label: '职场晋升机会总被忽略' },
      { value: 'E', label: '被要求承担过多非分内工作' },
    ]
  },
  {
    id: 's1q6', section: '一、职场心理与PUA风险', type: 'multiple', maxSelections: 3,
    text: '你认为自己目前最缺乏的职场能力有哪些？（最多选3项）',
    options: [
      { value: 'A', label: '设定边界，勇敢说"不"' },
      { value: 'B', label: '应对职场冲突和争论的沟通能力' },
      { value: 'C', label: '建立强势且受尊重的人设' },
      { value: 'D', label: '洞察并拆解职场话术的能力' },
      { value: 'E', label: '有效表达自身诉求的能力' },
      { value: 'F', label: '职业生涯自我规划能力' },
    ]
  },
  {
    id: 's1q7', section: '一、职场心理与PUA风险', type: 'short',
    text: '请简单描述最近一次让你深感不舒服的职场经历。'
  },
  {
    id: 's1q8', section: '一、职场心理与PUA风险', type: 'short',
    text: '你觉得职场PUA对你最大的影响是什么？'
  },
  // --- 二、当前人设与期望人设 --- 
  {
    id: 's2q1', section: '二、当前人设与期望人设', type: 'single',
    text: '你希望在职场中的人设是怎样的？',
    options: [
      { value: 'A', label: '亲和力强，好相处' },
      { value: 'B', label: '强势自信，有威望' },
      { value: 'C', label: '沉稳理性，专业性强' },
      { value: 'D', label: '灵活圆滑，擅长沟通' },
    ]
  },
  {
    id: 's2q2', section: '二、当前人设与期望人设', type: 'single',
    text: '当前你的职场状态，更接近哪一种？',
    options: [
      { value: 'A', label: '职场"小透明"，存在感弱' },
      { value: 'B', label: '"老好人"，无法拒绝他人' },
      { value: 'C', label: '工作认真，但常吃亏' },
      { value: 'D', label: '有一定的威望，但仍然面临PUA困扰' },
    ]
  },
  {
    id: 's2q3', section: '二、当前人设与期望人设', type: 'multiple', maxSelections: 3,
    text: '你想通过定制化人设战略解决哪些问题？（最多选3项）',
    options: [
      { value: 'A', label: '提升自信和职场竞争力' },
      { value: 'B', label: '打造更清晰的边界感，保护个人权益' },
      { value: 'C', label: '避免被无故指责或承担过多责任' },
      { value: 'D', label: '获得更多认可和职业机会' },
      { value: 'E', label: '应对职场矛盾更从容得体' },
    ]
  },
  {
    id: 's2q4', section: '二、当前人设与期望人设', type: 'multiple', maxSelections: 3,
    text: '下列哪些品质你认为是理想人设必须具备的？（最多选3项）',
    options: [
      { value: 'A', label: '强大的自信与表达能力' },
      { value: 'B', label: '良好的职场边界感' },
      { value: 'C', label: '精准拆解职场套路的话术技巧' },
      { value: 'D', label: '处理冲突时的镇定和智慧' },
      { value: 'E', label: '能主动掌控职场局面的能力' },
    ]
  },
  {
    id: 's2q5', section: '二、当前人设与期望人设', type: 'short',
    text: '描述一下你理想中最完美的职场状态或人设。'
  },
  {
    id: 's2q6', section: '二、当前人设与期望人设', type: 'short',
    text: '你认为哪些因素阻碍了你达到理想的职场人设？'
  },
  // --- 三、情境与高人智慧捕捉 --- 
  {
    id: 's3q1', section: '三、情境与高人智慧捕捉', type: 'single',
    text: '面对职场"画大饼"而不兑现的情况，你通常的反应是？',
    options: [
      { value: 'A', label: '默默接受，但内心不满' },
      { value: 'B', label: '直接表达质疑或不满' },
      { value: 'C', label: '私下吐槽但不敢公开表达' },
      { value: 'D', label: '沟通表达后仍被忽略' },
    ]
  },
  {
    id: 's3q2', section: '三、情境与高人智慧捕捉', type: 'multiple', maxSelections: 3,
    text: '在下面哪些情境下，你特别希望能获得高人的指导或智慧？（最多选3项）',
    options: [
      { value: 'A', label: '如何巧妙拒绝无理的职场要求' },
      { value: 'B', label: '如何表达自己的需求和界限' },
      { value: 'C', label: '如何处理职场上的小人或阴谋' },
      { value: 'D', label: '如何在争取资源或利益时赢得支持' },
      { value: 'E', label: '如何在受到职场PUA时有效反击' },
    ]
  },
  {
    id: 's3q3', section: '三、情境与高人智慧捕捉', type: 'short',
    text: '你最希望掌握哪种具体的职场沟通技巧或话术？'
  },
  {
    id: 's3q4', section: '三、情境与高人智慧捕捉', type: 'short',
    text: '请简述一次你觉得自己成功应对职场冲突的经历。'
  },
  {
    id: 's3q5', section: '三、情境与高人智慧捕捉', type: 'short',
    text: '如果遇到职场中难以拒绝的要求，你通常怎么说？请举一个具体的例子。'
  },
  {
    id: 's3q6', section: '三、情境与高人智慧捕捉', type: 'short',
    text: '如果现在职场有一位高人给你指导，你最想得到哪方面的建议或点拨？'
  },
];

interface QuestionnairePageProps {
  onBack: () => void;
  onSubmit: (answers: Record<string, string | string[]>) => void; // 答案类型为对象
}

// 进度条组件
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-amber-500 to-yellow-300 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ onBack, onSubmit }) => {

  // 使用 state 来存储答案
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // 添加提交状态
  const [submitProgress, setSubmitProgress] = useState(0); // 添加提交进度状态

  // 处理单选按钮变化
  const handleSingleChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // 处理多选按钮变化
  const handleMultipleChange = (questionId: string, value: string, maxSelections: number) => {
    setAnswers(prev => {
      const currentSelection = (prev[questionId] || []) as string[];
      const isSelected = currentSelection.includes(value);
      let newSelection: string[];

      if (isSelected) {
        newSelection = currentSelection.filter(v => v !== value);
      } else {
        if (currentSelection.length < maxSelections) {
          newSelection = [...currentSelection, value];
        } else {
          // 如果达到最大选项，则不添加新选项 (或者可以给用户提示)
          newSelection = currentSelection;
          alert(`此题最多选择 ${maxSelections} 项。`); // 添加提示
        }
      }
      return { ...prev, [questionId]: newSelection };
    });
  };

  // 处理简答题文本域变化
  const handleShortChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // 当isSubmitting状态改变时，模拟进度条增长
  useEffect(() => {
    let progressInterval: number;
    if (isSubmitting) {
      setSubmitProgress(0);
      progressInterval = window.setInterval(() => {
        setSubmitProgress(prev => {
          // 逐渐减缓增长速度，不超过95%（等待实际完成）
          const increment = Math.max(0.5, (100 - prev) / 20);
          const newProgress = prev + increment;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 150);
    } else if (submitProgress > 0) {
      // 如果已经开始提交，但现在完成了（isSubmitting = false）
      setSubmitProgress(100);
      progressInterval = window.setTimeout(() => {
        setSubmitProgress(0);
      }, 1000);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isSubmitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("提交的问卷答案:", answers);

    // 检查是否所有问题都已回答 (基本检查，可根据需要细化)
    const answeredQuestions = Object.keys(answers).filter(key => {
        const answer = answers[key];
        if (Array.isArray(answer)) return answer.length > 0;
        return typeof answer === 'string' && answer.trim() !== '';
    }).length;

    if (answeredQuestions < allQuestions.length) {
        alert('请确保所有问题都已回答！');
        return;
    }

    // 开始提交
    setIsSubmitting(true);
    setSubmitProgress(10); // 立即设置一个初始进度

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/questionnaire/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: answers
        })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      console.log('问卷提交成功:', data);
      // 调用父组件传递的 onSubmit 函数，传递答案和预览链接
      onSubmit(answers);
      
    } catch (error) {
      console.error('提交问卷时出错:', error);
      alert(`提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      // 延迟一点再结束提交状态，让进度条能完成动画
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  // 按部分分组问题
  const sections = allQuestions.reduce((acc, question) => {
    (acc[question.section] = acc[question.section] || []).push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#111111] text-gray-100 p-6 md:p-10 relative overflow-y-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="fixed top-6 left-6 md:top-10 md:left-10 z-30 flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors group bg-[#1a1a1a]/50 backdrop-blur-sm p-2 rounded-full shadow-md"
      >
        <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium hidden sm:inline">返回</span>
      </button>

      <div className="max-w-3xl mx-auto relative z-10 pt-16 md:pt-24 pb-12">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-amber-300">
            职场定制化人设战略匿名问卷
          </h1>
          <p className="text-md md:text-lg text-gray-400 max-w-2xl mx-auto">
            请认真回答以下问题，您的答案将帮助 AI 生成精准有效的《人设战略破局职场PUA》专属方案
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {Object.entries(sections).map(([sectionTitle, questionsInSection], sectionIndex) => (
            <section key={sectionTitle} className="bg-gray-900/50 p-6 md:p-8 rounded-xl border border-amber-500/20 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: `${sectionIndex * 0.15}s` }}>
              <h2 className="text-2xl font-semibold text-amber-400 mb-8 border-b border-amber-500/30 pb-3">{sectionTitle}</h2>
              <div className="space-y-8">
                {questionsInSection.map((q, questionIndex) => (
                  <div key={q.id} className="animate-fade-in-up" style={{ animationDelay: `${(questionIndex + 1) * 0.1}s` }}>
                    <label className="block text-lg font-medium text-gray-200 mb-4">
                      {questionIndex + 1 + (sectionIndex === 1 ? 8 : sectionIndex === 2 ? 14 : 0)}. {q.text} 
                      {q.type === 'multiple' && q.maxSelections && 
                        <span className="text-sm text-gray-500 ml-2">(最多选 {q.maxSelections} 项)</span>
                      }
                    </label>

                    {/* 单选题 */} 
                    {q.type === 'single' && q.options && (
                      <div className="space-y-3">
                        {q.options.map(option => (
                          <label key={option.value} className="flex items-center p-3 bg-gray-800/60 border border-gray-700 rounded-md hover:bg-gray-700/80 transition-colors duration-200 cursor-pointer">
                            <input
                              type="radio"
                              name={q.id}
                              value={option.value}
                              checked={answers[q.id] === option.value}
                              onChange={() => handleSingleChange(q.id, option.value)}
                              required
                              className="form-radio h-5 w-5 text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500 focus:ring-offset-gray-800"
                            />
                            <span className="ml-3 text-gray-300">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* 多选题 */} 
                    {q.type === 'multiple' && q.options && q.maxSelections && (
                      <div className="space-y-3">
                        {q.options.map(option => (
                          <label key={option.value} className="flex items-center p-3 bg-gray-800/60 border border-gray-700 rounded-md hover:bg-gray-700/80 transition-colors duration-200 cursor-pointer">
                            <input
                              type="checkbox"
                              name={q.id}
                              value={option.value}
                              checked={(answers[q.id] as string[] || []).includes(option.value)}
                              onChange={() => handleMultipleChange(q.id, option.value, q.maxSelections!)}
                              className="form-checkbox h-5 w-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 focus:ring-offset-gray-800"
                            />
                            <span className="ml-3 text-gray-300">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* 简答题 */} 
                    {q.type === 'short' && (
                      <textarea
                        id={q.id}
                        name={q.id}
                        rows={5}
                        required
                        value={(answers[q.id] as string || '')}
                        onChange={(e) => handleShortChange(q.id, e.target.value)}
                        className="w-full p-4 bg-gray-800/60 border border-gray-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-200 placeholder-gray-500 transition-colors duration-200"
                        placeholder="请在此处详细回答..."
                      ></textarea>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* 提交按钮区域 */}
          <div className="pt-8 flex flex-col items-center justify-center animate-fade-in-up" style={{ animationDelay: `${Object.keys(sections).length * 0.15}s` }}>
            {/* 提交时显示进度条 */}
            {isSubmitting && (
              <div className="w-full max-w-md mb-6 px-4">
                <ProgressBar progress={submitProgress} />
                <p className="text-amber-400 text-sm text-center mb-4">
                  正在处理您的回答，生成专属报告中...{Math.round(submitProgress)}%
                </p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mx-auto px-10 py-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-bold text-xl 
                hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'} 
                flex items-center justify-center gap-2 w-full max-w-md`}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>正在提交问卷...</span>
                </>
              ) : '提交问卷，生成专属报告'}
            </button>
            <p className="text-xs text-gray-500 mt-6 text-center">您的回答将被严格保密，仅用于生成您的专属报告。</p>
          </div>
        </form>

        <footer className="text-center text-gray-500 text-sm mt-16 pb-6">
          <p>Happy Work · 赋能您的职场</p>
        </footer>
      </div>
    </div>
  );
};

export default QuestionnairePage; 