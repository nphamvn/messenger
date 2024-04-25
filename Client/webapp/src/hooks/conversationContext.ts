import { createContext } from "react";
import IConversation from "../pages/IConversation";

const ConversationContext = createContext<IConversation[]>([]);

export default ConversationContext;
