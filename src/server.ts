import { ClientServer } from './ClientServer';
import { MaxMspServer } from './MaxMspServer';
import { OSCMessage } from './types';

const maxMspServer = new MaxMspServer();

const everySeekerApp = new ClientServer(maxMspServer);

export { everySeekerApp };
