class Decrypt {
	public for = (key: string): string => {
		return this.decrypt(key);
	};

	private decrypt = (key: string): any => {
		return Buffer.from(key, process.env.DECRYPTION_ALG as BufferEncoding).toString();
	};
}

const singleton = new Decrypt();
Object.freeze(singleton);
export default singleton;
