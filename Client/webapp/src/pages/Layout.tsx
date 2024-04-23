import { Outlet } from "react-router-dom";
import ConnectionContext from "./connectionContext";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import * as signalR from "@microsoft/signalr";
const url: string = import.meta.env.VITE_BASE_CHAT_API_URL;
export default function Layout() {
  const { getAccessTokenSilently } = useAuth0();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null,
  );
  useEffect(() => {
    const connect = async () => {
      const accessToken = await getAccessTokenSilently();
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/chat`, {
          accessTokenFactory: () => accessToken,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build();
      connection.start().then(() => {
        console.log("Connection started");
      });
      setConnection(connection);
    };
    connect();
  }, []);

  useEffect(() => {
    if (!connection) return;
    return () => {
      connection?.stop();
    };
  }, [connection]);

  return (
    <ConnectionContext.Provider value={connection}>
      <div>
        <Outlet />
      </div>
    </ConnectionContext.Provider>
  );
}
