import { useEffect, useRef } from "react";
import { Message, MessageAction } from "@schemas/index";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { BSON, UpdateMode } from "realm";
import { appConfig } from "constants/appConfig";

export function useMessage(connection: signalR.HubConnection | undefined) {
  usePostMessage(connection);
}

function usePostMessage(connection: signalR.HubConnection | undefined) {
  const createdMessageActions =
    useQuery(MessageAction).filtered("status = 'created'");
  const realm = useRealm();

  const handleReceiveMessage = async (message: {
    clientMessageId: string;
    conversationId: number;
  }) => {
    const clientId = message.clientMessageId;
    console.log("clientId: ", clientId);
    const msg = realm.objectForPrimaryKey(Message, new BSON.ObjectId(clientId));
    if (!msg) {
      realm.write(() => {
        realm.create(Message, {
          _id: new BSON.ObjectId(clientId),
          conversation: null,
          status: "received",
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
        const response = await fetch(
          `${appConfig.API_URL}/conversations/messages`,
          {
            method: "POST",
            body: JSON.stringify({
              ConversationId: message.conversation.sId,
              MemberIds: message.conversation.users.map((u) => u.id),
              Text: message.text,
            }),
          }
        );
        if (response.ok) {
          realm.write(() => {
            message.status = "sent";
            realm.delete(action);
          });
        }
      });
    };

    sendMessages();
  }, [createdMessageActions]);
}
