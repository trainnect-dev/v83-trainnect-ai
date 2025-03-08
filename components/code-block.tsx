'use client';

import React from 'react';

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  if (!inline) {
    // To fix hydration errors when rendered inside <p> tags, we need to use React.Fragment
    // instead of div elements when this component might be inside a paragraph
    return (
      // Using a code element directly without wrapping divs to avoid nesting issues
      <code
        {...props}
        className={`block text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
        style={{ whiteSpace: 'pre', display: 'block' }}
      >
        {children}
      </code>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
