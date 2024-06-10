import { useEffect, useRef } from "react";
import { Message, MessageAction, AckMessage } from "@schemas/index";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { BSON, UpdateMode } from "realm";

export function useMessage(connection: signalR.HubConnection | undefined) {
  const createdMessageActions =
    useQuery(MessageAction).filtered("status = 'created'");
  const realm = useRealm();

  const handleReceiveMessage = async (
    conversation: {},
    message: { clientMessageId: string }
  ) => {
    console.log("Received message: ", conversation, message);
    const clientId = message.clientMessageId;
    console.log("clientId: ", clientId);
    const msg = realm.objectForPrimaryKey(Message, new BSON.ObjectId(clientId));
    if (msg) {
      console.log("Message found: ", msg, ". Updating status to sent.");
      realm.write(() => {
        msg.status = "sent";
      });
    } else {
      console.log("Message not found: ", clientId);
    }
  };

  const handleReceiveAckMessage = (ackiId: string, error?: string) => {
    console.log("Received ack: ", ackiId, error);
    realm.write(() => {
      realm.create(
        AckMessage,
        { _id: new BSON.ObjectId(ackiId), error },
        UpdateMode.Modified
      );
    });
  };
  const intervalRef = useRef<number>();
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const inProgressMessageActions = realm
        .objects(MessageAction)
        .filtered("status = 'inProgress'");

      inProgressMessageActions.forEach((action: MessageAction) => {
        const ackMessage = realm.objectForPrimaryKey(AckMessage, action._id);
        if (ackMessage) {
          if (!ackMessage.error) {
            console.log("done. delete action and ackMessage");
            realm.write(() => {
              realm.delete(action);
              realm.delete(ackMessage);
            });
          }
        }
      });
    }, 1000);
    return () => {
      console.log("Clearing interval");
      window.clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    connection?.on("ReceiveMessage", handleReceiveMessage);
    connection?.on("ReceiveAckMessage", handleReceiveAckMessage);
    return () => {
      connection?.off("ReceiveMessage", handleReceiveMessage);
      connection?.off("ReceiveAckMessage", handleReceiveAckMessage);
    };
  }, [connection]);

  useEffect(() => {
    if (connection?.state !== signalR.HubConnectionState.Connected) {
      console.log("Connection not ready");
      return;
    }
    if (createdMessageActions.length === 0) {
      console.log("No messages to send");
      return;
    }

    createdMessageActions.forEach((action: MessageAction) => {
      console.log("Processing action: ", action);
      if (action.action === "send") {
        const msg = action.message;
        connection
          ?.invoke(
            "SendMessage",
            msg.conversation.sId,
            msg.cId.toString(),
            msg.conversation.users.map((u) => u.id).join(","),
            msg.text,
            msg.cId.toString(),
            action._id.toString()
          )
          .then(() => {
            console.log("...sent");
            realm.write(() => {
              action.status = "inProgress";
            });
          })
          .catch((error) => {
            console.error("Error sending message: ", error);
          })
          .finally(() => {});
      }
    });
  }, [createdMessageActions, connection]);
}
