import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import IUser from "../models/IUser";

export default function ContactList() {
  const { getAccessTokenSilently } = useAuth0();
  const [contacts, setContacts] = useState<IUser[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const accessToken = await getAccessTokenSilently();
      const contacts = await fetch("api/contacts", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((res) => res.json() as Promise<IUser[]>);
      setContacts(contacts);
    };

    fetchContacts();
  }, []);

  return (
    <div>
      <ul className="mt-3 max-w-md divide-y divide-gray-200">
        {contacts.map((contact) => (
          <li key={contact.id} className="p-3">
            <Link to={`o2o/${contact.id}`} className="flex items-center">
              <div className="me-2 flex-shrink-0">
                <img
                  className="h-8 w-8 rounded-full"
                  src={contact.picture}
                  alt={contact.fullName}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 ">
                  {contact.fullName}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
