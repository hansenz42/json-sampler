"use client";

import { useState, useRef, ChangeEvent, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 导入滚动条隐藏样式
import "@/styles/scrollbar-hide.css";

interface ErrorHandler {
  (error: { message: string; type: string; source: string }): void;
}

interface JsonSamplerFormProps {
  onSubmit: (json: string, listLength: number) => Promise<string>;
  onInputChange: (value: string) => void;
  value: string;
  placeholder: string;
  isLoading: boolean;
  defaultListLength?: number;
  onError?: ErrorHandler;
}

export function JsonSamplerForm({
  onSubmit,
  onInputChange,
  value,
  placeholder,
  isLoading,
  defaultListLength = 5,
  onError,
}: JsonSamplerFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [listLength, setListLength] = useState(defaultListLength);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [errorLineNumber, setErrorLineNumber] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 重置错误行号
    setErrorLineNumber(null);
    
    if (!value.trim()) {
      onError?.({
        message: "请输入有效的 JSON 内容",
        type: "warning",
        source: "表单验证",
      });
      return;
    }

    // 获取 JSON 解析错误的行号和列号
    const getJsonErrorPosition = (jsonStr: string, errorMessage: string): { lineNumber: number; columnNumber: number } => {
      // 从错误信息中提取位置
      const positionMatch = errorMessage.match(/position (\d+)/i);
      if (!positionMatch) return { lineNumber: 1, columnNumber: 1 };
      
      const position = parseInt(positionMatch[1], 10);
      const lines = jsonStr.substring(0, position).split('\n');
      const lineNumber = lines.length;
      const columnNumber = lines[lines.length - 1].length + 1;
      
      return { lineNumber, columnNumber };
    };

    try {
      // 验证 JSON 格式
      JSON.parse(value);
      
      setLocalIsLoading(true);
      // 调用提交函数，但不再更新输入框的值
      await onSubmit(value, listLength);
    } catch (error) {
      // 获取错误行号信息
      const errorMsg = (error as Error).message;
      const { lineNumber, columnNumber } = getJsonErrorPosition(value, errorMsg);
      
      // 设置错误行号，用于高亮显示
      setErrorLineNumber(lineNumber);
      
      // 如果有文本区域引用，将滚动到错误行
      if (textareaRef.current) {
        const lines = value.split('\n');
        let position = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
          position += lines[i].length + 1; // +1 是为了包含换行符
        }
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(position, position + lines[lineNumber - 1].length);
      }
      
      onError?.({
        message: `JSON 解析错误: ${errorMsg} (错误位置: 第 ${lineNumber} 行, 第 ${columnNumber} 列)`,
        type: "error",
        source: "JSON 验证",
      });
    } finally {
      setLocalIsLoading(false);
    }
  };
  
  const isProcessing = isLoading || localIsLoading;
  
  // 计算行号
  const lineNumbers = useMemo(() => {
    const lines = value.split('\n');
    return Array.from({ length: Math.max(1, lines.length) }, (_, i) => i + 1);
  }, [value]);

  // 同步滚动处理
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      
      // 插入制表符
      const newValue = value.substring(0, start) + '\t' + value.substring(end);
      onInputChange(newValue);
      
      // 使用 ref 来设置光标位置
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newCursorPos = start + 1;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="json-input">在这里输入一个 JSON</Label>
            <div className="relative flex w-full h-[600px] overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
              {/* 行号 */}
              <div 
                ref={lineNumbersRef}
                className="h-full overflow-y-auto py-3 px-3 text-right text-xs select-none bg-muted/10 dark:bg-muted/20 border-r border-slate-200 dark:border-slate-700 scrollbar-hide"
                aria-hidden="true"
                style={{ minWidth: '3rem' }}
              >
                <div className="min-h-full flex flex-col">
                  {lineNumbers.map((num) => (
                    <div 
                      key={num} 
                      className={cn(
                        "h-5 leading-5 font-mono text-[0.7rem] pr-1",
                        errorLineNumber === num
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold"
                          : "text-slate-500 dark:text-slate-400 opacity-70"
                      )}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 文本区域 */}
              <div className="relative h-full w-full">
                {/* 错误行高亮背景层 */}
                {errorLineNumber !== null && (
                  <div 
                    className="absolute pointer-events-none w-full bg-red-100/30 dark:bg-red-900/20 z-10"
                    style={{
                      top: `${(errorLineNumber - 1) * 1.25}rem`, // 基于行高计算位置
                      height: '1.25rem',
                    }}
                  />
                )}
                <Textarea
                  id="json-input"
                  value={value}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    onInputChange(e.target.value);
                    // 当用户修改内容时，清除错误行高亮
                    if (errorLineNumber !== null) {
                      setErrorLineNumber(null);
                    }
                  }}
                  placeholder={placeholder}
                  disabled={isProcessing}
                  className={cn(
                    "h-full w-full font-mono text-sm px-4 py-3 border-0 rounded-none resize-none overflow-y-auto",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "bg-transparent", // 改为透明背景，以便显示错误高亮层
                    "relative z-20" // 确保文本在高亮层之上
                  )}
                  style={{
                    lineHeight: '1.25rem',
                  }}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  ref={textareaRef}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="list-length" className="whitespace-nowrap">
              列表保留长度
            </Label>
            <Input
              id="list-length"
              type="number"
              min="1"
              value={listLength}
              onChange={(e) => setListLength(parseInt(e.target.value) || 1)}
              className="w-24 border-slate-200 dark:border-slate-700"
              disabled={isProcessing}
            />
          </div>
        </div>
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={isProcessing || value.length < 2}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isProcessing || value.length < 2
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "处理中..." : "采样"}
          </button>
        </div>
      </div>
    </form>
  );
}
