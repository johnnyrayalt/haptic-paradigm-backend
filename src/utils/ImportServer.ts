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
				key: fs.readFileSync('/home/johnny/.acme.sh/livelyservingitup.site/livelyservingitup.site.key'),
				cert: fs.readFileSync('/home/johnny/.acme.sh/livelyservingitup.site/livelyservingitup.site.cer'),
			},
			clientApp,
		);
	};
}

export default ImportServer;
