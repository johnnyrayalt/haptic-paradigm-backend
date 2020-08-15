import { SliderOptions } from './types';

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
const SLIDER: string = '/slider';
export const SLIDER_ONE: SliderOptions = { address: `${SLIDER}/frequency`, type: 'f' };
export const SLIDER_TWO: SliderOptions = { address: `${SLIDER}/amplitude`, type: 'a' };
