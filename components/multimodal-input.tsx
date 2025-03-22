'use client';

import { useRef, useEffect, useState, Dispatch, SetStateAction, memo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpIcon, PaperclipIcon, SearchIcon, XCircleIcon } from 'lucide-react';
import { ChatTools } from '@/components/chat-tools';
import { SuggestedActions } from '@/components/suggested-actions';
import type { Attachment, Message, CreateMessage, ChatRequestOptions } from 'ai';
import equal from 'fast-deep-equal';
import { sanitizeUIMessages } from '@/lib/utils';

interface MultimodalInputProps {
  className?: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  setMessages: (messages: Message[]) => void;
  chatId: string;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: Message[];
  handleSubmit: (
    event?: { preventDefault?: () => void },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
}

function MultimodalInputBase({
  className,
  input,
  setInput,
  isLoading,
  stop,
  append,
  setMessages,
  chatId,
  attachments,
  setAttachments,
  messages,
  handleSubmit,
}: MultimodalInputProps) {
  const [showSearchTools, setShowSearchTools] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types
    const validFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const invalidFiles = files.filter(file => !validFileTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast.error('Only JPEG, PNG, WebP images and PDF files are supported');
      return;
    }

    // Validate file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error('Files must be smaller than 10MB');
      return;
    }

    toast.info(`Uploading ${files.length} file(s)...`);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        return {
          url: data.url,
          name: data.pathname,
          contentType: data.contentType,
        };
      });

      const uploadedAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedAttachments]);
      toast.success(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file(s), please try again');
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (isLoading) {
        toast.error('Please wait for the model to finish its response!');
      } else if (input.trim()) {
        submitForm();
      }
    }
  };

  const submitForm = () => {
    if (input.trim()) {
      handleSubmit(undefined, {
        experimental_attachments: attachments,
      });
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setAttachments([]);
      setShowSearchTools(false); // Hide search tools after submission
    }
  };

  return (
    <div className="relative w-full">
      {messages.length === 0 && attachments.length === 0 && (
        <SuggestedActions append={append} chatId={chatId} />
      )}

      {showSearchTools && (
        <div className="absolute bottom-full mb-4 w-full">
          <ChatTools
            onToolResult={(result) => {
              const newInput = input + (input ? '\n\n' : '') + result;
              setInput(newInput);
              setShowSearchTools(false);
            }}
            isLoading={isLoading}
          />
        </div>
      )}

      <div className="relative flex w-full grow flex-row items-start gap-2 overflow-hidden rounded-md border bg-background px-3 py-4 text-sm ring-offset-background">
        <div className="flex flex-col items-center gap-2 pt-[0.4rem]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFileClick}
            disabled={isLoading}
          >
            <PaperclipIcon className="h-5 w-5" />
            <span className="sr-only">Attach files</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />
        </div>

        <Textarea
          ref={textareaRef}
          tabIndex={0}
          rows={1}
          placeholder="Send a message..."
          spellCheck={false}
          className="min-h-[98px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-visible:outline-none focus-visible:ring-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-2 pt-[0.4rem]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSearchTools(!showSearchTools)}
            disabled={isLoading}
          >
            <SearchIcon className="h-5 w-5" />
            <span className="sr-only">Search tools</span>
          </Button>

          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isLoading || input.trim().length === 0}
            onClick={(e) => {
              e.preventDefault();
              submitForm();
            }}
          >
            <ArrowUpIcon className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-muted p-2"
            >
              <span className="text-sm">{attachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAttachments(prev => prev.filter((_, i) => i !== index));
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const MultimodalInput = memo(
  MultimodalInputBase,
  (prevProps: MultimodalInputProps, nextProps: MultimodalInputProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;
    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={isLoading}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <XCircleIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
