import { useQuery, useRealm } from "@realm/react";
import { useEffect, useState } from "react";
import { useAuth0 } from "react-native-auth0";
import { MessageSchema } from "../schemas/MessageSchema";
import * as signalR from "@microsoft/signalr";
import { appConfig } from "../constants/appConfig";
import { BSON } from "realm";

export default function useMessaging() {
  const { user, getCredentials } = useAuth0();
  const isAuthenticated = user !== undefined && user !== null;
  const realm = useRealm();

  const [connection, setConnection] = useState<signalR.HubConnection>();

  const notSentMessages =
    useQuery(MessageSchema).filtered("status = 'notSent'");

  const handleReceiveMessage = async (
    conversation: {},
    message: { clientId: string }
  ) => {
    console.log("Received message: ", conversation, message);
    const clientId = message.clientId;
    const localMessage = realm.objectForPrimaryKey(
      MessageSchema,
      new BSON.ObjectId(clientId)
    );
    if (localMessage) {
      realm.write(() => {
        localMessage.status = "sent";
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        const { accessToken } = (await getCredentials())!;
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${appConfig.API_URL}/chat`, {
            accessTokenFactory: () => accessToken,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
          })
          .withAutomaticReconnect()
          .build();

        connection
          .start()
          .then(() => {
            console.log("Connection started");
          })
          .catch((error) => {
            console.error("Error starting connection: ", error);
          });

        connection.on("ReceiveMessage", handleReceiveMessage);
        setConnection(connection);
      })();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (
      connection?.state !== signalR.HubConnectionState.Connected ||
      notSentMessages.length === 0
    ) {
      console.log("Connection not ready or no messages to send");
      return;
    }
    notSentMessages.forEach((msg: MessageSchema) => {
      console.log("Sending message: ", msg.cId);
      connection
        ?.invoke(
          "SendMessage",
          msg.conversation.sId,
          msg.conversation.users.map((u) => u.id).join(","),
          msg.text,
          msg.cId.toString()
        )
        .then(() => {
          console.log("...sent");
        })
        .catch((error) => {
          console.error("Error sending message: ", error);
        })
        .finally(() => {});
    });
  }, [connection, notSentMessages]);

  return { connection };
}
