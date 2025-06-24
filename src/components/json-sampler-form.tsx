"use client";

import { useState, useRef, ChangeEvent, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// 导入滚动条隐藏样式
import "@/styles/scrollbar-hide.css";

interface ErrorHandler {
  (error: { message: string; type: string; source: string }): void;
}

interface JsonSamplerFormProps {
  onSubmit: (json: string, listLength: number, applyListLength: boolean) => Promise<string>;
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
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLPreElement>(null);
  const [listLength, setListLength] = useState(defaultListLength);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [applyListLength, setApplyListLength] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      await onSubmit(value, listLength, applyListLength);
    } catch (error) {
      // 获取错误行号信息
      const errorMsg = (error as Error).message;
      const { lineNumber, columnNumber } = getJsonErrorPosition(value, errorMsg);
      
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
  
  // 计算总行数
  const totalLines = useMemo(() => {
    const lines = value.split('\n');
    return Math.max(1, lines.length);
  }, [value]);

  const lineNumbers = useMemo(() => Array.from({ length: totalLines }, (_, i) => i + 1).join('\n'), [totalLines]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // 不再需要单独的 handleScroll 函数，因为我们在 textarea 的 onScroll 事件中直接处理了滚动同步

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
            <Label htmlFor="json-input">输入一个 JSON</Label>
            <div className="relative w-full h-[600px] overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col h-full w-full">
                {/* 文本区域容器 */}
                <div className="relative flex-1 overflow-hidden flex">
                  {/* 行号与文本区域 */}
                  <pre
                    ref={lineNumbersRef}
                    className="w-12 flex-shrink-0 overflow-hidden bg-muted/5 dark:bg-muted/10 text-right pr-2 py-3 text-xs leading-5 select-none border-r border-slate-200 dark:border-slate-700"
                    aria-hidden="true"
                  >
                    {lineNumbers}
                  </pre>
                  <textarea
                    id="json-input"
                    value={value}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                      onInputChange(e.target.value);
                    }}
                    placeholder={placeholder}
                    disabled={isProcessing}
                    className={cn(
                      "flex-1 h-full font-mono text-sm p-3 border-0 resize-none overflow-auto",
                      "focus:outline-none focus:ring-0 focus:ring-offset-0"
                    )}
                    style={{
                      lineHeight: '1.25rem',
                      tabSize: 2,
                      whiteSpace: 'pre', // 禁止自动换行
                    }}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    ref={textareaRef}
                    wrap="off"
                    spellCheck="false"
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>
                
                {/* 行数显示 */}
                <div className="flex-shrink-0 flex items-center px-4 py-1 text-xs text-slate-500 dark:text-slate-400 bg-muted/5 dark:bg-muted/10 border-t border-slate-200 dark:border-slate-700">
                  <span>{totalLines} 行</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <input
                  type="checkbox"
                  id="apply-list-length"
                  checked={applyListLength}
                  onChange={(e) => setApplyListLength(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <Label htmlFor="apply-list-length" className="whitespace-nowrap cursor-pointer">
                  限制列表长度
                </Label>
              </div>
              <Input
                type="number"
                id="list-length"
                min="1"
                value={listLength}
                onChange={(e) => setListLength(parseInt(e.target.value) || 1)}
                className="w-24 border-slate-200 dark:border-slate-700"
                disabled={isProcessing || !applyListLength}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-4">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              type="submit"
              disabled={isProcessing || value.length < 2}
              variant="outline"
              size="lg"
              className={cn(
                "px-8 py-6 h-auto font-medium text-base shadow-lg relative overflow-hidden",
                "hover:border-primary",
                "bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-600/30 dark:to-purple-600/30",
                "hover:from-blue-500/30 hover:to-purple-500/30 dark:hover:from-blue-600/40 dark:hover:to-purple-600/40",
                "text-primary-foreground",
                isProcessing && "border-primary/50 from-blue-500/30 to-purple-500/30 dark:from-blue-600/40 dark:to-purple-600/40"
              )}
            >
              {isProcessing ? (
                <>
                  <motion.div
                    className="absolute inset-0 bg-primary/10"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    处理中...
                  </span>
                </>
              ) : (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v4"/>
                    <path d="M18.364 7.636a9 9 0 1 1-12.728 0"/>
                  </svg>
                  处理
                </motion.span>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </form>
  );
}
