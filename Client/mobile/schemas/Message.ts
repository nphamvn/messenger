import Realm, { BSON, ObjectSchema } from "realm";
import { Conversation } from "./Conversation";
import { User } from "./User";

export class Message extends Realm.Object<
  Message,
  "cId" | "conversation" | "sender" | "text" | "status" | "createdAt"
> {
  cId!: BSON.ObjectId;
  sId?: number;
  conversation!: Conversation;
  sender!: User;
  text!: string;
  status!: "notSent" | "sent" | "delivered" | "read" | "failed";
  createdAt!: Date;

  static schema: ObjectSchema = {
    name: "Message",
    properties: {
      cId: { type: "objectId", default: new BSON.ObjectId() },
      sId: "int?",
      conversation: "Conversation",
      sender: "User",
      text: { type: "string", optional: false },
      status: { type: "string", default: "notSent" },
      createdAt: { type: "date", default: new Date() },
    },
    primaryKey: "cId",
  };
}
