"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonSamplerForm } from "@/components/json-sampler-form";
import { ResultContent } from "@/components/result-card";
import { useError, ErrorType } from "@/contexts/ErrorContext";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// 页面头部组件
const PageHeader = ({
  title,
  subtitle,
  badgeText,
}: {
  title: string;
  subtitle: string;
  badgeText: string;
}) => (
  <div className="mb-8 text-center">
    <div className="inline-flex items-center justify-center px-3 py-1 mb-4 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      {badgeText}
    </div>
    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
      {title}
    </h1>
    <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
  </div>
);

export default function Home() {
  const [jsonInput, setJsonInput] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setError } = useError();
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (json: string, listLength: number, convertUnicode: boolean, applyListLength: boolean) => {
    try {
      // 处理 JSON 数据，对长列表进行采样
      const processData = (jsonString: string): any => {
        // 如果需要转换 Unicode，先进行转换
        if (convertUnicode) {
          jsonString = jsonString.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          });
          // 处理 \x 格式的 Unicode 编码
          jsonString = jsonString.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          });
        }

        // 直接解析 JSON，因为在 JsonSamplerForm 中已经验证过了
        const data = JSON.parse(jsonString);

        // 处理数据
        const processObject = (obj: any): any => {
          if (Array.isArray(obj)) {
            // 如果启用了列表长度限制并且数组长度超过保留长度，则进行采样，只保留前 listLength 项
            return (applyListLength && obj.length > listLength) ? obj.slice(0, listLength) : obj;
          } else if (obj !== null && typeof obj === "object") {
            // 递归处理对象属性
            const result: Record<string, any> = {};
            for (const key in obj) {
              result[key] = processObject(obj[key]);
            }
            return result;
          }
          return obj;
        };

        return processObject(data);
      };

      // 处理 JSON 数据
      const processedData = processData(json);

      console.log("处理后的 JSON 数据:", processedData);
      console.log("是否转换 Unicode:", convertUnicode);
      console.log("是否应用列表长度限制:", applyListLength);
      // 返回处理后的 JSON 字符串
      const result = JSON.stringify(processedData, null, 2);
      setResult(result);
      return result;
    } catch (error) {
      // 捕获并抛出错误，包括 JSON 解析错误
      throw error;
    }
  };

  const exampleJson = `{
  "example": "这是一个示例 JSON 数据",
  "items": [1, 2, 3, 4, 5],
  "nested": {
    "key1": "value1",
    "key2": 123,
    "key3": true
  },
  "description": "请在此处输入或粘贴您的 JSON 数据"
}`;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 md:px-8 font-sans bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <PageHeader
        title="JSON 列表采样器"
        subtitle="JSON 里的列表太长不方便放到文档里？你来定一个长度，轻松采样 JSON 里的 list。"
        badgeText="🔍 JSON Sampler"
      />

      <main className="max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border border-gray-100 dark:border-gray-800 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800">
            <CardContent className="p-6 pt-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <JsonSamplerForm
                  onSubmit={handleSubmit}
                  onInputChange={setJsonInput}
                  value={jsonInput}
                  placeholder={exampleJson}
                  isLoading={isLoading}
                  defaultListLength={5}
                  onError={(error) =>
                    setError({
                      message: error.message,
                      type: error.type as
                        | "error"
                        | "warning"
                        | "info"
                        | undefined,
                      source: error.source,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
          </Card>
        </motion.div>

        {/* 结果展示 */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
            layout
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600"></div>
            <Card className={cn(
              "overflow-hidden",
              "border border-gray-200 dark:border-gray-800", 
              "shadow-md hover:shadow-xl transition-all duration-300",
              "bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20",
              "rounded-xl",
              "pl-2" // 添加左侧内边距，为蓝色条留出空间
            )}>
              <CardContent className="p-6 pt-2">
                <ResultContent
                  result={result}
                  onCopy={() => {
                    // 可以在这里添加复制成功的提示
                    console.log("结果已复制到剪贴板");
                  }}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 页脚 */}
        <Footer
          version="v1.0"
          companyName={
            <a
              href="https://www.assen.top"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-primary"
            >
              浩森 Hansen
            </a>
          }
        />

        {/* 底部引用元素，用于滚动定位 */}
        <div ref={bottomRef} className="h-1" />
      </main>
    </div>
  );
}
