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

export default function App() {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="page-layout">
        <PageLoader />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AuthenticationGuard component={Index} />}>
        <Route index Component={ConversationList}></Route>
        <Route path="/contacts" Component={ContactList} />
        <Route path="/people" Component={PeopleList} />
      </Route>
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
