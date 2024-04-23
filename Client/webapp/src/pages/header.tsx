import { Link } from "react-router-dom";

export default function Header({ activeTab }: { activeTab?: string }) {
  return (
    <div className="flex space-x-2">
      <Link
        to="/"
        className={
          activeTab === "conversations" ? "text-blue-500 underline" : ""
        }
      >
        Conversations
      </Link>
      <Link
        to="/contacts"
        className={activeTab === "contacts" ? "text-blue-500 underline" : ""}
      >
        Contacts
      </Link>
      <Link
        to="/people"
        className={activeTab === "people" ? "text-blue-500 underline" : ""}
      >
        People
      </Link>
    </div>
  );
}
