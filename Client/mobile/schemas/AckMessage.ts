import Realm, { BSON } from "realm";

export class AckMessage extends Realm.Object<AckMessage> {
  _id!: BSON.ObjectId;
  error?: string;

  static schema: Realm.ObjectSchema = {
    name: "AckMessage",
    properties: {
      _id: { type: "objectId", default: new BSON.ObjectId() },
      error: { type: "string", optional: true },
    },
    primaryKey: "_id",
  };
}
