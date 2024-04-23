import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { Outlet, useMatch } from "react-router-dom";
import ConnectionContext from "./connectionContext";
import * as signalR from "@microsoft/signalr";
import ConversationWindow from "./ConversationWindow";

export default function Index() {
  const { getAccessTokenSilently } = useAuth0();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );
  useEffect(() => {
    const connect = async () => {
      const accessToken = await getAccessTokenSilently();
      const connection = new signalR.HubConnectionBuilder()
        .withUrl("/api/ws/chat", {
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
          console.error(error);
        });
      setConnection(connection);
    };
    connect();
  }, []);

  const [openingConversationId, setOpeningConversationId] = useState<number>();
  const onConversationClick = (conversationId: number) => {};
  const isNewConversation = useMatch("/new");

  return (
    <ConnectionContext.Provider value={connection}>
      <div className="flex h-screen">
        <div className="text-white w-64 flex-shrink-0">
          <button onClick={handleNewConversationClick}>New</button>
          <Outlet />
        </div>
        <div className="flex-1">
          {openingConversationId || newConversation || (
            <ConversationWindow conversationId={openingConversationId} />
          )}
        </div>
      </div>
    </ConnectionContext.Provider>
  );
}
