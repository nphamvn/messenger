import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { useAuth0 } from "react-native-auth0";
import { Text } from "react-native";

export default function Layout() {
  const { user, isLoading } = useAuth0();
  if (isLoading) {
    console.log("Loading...");
    return <Text>Loading...</Text>;
  }

  if (!user) {
    console.log("Redirecting to login...");
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          tabBarLabel: "Conversations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox" size={size} color={color} />
          ),
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarLabel: "Contacts",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="contacts" size={size} color={color} />
          ),
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      ></Tabs.Screen>
    </Tabs>
  );
}
