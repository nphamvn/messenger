import Message from "./Message";
import User from "./User";

export interface Conversation {
  id: number;
  name: string | null;
  members: User[];
  lastMessage: Message;
  createdAt: string;
}
