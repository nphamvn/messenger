import User from "./User";

export default interface Message {
  id: number;
  text: string;
  sender: User;
  createdAt: Date;
}
