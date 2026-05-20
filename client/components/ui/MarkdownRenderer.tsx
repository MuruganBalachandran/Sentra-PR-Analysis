import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Basic wrapper customized with our tailwind classes
export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-full prose-gray leading-relaxed text-[13px] break-words
      prose-p:mt-0 prose-p:mb-2 
      prose-h1:text-base prose-h1:font-bold prose-h1:mt-4 prose-h1:mb-2
      prose-h2:text-[14px] prose-h2:font-bold prose-h2:mt-3 prose-h2:mb-1.5
      prose-h3:text-[13px] prose-h3:font-bold prose-h3:mt-2
      prose-ul:my-2 prose-ul:pl-4 prose-ul:list-disc
      prose-ol:my-2 prose-ol:pl-4 prose-ol:list-decimal
      prose-li:my-0.5
      prose-hr:my-3 prose-hr:border-gray-200
      prose-strong:font-bold prose-strong:text-gray-900
      prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
      prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded prose-code:text-[12px] prose-code:break-words
      prose-pre:bg-gray-100 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:max-w-full
      prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:text-gray-700 prose-blockquote:italic"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
