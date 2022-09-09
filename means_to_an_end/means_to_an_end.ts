import { BufWriter, BufReader } from "https://deno.land/std@0.155.0/io/buffer.ts";
const port = parseInt(Deno.env.get("PORT") || '2345');
const listener = Deno.listen({ port });
console.log(`listening on 0.0.0.0:${port}`);


const charI = 'I'.charCodeAt(0)
const charQ = 'Q'.charCodeAt(0)

const data: [number, number][] = [];

function insert(timestamp: number, price: number) {
    data.push([timestamp, price]);
}

function query(mintime: number, maxtime: number): number {
    console.log('query', mintime, maxtime);
    if (mintime > maxtime) {
        return 0
    }

    // calculate mean
    let sum = 0;
    let count = 0;
    for (const entry of data) {
        if (mintime <= entry[0] && entry[0] <= maxtime) {
            sum += entry[1]
            count++;
        }
    }

    return Math.ceil(sum / count);
}

async function handleConnection(reader: BufReader, writer: BufWriter) {
    const rawBuffer = new ArrayBuffer(9);
    const buffer = new Uint8Array(rawBuffer)
    const view = new DataView(rawBuffer);
    try {
        while(true) {
            await reader.readFull(buffer);
            const type = view.getUint8(0);
            const a = view.getInt32(1, false);
            const b = view.getInt32(5, false);
            if (type === charI) {
                insert(a, b);
            }
            else if (type == charQ) {
                const result = query(a, b)
                const outBuf = new ArrayBuffer(4);
                const outView = new DataView(outBuf);
                outView.setInt32(0, result, false);
                await writer.write(new Uint8Array(outBuf));
                await writer.flush();
            }
            else {
                throw new Error(`unknown type: ${type}`)
            }
        }
    }
    catch(ex) {
        console.log(ex);
    }
}

for await (const conn of listener) {
    const hostname = (conn.remoteAddr as Deno.NetAddr).hostname;
    console.log(`New connection from ${hostname}`);
    const writer = new BufWriter(conn);
    const reader = new BufReader(conn);

    // not using await here to allow multiple parallel connections
    handleConnection(reader, writer)
    .catch(ex => {
        console.error(ex);
    })
    .finally(() => {
        console.log(`Closing connection from ${hostname}`);
        conn.close();
    })
}
