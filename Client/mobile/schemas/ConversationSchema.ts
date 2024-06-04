import Realm, { BSON } from "realm";
import { UserSchema } from "./UserSchema";
import { MessageSchema } from "./MessageSchema";

export class ConversationSchema extends Realm.Object<ConversationSchema> {
  cId!: BSON.ObjectId;
  sId?: number;
  users!: Realm.List<UserSchema>;
  messages!: Realm.List<MessageSchema>;

  static schema: Realm.ObjectSchema = {
    name: "Conversation",
    properties: {
      sId: "int?",
      cId: "objectId",
      users: "User[]",
      messages: "Message[]",
    },
    primaryKey: "cId",
  };
}
