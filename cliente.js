var mqtt = require('mqtt')
var client_mqtt = mqtt.connect({ host: 'localhost', port: 1883 })
const jsonexport = require('jsonexport')
fs = require('fs')
let dados = { chegada: undefined, delay_ms: undefined, jitter_ms: undefined }
let delay_anterior = -1
let gravado = false
let array_dados = []
let ms = 0, mi = 0

client_mqtt.on('connect', () => {
    client_mqtt.subscribe(['0'], { qos: 0 })
})

client_mqtt.on('message', (topic, message) => {
    // console.log('Tópico: ' + String(topic))
    // console.log('Tamanho Tópico: ' + Buffer.byteLength(topic) + ' bytes')
    // console.log('Tamanho Mensagem: ' + Buffer.byteLength(message) + ' Bytes')
    dados = JSON.parse(String(message))
    if (dados.fim) {
        gravar()
        console.log(dados)
    }
    else {
        dados.chegada = String(new Date().getTime() / 1000)
        dados.chegada = data_format_ms(dados.chegada.split('.')[0], dados.chegada.split('.')[1])
        dados.envio = data_format_us(dados.s, dados.us)
        let envio = new Date(parseInt(dados.envio))
        let chegada = new Date(parseInt(dados.chegada))
        dados.delay_ms = chegada - envio
        if (dados.delay_ms < 0) dados.delay_ms = 0

        if (delay_anterior == -1)
            dados.jitter_ms = 0
        else
            dados.jitter_ms = Math.abs(delay_anterior - dados.delay_ms)
        delay_anterior = dados.delay_ms
        delete dados.a
        mi++
        ms = ms + dados.delay_ms
        console.log('Mensagem: ' + Buffer.byteLength(message) + ' B')
        console.log('Qtd Msg: ' + mi)
        console.log('Delay::::::::::::::: ' + dados.delay_ms + ' ms')
        console.log('Média: ' + (ms / mi).toFixed(2) + ' ms\n')
        array_dados.push(dados)
    }

    // client_mqtt.end()
})

data_format_ms = (s, us) => {
    s = String(s) || '0'
    us = String(us).toLowerCase().indexOf('undefined') > -1 ? '000' : String(us)
    let qtd_zero = 3 - us.length
    for (let i = 0; i < qtd_zero; i++)
        us += '0'
    s += us.slice(0, 3)
    return s
}

data_format_us = (s, us) => {
    s = String(s)
    us = String(us).toLowerCase().indexOf('undefined') > -1 ? '000' : String(us)
    let qtd_zero = 6 - us.length
    for (let i = 0; i < qtd_zero; i++)
        us += '0'
    s += us.slice(0, 3)
    return s
}

gravar = () => {
    jsonexport(array_dados, (err, csv) => {
        if (err) return console.error(err)
        let arquivo = csv
        fs.writeFile('exp3/teste.csv', arquivo, (err) => {
            // fs.writeFile('exp3/qos2_4096b0ms_3.csv', arquivo, (err) => {
            if (err) return console.log(err)
            else gravado = true
        })
    })
}

//MQTT - Rodando por 60s - Média do Delay - Biblioteca MQTT.Js

//(1x 4170)
//qos0,4096b,0ms = 22.60ms/13592, 24.18ms/136000, 24.27ms/13550
//qos0,4096b,20ms = 19.68ms/2908, 19.87ms/2906, 19.83ms/2909
//qos0,4096b,40ms = 18.86ms/1475, 18.79ms/1475, 19.10ms/1475
//qos0,4096b,60ms = 3.04ms/989, 3.11ms/989, 3.17ms/989
//qos0,4096b,80ms = 3.92ms/743, 3.78ms/743, 3.79ms/743
//qos0,4096b,100ms = 5.27ms/595, 5.35ms/595, 5.31ms/595

//(2x 4172, 2x 72 {Publish Ack})
//qos1,4096b,0ms = 22.63ms/4183, 22.78ms/4256, 21.92ms/4340
//qos1,4096b,10ms = 9.24ms/3587, 9.56ms/3517, 9.74ms/3483
//qos1,4096b,20ms = 2.84ms/2956, 3.01ms/2944, 2.82ms/2955
//qos1,4096b,40ms = 3.22ms/1490, 3.07ms/1490, 3.03ms/1490
//qos1,4096b,60ms = 3.43ms/996, 3.26ms/996, 3.41ms/996
//qos1,4096b,80ms = 4.02ms/747, 4.06ms/748, 3.96ms/748
//qos1,4096b,100ms = 5.61ms/598, 5.57ms/598, 5.84ms/598

//(2x 4172, 1x 72 {Publish Ack})
//qos2,4096b,0ms = 17.46ms/13130, 18.43ms/13613, 23.19ms/13333