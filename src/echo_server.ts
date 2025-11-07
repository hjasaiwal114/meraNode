import * as net from "net";

function newConn(socket: net.Socket): void{
    console.log('new connection', socket.remoteAddress, socket.remotePort);

    socket.on('end', () => {
        console.log('EOF');
    });
    socket.on('data', (data: Buffer) => {
        console.log('data', data);
        socket.write(data); // echo back the data
        // actively closed 
        if (data.includes('q')) {
            console.log('clossing');
            socket.end(); // this will ssend fin and close the connection
        }
    });
}
let server = net.createServer();
server.on('error',(err: Error) => {throw err;});
server.on('connection', newConn);
server.listen({host: '127.0.0.1', port: 1234});

