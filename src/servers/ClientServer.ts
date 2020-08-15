import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { createServer, Server } from 'http';
import socketio from 'socket.io';
import { CLIENT_SERVER, MESSAGE, PING_INTERVAL, PING_TIMEOUT, SLIDER_ONE, SLIDER_TWO } from '../utils/constants';
import { Logger } from '../utils/Logger';
import { OSCMessage } from '../utils/types';
import { CONNECT, DISCONNECT } from './../utils/constants';
import { RemoteServer } from './RemoteServer';
require('dotenv').config();

export class ClientServer {
	private readonly CLIENT_PORT: string | number = process.env.PORT || 8000;
	private serverOpts = {};
	private remoteServer: RemoteServer;

	private clientApp: express.Application;
	private clientServer: Server;
	private clientIO: SocketIO.Server;
	private clientPort: string | number;

	private frequencyState: OSCMessage;
	private amplitudeState: OSCMessage;

	private controlling: string = '';
	private connectedClients: any = [];
	private timeout: any;
	private timeUntilDisconnect: number = 180 * 1000;

	private logger: Logger = new Logger(CLIENT_SERVER);

	constructor(remoteServer: RemoteServer) {
		// this.checkNodeEnv();
		this.remoteServer = remoteServer;

		this.clientApp = express();
		this.clientPort = this.CLIENT_PORT;
		this.clientApp.use(cors);
		this.clientApp.options('*', cors());
		this.clientServer = createServer(this.clientApp);

		this.frequencyState = { address: SLIDER_ONE.address, args: [{ type: SLIDER_ONE.type, value: 50 }] };
		this.amplitudeState = { address: SLIDER_TWO.address, args: [{ type: SLIDER_TWO.type, value: 50 }] };

		this.initSocket();
		this.listenForClient();
		this.handleSocketConnections();
	}

	// private checkNodeEnv() {
	// 	if (process.env.NODE_ENV !== 'development')
	// 		this.serverOpts = {
	// 			key: fs.readFileSync(process.env.PATH_TO_SSL_KEY),
	// 			cert: fs.readFileSync(process.env.PATH_TO_SSL_CER),
	// 		};
	// }

	private initSocket(): void {
		this.clientIO = socketio(this.clientServer, { pingInterval: PING_INTERVAL, pingTimeout: PING_TIMEOUT });
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

			socket.emit('connectedToServer', '[CLIENT SERVER]: Connected ٩(｡•́‿•̀｡)۶');

			this.connectedClients.push(socket.conn.id);

			this.clientIO.to(socket.conn.id).emit('initialState', [this.frequencyState, this.amplitudeState]);

			if (this.controlling === '') {
				this.controlling = this.connectedClients[0];

				this.logger.broadcast({ message: `Now in control: { ${this.controlling} }` });

				if (!this.timeout) {
					this.clientIO.to(this.controlling).emit('controlling', [this.frequencyState, this.amplitudeState]);
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

			switch (message.address) {
				case SLIDER_ONE.address:
					this.frequencyState = message;
				case SLIDER_TWO.address:
					this.amplitudeState = message;
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

				this.clientIO.to(this.controlling).emit('controlling', [this.frequencyState, this.amplitudeState]);

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
