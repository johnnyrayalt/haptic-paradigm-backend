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

// Sliders
const SLIDER_NAME: string = 'cube';
export const SLIDER = (address: string, value: number, name: string = SLIDER_NAME): OSCMessage => ({
	address: `/${name}/${address}`,
	args: [
		{
			type: address,
			value: value,
		},
	],
});

export const SLIDER_DATA = [
	{
		address: 'x',
		value: 50,
	},
	{
		address: 'y',
		value: 50,
	},
	{
		address: 'z',
		value: 50,
	},
];
