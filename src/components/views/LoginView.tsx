'use client';

import React from 'react';
import LoginForm from '@/components/auth/LoginForm'; // Keep the form component separate

interface LoginViewProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function LoginView({ onLoginSuccess, onBack }: LoginViewProps) {
  return (
    <LoginForm onLoginSuccess={onLoginSuccess} onBack={onBack} />
  );
}
