

'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, BookOpen } from 'lucide-react'; // Using BookOpen for lesson content
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or choose another theme


interface SlideTextContentViewProps {
  markdownContent: string | null;
  lessonName?: string;
}

export default function SlideTextContentView({ markdownContent, lessonName }: SlideTextContentViewProps) {
  if (!markdownContent) {
    return (
      <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
        <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
        No textual content available for this lesson yet, or content is still loading.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-card/60 backdrop-blur-sm rounded-lg shadow-lg border border-border/20">
      <header className="p-3 border-b border-border/30 flex-shrink-0 bg-background/30 rounded-t-lg flex items-center justify-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-primary header-glow">
          Lesson Notes: {lessonName || "Current Lesson"}
        </h2>
      </header>
      <ScrollArea className="flex-grow">
        <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none p-4 md:p-6">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize heading rendering to match futuristic theme if needed
              h1: ({node, ...props}) => <h2 className="text-primary header-glow !mb-3 !mt-4 border-b border-primary/30 pb-1" {...props} />,
              h2: ({node, ...props}) => <h3 className="text-primary/90 !mb-2 !mt-3 border-b border-border/50 pb-1" {...props} />,
              h3: ({node, ...props}) => <h4 className="text-foreground !mb-1.5 !mt-2.5" {...props} />,
              // Add p renderer to control paragraph font size
              p: ({node, ...props}) => <p className="text-s" {...props} />,
              // Code block highlighting
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus} // Choose your theme
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md !bg-muted/50 !p-3 shadow-inner border border-border/50 !text-sm" // Tailwind classes for styling
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-muted/40 text-foreground px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-border/30" {...props}>
                    {children}
                  </code>
                )
              },
              // Customize other elements as needed, e.g., blockquotes, links
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground text-xs" {...props} />,
              a: ({node, ...props}) => <a className="text-primary hover:text-primary/80 underline" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc space-y-1 pl-5 marker:text-primary text-xs" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal space-y-1 pl-5 marker:text-primary text-xs" {...props} />,
              table: ({node, ...props}) => <table className="w-full border-collapse border border-border/30 my-3" {...props} />,
              th: ({node, ...props}) => <th className="border border-border/30 px-2 py-1 bg-muted/20 text-left" {...props} />,
              td: ({node, ...props}) => <td className="border border-border/30 px-2 py-1" {...props} />,

            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </article>
      </ScrollArea>
    </div>
  );
}

