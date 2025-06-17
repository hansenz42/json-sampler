import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
// 使用更适合深色模式的主题
import 'highlight.js/styles/github-dark.css';

// 添加自定义样式以增强可读性
import "@/styles/highlight-custom.css";

// 注册 JSON 语言
hljs.registerLanguage('json', json);

// 导入滚动条隐藏样式
import "@/styles/scrollbar-hide.css";

interface ResultContentProps {
  result: string;
  onCopy?: () => void;
  className?: string;
}

export function ResultContent({ result, onCopy, className = "" }: ResultContentProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  
  // 处理 JSON 高亮
  useEffect(() => {
    if (result) {
      try {
        const highlighted = hljs.highlight(result, { language: 'json' }).value;
        setHighlightedCode(highlighted);
      } catch (error) {
        console.error('高亮处理错误:', error);
        setHighlightedCode('');
      }
    } else {
      setHighlightedCode('');
    }
  }, [result]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      onCopy?.();
      
      // 2秒后重置复制状态
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (!result) return null;

  return (
    <div className={`${className}`}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">
          采样结果
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
          title="复制到剪贴板"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">复制到剪贴板</span>
        </Button>
      </div>
      <div className="relative">
        <div className="flex w-full overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-md border border-slate-200 dark:border-slate-700 text-sm">
          {/* 行号 */}
          <div 
            className="py-4 px-3 text-right text-xs select-none bg-muted/10 dark:bg-muted/20 border-r border-slate-200 dark:border-slate-700 scrollbar-hide"
            aria-hidden="true"
            style={{ minWidth: '3rem' }}
          >
            <div className="flex flex-col">
              {result.split('\n').map((_, index) => (
                <div 
                  key={index} 
                  className="h-5 leading-5 text-slate-500 dark:text-slate-400 font-mono text-[0.7rem] pr-1 opacity-70"
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
          
          {/* 结果内容 */}
          <pre className="overflow-x-auto p-4 w-full">
            <code 
              className="hljs-custom-theme" 
              dangerouslySetInnerHTML={{ __html: highlightedCode || result }} 
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
