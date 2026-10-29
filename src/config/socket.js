let io;

function setIO(socketInstance){
    io=socketInstance;
}

function getIO(){
    if(!io){
        throw new error("Socket.IO has not been initialized");
    }
    return io;
}

module.exports = {setIO,getIO};