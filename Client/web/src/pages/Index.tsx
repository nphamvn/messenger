import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
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

  const isNewConversation = useMatch("/new");
  const conversationId = useParams()["conversationId"];
  const contactId = useParams()["contactId"];
  console.log("conversationId", conversationId);
  console.log("contactId", contactId);
  const navigate = useNavigate();
  const handleNewConversationClick = () => {
    navigate("/new");
  };
  const isIndex = useMatch("/");
  const isContacts = useMatch("/contacts");
  const isPeople = useMatch("/people");
  return (
    <ConnectionContext.Provider value={connection}>
      <div className="flex h-screen">
        <div className="flex flex-col">
          <Link to="/" className={isIndex ? "text-blue-500 underline" : ""}>
            Conversations
          </Link>
          <Link
            to="/contacts"
            className={isContacts ? "text-blue-500 underline" : ""}
          >
            Contacts
          </Link>
          <Link
            to="/people"
            className={isPeople ? "text-blue-500 underline" : ""}
          >
            People
          </Link>
        </div>
        <div className="text-white w-64 flex-shrink-0">
          <button onClick={handleNewConversationClick}>New</button>
          <Outlet />
        </div>
        <div className="flex-1">
          {(isNewConversation || conversationId || contactId) && (
            <ConversationWindow
              conversationId={conversationId}
              contactId={contactId}
            />
          )}
        </div>
      </div>
    </ConnectionContext.Provider>
  );
}
