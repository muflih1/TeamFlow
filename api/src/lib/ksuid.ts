import crypto from 'node:crypto';

class KSUID {
  constructor(
    private epoch = Math.floor(
      new Date('2014-05-13T00:00:00Z').getTime() / 1000,
    ),
  ) {}

  private encode(bytes: Uint8Array) {
    const charset =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    let value = 0n;

    for (const b of bytes) {
      value = (value << 8n) | BigInt(b);
    }

    let result = '';

    while (value > 0n) {
      const rem = Number(value % 62n);
      result = charset[rem] + result;
      value /= 62n;
    }

    return result.padStart(27, '0');
  }

  generate() {
    const now = Math.floor(Date.now() / 1000);

    const timestamp = now - this.epoch;

    if (timestamp < 0) {
      throw new Error('Time before epoch');
    }

    const bytes = new Uint8Array(20);

    // write timestamp (big-endian)
    bytes[0] = (timestamp >>> 24) & 0xff;
    bytes[1] = (timestamp >>> 16) & 0xff;
    bytes[2] = (timestamp >>> 8) & 0xff;
    bytes[3] = timestamp & 0xff;

    // 16 random bytes
    const rand = crypto.randomBytes(16);
    bytes.set(rand, 4);

    return this.encode(bytes);
  }
}

export const ksuid = new KSUID();
