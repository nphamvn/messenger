import { useEffect } from "react";
import { Message, MessageAction } from "@schemas/index";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { BSON } from "realm";
import { appConfig } from "constants/appConfig";
import useData from "./useData";
import { useAuth0 } from "react-native-auth0";

export function useMessage(connection: signalR.HubConnection | undefined) {
  usePostMessage(connection);
}

function usePostMessage(connection: signalR.HubConnection | undefined) {
  const { getCredentials } = useAuth0();
  const createdMessageActions =
    useQuery(MessageAction).filtered("status = 'created'");
  const realm = useRealm();
  const { getUser, getConversation } = useData();

  const handleReceiveMessage = async (message: {
    Id: number;
    ClientMessageId: string;
    ConversationId: number;
    SenderId: string;
    Text: string;
  }) => {
    console.log("Received message: ", message);
    const msg = realm.objects(Message).filtered(`sId = ${message.Id}`)[0];
    if (msg) {
      console.log("Message already exists: ", msg, msg);
      return;
    }
    console.log("Message does not exist.");

    const conversation = await getConversation(message.ConversationId);
    if (!conversation) {
      console.log("No conversation found for id: ", message.ConversationId);
      return;
    }

    const sender = await getUser(message.SenderId);
    if (!sender) {
      console.log("No sender found for id: ", message.SenderId);
      return;
    }

    console.log("Creating message: ", message);
    realm.write(() => {
      realm.create(Message, {
        cId: new BSON.ObjectId(),
        sId: message.Id,
        conversation: conversation,
        sender: sender,
        text: message.Text,
      });
    });
  };

  useEffect(() => {
    connection?.on("ReceiveMessage", handleReceiveMessage);
    return () => {
      connection?.off("ReceiveMessage", handleReceiveMessage);
    };
  }, [connection]);

  useEffect(() => {
    const sendMessages = async () => {
      const actionIds = createdMessageActions.map((action) => action._id);
      const accessToken = (await getCredentials())?.accessToken;
      for (let index = 0; index < actionIds.length; index++) {
        const actionId = actionIds[index];
        const action = realm.objectForPrimaryKey(MessageAction, actionId);
        if (!action) {
          console.log("No action found for id: ", actionId);
          continue;
        }
        const message = realm.objectForPrimaryKey(Message, action.message.cId);
        if (!message) {
          console.log("No message found for action: ", action);
          realm.write(() => {
            realm.delete(action);
            realm.delete(message);
          });
          continue;
        }

        const response = await fetch(
          `${appConfig.API_URL}/conversations/messages`,
          {
            method: "POST",
            body: JSON.stringify({
              ConversationId: message.conversation.sId ?? null,
              MemberIds: message.conversation.members.map((u) => u.id),
              Text: message.text,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.ok) {
          const { id, conversationId } = await response.json();
          console.log(
            "Message sent: id: ",
            id,
            ", conversationId: ",
            conversationId
          );
          realm.write(() => {
            message.sId = id;
            message.status = "sent";
            if (!message.conversation.sId) {
              message.conversation.sId = conversationId;
            }
            realm.delete(action);
          });
        }
      }
    };

    sendMessages();
  }, [createdMessageActions]);
}
