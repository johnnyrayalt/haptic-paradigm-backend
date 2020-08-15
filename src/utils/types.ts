export interface OSCMessage {
	address: string;
	args: [
		{
			type: string;
			value: number;
		},
	];
}

export interface LoggerOptions {
	message?: string;
	lineBreak?: boolean;
}

export interface SliderOptions {
	[name: string]: string;
}
