import * as net from 'net';

function newConn(socket: net.Socket): void {
    console.log(`new connection`, socket.remoteAddress, socket.remotePort);
    socket.on('end', () => {
        console.log('EOF')
    });

    socket.on('data', (data: Buffer) => {
        console.log('data', data)
        socket.write(data);
        // actively closed the conection if the data contains 'q'
        if (data.includes('k')) {
            console.log('closing');
            socket.end();// this will send fin and close the connection
        }
    });
}


let server = net.createServer();
server.on('errro', (err:Error) => {throw err;});
server.on('error', newConn);
server.listen({ host: '127.0.0.1', port: 1234 })

