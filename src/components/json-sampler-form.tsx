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
  onSubmit: (json: string, listLength: number, convertUnicode: boolean, applyListLength: boolean) => Promise<string>;
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
  const [convertUnicode, setConvertUnicode] = useState(false);
  const [applyListLength, setApplyListLength] = useState(true);

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
      await onSubmit(value, listLength, convertUnicode, applyListLength);
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
            <Label htmlFor="json-input">输入一个 JSON</Label>
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
              <div className="relative h-full w-full flex flex-col">
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
                    "flex-1 w-full font-mono text-sm px-4 py-3 border-0 rounded-none resize-none overflow-y-auto",
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
                {/* 行数显示 */}
                <div className="flex items-center px-4 py-1 text-xs text-slate-500 dark:text-slate-400 bg-muted/5 dark:bg-muted/10 border-t border-slate-200 dark:border-slate-700">
                  <span>{lineNumbers.length} 行</span>
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
                  List保留长度
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="convert-unicode"
                checked={convertUnicode}
                onChange={(e) => setConvertUnicode(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <Label htmlFor="convert-unicode" className="whitespace-nowrap cursor-pointer">
                Unicode 转中文
              </Label>
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
                  采样
                </motion.span>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </form>
  );
}
