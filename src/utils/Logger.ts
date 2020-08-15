import moment from 'moment';
import { LoggerOptions } from './types';

// TODO:: implement Pino logger
export class Logger {
	private lineBreakString: string = '------------------';
	private location: string;

	constructor(location: string) {
		this.location = `[${location.toUpperCase()} SERVER]`;
	}

	public broadcast(options: LoggerOptions) {
		options.lineBreak ? this.assembleLog(this.lineBreakString) : this.assembleLog(options.message);
	}

	private assembleLog(body: string) {
		const timeStamp: string = moment().format('MM/DD/YY, h:mm:ss a');

		return console.log(this.location, timeStamp, '|', body);
	}
}
