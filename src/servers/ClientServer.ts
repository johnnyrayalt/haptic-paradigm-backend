import cors from 'cors';
import express from 'express';
import * as HttpServer from 'http';
import * as HttpsServer from 'https';
import socketio from 'socket.io';
import {
	buildMessage,
	CLIENT_SERVER,
	CONNECT,
	DISCONNECT,
	MESSAGE,
	PING_INTERVAL,
	PING_TIMEOUT,
	TIME_LIMIT,
	XYPAD_DATA,
} from '../utils/constants';
import ImportServer from '../utils/ImportServer';
import { Logger } from '../utils/Logger';
import { OSCMessage } from '../utils/types';
import { RemoteServer } from './RemoteServer';

export class ClientServer {
	private readonly CLIENT_PORT: string | number = process.env.CLIENT_PORT || 8000;
	private remoteServer: RemoteServer;

	private clientApp: express.Application;
	private clientServer: HttpServer.Server | HttpsServer.Server;
	private clientIO: SocketIO.Server;
	private clientPort: string | number;

	private uiControllState: { [name: string]: OSCMessage } = {};

	private controlling: string = '';
	private connectedClients: any = [];
	private timeout: any;
	private timeUntilDisconnect: number = TIME_LIMIT * 1000;

	private logger: Logger = new Logger(CLIENT_SERVER);

	constructor(remoteServer: RemoteServer) {
		this.initUIControlls();

		this.remoteServer = remoteServer;

		this.clientApp = express();
		this.clientPort = this.CLIENT_PORT;
		this.clientApp.use(cors);
		this.clientApp.options('*', cors());

		this.initServer();
		this.initSocket();
		this.listenForClient();
		this.handleSocketConnections();
	}

	private initUIControlls(): void {
		XYPAD_DATA.forEach((data) => {
			this.uiControllState = {
				[data.address]: buildMessage(data.address, data.value),
			};
		});
	}

	private initServer(): void {
		if (process.env.NODE_ENV === 'development') {
			this.clientServer = ImportServer.http(this.clientApp);
		} else {
			this.clientServer = ImportServer.https(this.clientApp);
		}
	}

	private initSocket(): void {
		this.clientIO = socketio(this.clientServer, {
			pingInterval: PING_INTERVAL,
			pingTimeout: PING_TIMEOUT,
		});
	}

	private listenForClient(): void {
		this.clientServer.listen(this.clientPort, () => {
			this.logger.broadcast({ lineBreak: true });
			this.logger.broadcast({ message: `Running server on port ${this.clientPort}` });
			this.logger.broadcast({ lineBreak: true });
		});
	}

	private restartServer(): void {
		this.clientIO.removeAllListeners();

		// reset state
		this.controlling = '';
		this.connectedClients = [];

		this.clientServer.close();
		this.listenForClient();
		this.handleSocketConnections();
	}

	private handleSocketConnections(): void {
		this.clientIO.on(CONNECT, (socket: SocketIO.Socket): void => {
			this.logger.broadcast({
				message: `Connected client with ID { ${socket.conn.id} } on port ${this.clientPort}`,
			});

			socket.emit('connectedToServer', '[CLIENT SERVER]: Connected ??(???????????????????)??');

			this.connectedClients.push(socket.conn.id);

			const outBoundData: OSCMessage[] = this.assembleOutBoundData();
			this.clientIO.to(socket.conn.id).emit('initialState', outBoundData);

			if (this.controlling === '') {
				this.controlling = this.connectedClients[0];

				this.logger.broadcast({ message: `Now in control: { ${this.controlling} }` });

				if (!this.timeout) {
					const outBoundData: OSCMessage[] = this.assembleOutBoundData();
					this.clientIO.to(this.controlling).emit('controlling', outBoundData);
				}
			}

			this.controllerStartTimer(socket);
			this.receiveMessage(socket);
			this.disconnect(socket);
		});
	}

	private startTimer() {
		clearTimeout(this.timeout);

		this.timeout = setTimeout(() => {
			this.disconnectingClient();
		}, this.timeUntilDisconnect);
	}

	private stopTimer() {
		clearTimeout(this.timeout);
		this.timeout = '';
	}

	private receiveMessage(socket: SocketIO.Socket): void {
		socket.on(MESSAGE, (message: OSCMessage) => {
			this.logger.broadcast({ message: `Message received: ${JSON.stringify(message, null, 4)}` });
			this.logger.broadcast({ lineBreak: true });

			for (const uiControll in this.uiControllState) {
				if (message.address === uiControll) {
					this.uiControllState[uiControll] = message;
				}
			}

			const messageToSend: OSCMessage = {
				address: message.address,
				args: message.args,
			};

			this.remoteServer.broadcastMessage(MESSAGE, messageToSend);

			this.broadcastMessage(messageToSend, socket);
		});
	}

	private broadcastMessage(message: OSCMessage, socket: SocketIO.Socket): void {
		this.logger.broadcast({ message: `Broadcasting message: ${JSON.stringify(message, null, 4)}` });
		this.logger.broadcast({ lineBreak: true });

		socket.broadcast.emit('broadcastMessage', message);
	}

	private assembleOutBoundData(): OSCMessage[] {
		const outBoundData: OSCMessage[] = [];
		Object.keys(this.uiControllState).forEach((uiController: string) =>
			outBoundData.push(this.uiControllState[uiController]),
		);

		return outBoundData;
	}

	private controllerStartTimer(socket: SocketIO.Socket): void {
		socket.on('controllerTimerStart', () => {
			this.logger.broadcast({ message: `STARTING CONNECTION TIMER` });
			this.logger.broadcast({ lineBreak: true });

			this.startTimer();

			socket.emit('startingTimer', 'Timer has started');
		});
	}

	private disconnectingClient() {
		this.clientIO.to(this.controlling).emit('disconnectingClient');
	}

	private disconnect(socket: SocketIO.Socket) {
		socket.on(DISCONNECT, () => {
			this.logger.broadcast({ message: `Disconnecting Client { ${socket.conn.id} }` });

			if (this.controlling === socket.conn.id) {
				this.logger.broadcast({ message: `STOPPING TIMER` });
				this.logger.broadcast({ lineBreak: true });

				this.stopTimer();

				this.connectedClients.splice(0, 1);
				this.controlling = this.connectedClients[0];

				this.logger.broadcast({ message: `Now in control: { ${this.controlling} }` });

				const outBoundData: OSCMessage[] = this.assembleOutBoundData();
				this.clientIO.to(this.controlling).emit('controlling', outBoundData);

				if (this.controlling === undefined) {
					this.logger.broadcast({ message: `RESTARTING` });
					this.logger.broadcast({ lineBreak: true });

					this.restartServer();
				}
			} else {
				this.logger.broadcast({ message: `removing client { ${socket.conn.id} } fron queue` });

				this.connectedClients = this.connectedClients.filter((client: string) => client !== socket.conn.id);
				this.controlling = this.connectedClients[0];
			}
		});
	}
}
