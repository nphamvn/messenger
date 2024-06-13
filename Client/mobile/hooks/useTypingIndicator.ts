import { useRealm } from "@realm/react";
import { Conversation } from "@schemas/index";
import { useEffect, useState } from "react";
import useAppDelegate from "./useAppDelegate";

export default function useTypingIndicator() {
  const { connection } = useAppDelegate();
  const realm = useRealm();

  const [typingConversations, setTypingConversations] = useState<
    {
      conversation: Conversation;
      typingUsers: {
        userId: string;
        lastTypingAt: Date;
      }[];
    }[]
  >([]);

  const handleReceiveTypingIndicator = ({
    conversationId,
    userId,
  }: {
    conversationId: number;
    userId: string;
  }) => {
    const conversation = realm.objectForPrimaryKey(
      Conversation,
      conversationId
    );
    if (!conversation) {
      return;
    }

    const typingConversation = typingConversations.find(
      (tc) => tc.conversation === conversation
    );
    if (typingConversation) {
      const typingUser = typingConversation.typingUsers.find(
        (tu) => tu.userId === userId
      );
      if (typingUser) {
        typingUser.lastTypingAt = new Date();
      } else {
        typingConversation.typingUsers.push({
          userId,
          lastTypingAt: new Date(),
        });
      }
      setTypingConversations([...typingConversations]);
    } else {
      setTypingConversations([
        ...typingConversations,
        {
          conversation,
          typingUsers: [
            {
              userId,
              lastTypingAt: new Date(),
            },
          ],
        },
      ]);
    }
  };
  useEffect(() => {
    connection?.on("ReceiveTypingIndicator", handleReceiveTypingIndicator);
    return () => {
      connection?.off("ReceiveTypingIndicator", handleReceiveTypingIndicator);
    };
  }, [connection]);

  return typingConversations;
}

export function useConversationTypingIndicator(
  conversation: Conversation | null
) {
  const typingConversations = useTypingIndicator();

  if (!conversation) {
    return [];
  }

  return (
    typingConversations.find(
      (tc) => tc.conversation.cId.toString() === conversation.cId.toString()
    )?.typingUsers ?? []
  );
}
