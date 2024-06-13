import { useEffect } from "react";
import { Message, MessageAction } from "@schemas/index";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { BSON } from "realm";
import { appConfig } from "constants/appConfig";
import useData from "./useData";

export function useMessage(connection: signalR.HubConnection | undefined) {
  usePostMessage(connection);
}

function usePostMessage(connection: signalR.HubConnection | undefined) {
  const createdMessageActions =
    useQuery(MessageAction).filtered("status = 'created'");
  const realm = useRealm();
  const { getUser, getConversation } = useData();

  const handleReceiveMessage = async (message: {
    id: number;
    clientMessageId: string;
    conversationId: number;
    senderId: string;
  }) => {
    const clientId = message.clientMessageId;
    const msg = realm.objectForPrimaryKey(Message, new BSON.ObjectId(clientId));
    if (!msg) {
      const conversation = await getConversation(message.conversationId);
      if (!conversation) {
        return;
      }

      const sender = await getUser(message.senderId);
      if (!sender) {
        return;
      }

      realm.write(() => {
        realm.create(Message, {
          cId: new BSON.ObjectId(clientId),
          sId: message.id,
          conversation: conversation,
          sender: sender,
        });
      });
    }
  };

  useEffect(() => {
    connection?.on("ReceiveMessage", handleReceiveMessage);
    return () => {
      connection?.off("ReceiveMessage", handleReceiveMessage);
    };
  }, [connection]);

  useEffect(() => {
    const sendMessages = async () => {
      createdMessageActions.forEach(async (action) => {
        const { message } = action;
        console.log("Sending message: ", message);
        const response = await fetch(
          `${appConfig.API_URL}/conversations/messages`,
          {
            method: "POST",
            body: JSON.stringify({
              ConversationId: message.conversation.sId ?? null,
              MemberIds: message.conversation.members.map((u) => u.id),
              Text: message.text,
            }),
          }
        );
        console.log("sendMessages: ", response.status);
        if (response.ok) {
          realm.write(() => {
            console.log("Message sent");
            message.status = "sent";
            realm.delete(action);
          });
        }
      });
    };

    sendMessages();
  }, [createdMessageActions]);
}
