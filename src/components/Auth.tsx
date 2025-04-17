import React, { useState } from 'react';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

// 使用type guard函数来检查模式
const isChangePasswordMode = (mode: string): boolean => mode === 'changePassword';

interface AuthProps {
  onClose: () => void;
  defaultMode: 'login' | 'register' | 'changePassword';
  userEmail?: string | null;
  token?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const Auth: React.FC<AuthProps> = ({ onClose, defaultMode, userEmail, token }) => {
  const [identifier, setIdentifier] = useState(isChangePasswordMode(defaultMode) && userEmail ? userEmail : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mode, setMode] = useState<'login' | 'register' | 'changePassword'>(defaultMode);
  const [isCodeLogin, setIsCodeLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendCode = async () => {
    if (!identifier) {
      setError('请输入邮箱');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      setError('请输入有效的邮箱格式');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/send_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          identifier,
          mode
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否运行');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier) {
      setError('请输入邮箱');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      setError('请输入有效的邮箱格式');
      return;
    }

    if (mode === 'register') {
      if (!identifier || !password || !code) {
        setError('请填写所有必要信息');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少6位');
        return;
      }
    } else if (!isCodeLogin && (!identifier || !password)) {
      setError('请填写所有必要信息');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'register' 
        ? '/register' 
        : (isCodeLogin ? '/verify_code' : '/login');

      const body = mode === 'register'
        ? { identifier, password, code }
        : isCodeLogin
        ? { identifier, code }
        : { identifier, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // 保存token到localStorage
        localStorage.setItem('userToken', data.token);
        
        // 设置标志，表明通过刷新页面解决UI问题
        localStorage.setItem('force_reload_fix', 'true');
        localStorage.setItem('login_success', 'true');
        
        // 强制刷新页面到主页
        window.location.href = window.location.origin + window.location.pathname;
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier) {
      setError('请输入邮箱');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      setError('请输入有效的邮箱格式');
      return;
    }

    if (!identifier || !password || !confirmPassword || !code) {
      setError('请填写所有必要信息');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password,
          code
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setError('');
        setSuccessMessage('注册成功！请使用您的账号登录。');
        setIdentifier('');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setTimeout(() => {
          setSuccessMessage('');
          setMode('login');
        }, 1500);
      } else {
        setError(data.message || '注册失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isChangePasswordMode(mode)) {
      return;
    }

    if (!code || !password || !confirmPassword) {
      setError('请填写所有必要信息');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // 添加Authorization头
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/change_password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          newPassword: password,
          code
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setError('');
        setSuccessMessage('密码修改成功！');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1500);
      } else {
        setError(data.message || '密码修改失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden border border-gray-800 shadow-2xl animate-scale-in">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl md:text-2xl font-semibold text-gray-100">
                {mode === 'login' ? '欢迎回来' : mode === 'register' ? '创建账户' : '修改密码'}
              </h2>
            </div>
            <button
              onClick={() => {
                // 存储用户登录状态，以便页面刷新后保持
                if (token) {
                  localStorage.setItem('temp_token', token);
                }
                
                // 设置一个标志，表明我们正在通过刷新页面来解决UI问题
                localStorage.setItem('force_reload_fix', 'true');
                
                // 强制刷新页面到主页
                window.location.href = window.location.origin + window.location.pathname;
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">电子邮箱</label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100"
                  placeholder="请输入您的邮箱"
                />
              </div>

              {!isCodeLogin ? (
                <>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-400 mb-1">密码</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100 pr-10"
                        placeholder="请输入您的密码"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsCodeLogin(true)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      使用验证码登录
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      没有账户？注册
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">验证码</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100"
                        placeholder="请输入验证码"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading || countdown > 0}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors whitespace-nowrap text-sm"
                      >
                        {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                      </button>
                    </div>
                    {countdown > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        若未收到验证码，请检查垃圾邮件，或将happyworkfkpua@gmail.com加入通讯录。
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsCodeLogin(false)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      使用密码登录
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      没有账户？注册
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex justify-center items-center"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">电子邮箱</label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100"
                  placeholder="请输入您的邮箱"
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100 pr-10"
                    placeholder="请设置密码（至少6位）"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">确认密码</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100 pr-10"
                    placeholder="请再次输入密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100"
                    placeholder="请输入验证码"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading || countdown > 0}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    若未收到验证码，请检查垃圾邮件，或将happyworkfkpua@gmail.com加入通讯录。
                  </p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  已有账户？登录
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex justify-center items-center"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}

          {mode === 'changePassword' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="text-gray-400 text-sm mb-4">
                {userEmail ? `您正在修改账户 ${userEmail} 的密码` : '请填写以下信息修改密码'}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">新密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100 pr-10"
                    placeholder="请设置新密码（至少6位）"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">确认新密码</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100 pr-10"
                    placeholder="请再次输入新密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 p-3 bg-gray-800/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-100"
                    placeholder="请输入验证码"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading || countdown > 0}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    若未收到验证码，请检查垃圾邮件，或将happyworkfkpua@gmail.com加入通讯录。
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex justify-center items-center"
              >
                {loading ? '提交中...' : '修改密码'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}; 