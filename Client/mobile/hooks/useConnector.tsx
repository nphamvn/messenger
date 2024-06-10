import { useEffect, useState } from "react";
import { useAuth0 } from "react-native-auth0";
import * as signalR from "@microsoft/signalr";
import * as signalRMsgPack from "@microsoft/signalr-protocol-msgpack";
import { appConfig } from "../constants/appConfig";

export function useConnector() {
  const { user, getCredentials } = useAuth0();
  const [connection, setConnection] = useState<signalR.HubConnection>();

  const connect = async () => {
    const { accessToken } = (await getCredentials())!;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${appConfig.API_URL}/chat`, {
        accessTokenFactory: () => accessToken,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withHubProtocol(new signalRMsgPack.MessagePackHubProtocol())
      .withAutomaticReconnect()
      .build();
    connection.on("ReceivePing", (msg: { Message: string }) => {
      console.log("Received ping: ", msg.Message);
    });
    connection
      .start()
      .then(() => {
        console.log("Connection started");
        connection?.invoke("SendPing", { Message: "Hi" });
      })
      .catch((error) => {
        console.error("Error starting connection: ", error);
      });

    connection.onclose((error) => {
      console.error("Connection closed: ", error);
    });

    setConnection(connection);
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      connection?.stop();
    };
  }, [user]);

  return connection;
}
