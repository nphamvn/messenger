export default interface Contact {
  id: string;
  fullName: string;
  picture: string;
  isContact: boolean;
}
export interface SearchPerson extends Contact {
  isContact: boolean;
}
