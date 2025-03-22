import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInterface } from './search/search-interface';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processPrompt } from '@/lib/prompt-manager/utils/template';
import { SEARCH_PROMPT } from '@/lib/prompt-manager/templates/search';
import { Loader2, Search, Wand2 } from 'lucide-react';

interface ChatToolsProps {
  onToolResult: (result: string) => void;
  isLoading?: boolean;
}

export function ChatTools({ onToolResult, isLoading }: ChatToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchResult = (result: string) => {
    onToolResult(result);
    setIsExpanded(false);
  };

  return (
    <div className="relative">
      <div className="absolute bottom-0 right-0 mb-2 mr-2 flex gap-2">
        {isLoading && (
          <Button variant="outline" size="icon" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
        )}
      </div>
      {isExpanded && (
        <Card className="absolute bottom-full right-0 mb-2 w-[600px] p-4">
          <Tabs defaultValue="search">
            <TabsList className="mb-4">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Web Search
              </TabsTrigger>
              <TabsTrigger value="prompts">
                <Wand2 className="h-4 w-4 mr-2" />
                Prompt Templates
              </TabsTrigger>
            </TabsList>
            <TabsContent value="search">
              <SearchInterface
                onResultSelect={handleSearchResult}
                className="w-full"
              />
            </TabsContent>
            <TabsContent value="prompts">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">
                  Select a prompt template to use in your conversation.
                </p>
                {/* Add prompt template selector here */}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
