'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';

// 错误类型
export type ErrorType = {
  message: string;
  type?: 'error' | 'warning' | 'info';
  source?: string;
};

// 错误上下文类型
type ErrorContextType = {
  error: ErrorType | null;
  setError: (error: ErrorType | null) => void;
  clearError: () => void;
};

// 创建上下文
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// 错误提供者组件属性
interface ErrorProviderProps {
  children: ReactNode;
}

// 错误上下文提供者
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<ErrorType | null>(null);

  const clearError = () => {
    setError(null);
  };

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
      {error && <ErrorDisplay error={error} onClose={clearError} />}
    </ErrorContext.Provider>
  );
};

// 错误显示组件属性
interface ErrorDisplayProps {
  error: ErrorType;
  onClose: () => void;
}

// 错误显示组件
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  // 根据错误类型设置样式
  const getStylesByType = () => {
    switch (error.type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'error':
      default:
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`rounded-md border p-4 shadow-md ${getStylesByType()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {error.source ? `${error.source}: ` : ''}
              {error.message}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto flex-shrink-0">
            <X className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 错误上下文钩子
export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError 必须在 ErrorProvider 内部使用');
  }
  return context;
};

// 统一的错误处理工具函数
export const handleApiError = async (
  response: Response,
  defaultErrorMessage: string = '操作失败'
): Promise<any> => {
  if (!response.ok) {
    let errorMessage = defaultErrorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || defaultErrorMessage;
    } catch (e) {
      // 如果无法解析JSON，使用默认错误信息
    }
    throw new Error(errorMessage);
  }
  return await response.json();
};
