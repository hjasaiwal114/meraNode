import * as net from "net";
import { resolve } from "path";
// wrap a raw net.socket into promise-friendly tcpconn
function soInit(socket) {
    const conn = { socket, err: null, ended: false, reader: null };
    socket.on("data", (data) => {
        // if a reader is waiting , deliver data and pause events untill next read
        if (conn.reader) {
            conn.socket.pause();
            conn.reader.resolve(data);
            conn.reader = null;
        }
    });
    socket.on("end", () => {
        conn.ended = true;
        if (conn.reader) {
            conn.reader.resolve(Buffer.from(""));
            conn.reader = null;
        }
    });
    socket.on("error", (err) => {
        conn.err = err;
        if (conn.reader) {
            conn.reader.resolve(Buffer.from(""));
            conn.reader = null;
        }
    });
    return conn;
}
function soRead(conn) {
    if (conn.err)
        return Promise.reject(conn.err);
    if (conn.ended)
        return Promise.resolve(Buffer.from(""));
    return new Promise((resolve, reject) => {
        console.assert(!conn.reader, "concurrent reads not supported");
        conn.reader = { resolve, reject };
        // resume the 'data' event so the next incoming chunk will fullfill the promise
        conn.socket.resume();
    });
}
function soWrite(conn, data) {
    if (conn.err)
        return Promise.reject(conn.err);
    return new Promise((resolve, reject) => {
        conn.socket.write(data, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
// the echo loop 
async function serverClient(socket) {
    const conn = soInit(socket);
    try {
        while (true) {
            const data = await soRead(conn); // resolve to empty buffer on eof
            if (data.length === 0) {
                console.log("request close; ending");
                break;
            }
            console.log("rec", data.toString());
            await soWrite(conn, data); // echo back
            // close connection if client send letter q
            if (data.includes(Buffer.from('q'))) {
                console.log('requested close; ending');
                socket.end(); // fin fin 
                break;
            }
        }
    }
    catch (err) {
        console.error("serverClient error:", err);
        socket.destroy();
    }
}
// server setup
function newConn(socket) {
    console.log("new connection", socket.remoteAddress, socket.remotePort);
    // pause data events until soRead resume them
    socket.pause();
    serverClient(socket).catch((e) => console.error("unhandled", e));
}
const server = net.createServer({ pauseOnConnect: true }, newConn);
server.on("error", (err) => {
    console.log("server error:", err);
    server.close();
});
server.listen({ host: "127.0.0.1", port: 1234 }, () => {
    console.log("echo server listening on 127.0.0.1:1234");
});
//# sourceMappingURL=echo_server.js.map