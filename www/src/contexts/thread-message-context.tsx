import {createContext, useContext, useState} from 'react';

const ThreadMessageContext = createContext<{
  threadId: string | null;
  onThreadIdChange: (threadId: string | null) => void;
}>({
  threadId: null,
  onThreadIdChange: () => {},
});

export function ThreadMessageContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [threadId, setThreadId] = useState<string | null>(null);

  return (
    <ThreadMessageContext.Provider
      value={{threadId, onThreadIdChange: setThreadId}}
    >
      {children}
    </ThreadMessageContext.Provider>
  );
}

export function useThreadMessageContext() {
  return useContext(ThreadMessageContext);
}
