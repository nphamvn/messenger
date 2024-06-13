import { useEffect } from "react";
import { User, Conversation } from "@schemas/index";
import { useAuth0 } from "react-native-auth0";
import { useRealm } from "@realm/react";
import { appConfig } from "../constants/appConfig";
import { BSON } from "realm";

export function useSyncMessages(user: User | undefined) {
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
            realm.delete(realm.objects(Conversation));

            data.forEach((conversation) => {
              realm.delete(
                realm.objects(Conversation).filtered(`sId = ${conversation.id}`)
              );
              const inConversation = conversation.members.some(
                (m) => m.id === user.id
              );
              if (!inConversation) {
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
              if (otherUsers.length === 0) {
                return;
              }
              realm.create(Conversation, {
                cId: new BSON.ObjectId(),
                sId: conversation.id,
                members: [user, ...otherUsers],
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
