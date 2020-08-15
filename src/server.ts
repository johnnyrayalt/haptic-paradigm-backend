import { ClientServer } from './servers/ClientServer';
import { RemoteServer } from './servers/RemoteServer';

const remoteServer = new RemoteServer();

const hapticParadigmApp = new ClientServer(remoteServer);

export { hapticParadigmApp };
