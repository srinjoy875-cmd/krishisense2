import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Sprout } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#3A7D44 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-soft border border-border relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <Sprout size={28} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
          <p className="text-text-secondary">Sign in to your KrishiSense dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg">{error}</div>}

          {/* Hidden dummy inputs to trick browser autofill */}
          <input type="text" name="prevent_autofill" style={{ display: 'none' }} />
          <input type="password" name="prevent_autofill" style={{ display: 'none' }} />

          <Input
            label="Email"
            type="email"
            name="email_field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password_field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <Button type="submit" className="w-full mt-2">Sign In</Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
