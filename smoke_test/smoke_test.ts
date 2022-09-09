// https://deno.land/manual@v1.25.2/examples/tcp_echo

import { copy } from "https://deno.land/std@0.155.0/streams/conversion.ts";

const port = parseInt(Deno.env.get("PORT") || '2345');

const listener = Deno.listen({ port });

console.log(`listening on 0.0.0.0:${port}`);
for await (const conn of listener) {
  copy(conn, conn).finally(() => conn.close());
}
