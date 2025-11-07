import * as net from "net";

function newConn(socket: net.Socket): void {
    console.log('new connection', socket.remoteAddress, socket.remotePort);
    socket.end('end', () => {
        // fin received the connection will be closed automatically
        console.log('EOF.');
    });
    socket.on('data',(data: Buffer)=> {
        console.log('data:', data);
        socket.write(data); // echo back the data

        // actively closed the conncection is the data contains 'q'
        if (data.includes('q')) {
            console.log('closing')
            socket.end(); // this will send fin and close the connection
        }
    });
}

let server = net.createServer({allowHalfOpen: true});
server.on('error', (err: Error) => { throw err});
server.on('connection', newConn)
server.listen({host: '127.0.0.1', port: 1234});
