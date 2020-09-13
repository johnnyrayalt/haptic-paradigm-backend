import express from 'express';
import fs from 'fs';
import * as http from 'http';
import * as https from 'https';

class ImportServer {
	public static http = (clientApp: express.Application): http.Server => {
		return http.createServer(clientApp);
	};

	public static https = (clientApp: express.Application): https.Server => {
		return https.createServer(
			{
				key: fs.readFileSync(process.env.CLIENT_KEY),
				cert: fs.readFileSync(process.env.CLIENT_CER),
			},
			clientApp,
		);
	};
}

export default ImportServer;
