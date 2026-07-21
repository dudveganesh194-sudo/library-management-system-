import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Eye, EyeOff, Loader2, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../store/auth.context';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  username: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const user = await login(data.username, data.password);
      toast.success('Welcome back!');
      const target = user.role === 'super_admin' ? '/super-admin/dashboard' : from;
      navigate(target, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid credentials';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">StudyLib</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 text-base mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Username or Email */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="label text-base font-semibold">Username or Email</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter username or email"
                  {...register('username')}
                  className={`input pl-11 text-base ${errors.username ? 'input-error' : ''}`}
                />
              </div>
              {errors.username && <p className="error-msg text-sm"><span>{errors.username.message}</span></p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="label text-base font-semibold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`input pl-11 pr-11 text-base ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="error-msg text-sm"><span>{errors.password.message}</span></p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary btn btn-lg w-full mt-2 text-base font-semibold"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-border">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Default: <span className="text-foreground font-semibold font-mono">admin@library.com</span> / <span className="text-foreground font-semibold font-mono">Admin@123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
