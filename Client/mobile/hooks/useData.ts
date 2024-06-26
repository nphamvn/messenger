import { useRealm } from "@realm/react";
import { Conversation, User } from "@schemas/index";
import { appConfig } from "constants/appConfig";
import { useAuth0 } from "react-native-auth0";
import { BSON, UpdateMode } from "realm";

export default function useData() {
  const { user, getCredentials } = useAuth0();
  const realm = useRealm();

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

    if (response.ok) {
      const user = await response.json();
      return realm.write(() => {
        return realm.create(
          User,
          {
            id: user.id,
            fullName: user.fullName,
            picture: user.picture,
          },
          UpdateMode.Modified
        );
      });
    }

    return null;
  };

  const getConversation = async (conversationId: number) => {
    console.log("Getting conversation: ", conversationId);
    let conversation = realm
      .objects(Conversation)
      .filtered(`sId = ${conversationId}`)[0];
    if (conversation) {
      console.log("Conversation found: ", conversation);
      return conversation;
    }
    console.log("Conversation not found. Try to fetch from server");

    const accessToken = (await getCredentials())?.accessToken;
    const response = await fetch(
      `${appConfig.API_URL}/conversations/${conversationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      const json = (await response.json()) as {
        id: number;
        members: { id: string; fullName: string; picture: string }[];
      };
      if (json.members.indexOf(user?.id) === -1) {
        throw new Error("User is not a member of the conversation");
      }
      return realm.write(() => {
        const members = json.members.map((m) => {
          return realm.create(
            User,
            { id: m.id, fullName: m.fullName, picture: m.picture },
            UpdateMode.Modified
          );
        });
        return realm.create(Conversation, {
          cId: new BSON.ObjectId(),
          sId: conversationId,
          members: members,
        });
      });
    }
    return null;
  };

  return { getUser, getConversation };
}
