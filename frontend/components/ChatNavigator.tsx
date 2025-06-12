import { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { useMessageSummaries } from '../hooks/useConvexData';
import { useAuth } from '../providers/ConvexAuthProvider';
import { useSidebar } from './ui/sidebar';

interface MessageNavigatorProps {
  threadId: string;
  scrollToMessage: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

function PureChatNavigator({
  threadId,
  scrollToMessage,
  isVisible,
  onClose,
}: MessageNavigatorProps) {
  const { user } = useAuth();
  const { position } = useSidebar();
  const messageSummaries = useMessageSummaries(threadId);
  
  // Determine the position based on sidebar position
  const navigatorPosition = position === 'right' ? 'left-0' : 'right-0';

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed ${navigatorPosition} top-0 h-full w-80 bg-background border-l border-r z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible 
            ? 'translate-x-0' 
            : position === 'right' 
              ? '-translate-x-full' 
              : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-medium">Chat Navigator</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close navigator"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            <ul className="flex flex-col gap-2 p-4 prose prose-sm dark:prose-invert list-disc pl-5 h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full">
              {messageSummaries?.map((summary) => (
                <li
                  key={summary._id}
                  onClick={() => {
                    scrollToMessage(summary.messageId);
                  }}
                  className="cursor-pointer hover:text-foreground transition-colors"
                >
                  {summary.content.slice(0, 100)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(PureChatNavigator, (prevProps, nextProps) => {
  return (
    prevProps.threadId === nextProps.threadId &&
    prevProps.isVisible === nextProps.isVisible
  );
});
