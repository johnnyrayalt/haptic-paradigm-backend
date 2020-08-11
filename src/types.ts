export interface OSCMessage {
	address: string;
	args: [
		{
			type: 'a' | 'f';
			value: number;
		},
	];
}
