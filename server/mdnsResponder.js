import dgram from 'dgram';
import { getPrimaryLocalIP } from './networkUtils.js';

const MDNS_MULTICAST_ADDR = '224.0.0.251';
const MDNS_PORT = 5353;

/**
 * Encodes a domain name string like "fly.local" into DNS wire format:
 * "fly.local" -> "\x03fly\x05local\x00"
 */
function encodeDomainName(domain) {
  const parts = domain.split('.').filter(Boolean);
  const buffers = [];
  for (const part of parts) {
    const len = Buffer.byteLength(part);
    const buf = Buffer.alloc(1 + len);
    buf.writeUInt8(len, 0);
    buf.write(part, 1, len, 'utf8');
    buffers.push(buf);
  }
  buffers.push(Buffer.from([0x00])); // null terminator
  return Buffer.concat(buffers);
}

/**
 * Extracts question names from an incoming DNS query buffer
 */
function extractQuestionNames(msg) {
  const names = [];
  if (msg.length < 12) return names;

  const qdCount = msg.readUInt16BE(4);
  let offset = 12;

  for (let q = 0; q < qdCount && offset < msg.length; q++) {
    const labels = [];
    while (offset < msg.length) {
      const len = msg.readUInt8(offset);
      if (len === 0) {
        offset += 1;
        break;
      }
      if ((len & 0xc0) === 0xc0) {
        // Pointer (compression)
        offset += 2;
        break;
      }
      offset += 1;
      if (offset + len <= msg.length) {
        labels.push(msg.toString('utf8', offset, offset + len));
        offset += len;
      } else {
        break;
      }
    }
    // Skip QTYPE (2 bytes) and QCLASS (2 bytes)
    offset += 4;
    if (labels.length > 0) {
      names.push(labels.join('.').toLowerCase());
    }
  }

  return names;
}

/**
 * Builds an authoritative mDNS A-record response packet
 */
function buildAResponse(domain, ipAddress, txId = 0) {
  const nameBuf = encodeDomainName(domain);
  const ipParts = ipAddress.split('.').map((p) => parseInt(p, 10));

  // Header: 12 bytes
  const header = Buffer.alloc(12);
  header.writeUInt16BE(txId, 0);       // ID
  header.writeUInt16BE(0x8400, 2);     // Flags: Response, Authoritative Answer
  header.writeUInt16BE(0, 4);          // QDCOUNT (0 questions)
  header.writeUInt16BE(1, 6);          // ANCOUNT (1 answer)
  header.writeUInt16BE(0, 8);          // NSCOUNT (0)
  header.writeUInt16BE(0, 10);         // ARCOUNT (0)

  // Answer record
  const answerFixed = Buffer.alloc(10);
  answerFixed.writeUInt16BE(0x0001, 0);     // TYPE: A
  answerFixed.writeUInt16BE(0x8001, 2);     // CLASS: IN + Cache-Flush bit (0x8000)
  answerFixed.writeUInt32BE(120, 4);        // TTL: 120 seconds
  answerFixed.writeUInt16BE(4, 8);          // RDLENGTH: 4 bytes

  const rdata = Buffer.from(ipParts);

  return Buffer.concat([header, nameBuf, answerFixed, rdata]);
}

/**
 * mDNS Local Hostname Responder
 * Responds to queries for:
 * - fly.local
 * - f.local
 * - filefly.local
 */
export class MdnsResponder {
  constructor(hostnames = ['fly.local', 'f.local', 'filefly.local']) {
    this.hostnames = hostnames.map((h) => h.toLowerCase());
    this.socket = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('error', (err) => {
      // If port 5353 is already taken or restricted, fail gracefully without crashing
      console.warn('[mDNS] Notice:', err.message);
    });

    this.socket.on('message', (msg, rinfo) => {
      try {
        const queryNames = extractQuestionNames(msg);
        const myIP = getPrimaryLocalIP();

        for (const queryName of queryNames) {
          const matched = this.hostnames.find(
            (h) => queryName === h || queryName === `${h}.`
          );

          if (matched && myIP && myIP !== '127.0.0.1') {
            const txId = msg.readUInt16BE(0);
            const responsePacket = buildAResponse(matched, myIP, txId);

            // Multicast reply back to 224.0.0.251:5353
            this.socket.send(
              responsePacket,
              0,
              responsePacket.length,
              MDNS_PORT,
              MDNS_MULTICAST_ADDR
            );

            // Also unicast reply directly to querying device for maximum reliability
            if (rinfo.port && rinfo.address) {
              this.socket.send(
                responsePacket,
                0,
                responsePacket.length,
                rinfo.port,
                rinfo.address
              );
            }

            console.log(`[mDNS] Resolved ${matched} -> ${myIP} for ${rinfo.address}`);
          }
        }
      } catch (e) {
        // Ignore malformed packets
      }
    });

    this.socket.on('listening', () => {
      this.isRunning = true;
      try {
        this.socket.setBroadcast(true);
        this.socket.setMulticastTTL(255);
        this.socket.setMulticastLoopback(true);
        this.socket.addMembership(MDNS_MULTICAST_ADDR);
      } catch (e) {
        // Membership might fail if network interface isn't up yet
      }

      console.log(`[mDNS] Local hostname responder active: http://fly.local / http://f.local`);
    });

    try {
      this.socket.bind(MDNS_PORT, '0.0.0.0');
    } catch (e) {
      console.warn('[mDNS] Could not bind port 5353:', e.message);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.socket) {
      try {
        this.socket.dropMembership(MDNS_MULTICAST_ADDR);
      } catch (e) {}
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
  }
}
