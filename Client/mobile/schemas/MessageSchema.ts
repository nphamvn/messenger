import Realm, { BSON, ObjectSchema } from "realm";
import { ConversationSchema } from "./ConversationSchema";
import { UserSchema } from "./UserSchema";

export class MessageSchema extends Realm.Object<MessageSchema> {
  cId!: BSON.ObjectId;
  sId?: number;
  conversation!: ConversationSchema;
  sender!: UserSchema;
  text!: string;
  status!: "notSent" | "sent" | "delivered" | "read";
  createdAt!: Date;

  static schema: ObjectSchema = {
    name: "Message",
    properties: {
      cId: { type: "objectId", default: new BSON.ObjectId() },
      sId: "int?",
      conversation: {
        type: "linkingObjects",
        objectType: "Conversation",
        property: "messages",
      },
      sender: "User",
      text: "string",
      status: { type: "string", default: "notSent" },
      createdAt: { type: "date", default: new Date() },
    },
    primaryKey: "cId",
  };
}
