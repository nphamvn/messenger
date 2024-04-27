import { useAuth0 } from "@auth0/auth0-react";
import { Route, Routes } from "react-router-dom";
import { PageLoader } from "./components/PageLoader";
import { LoginPage } from "./pages/LoginPage";
import { AuthenticationGuard } from "./components/AuthenticationGuard";
import { CallbackPage } from "./pages/CallbackPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import ConversationList from "./pages/conversationList";
import ContactList from "./pages/contactList";
import PeopleList from "./pages/peopleList";
import Index from "./pages/Index";
import { useEffect, useState } from "react";
import IConversation from "./models/IConversation";
import ConversationContext from "./hooks/conversationContext";

export default function App() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState<IConversation[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchConversations = async () => {
        const accessToken = await getAccessTokenSilently();
        fetch("/api/conversations", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then(setConversations);
      };
      fetchConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if(isAuthenticated) {
      console.log("User is authenticated", user);
    }
   }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="page-layout">
        <PageLoader />
      </div>
    );
  }
  return (
    <ConversationContext.Provider value={conversations}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthenticationGuard component={Index} />}>
          <Route path="" Component={ConversationList}>
            <Route path="c/:conversationId" />
          </Route>
          <Route path="new" Component={ConversationList}></Route>
          <Route path="/contacts" Component={ContactList}>
            <Route path="o2o/:contactId" />
          </Route>
          <Route path="/people" Component={PeopleList} />
        </Route>
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ConversationContext.Provider>
  );
}
