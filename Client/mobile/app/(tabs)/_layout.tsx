import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Conversations",
          headerShown: false,
          tabBarLabel: "Conversations",
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          headerShown: false,
          tabBarLabel: "Contacts",
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarLabel: "Settings",
        }}
      ></Tabs.Screen>
    </Tabs>
  );
}
