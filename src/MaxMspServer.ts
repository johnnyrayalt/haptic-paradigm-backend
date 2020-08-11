import cors from 'cors';
import express from 'express';
import { createServer, Server } from 'http';
import moment from 'moment';
import socketio from 'socket.io';

export class MaxMspServer {
	private readonly MAXMSP_PORT: string | number = process.env.PORT || 8001;

	private maxMspApp: express.Application;
	private maxMspServer: Server;
	public maxMspIO: SocketIO.Server;
	private maxMspPort: string | number;

	constructor() {
		this.maxMspApp = express();
		this.maxMspPort = this.MAXMSP_PORT;
		this.maxMspApp.use(cors());
		this.maxMspApp.options('*', cors());
		this.maxMspServer = createServer(this.maxMspApp);

		this.initSocket();
		this.listenForMax();
		this.handleSocketConnections();
	}

	private initSocket(): void {
		this.maxMspIO = socketio(this.maxMspServer);
	}

	private listenForMax(): void {
		this.maxMspServer.listen(this.maxMspPort, () => {
			console.log(`[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);
			console.log(
				`[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Running server on port ${this.maxMspPort}`,
			);
			console.log(`[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | ------------------`);
		});
	}

	private handleSocketConnections(): void {
		this.maxMspIO.on('connect', (socket: SocketIO.Socket): void => {
			console.log(
				`[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Connected client with ID { ${
					socket.conn.id
				} } on port ${this.MAXMSP_PORT}`,
			);

			socket.emit('connectedToServer', `[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Connected ٩(｡•́‿•̀｡)۶`);

			socket.on('disconnect', () => {
				console.log(`[MAX SERVER]: ${moment().format('MM/DD/YY, h:mm:ss a')} | Disconnected from remote max client`);
				socket.disconnect();
			});
		});
	}
}
