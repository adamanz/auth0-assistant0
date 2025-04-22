import { NextRequest, NextResponse } from 'next/server';
import { type Message, LangChainAdapter } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage } from '@langchain/core/messages';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { GmailSearch } from '@langchain/community/tools/gmail';
import { GmailCreateDraft } from '@langchain/community/tools/gmail';
import { GoogleCalendarCreateTool, GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';

import { getGoogleAccessToken } from '@/lib/auth0';
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { logToolCallsInDevelopment } from '@/utils/stream-logging';

const AGENT_SYSTEM_TEMPLATE = `You are Simple, your friendly personal assistant who keeps it simple. I'm here to help with tasks, answer questions, and make your life easier with these powerful tools at my disposal:

1. Calculator: I can solve math problems and perform calculations for you.
2. Web Search: I can search the internet for current information, news, or facts.
3. Gmail: I can search your emails and create email drafts.
4. Google Calendar: I can view your calendar and create new events.

I'll proactively suggest using these tools when they can help with your request.

When I need more information to help you effectively:
- I'll ask specific, clear questions to get the details I need
- For calendar events, I'll ask for date, time, title, and any other missing information
- For emails, I'll ask for recipient, subject, and content details if not provided
- I won't guess critical information that could lead to errors

Formatting Guidelines:
Calendar Events:  
Date: YYYY-MM-DD  
Time: HH:MM - HH:MM  
Event Name: Bold and clear  
Location: Where it's at  
Summary: One short sentence

Emails:  
Clean markdown for clarity  
Summarize long emails  
Keep it neat and simple

General Tips:  
Short and sweet  
Consistent spacing  
Readability is key!

Let's get started—I'm here to help with a smile!`;

/**
 * This handler initializes and calls an tool calling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? [])
      .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
      .map(convertVercelMessageToLangChainMessage);

    // Check for required API keys
    if (!process.env.GOOGLE_API_KEY) {
      console.error('Missing GOOGLE_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Gemini API key' },
        { status: 500 }
      );
    }

    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash-preview-04-17',
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });

    // Create basic tools that don't require Google integration
    const basicTools = [new Calculator()];
    
    // Add SerpAPI if the API key is available
    if (process.env.SERPAPI_API_KEY) {
      basicTools.push(new SerpAPI(process.env.SERPAPI_API_KEY));
    } else {
      console.warn('SERPAPI_API_KEY not configured - web search functionality will be unavailable');
    }

    try {
      // Get the access token via Auth0
      const accessToken = await getGoogleAccessToken();
      
      if (!accessToken) {
        console.warn('No Google access token available - falling back to basic tools');
        // Instead of throwing, continue with basic tools only
        const fallbackAgent = createReactAgent({
          llm,
          tools: basicTools,
          messageModifier: new SystemMessage(
            AGENT_SYSTEM_TEMPLATE + 
            `\n\nNOTE: Google integrations (Gmail, Calendar) are currently unavailable. You don't have permission to access Google services.` +
            `\n\nTo fix this issue: Please sign out, then sign back in and make sure to allow all requested permissions.`
          ),
        });
        
        const eventStream = fallbackAgent.streamEvents({ messages }, { version: 'v2' });
        const transformedStream = logToolCallsInDevelopment(eventStream);
        return LangChainAdapter.toDataStreamResponse(transformedStream);
      }
      
      console.log('Successfully retrieved Google access token, initializing tools');
      
      // Provide the access token to the Gmail tools
      const gmailParams = {
        credentials: { accessToken },
      };

      const googleCalendarParams = {
        credentials: { accessToken, calendarId: 'primary' },
        model: llm,
      };

      // Create all tools including Google integrations
      const tools = [
        ...basicTools,
        new GmailSearch(gmailParams),
        new GmailCreateDraft(gmailParams),
        new GoogleCalendarCreateTool(googleCalendarParams),
        new GoogleCalendarViewTool(googleCalendarParams),
      ];
      
      console.log('Successfully created Google tools, creating agent');
      
      /**
       * Use a prebuilt LangGraph agent.
       */
      const agent = createReactAgent({
        llm,
        tools,
        /**
         * Modify the stock prompt in the prebuilt agent. See docs
         * for how to customize your agent:
         *
         * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
         */
        messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
      });

      /**
       * Stream back all generated tokens and steps from their runs.
       *
       * See: https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/
       */
      const eventStream = agent.streamEvents({ messages }, { version: 'v2' });

      // Log tool calling data. Only in development mode
      const transformedStream = logToolCallsInDevelopment(eventStream);
      // Adapt the LangChain stream to Vercel AI SDK Stream
      return LangChainAdapter.toDataStreamResponse(transformedStream);
    } catch (googleError: any) {
      console.error("Google API access error:", googleError);
      
      // Provide more detailed error messages
      let errorContext = "Google integration error";
      if (googleError.message?.includes('insufficient authentication scopes')) {
        errorContext = "Insufficient Google API permissions. The app needs additional permissions to access your Google data.";
      } else if (googleError.message?.includes('token')) {
        errorContext = "Authentication token error. Please try logging out and back in to refresh your permissions.";
      }
      
      // Fall back to using LLM without Google tools
      console.log("Falling back to LLM without Google integrations");
      
      const fallbackAgent = createReactAgent({
        llm,
        tools: basicTools,
        messageModifier: new SystemMessage(
          AGENT_SYSTEM_TEMPLATE + 
          `\n\nNOTE: Google integrations (Gmail, Calendar) are currently unavailable: ${errorContext}. Please try logging out and back in with Google to fix this issue.`
        ),
      });
      
      const eventStream = fallbackAgent.streamEvents({ messages }, { version: 'v2' });
      const transformedStream = logToolCallsInDevelopment(eventStream);
      return LangChainAdapter.toDataStreamResponse(transformedStream);
    }
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ error: e.message || 'Unknown server error' }, { status: e.status ?? 500 });
  }
}