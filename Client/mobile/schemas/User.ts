import Realm, { ObjectSchema } from "realm";
import { Conversation } from "./Conversation";

export class User extends Realm.Object<User> {
  id!: string;
  fullName!: string;
  picture!: string;
  conversations!: Realm.List<Conversation>;
  static schema: ObjectSchema = {
    name: "User",
    properties: {
      id: "string",
      fullName: "string",
      picture: "string",
      conversations: {
        type: "linkingObjects",
        objectType: "Conversation",
        property: "members",
      },
    },
    primaryKey: "id",
  };
}
