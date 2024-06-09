import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  User,
  Conversation,
  Message,
  MessageAction,
  AckMessage,
} from "@schemas/index";
import { useAuth0 } from "react-native-auth0";
import { useQuery, useRealm } from "@realm/react";
import * as signalR from "@microsoft/signalr";
import { appConfig } from "../constants/appConfig";
import { BSON, UpdateMode } from "realm";
import { useRouter, useSegments } from "expo-router";

function useSyncMessages(user: User | undefined) {
  const { getCredentials } = useAuth0();
  const realm = useRealm();
  const sync = async () => {
    if (!user) {
      throw new Error("User not found");
    }
    console.log("Syncing messages");

    const accessToken = (await getCredentials())?.accessToken;
    //GetConversations
    fetch(`${appConfig.API_URL}/conversations`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then(
        (
          data: [
            {
              createdAt: string;
              id: number;
              members: [{ id: string; fullName: string; picture: string }];
            }
          ]
        ) => {
          realm.write(() => {
            console.log("Deleting all conversations");
            realm.delete(realm.objects(Conversation));

            data.forEach((conversation) => {
              realm.delete(
                realm.objects(Conversation).filtered(`sId = ${conversation.id}`)
              );
              console.log("conversation", conversation);
              const inConversation = conversation.members.some(
                (m) => m.id === user.id
              );
              if (!inConversation) {
                console.log("User not in conversation");
                return;
              }
              const otherUsers = conversation.members
                .filter((m) => m.id !== user.id)
                .map(
                  (m) =>
                    realm.objectForPrimaryKey(User, m.id) ||
                    realm.create(User, {
                      id: m.id,
                      fullName: m.fullName,
                      picture: m.picture,
                    })
                );
              console.log("otherUsers", otherUsers);
              if (otherUsers.length === 0) {
                console.log("No other users in conversation");
                return;
              }
              realm.create(Conversation, {
                cId: new BSON.ObjectId(),
                sId: conversation.id,
                users: [user, ...otherUsers],
              });
            });
          });
        }
      );
  };
  useEffect(() => {
    if (!user) {
      return;
    }
    sync();
  }, [user]);
}

function useRouteGuard() {
  const { user } = useAuth0();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    const isInProtectedGroup = segments[0] === "(tabs)";
    if (!user && isInProtectedGroup) {
      router.replace("/login");
    } else if (user && !isInProtectedGroup) {
      router.replace("/");
    }
  }, [user, segments]);
}

function useDataCleaner() {
  const { user, isLoading } = useAuth0();
  const realm = useRealm();

  useEffect(() => {
    if (!user && !isLoading) {
      console.log("Deleting all data");
      realm.write(() => {
        realm.deleteAll();
      });
    }
  }, [user, isLoading]);
}

function useMessage(connection: signalR.HubConnection | undefined) {
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

function useUser() {
  const { user: authUser } = useAuth0();
  const realm = useRealm();
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (authUser) {
      let user = realm.objectForPrimaryKey(User, authUser?.sub!);
      if (!user) {
        console.log("Creating user");
        realm.write(() => {
          user = realm.create(User, {
            id: authUser?.sub!,
            fullName: authUser?.name!,
            picture: authUser?.picture!,
          });
        });
      }
      setUser(user!);
    } else {
      setUser(undefined);
    }
  }, [authUser]);

  return user;
}

function useConnector() {
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

interface AppDelegateContextType {
  connection: signalR.HubConnection | undefined;
  user: User | undefined;
}

export const AppDelegateContext = createContext<
  AppDelegateContextType | undefined
>(undefined);

export default function useAppDelegate(): AppDelegateContextType {
  const context = useContext(AppDelegateContext);
  if (!context) {
    throw new Error("useAppDelegate must be used within a AppDelegateProvider");
  }
  return context;
}

export const AppDelegateProvider = ({ children }: { children: ReactNode }) => {
  useRouteGuard();
  useDataCleaner();

  const user = useUser();
  const connection = useConnector();

  useSyncMessages(user);
  useMessage(connection);

  return (
    <AppDelegateContext.Provider value={{ user, connection }}>
      {children}
    </AppDelegateContext.Provider>
  );
};
