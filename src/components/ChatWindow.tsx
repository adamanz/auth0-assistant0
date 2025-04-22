'use client';

import { type Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { ArrowDown, ArrowUpIcon, LoaderCircle, AlertCircleIcon, RefreshCcw } from 'lucide-react';

import { ChatMessageBubble } from '@/components/ChatMessageBubble';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m, i) => {
        return <ChatMessageBubble key={m.id} message={m} aiEmoji={props.aiEmoji} />;
      })}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button variant="outline" className={props.className} onClick={() => scrollToBottom()}>
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();
        props.onSubmit(e);
      }}
      className={cn('flex w-full flex-col', props.className)}
    >
      <div className="border border-input bg-background rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          disabled={props.disabled}
          className="border-none outline-none bg-transparent p-4"
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>

          <Button
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            type="submit"
            disabled={props.loading || props.disabled}
          >
            {props.loading ? <LoaderCircle className="animate-spin" /> : <ArrowUpIcon size={14} />}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ErrorNotification(props: { 
  error: Error | null;
  onRetry: () => void;
}) {
  if (!props.error) return null;
  
  return (
    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 mb-4 max-w-[768px] mx-auto w-full flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircleIcon className="w-5 h-5" />
        <div>
          <p className="font-semibold">Error connecting to agent</p>
          <p className="text-sm">{props.error.message || "Try logging out and back in to refresh permissions"}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={props.onRetry} className="gap-1">
        <RefreshCcw className="w-3 h-3" />
        <span>Retry</span>
      </Button>
    </div>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  // scrollRef will also switch between overflow: unset to overflow: auto
  return (
    <div
      ref={context.scrollRef}
      style={{ width: '100%', height: '100%' }}
      className={cn('grid grid-rows-[1fr,auto]', props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
}) {
  const [hasError, setHasError] = useState<Error | null>(null);
  
  const chat = useChat({
    api: props.endpoint,
    onFinish(response) {
      console.log('Final response: ', response?.content);
      setHasError(null);
    },
    onResponse(response) {
      console.log('Response received. Status:', response.status);
      if (!response.ok) {
        // Handle non-200 responses
        response.json().then((data) => {
          setHasError(new Error(data.error || 'Unknown error occurred'));
        }).catch(() => {
          setHasError(new Error(`Request failed with status ${response.status}`));
        });
      } else {
        setHasError(null);
      }
    },
    onError: (e) => {
      console.error('Error: ', e);
      setHasError(e);
      toast.error(`Error while processing your request`, { description: e.message });
    },
  });

  function isChatLoading(): boolean {
    return chat.status === 'streaming';
  }

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isChatLoading()) return;
    setHasError(null);
    chat.handleSubmit(e);
  }
  
  function retryConnection() {
    setHasError(null);
    window.location.href = "/auth/logout?returnTo=/";
  }

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          chat.messages.length === 0 ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <>
              {hasError && <ErrorNotification error={hasError} onRetry={retryConnection} />}
              <ChatMessages
                aiEmoji={props.emoji}
                messages={chat.messages}
                emptyStateComponent={props.emptyStateComponent}
              />
            </>
          )
        }
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            <ChatInput
              value={chat.input}
              onChange={chat.handleInputChange}
              onSubmit={sendMessage}
              loading={isChatLoading()}
              disabled={!!hasError}
              placeholder={hasError ? 'Please retry connection before sending messages' : props.placeholder ?? 'What can I help you with?'}
            ></ChatInput>
          </div>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  );
}
