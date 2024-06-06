import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { User } from "../schemas/User";
import { useAuth0 } from "react-native-auth0";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { appConfig } from "../constants/appConfig";
import { Message } from "../schemas/Message";
import { BSON } from "realm";
import { useRouter } from "expo-router";
import { Conversation } from "../schemas/Conversation";

interface MessagingContextType {
  connection: signalR.HubConnection | undefined;
  user: User | undefined;
  //getUser: (id: string) => Promise<User>;
  getO2OConversation: (userId: string) => Promise<Conversation | null>;
}
export const MessagingContext = createContext<MessagingContextType | undefined>(
  undefined
);

export default function useMessaging(): MessagingContextType {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, getCredentials } = useAuth0();
  const realm = useRealm();
  const notSentMessages = useQuery(Message).filtered("status = 'notSent'");
  const router = useRouter();
  const [connection, setConnection] = useState<signalR.HubConnection>();
  const [user, setUser] = useState<User>();

  const handleReceiveMessage = async (
    conversation: {},
    message: { clientId: string }
  ) => {
    console.log("Received message: ", conversation, message);
    const clientId = message.clientId;
    const localMessage = realm.objectForPrimaryKey(
      Message,
      new BSON.ObjectId(clientId)
    );
    if (localMessage) {
      realm.write(() => {
        localMessage.status = "sent";
      });
    }
  };

  useEffect(() => {
    console.log("useMessaging hook");
    if (!authUser) {
      console.log("No auth user");
      return;
    }
    let localUser = realm.objectForPrimaryKey(User, authUser?.sub!);
    console.log("Local user: ", localUser);
    if (!localUser) {
      realm.write(() => {
        localUser = realm.create(User, {
          id: authUser?.sub!,
          fullName: authUser?.name!,
          picture: user?.picture!,
        });
      });
    }
    setUser(localUser!);

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

      connection.onclose((error) => {
        console.error("Connection closed: ", error);
      });

      connection.on("ReceiveMessage", handleReceiveMessage);
      setConnection(connection);
    })();

    router.replace("/");

    return () => {
      connection?.stop();
    };
  }, [authUser]);

  useEffect(() => {
    if (connection?.state !== signalR.HubConnectionState.Connected) {
      console.log("Connection not ready");
      return;
    }
    if (notSentMessages.length === 0) {
      console.log("No messages to send");
      return;
    }
    notSentMessages.forEach((msg: Message) => {
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

  const getO2OConversation = async (userId: string) => {
    console.log("getO2OConversation", userId);
    let member = realm.objectForPrimaryKey(User, userId);
    console.log("member", member);
    if (!member) {
      console.log("Creating user");
      member = realm.write(() => {
        return realm.create(User, {
          id: userId,
          fullName: "todo: ",
          picture: "https://picsum.photos/200",
        });
      });
    }
    const conv = member
      .linkingObjects(Conversation, "users")
      .filtered("users.@count == 2")[0];
    console.log("conv", conv);
    if (conv) {
      console.log("Returning existing conversation");
      return conv;
    } else {
      console.log("Creating new conversation");
      const accessToken = (await getCredentials())?.accessToken;
      const response = await fetch(
        `${appConfig.API_URL}/conversations/o2o/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        const { id } = await response.json();
        return realm.write(() => {
          return realm.create(Conversation, {
            cId: new BSON.ObjectId(),
            sId: id,
            users: [user!, member],
          });
        });
      }
      return null;
    }
  };

  return (
    <MessagingContext.Provider value={{ user, connection, getO2OConversation }}>
      {children}
    </MessagingContext.Provider>
  );
};
