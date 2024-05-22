import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="conversations"
        options={{ title: "Conversations" }}
      ></Tabs.Screen>
    </Tabs>
  );
}
