import { ClientServer } from '../servers/ClientServer';
import { RemoteServer } from '../servers/RemoteServer';

class InitServer {
	constructor() {
		const remoteServer = this.buildRemoteServer();
		this.buildClientServer(remoteServer);
	}

	private buildRemoteServer = () => {
		return new RemoteServer();
	};

	private buildClientServer = (remoteServer: RemoteServer) => {
		return new ClientServer(remoteServer);
	};
}

export { InitServer };
