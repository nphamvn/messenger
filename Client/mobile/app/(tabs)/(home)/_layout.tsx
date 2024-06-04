import { Link, Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Conversations",
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "New Conversation",
          presentation: "modal",
          headerLeft: () => (
            <Link
              href=".."
              style={{
                color: "#007AFF",
              }}
            >
              Cancel
            </Link>
          ),
        }}
      />
    </Stack>
  );
}
