import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { createServer, Server } from 'http';
import moment from 'moment';
import socketio from 'socket.io';
import { OSCEvent } from './constants';
import { MaxMspServer } from './MaxMspServer';
import { OSCMessage } from './types';

export class ClientServer {
	private readonly CLIENT_PORT: string | number = process.env.PORT || 8000;
	private maxMspServer: MaxMspServer;

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

	constructor(maxMspServer: MaxMspServer) {
		this.maxMspServer = maxMspServer;

		this.clientApp = express();
		this.clientPort = this.CLIENT_PORT;
		this.clientApp.use(cors);
		this.clientApp.options('*', cors());
		this.clientServer = createServer(this.clientApp);

		this.frequencyState = { address: '/slider/frequency', args: [{ type: 'f', value: 50 }] };
		this.amplitudeState = { address: '/slider/amplitude', args: [{ type: 'a', value: 50 }] };

		this.initSocket();
		this.listenForClient();
		this.handleSocketConnections();
	}

	private initSocket(): void {
		this.clientIO = socketio(this.clientServer, { pingInterval: 1000, pingTimeout: 10000 });
	}

	private listenForClient(): void {
		this.clientServer.listen(this.clientPort, () => {
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Running server on port ${this.clientPort}`);
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);
		});
	}

	private restartServer(): void {
		this.clientIO.removeAllListeners();
		this.controlling = '';
		this.connectedClients = [];
		this.clientServer.close();
		this.listenForClient();
		this.handleSocketConnections();
	}

	private handleSocketConnections(): void {
		this.clientIO.on('connect', (socket: SocketIO.Socket): void => {
			console.log(
				`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Connected client with ID { ${socket.conn.id} } on port ${
					this.clientPort
				}`,
			);

			socket.emit('connectedToServer', '[SERVER]: Connected ٩(｡•́‿•̀｡)۶');

			this.connectedClients.push(socket.conn.id);

			this.clientIO.to(socket.conn.id).emit('initialState', [this.frequencyState, this.amplitudeState]);

			if (this.controlling === '') {
				this.controlling = this.connectedClients[0];

				console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Now in control: { ${this.controlling} }`);

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
		socket.on(OSCEvent.MESSAGE, (message: OSCMessage) => {
			console.log(
				`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Message received: ${JSON.stringify(message, null, 4)}`,
			);
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);

			switch (message.address) {
				case '/slider/frequency':
					this.frequencyState = message;
				case '/slider/amplitude':
					this.amplitudeState = message;
			}

			const sendMessage = {
				address: message.address,
				args: message.args,
			};

			this.maxMspServer.maxMspIO.emit('message', sendMessage);
			this.broadcastMessage(sendMessage, socket);
		});
	}

	private broadcastMessage(message: OSCMessage, socket: SocketIO.Socket): void {
		console.log(
			`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Broadcasting message: ${JSON.stringify(message, null, 4)}`,
		);
		console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);

		socket.broadcast.emit('broadcastMessage', message);
	}

	private controllerStartTimer(socket: SocketIO.Socket): void {
		socket.on('controllerTimerStart', () => {
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | STARTING CONNECTION TIMER`);
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);
			this.startTimer();
			socket.emit('startingTimer', 'Timer has started');
		});
	}

	private disconnectingClient() {
		this.clientIO.to(this.controlling).emit('disconnectingClient');
	}

	private disconnect(socket: SocketIO.Socket) {
		socket.on('disconnect', () => {
			console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Disconnecting Client { ${socket.conn.id} }`);

			if (this.controlling === socket.conn.id) {
				console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | STOPPING TIMER`);
				console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);

				this.stopTimer();

				this.connectedClients.splice(0, 1);
				this.controlling = this.connectedClients[0];

				console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Now in control: { ${this.controlling} }`);

				this.clientIO.to(this.controlling).emit('controlling', [this.frequencyState, this.amplitudeState]);

				if (this.controlling === undefined) {
					console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | RESTARTING`);
					console.log(`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);
					this.restartServer();
				}
			} else {
				console.log(
					`[SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | removing client { ${socket.conn.id} } fron queue`,
				);
				this.connectedClients = this.connectedClients.filter((client: string) => client !== socket.conn.id);
				this.controlling = this.connectedClients[0];
			}
		});
	}
}
