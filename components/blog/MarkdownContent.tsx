"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

// Custom Rust-inspired theme - muted earth tones
const rustTheme = {
  'code[class*="language-"]': {
    color: "#d4d4d4",
    background: "transparent",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: "14px",
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal" as const,
    wordWrap: "normal" as const,
    lineHeight: "1.6",
    MozTabSize: "4",
    OTabSize: "4",
    tabSize: "4",
    WebkitHyphens: "none",
    MozHyphens: "none",
    msHyphens: "none",
    hyphens: "none" as const,
  },
  'pre[class*="language-"]': {
    color: "#d4d4d4",
    background: "transparent",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: "14px",
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal" as const,
    wordWrap: "normal" as const,
    lineHeight: "1.6",
    MozTabSize: "4",
    OTabSize: "4",
    tabSize: "4",
    WebkitHyphens: "none",
    MozHyphens: "none",
    msHyphens: "none",
    hyphens: "none" as const,
    padding: "1em",
    margin: "0",
    overflow: "auto",
  },
  comment: { color: "#6b7280", fontStyle: "italic" },
  prolog: { color: "#6b7280" },
  doctype: { color: "#6b7280" },
  cdata: { color: "#6b7280" },
  punctuation: { color: "#9ca3af" },
  property: { color: "#b8bcc0" },
  tag: { color: "#b8bcc0" },
  boolean: { color: "#CE7B3A" }, // Rust orange for booleans
  number: { color: "#9ca3af" },
  constant: { color: "#CE7B3A" }, // Rust orange for constants
  symbol: { color: "#9ca3af" },
  deleted: { color: "#6b7280" },
  selector: { color: "#a4a8ac" },
  "attr-name": { color: "#a4a8ac" },
  string: { color: "#8a8a8a" }, // Muted gray for strings
  char: { color: "#8a8a8a" },
  builtin: { color: "#b0b4b8" },
  inserted: { color: "#d1d5db" },
  operator: { color: "#7c8084" },
  entity: { color: "#9ca3af", cursor: "help" },
  url: { color: "#9ca3af" },
  ".language-css .token.string": { color: "#8a8a8a" },
  ".style .token.string": { color: "#8a8a8a" },
  variable: { color: "#b8bcc0" },
  atrule: { color: "#b0b4b8" },
  "attr-value": { color: "#8a8a8a" },
  function: { color: "#a8a8a8" }, // Lighter gray for functions
  "class-name": { color: "#b8bcc0" },
  keyword: { color: "#c5c5c5", fontWeight: "600" }, // Light gray for keywords
  regex: { color: "#9ca3af" },
  important: { color: "#CE7B3A", fontWeight: "bold" }, // Rust orange for important
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  namespace: { color: "#CE7B3A" }, // Rust orange for namespaces/crates
  "maybe-class-name": { color: "#b8bcc0" },
  "property-access": { color: "#a8a8a8" },
};

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  let codeBlockIndex = -1;

  const handleCopy = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none
      prose-headings:text-gray-200 prose-headings:font-semibold
      prose-p:text-gray-400 prose-p:leading-7
      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-300 prose-strong:font-bold
      prose-ul:text-gray-400 prose-ol:text-gray-400
      prose-li:text-gray-400 prose-li:marker:text-gray-500
      prose-code:text-[#CE7B3A] prose-code:bg-gray-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium
      prose-code:before:content-[''] prose-code:after:content-['']
      prose-hr:border-gray-700
      prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-500
      prose-h1:border-b prose-h1:border-gray-800 prose-h1:pb-2
      prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2
      prose-table:text-gray-400
      prose-thead:border-gray-700
      prose-tr:border-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom code block renderer with IDE-style header
          pre: ({ children, ...props }) => {
            codeBlockIndex++;
            const currentIndex = codeBlockIndex;
            const isCopied = copiedIndex === currentIndex;

            // Extract code content and language
            let code = "";
            let language = "text";

            if (children && typeof children === "object" && "props" in children) {
              const codeProps = children.props;
              if (codeProps.children && typeof codeProps.children === "string") {
                code = codeProps.children;
              }
              if (codeProps.className) {
                const match = codeProps.className.match(/language-(\w+)/);
                if (match) language = match[1];
              }
            }

            const languageColors: Record<string, string> = {
              rust: "from-[#CE7B3A] to-[#A0522D]", // Earth tones inspired by Rust
              typescript: "from-blue-600/80 to-blue-700/80",
              javascript: "from-yellow-600/80 to-amber-600/80",
              python: "from-blue-500/80 to-blue-600/80",
              bash: "from-green-600/80 to-emerald-700/80",
              go: "from-cyan-600/80 to-blue-600/80",
              json: "from-gray-500 to-gray-600",
              sql: "from-pink-600/80 to-rose-600/80",
              toml: "from-indigo-500/80 to-purple-500/80",
              yaml: "from-teal-600/80 to-cyan-600/80",
            };

            const gradientColor = languageColors[language.toLowerCase()] || "from-gray-600 to-gray-700";

            return (
              <div className="ide-container-wrapper group relative my-6 overflow-hidden rounded-2xl border border-border/50 bg-[#1e1e1e] shadow-lg not-prose">
                {/* IDE Header */}
                <div className="ide-header flex items-center justify-between border-b border-border/20 bg-[#2d2d2d] px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Traffic lights */}
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer"></div>
                    </div>

                    {/* Language badge */}
                    <div className={`flex h-6 items-center gap-1.5 rounded-md bg-gradient-to-r ${gradientColor} px-2 text-xs font-medium text-white shadow-sm`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 17 10 11 4 5"></polyline>
                        <line x1="12" y1="19" x2="20" y2="19"></line>
                      </svg>
                      <span>{language.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(code, currentIndex)}
                    className="inline-flex items-center gap-2 rounded-lg bg-muted/50 hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:scale-105 active:scale-95"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Code content */}
                <div className="overflow-x-auto">
                  <SyntaxHighlighter
                    language={language}
                    style={rustTheme}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                      fontSize: "14px",
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          },

          // Inline code styling
          code: ({ className, children, ...props }) => {
            const isInline = !className || !className.startsWith("language-");

            if (isInline) {
              return (
                <code className="text-[#CE7B3A] bg-gray-800/50 px-1.5 py-0.5 rounded text-sm font-medium" {...props}>
                  {children}
                </code>
              );
            }

            return <code className={className} {...props}>{children}</code>;
          },

          // Override paragraph styling
          p: ({ children, ...props }) => (
            <p className="!text-gray-400 leading-7 mb-6" {...props}>
              {children}
            </p>
          ),

          // Override heading styling
          h1: ({ children, ...props }) => (
            <h1 className="!text-gray-200 text-3xl font-semibold border-b border-gray-800 pb-2 mb-6 mt-12" {...props}>
              {children}
            </h1>
          ),

          h2: ({ children, ...props }) => (
            <h2 className="!text-gray-200 text-2xl font-semibold border-b border-gray-800 pb-2 mb-4 mt-10" {...props}>
              {children}
            </h2>
          ),

          h3: ({ children, ...props }) => (
            <h3 className="!text-gray-200 text-xl font-semibold mb-3 mt-8" {...props}>
              {children}
            </h3>
          ),

          // Override list styling
          ul: ({ children, ...props }) => (
            <ul className="!text-gray-400 list-disc pl-6 mb-6 space-y-2" {...props}>
              {children}
            </ul>
          ),

          ol: ({ children, ...props }) => (
            <ol className="!text-gray-400 list-decimal pl-6 mb-6 space-y-2" {...props}>
              {children}
            </ol>
          ),

          // eslint-disable-next-line jsx-a11y/no-redundant-roles
          li: ({ children, ...props }) => (
            <li className="!text-gray-400" {...props}>
              {children}
            </li>
          ),

          // Override strong/bold styling
          strong: ({ children, ...props }) => (
            <strong className="!text-gray-300 font-bold" {...props}>
              {children}
            </strong>
          ),

          // Override blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote className="!text-gray-500 border-l-4 border-blue-500 pl-4 italic my-6" {...props}>
              {children}
            </blockquote>
          ),

          // Override link styling
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="!text-blue-400 no-underline hover:underline"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
