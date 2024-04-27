export interface IMessage {
  id: number;
  senderId: string;
  text: string;
  clientId?: string;
  createdAt: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}
