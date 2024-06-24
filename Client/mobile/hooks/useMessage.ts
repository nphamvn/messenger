import { useEffect } from "react";
import { Message, Action } from "@schemas/index";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { BSON, UpdateMode } from "realm";
import { appConfig } from "constants/appConfig";
import useData from "./useData";
import { useAuth0 } from "react-native-auth0";
import { Events } from "constants/Events";

export function useMessage(connection: signalR.HubConnection | undefined) {
  useMessageSender(connection);
  useMessageReceiver(connection);
}

function useMessageReceiver(connection: signalR.HubConnection | undefined) {
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
    const sMsg = realm.objects(Message).filtered(`sId = ${message.Id}`)[0];
    if (sMsg) {
      console.log("Server message exists: ", sMsg);
      return;
    }
    const cMsg = realm.objectForPrimaryKey(
      Message,
      new BSON.ObjectId(message.ClientMessageId)
    );
    if (cMsg) {
      console.log("Client message exists: ", cMsg);
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
      realm.create(
        Message,
        {
          cId: new BSON.ObjectId(message.ClientMessageId),
          sId: message.Id,
          conversation: conversation,
          sender: sender,
          text: message.Text,
          status: "sent",
          createdAt: new Date(),
        },
        UpdateMode.Modified
      );
    });
  };

  useEffect(() => {
    connection?.on(Events.ReceiveMessage, handleReceiveMessage);
    return () => {
      connection?.off(Events.ReceiveMessage, handleReceiveMessage);
    };
  }, [connection]);
}

function useMessageSender(connection: signalR.HubConnection | undefined) {
  const { getCredentials } = useAuth0();
  const realm = useRealm();

  const sendMessageActions = useQuery(Action).filtered("type = 'SEND_MESSAGE'");

  useEffect(() => {
    const sendMessages = async () => {
      const actionIds = sendMessageActions.map((action) => action._id);
      const accessToken = (await getCredentials())?.accessToken;
      for (let index = 0; index < actionIds.length; index++) {
        const action = realm.objectForPrimaryKey(Action, actionIds[index]);
        if (!action) {
          console.log("No action found for id: ", actionIds[index]);
          continue;
        }
        const { messageId } = JSON.parse(action.payload);
        const message = realm.objectForPrimaryKey(
          Message,
          new BSON.ObjectId(messageId)
        );
        console.log("message: ", message);
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
              ClientMessageId: message.cId.toString(),
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
  }, [sendMessageActions]);
}
