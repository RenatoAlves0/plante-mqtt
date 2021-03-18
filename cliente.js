var mqtt = require('mqtt')
var client_mqtt = mqtt.connect({ host: 'localhost', port: 1883 })
const jsonexport = require('jsonexport')
fs = require('fs')
let dados = { chegada: undefined, delay_ms: undefined, jitter_ms: undefined }
let delay_anterior = -1
let gravado = false
let array_dados = []

client_mqtt.on('connect', function () {
    client_mqtt.subscribe(['0'], function (err) {
        // if (!err) {
        //     client_mqtt.publish('presence', 'Hello mqtt')
        // }
    })
})

client_mqtt.on('message', (topic, message) => {
    console.log('Tópico: ' + topic.toString())
    console.log('Tamanho Tópico: ' + Buffer.byteLength(topic) + ' bytes')
    console.log('Tamanho Mensagem: ' + Buffer.byteLength(message) + ' bytes')
    dados = JSON.parse(message.toString())

    dados.chegada = String(new Date().getTime() / 1000).replace('.', '')
    for (let i = 0; i < 13 - (dados.chegada.length); i++)
        dados.chegada += '0'

    if (dados.fim) gravar()
    else {
        dados.envio = data_format(dados.envio_s, dados.envio_us)
        let envio = new Date(parseInt(dados.envio))
        let chegada = new Date(parseInt(dados.chegada))
        dados.delay_ms = Math.abs(chegada - envio)
        if (delay_anterior == -1)
            dados.jitter_ms = 0
        else
            dados.jitter_ms = Math.abs(delay_anterior - dados.delay_ms)
        delay_anterior = dados.delay_ms
        console.log(dados)
        array_dados.push(dados)
    }

    // client_mqtt.end()
})

data_format = (s, us) => {
    s = s.toString()
    us = us.toString()
    let qtd_zero = 6 - us.length
    for (let i = 0; i < qtd_zero; i++)
        s += '0'
    let qtd_ms = 3 - qtd_zero
    s += us.slice(0, qtd_ms)
    return s
}

gravar = () => {
    jsonexport(array_dados, (err, csv) => {
        if (err) return console.error(err)
        let arquivo = csv
        fs.writeFile('1.csv', arquivo, (err) => {
            if (err) return console.log(err)
            else gravado = true
        })
    })
}