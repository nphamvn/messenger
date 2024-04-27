import { createContext } from "react";
import IConversation from "../models/IConversation";

const ConversationContext = createContext<IConversation[]>([]);

export default ConversationContext;
