var mqtt = require('mqtt')
var client_mqtt = mqtt.connect({ host: 'localhost', port: 1883 })
const NTP = require("ntp-time").Client
const client_ntp = new NTP("a.st1.ntp.br", 123, { timeout: 5000 })
let delay_anterior = 0

client_mqtt.on('connect', function () {
    client_mqtt.subscribe('sensores', function (err) {
        // if (!err) {
        //     client_mqtt.publish('presence', 'Hello mqtt')
        // }
    })
})

client_mqtt.on('message', function (topic, message) {
    let dados = { chegada: undefined, delay_ms: undefined, jitter_ms: undefined }
    dados = JSON.parse(message.toString())
    // dados.chegada = Date.now()
    dados.envio = data_saida(dados.envio_s, dados.envio_us)

    client_ntp
        .syncTime()
        .then((time) => {
            dados.chegada = time.transmitTimestamp.toString().split('.')[0]
            let envio = new Date(parseInt(dados.envio))
            let chegada = new Date(parseInt(dados.chegada))
            dados.delay_ms = Math.abs(chegada - envio)

            dados.jitter_ms = Math.abs(delay_anterior - dados.delay_ms)
            console.log(dados)

            delay_anterior = dados.delay_ms
        })

    // client_mqtt.end()
})

data_saida = (envio_s, envio_us) => {
    envio_s = envio_s.toString()
    envio_us = envio_us.toString()
    let qtd_zero = 6 - envio_us.length
    let qtd_ms = 3 - qtd_zero
    for (let i = 0; i < qtd_zero; i++)
        envio_s += "0"
    envio_s += envio_us.slice(0, qtd_ms)
    return envio_s
}