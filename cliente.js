var mqtt = require('mqtt')
var client_mqtt = mqtt.connect({ host: 'localhost', port: 1883 })
const NTP = require("ntp-time").Client
const client_ntp = new NTP("a.st1.ntp.br", 123, { timeout: 5000 })
const jsonexport = require('jsonexport')
fs = require('fs')
let dados = { chegada: undefined, delay_ms: undefined, jitter_ms: undefined }
let delay_anterior = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
let gravado = [false, false, false, false, false, false, false, false, false, false]
let array_dados = [[], [], [], [], [], [], [], [], [], []]

client_mqtt.on('connect', function () {
    client_mqtt.subscribe(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], function (err) {
        // if (!err) {
        //     client_mqtt.publish('presence', 'Hello mqtt')
        // }
    })
})

client_mqtt.on('message', async (topic, message) => {
    console.log('Tópico: ' + topic.toString())
    console.log('Tamanho Tópico: ' + Buffer.byteLength(topic) + ' bytes')
    console.log('Tamanho Mensagem: ' + Buffer.byteLength(message) + ' bytes')
    dados = JSON.parse(message.toString())
    dados.envio = data_saida(dados.envio_s, dados.envio_us)

    client_ntp
        .syncTime()
        .then(async (time) => {
            dados.chegada = await time.transmitTimestamp.toString().split('.')[0]
            let envio = await new Date(parseInt(dados.envio))
            let chegada = await new Date(parseInt(dados.chegada))
            dados.delay_ms = await Math.abs(chegada - envio)
            if (delay_anterior[parseInt(topic)] == -1)
                dados.jitter_ms = 0
            else
                dados.jitter_ms = await Math.abs(delay_anterior[parseInt(topic)] - dados.delay_ms)
            delay_anterior[parseInt(topic)] = await dados.delay_ms
            await dadosToFile(dados, parseInt(topic))
        })

    // client_mqtt.end()
})

data_saida = (envio_s, envio_us) => {
    envio_s = envio_s.toString()
    envio_us = envio_us.toString()
    let qtd_zero = 6 - envio_us.length
    let qtd_ms = 3 - qtd_zero
    for (let i = 0; i < qtd_zero; i++)
        envio_s += '0'
    envio_s += envio_us.slice(0, qtd_ms)
    return envio_s
}

dadosToFile = async (dados, i) => {
    // console.log('i ===> ' + i)
    // console.log(dados)
    await array_dados[i].push(dados)
    // if (dados.id <= 14) {
    if (dados.id >= 14 && !gravado[i]) {
        await jsonexport(array_dados[i], async (err, csv) => {
            if (err) return console.error(err)
            let arquivo = await csv
            await fs.writeFile('f16_' + i + '.csv', arquivo, async (err) => {
                if (err) return console.log(err)
                else gravado[i] = true
            })
        })
    }
}