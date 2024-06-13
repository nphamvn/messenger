import Realm, { BSON } from "realm";
import { User } from "./User";

export class Conversation extends Realm.Object<Conversation> {
  cId!: BSON.ObjectId;
  sId?: number;
  members!: Realm.List<User>;

  static schema: Realm.ObjectSchema = {
    name: "Conversation",
    properties: {
      sId: "int?",
      cId: "objectId",
      members: "User[]",
    },
    primaryKey: "cId",
  };
}
