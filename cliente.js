var mqtt = require('mqtt')
var client_mqtt = mqtt.connect({ host: 'localhost', port: 1883 })
const jsonexport = require('jsonexport')
fs = require('fs')
let dados = { chegada: undefined, delay_ms: undefined, jitter_ms: undefined }
let delay_anterior = -1
let gravado = false
let array_dados = []

client_mqtt.on('connect', () => {
    client_mqtt.subscribe(['0'], (err) => { })
})

client_mqtt.on('message', (topic, message) => {
    console.log('Tópico: ' + topic.toString())
    console.log('Tamanho Tópico: ' + Buffer.byteLength(topic) + ' bytes')
    console.log('Tamanho Mensagem: ' + Buffer.byteLength(message) + ' bytes')
    dados = JSON.parse(message.toString())

    dados.chegada = String(new Date().getTime() / 1000)
    dados.chegada = data_format_ms(dados.chegada.split('.')[0], dados.chegada.split('.')[1])

    if (dados.fim) gravar()
    else {
        dados.envio = data_format_us(dados.envio_s, dados.envio_us)
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

data_format_ms = (s, us) => {
    s = s.toString()
    us = us.toString()
    let qtd_zero = 3 - us.length
    for (let i = 0; i < qtd_zero; i++)
        s += '0'
    let qtd_ms = 3 - qtd_zero
    s += us.slice(0, qtd_ms)
    return s
}

data_format_us = (s, us) => {
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
        fs.writeFile('exp2/1.csv', arquivo, (err) => {
            if (err) return console.log(err)
            else gravado = true
        })
    })
}