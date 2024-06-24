import Realm, { BSON } from "realm";

export type ACTION_TYPE = "SEND_MESSAGE";

export type ACTION_STATUS =
  | "New"
  | "InProgress"
  | "Failed"
  | "Successful"
  | "Abandoned"
  | "Retried"
  | "Deleted";

export default class Action extends Realm.Object<Action> {
  _id!: BSON.ObjectId;
  type!: ACTION_TYPE;
  payload!: string;
  createdAt!: Date;
  status!: ACTION_STATUS;

  static schema: Realm.ObjectSchema = {
    name: "Action",
    properties: {
      _id: { type: "objectId", default: new BSON.ObjectId() },
      type: "string",
      payload: "string",
      createdAt: { type: "date", default: new Date() },
      status: { type: "string", default: "New" },
    },
    primaryKey: "_id",
  };
}
