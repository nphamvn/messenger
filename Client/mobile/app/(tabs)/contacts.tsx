import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import Contact, { SearchPerson } from "../../models/Contact";
import { useAuth0 } from "react-native-auth0";
import { router } from "expo-router";
import { appConfig } from "../../constants/appConfig";

export default function ContactsScreen() {
  const { getCredentials } = useAuth0();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchPeople, setSearchPeople] = useState<SearchPerson[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [searchText, setSearchText] = useState("");
  useEffect(() => {
    (async () => {
      const credentials = await getCredentials();
      const response = await fetch(`${appConfig.API_URL}/contacts`, {
        headers: {
          Authorization: `Bearer ${credentials?.accessToken}`,
        },
      });
      const data = await response.json();
      setContacts(data);
    })();
  }, []);

  useEffect(() => {
    if (!searchModalVisible) {
      // searchModalVisible is false, so the modal is closed
      return;
    }
    if (!searchText) {
      // searchText is empty, so we don't need to filter the contacts
      return;
    }
    (async () => {
      const credentials = await getCredentials();
      const response = await fetch(
        `${appConfig.API_URL}/people?search=${searchText}`,
        {
          headers: {
            Authorization: `Bearer ${credentials?.accessToken}`,
          },
        }
      );
      const data = await response.json();
      console.log(data);
      setSearchPeople(data);
    })();
  }, [searchText]);

  const addContact = async (id: string) => {
    console.log("Adding contact", id);
    const credentials = await getCredentials();
    const response = await fetch(`${appConfig.API_URL}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials?.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setSearchPeople((people) => {
        return people.map((person) => {
          if (person.id === id) {
            return { ...person, isContact: true };
          }
          return person;
        });
      });
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
        <View style={{ flexDirection: "row", alignContent: "center" }}>
          <TextInput
            placeholder="Search"
            style={{
              padding: 10,
              borderRadius: 10,
              borderColor: "#3ea8ff",
              borderWidth: 1,
              flex: 1,
              marginRight: 10,
            }}
          />
          <Pressable
            onPress={() => {
              setSearchModalVisible(true);
            }}
            style={{
              backgroundColor: "#3ea8ff",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: "white",
                borderRadius: 10,
              }}
            >
              Add
            </Text>
          </Pressable>
        </View>
        <FlatList
          style={{
            marginTop: 20,
          }}
          data={contacts}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "conversation/chat",
                  params: {
                    userId: item.id,
                  },
                });
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                  borderBottomWidth: 1,
                  borderColor: "#ccc",
                  padding: 4,
                }}
              >
                <Image
                  source={{ uri: item.picture }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                <Text style={{ marginLeft: 10 }}>{item.fullName}</Text>
              </View>
            </Pressable>
          )}
        ></FlatList>
      </View>
      <Modal
        style={{ flex: 1 }}
        visible={searchModalVisible}
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSearchModalVisible(false);
        }}
        onShow={() => {
          setSearchText("");
          searchInputRef.current?.focus();
        }}
      >
        <View style={{ padding: 20, flex: 1 }}>
          <TextInput
            ref={searchInputRef}
            placeholder="Search"
            value={searchText}
            onChangeText={setSearchText}
            style={{
              padding: 10,
              borderRadius: 10,
              borderColor: "#3ea8ff",
              borderWidth: 1,
            }}
          />
          <FlatList
            style={{ marginTop: 20 }}
            data={searchPeople}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderColor: "#ccc",
                  padding: 4,
                }}
                key={item.id}
              >
                <Image
                  source={{ uri: item.picture }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                ></Image>
                <Text style={{ marginLeft: 10 }}>{item.fullName}</Text>
                {!item.isContact && (
                  <Pressable
                    onPress={() => addContact(item.id)}
                    style={{ marginLeft: "auto" }}
                  >
                    <Text style={{ color: "#3ea8ff" }}>Add</Text>
                  </Pressable>
                )}
              </View>
            )}
          ></FlatList>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
