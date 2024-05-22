import { useState } from "react";
import { View, Text } from "react-native";
interface User { 

}
interface Conversation {
    id: number;
    users: User[];
}

export default function ConversationsScreen() { 
    const [conversations, setConversations] = useState<Conversation[]>([])
    return (
        <View>
            <Text>ConversationsScreen</Text>
        </View>
    );
}