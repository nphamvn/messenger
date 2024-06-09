import Realm, { BSON } from "realm";
import { Message } from "./Message";

export class MessageAction extends Realm.Object<MessageAction> {
  _id!: BSON.ObjectId;
  action!: "send" | "delete";
  message!: Message;
  createdAt!: Date;
  status!: "created" | "inProgress" | "done" | "error";

  static schema: Realm.ObjectSchema = {
    name: "MessageAction",
    properties: {
      _id: { type: "objectId", default: new BSON.ObjectId() },
      action: "string",
      message: "Message",
      createdAt: { type: "date", default: new Date() },
      status: { type: "string", default: "created" },
    },
    primaryKey: "_id",
  };
}
