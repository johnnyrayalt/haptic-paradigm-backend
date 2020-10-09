import { OSCMessage } from './types';

// Socket Events
export const CONNECT: string = 'connect';
export const DISCONNECT: string = 'disconnect';
export const MESSAGE: string = 'message';

// Servers
export const REMOTE_SERVER: string = 'remote';
export const CLIENT_SERVER: string = 'client';

// Socket Options
export const PING_INTERVAL: number = 1000;
export const PING_TIMEOUT: number = 10000;

// Time limit in seconds
export const TIME_LIMIT: number = 90;

export const buildMessage = (address: string, value: number, name: string = XYPAD_NAME): OSCMessage => ({
	address: `/${name}/${address}`,
	args: [
		{
			type: address,
			value: value,
		},
	],
});

// XYPAD DATA
export const XYPAD_NAME: string = 'xypad';
export const XYPAD_DATA = [
	{
		address: 'x',
		value: 50,
		displayName: 'X',
	},
	{
		address: 'y',
		value: 50,
		displayName: 'Y',
	},
];

// Sliders
const SLIDER_NAME: string = 'slider';
export const SLIDER_DATA = [
	{
		address: 'x',
		value: 2500,
	},
];
