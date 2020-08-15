import cors from 'cors';
import express from 'express';
import { createServer, Server } from 'http';
import moment from 'moment';
import socketio from 'socket.io';
import { Logger } from '../utils/Logger';
import { OSCMessage } from '../utils/types';
import { CONNECT, DISCONNECT } from './../utils/constants';

export class RemoteServer {
	private readonly REMOTE_PORT: string | number = process.env.PORT || 8001;

	private remoteApp: express.Application;
	private remoteServer: Server;
	public remoteIO: SocketIO.Server;
	private remotePort: string | number;

	private logger: Logger = new Logger('remote');

	constructor() {
		this.remoteApp = express();
		this.remotePort = this.REMOTE_PORT;
		this.remoteApp.use(cors());
		this.remoteApp.options('*', cors());
		this.remoteServer = createServer(this.remoteApp);

		this.initSocket();
		this.listenForRemoteServer();
		this.handleSocketConnections();
	}

	public broadcastMessage(socketEvent: string, message: OSCMessage) {
		this.remoteIO.emit(socketEvent, message);
	}

	private initSocket(): void {
		this.remoteIO = socketio(this.remoteServer);
	}

	private listenForRemoteServer(): void {
		this.remoteServer.listen(this.remotePort, () => {
			this.logger.broadcast({ lineBreak: true });
			this.logger.broadcast({ message: `Running server on port ${this.remotePort}` });
			this.logger.broadcast({ lineBreak: true });
		});
	}

	private handleSocketConnections(): void {
		this.remoteIO.on(CONNECT, (socket: SocketIO.Socket): void => {
			this.logger.broadcast({
				message: `Connected client with ID { ${socket.conn.id} } on port ${this.REMOTE_PORT}`,
			});

			socket.emit('connectedToServer', `[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Connected ٩(｡•́‿•̀｡)۶`);

			socket.on(DISCONNECT, () => {
				this.logger.broadcast({ message: `Disconnected from remote max client` });

				socket.disconnect();
			});
		});
	}
}
