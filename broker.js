var mosca = require('mosca')

var ascoltatore = {
    type: 'mongo',
    url: 'mongodb://localhost:27017/mqtt',
    pubsubCollection: 'ascoltatori',
    mongo: {}
}

var settings = {
    port: 1883,
    backend: ascoltatore
}

var server = new mosca.Server(settings)

server.on('clientConnected', function (client) {
    console.log('client connected', client.id)
})

server.on('published', function (packet, client) {
    console.log('Mensagem recebida', packet.payload)
})

server.on('ready', setup)

function setup() {
    console.log('Broker MQTT Online')
}