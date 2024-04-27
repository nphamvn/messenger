import { useContext, useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import IConversation from "../models/IConversation";
import ConnectionContext from "./connectionContext";
import { useReferredState } from "../utils/useReferredState";
import { IMessage } from "../models/IMessage";

type MessageInput = {
  message: string;
};

export default function ConversationWindow({
  contactId,
  conversationId,
}: {
  contactId?: string;
  conversationId?: string;
}) {
  const { getAccessTokenSilently, user } = useAuth0();
  const conversationRef = useRef<IConversation>();

  const [messages, messagesRef, setMessages] = useReferredState<IMessage[]>([]);
  const sortedMessages = messages.sort((a, b) => {
    if (a.id > b.id) return -1;
    if (a.id < b.id) return 1;
    return 0;
  });

  const connection = useContext(ConnectionContext);
  useEffect(() => {
    const fetchMessages = async () => {
      let messages: IMessage[] = [];
      const accessToken = await getAccessTokenSilently();
      if (conversationId) {
        console.log("Fetching messages for conversation", conversationId);
        messages = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ).then((res) => res.json() as Promise<IMessage[]>);
      } else if (contactId) {
        console.log("Fetching private conversation with user", contactId);
        const response = await fetch(
          `/api/conversations/private/${contactId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.ok) {
          const conversation = await response.json();
          conversationRef.current = conversation;
          messages = await fetch(
            `/api/conversations/${conversation.id}/messages`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          ).then((res) => res.json() as Promise<IMessage[]>);
        }
      }
      setMessages(messages.map((msg) => ({ ...msg, status: "sent" })));
    };
    fetchMessages();
  }, []);

  const handleReceiveMessage = (
    conversation: IConversation,
    message: IMessage
  ) => {
    console.log("Received message", message);
    if (!conversationRef.current) {
      conversationRef.current = conversation;
    }
    const msg = messagesRef.current.find(
      (m) => m.clientId === message.clientId
    );
    let newMessages: IMessage[];
    if (msg) {
      newMessages = messagesRef.current.map((msg) => {
        if (msg.clientId === message.clientId) {
          return {
            ...msg,
            id: message.id,
            createdAt: message.createdAt,
            status: "sent",
          };
        }
        return msg;
      });
    } else {
      newMessages = [...messagesRef.current, message];
    }
    setMessages(newMessages);
  };

  const handleReceiveTypingIndicator = () => {};

  useEffect(() => {
    if (connection) {
      connection.on("ReceiveMessage", handleReceiveMessage);
      connection.on("ReceiveTypingIndicator", handleReceiveTypingIndicator);
    }

    return () => {
      connection?.off("ReceiveMessage", handleReceiveMessage);
      connection?.off("ReceiveTypingIndicator", handleReceiveTypingIndicator);
    };
  }, [connection]);

  const { handleSubmit, register, reset } = useForm<MessageInput>();

  const onSubmit = (messageInput: MessageInput) => {
    const newMessage: IMessage = {
      id: Math.max(...messagesRef.current.map((msg) => msg.id)) + 1,
      senderId: user!.sub!,
      text: messageInput.message,
      createdAt: new Date().toString(),
      clientId: uuidv4(),
      status: "sending",
    };
    const newMessages = [...messagesRef.current, newMessage];
    setMessages(newMessages);
    connection
      ?.invoke(
        "SendMessage",
        conversationRef.current?.id || null,
        conversationRef.current?.members.map((m) => m.id).join(",") ||
          [contactId].join(","),
        messageInput.message,
        newMessage.clientId
      )
      .then(() => {
        console.log("Message sent");
        reset();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const timer = useRef<number>();
  const [typing, setTyping] = useState(false);
  const handleMessageInput = () => {
    console.log("Typing...");
    if (timer.current) {
      console.log("Clearing timer");
      window.clearTimeout(timer.current);
    }
    setTyping(true);
    console.log("Setting timer");
    timer.current = window.setTimeout(() => {
      setTyping(false);
    }, 2000);
  };
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!connection) {
      console.log("Connection not set");
      return;
    }
    if (!conversationRef.current) {
      console.log("Conversation not set");
      return;
    }
    console.log(
      "Sending typing indicator. Typing:",
      typing,
      "Conversation:",
      conversationRef.current.id
    );
    connection
      .invoke("SendTypingIndicator", conversationRef.current.id, typing)
      .then(() => {
        console.log("Typing indicator sent");
      })
      .catch((err) => {
        console.error(err);
      });
  }, [typing]);

  return (
    <div className="max-w-2xl">
      <section className="container mx-auto flex max-h-96 flex-col-reverse overflow-y-auto p-4">
        {sortedMessages.map((message) => {
          if (message.senderId === user!.sub!) {
            return (
              <div key={message.id} className="flex items-center justify-start">
                <div className="w-3 overflow-hidden">
                  <div className="h-2 origin-bottom-right rotate-45 transform rounded-sm bg-green-400"></div>
                </div>
                <div className="my-1 rounded bg-green-400 px-3">
                  {message.text}
                </div>
              </div>
            );
          } else {
            return (
              <div key={message.id} className="flex items-center justify-end">
                <div className="my-1 rounded-lg bg-blue-200 px-2 py-1.5">
                  {message.text}
                </div>
                <div className="w-3 overflow-hidden ">
                  <div className="h-4 origin-top-left rotate-45 transform rounded-sm bg-blue-200"></div>
                </div>
              </div>
            );
          }
        })}
      </section>
      <form onSubmit={handleSubmit(onSubmit)} className="absolute bottom-0">
        <div className="flex space-x-1">
          <div
            id="typingIndicator"
            style={{ display: typing ? "block" : "none" }}
          >
            Typing...
          </div>
          <input
            type="text"
            {...register("message", { required: true })}
            onInput={handleMessageInput}
            className="w-full border"
          />
          <button type="submit" className="ms-auto">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
