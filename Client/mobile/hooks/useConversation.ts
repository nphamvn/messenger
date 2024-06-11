import { useQuery, useRealm } from "@realm/react";
import { appConfig } from "constants/appConfig";
import { useEffect, useState } from "react";
import { useAuth0 } from "react-native-auth0";
import { BSON, UpdateMode } from "realm";
import { User, Conversation, Message } from "schemas";
import useAppDelegate from "./useAppDelegate";
import { MessageAction } from "@schemas/MessageAction";

export default function useConversation(
  conversationId?: string,
  userId?: string
) {
  if (!conversationId && !userId) {
    throw new Error("Must provide either conversationId or userId");
  }

  const { user } = useAppDelegate();
  const { getCredentials } = useAuth0();
  const realm = useRealm();

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const messages = useQuery(
    {
      type: Message,
      query: (collection) =>
        collection
          .filtered(`conversation = $0`, conversation)
          .sorted("createdAt", false),
    },
    [conversation]
  );

  useEffect(() => {
    if (conversation) {
      syncMessages(conversation);
    }
  }, [conversation]);

  const getUser = async (userId: string) => {
    let user = realm.objectForPrimaryKey(User, userId);
    if (user) {
      return user;
    }
    const accessToken = (await getCredentials())?.accessToken;
    const response = await fetch(`${appConfig.API_URL}/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = await response.json();

    realm.write(() => {
      user = realm.create(User, {
        id: json.id,
        fullName: json.fullName,
        picture: json.picture,
      });
    });
    return user;
  };

  function createConversation(users: User[]) {
    return realm.create(Conversation, {
      cId: new BSON.ObjectId(),
      users: users,
    });
  }

  function createMessage(
    text: string,
    conversation: Conversation,
    sender: User
  ) {
    return realm.create(Message, {
      cId: new BSON.ObjectId(),
      conversation: conversation,
      sender: sender,
      text: text,
      status: "notSent",
      createdAt: new Date(),
    });
  }
  const sendMessage = async (text: string) => {
    realm.write(async () => {
      if (!conversation) {
        if (!userId) {
          throw new Error("No userId");
        }
        const member = await getUser(userId);
        if (!member) {
          console.error("Member not found");
          return;
        }
        // Create a new conversation
        const newConversation = createConversation([user!, member]);
        // Create a new message
        const message = createMessage(text, newConversation, user!);
        realm.create(MessageAction, { action: "send", message: message });
        setConversation(newConversation);
      } else {
        const message = createMessage(text, conversation, user!);
        realm.create(MessageAction, { action: "send", message: message });
      }
    });
  };

  const deleteMessage = async (id: string) => {
    console.log("Deleting message. id: ", id);
    const message = realm.objectForPrimaryKey(Message, new BSON.ObjectId(id));
    if (!message) {
      console.error("Message not found");
      return;
    }
    realm.write(() => {
      realm.delete(message);
    });
  };

  const syncMessages = async (conversation: Conversation) => {
    console.log("Syncing messages for conversation", conversation);
    if (!conversation.sId) {
      console.log("No conversation server id");
      return;
    }
    const accessToken = (await getCredentials())?.accessToken;
    fetch(`${appConfig.API_URL}/conversations/${conversation.sId}/messages`, {
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
              text: string;
              senderId: string;
            }
          ]
        ) => {
          try {
            realm.write(() => {
              data.forEach((m) => {
                const msgs = realm.objects(Message).filtered(`sId = ${m.id}`); // because of the way the API is structured, we can't use the sId as the primary key
                if (msgs.length > 0) {
                  msgs.forEach((msg) => {
                    realm.create(
                      Message,
                      {
                        cId: msg.cId,
                        sId: m.id,
                        conversation: conversation,
                        text: m.text,
                        sender: realm.objectForPrimaryKey(User, m.senderId)!,
                        status: "sent",
                        createdAt: new Date(m.createdAt),
                      },
                      UpdateMode.Modified
                    );
                  });
                } else {
                  const sender =
                    realm.objectForPrimaryKey(User, m.senderId) ||
                    realm.create(User, {
                      id: m.senderId,
                      fullName: "User",
                      picture: "https://picsum.photos/200",
                    });

                  realm.create(Message, {
                    cId: new BSON.ObjectId(),
                    sId: m.id,
                    conversation: conversation,
                    text: m.text,
                    sender: sender,
                    status: "sent",
                    createdAt: new Date(m.createdAt),
                  });
                }
              });
            });
          } catch (error) {
            console.error("Error updating messages: ", error);
          }
        }
      );
  };

  const getConversation = async (conversationId: string) => {
    return realm.objectForPrimaryKey(
      Conversation,
      new BSON.ObjectId(conversationId)
    );
  };

  const getO2OConversation = async (userId: string) => {
    return realm.write(async () => {
      const member =
        realm.objectForPrimaryKey(User, userId) ||
        realm.create(User, {
          id: userId,
          fullName: "todo: ",
          picture: "https://picsum.photos/200",
        });

      const conv = member
        .linkingObjects(Conversation, "users")
        .filtered("users.@count == 2")[0];

      console.log("conv", conv);
      if (conv) {
        console.log("Returning existing conversation");
        return conv;
      } else {
        console.log("Getting conversation from API");
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
          return realm.create(Conversation, {
            cId: new BSON.ObjectId(),
            sId: id,
            users: [user!, member],
          });
        }
        return null;
      }
    });
  };

  useEffect(() => {
    console.log("Getting conversation");
    (async () => {
      let conversation: Conversation | null = null;
      if (conversationId) {
        conversation = await getConversation(conversationId);
      } else if (userId) {
        conversation = await getO2OConversation(userId);
      }
      setConversation(conversation);
    })();
  }, []);

  return {
    conversation,
    messages,
    sendMessage,
    deleteMessage,
  };
}
