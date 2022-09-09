import { readLines, BufWriter, BufReader } from "https://deno.land/std@0.155.0/io/buffer.ts";
const port = parseInt(Deno.env.get("PORT") || '2345');
const listener = Deno.listen({ port });
console.log(`listening on 0.0.0.0:${port}`);

function isPrime(n: number): boolean {
    if (!Number.isInteger(n) || n <= 1) {
        return false;
    }
    if (n == 2) {
        return true;
    }
    let d = 2;
    while (d <= Math.ceil(Math.sqrt(n))) {
        if (n % d == 0) {
            return false;
        }
        d++;
    }
    return true;
}

async function handleConnection(reader: BufReader, writer: BufWriter) {
    for await (const line of readLines(reader)) {
        console.log(`Received: ${line}`)
        try {
            const { method, number } = JSON.parse(line);
            if (method === 'isPrime' && typeof(number) === 'number' && isFinite(number)) {
                const response = { method: 'isPrime', "prime": isPrime(number)};
                await writer.write(encoder.encode(JSON.stringify(response) + "\n"));
            }
            else {
                await writer.write(encoder.encode("nope\n"))
            }
        }
        catch(ex) {
            console.log(ex);
            await writer.write(encoder.encode("wtf\n"))
        }
        await writer.flush();
    }
}

const encoder = new TextEncoder();
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
