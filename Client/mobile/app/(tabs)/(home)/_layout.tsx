import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Conversations",
        }}
      />
      <Stack.Screen name="chat" />
      <Stack.Screen
        name="new"
        options={{
          title: "New Conversation",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
