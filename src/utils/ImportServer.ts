import express from 'express';
import fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import Decrypt from './Decrypt';

class ImportServer {
	public static http = (clientApp: express.Application): http.Server => {
		return http.createServer(clientApp);
	};

	public static https = (clientApp: express.Application, isClientServer: boolean): https.Server => {
		return https.createServer(
			{
				key: isClientServer ? fs.readFileSync(process.env.CLIENT_KEY) : Decrypt.for(process.env.SSL_KEY),
				cert: isClientServer ? fs.readFileSync(process.env.CLIENT_CER) : Decrypt.for(process.env.SSL_CER),
			},
			clientApp,
		);
	};
}

export default ImportServer;
