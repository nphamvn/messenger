import { BSON, Object, ObjectSchema } from "realm";

export class Message extends Object<Message> {
  _id!: BSON.ObjectId;
  text!: string;
  status!: "notSent" | "sent" | "delivered" | "read";
  userId?: string | null;
  conversationId?: number | null;

  static schema: ObjectSchema = {
    name: "Message",
    properties: {
      _id: { type: "objectId", default: new BSON.ObjectId() },
      text: "string",
      status: { type: "string", default: "notSent" },
    },
    primaryKey: "_id",
  };
}
