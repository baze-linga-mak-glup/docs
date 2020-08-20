'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



exports.MainClass = class Messages extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setPrefix('msg');

            this.events = this.getEnumArray([
                'deleteMessage',
                'receiveMessage'
            ]);

            bot.client.on('message', message => {
                this.emitEvent(this.events.receiveMessage, message);
            });

            resolve();
        });
    }

    ready() {}

    reserve() {
        console.log('e')
        return new Promise((resolve, reject) => {
            this.setOnceEvent(this.events.receiveMessage, message => {
                console.log('d')
                resolve(message);
            });
        });
    }
}