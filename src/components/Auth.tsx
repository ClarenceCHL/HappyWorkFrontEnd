import React, { useState } from 'react';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

// 使用type guard函数来检查模式
const isChangePasswordMode = (mode: string): boolean => mode === 'changePassword';

interface AuthProps {
  onSuccess: (token: string) => void;
  onClose: () => void;
  defaultMode: 'login' | 'register' | 'changePassword';
  userEmail?: string | null;
  token?: string | null;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onClose, defaultMode, userEmail, token }) => {
  const [identifier, setIdentifier] = useState(isChangePasswordMode(defaultMode) && userEmail ? userEmail : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
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
      const response = await fetch('http://localhost:8000/send_code', {
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
        setCodeSent(true);
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

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status === 'success') {
        onSuccess(data.token);
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
      const response = await fetch('http://localhost:8000/register', {
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
        setCodeSent(false);
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
      
      const response = await fetch('http://localhost:8000/change_password', {
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
        setCodeSent(false);
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

  const goToLoginOrRegister = () => {
    if ((mode as string) === 'register' || (mode as string) === 'changePassword') {
      setMode('login');
    } else {
      setMode('register');
    }
    setError('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setCodeSent(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
        >
          ×
        </button>
        
        <h2 className="text-2xl font-medium mb-6 text-center">
          {mode === 'login' ? '登录' : mode === 'register' ? '注册' : '修改密码'}
        </h2>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        <form 
          className="mt-8 space-y-6" 
          onSubmit={mode === 'register' ? handleRegister : isChangePasswordMode(mode) ? handleChangePassword : handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="text-sm font-medium text-gray-300">
                邮箱
              </label>
              <input
                id="identifier"
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400"
                placeholder="请输入邮箱"
                readOnly={isChangePasswordMode(defaultMode)}
                disabled={isChangePasswordMode(defaultMode)}
              />
            </div>

            {(mode === 'register' || (mode === 'login' && !isCodeLogin)) && !isChangePasswordMode(mode) && (
              <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  密码
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400"
                    placeholder={mode === 'register' ? "请设置密码（至少6位）" : "请输入密码"}
                    autoComplete={mode === 'register' ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {isChangePasswordMode(mode) && (
              <div>
                <label htmlFor="new-password" className="text-sm font-medium text-gray-300">
                  新密码
                </label>
                <div className="mt-1 relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400"
                    placeholder="请设置新密码（至少6位）"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'register' || isChangePasswordMode(mode)) && (
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  {isChangePasswordMode(mode) ? '确认新密码' : '确认密码'}
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400"
                    placeholder={isChangePasswordMode(mode) ? "请再次输入新密码" : "请再次输入密码"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'register' || isChangePasswordMode(mode) || isCodeLogin) && (
              <div>
                <label htmlFor="code" className="text-sm font-medium text-gray-300">
                  验证码
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400"
                    placeholder="请输入验证码"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading || countdown > 0 || !identifier}
                    className="px-4 py-2 bg-blue-400 text-black rounded-md hover:bg-blue-300 disabled:bg-gray-600 whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || ((mode === 'register' || isChangePasswordMode(mode)) && !codeSent)}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-400 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-600"
            >
              {loading ? '处理中...' : (mode === 'register' ? '注册' : isChangePasswordMode(mode) ? '修改密码' : '登录')}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsCodeLogin(!isCodeLogin)}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                {isCodeLogin ? '密码登录' : '忘记密码？验证码登录'}
              </button>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={goToLoginOrRegister}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {mode === 'register' ? '已有账号？去登录 →' : isChangePasswordMode(mode) ? '取消' : '没有账号？去注册 →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 