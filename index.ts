interface ConfigFile {
    port: number;
    basePath: string;
}

const config: ConfigFile = JSON.parse(await Deno.readTextFile('config.json'));
const server = Deno.listen({ port: config.port });
console.log(`Web server started at port ${config.port}`);

async function serveConnection(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const reqEvent of httpConn) {
        const url = new URL(reqEvent.request.url);
        const filepath = decodeURIComponent(url.pathname)

        let file;
        try {
            file = await Deno.open(`${config.basePath}${filepath == '/' ? '/index.html' : filepath}`, { read: true });
        } catch {
            await reqEvent.respondWith(new Response('404 Not Found', { status: 404 }));
            continue;
        }

        const readableStream = file.readable;
        const res = new Response(readableStream);
        await reqEvent.respondWith(res);
    }
}

for await (const connection of server) {
    serveConnection(connection).catch(console.error);
}
