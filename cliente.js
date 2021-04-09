const mqtt = require('mqtt')
const cliente = mqtt.connect({ host: 'localhost', port: 1883, keepalive: 18000 })
const jsonexport = require('jsonexport')
const fs = require('fs')
let dados = { chegada: undefined, delay_ms: undefined, jitter_ms: undefined }
let array_dados = [], delay_anterior = -1, ms = 0, mi = 0, nome_arquivo

cliente.on('connect', () => {
    cliente.subscribe('0', { qos: 0 })
    cliente.subscribe('1', { qos: 1 })
    cliente.subscribe('2', { qos: 2 })
})

cliente.on('message', (topic, message) => {
    dados = JSON.parse(String(message))
    if (dados.reset) {
        mi = 0
        ms = 0
        array_dados = []
        delay_anterior = -1
        nome_arquivo = 'exp2/' + dados.nome_arquivo
        console.log('RESETANDO\n')
        console.log(dados)
    } else
        if (dados.fim) {
            gravar(dados.total)
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

gravar = (total) => {
    let relatorio = nome_arquivo + ': ' + mi + '/' + total + ', ' + (ms / mi).toFixed(2) + ' ms\n'
    fs.appendFile('relatorio_exp2.txt', relatorio, (err) => {
        if (err) throw err
        console.log('Updated!')
    })

    jsonexport(array_dados, (err, csv) => {
        if (err) return console.error(err)
        let arquivo = csv
        fs.writeFile(nome_arquivo, arquivo, (err) => {
            if (err) return console.log(err)
        })
    })
}