import * as signalR from '@microsoft/signalr';
import { createContext } from 'react';

const ConnectionContext = createContext<signalR.HubConnection | null>(null);


export default ConnectionContext;