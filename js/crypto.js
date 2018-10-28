"use strict";

async function import_key(key, ops) {
    const keyData = key;
	
    const algo = {
        name: "RSA-OAEP",
        hash: {
            name: "SHA-256"
        }
    };

    const imported_key = await crypto.subtle.importKey("jwk", keyData, algo, false, ops);

    return imported_key;
}

function convertStringToArrayBufferView(str) {
    let bytes = new Uint8Array(str.length);
    for (let iii = 0; iii < str.length; iii++) {
        bytes[iii] = str.charCodeAt(iii);
    }
    return bytes;
}

function convertArrayBufferViewtoString(buffer) {
    let str = "";
    for (let iii = 0; iii < buffer.byteLength; iii++) {
        str += String.fromCharCode(buffer[iii]);
    }
    return str;
}

function _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function _base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}



async function generate_key() {
    if (!crypto.subtle) throw "Browser doesn't support crypto API"
    const key = await crypto.subtle.generateKey({
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {
            name: "SHA-256"
        }
    }, true, ["encrypt", "decrypt"]);
    return key
}

async function export_key(publicKey) {
    const result = await crypto.subtle.exportKey("jwk", publicKey);
    return result
}



async function decrypt_data(ciphertext, private_key, vector) {
    try {
        const data = _base64ToArrayBuffer(ciphertext);
        const result = await crypto.subtle.decrypt({
            name: "RSA-OAEP",
            hash: {
                name: "SHA-256"
            },
        }, private_key, data);
        const decrypted_data = new Uint8Array(result);
        return convertArrayBufferViewtoString(decrypted_data);
    } catch (err) {
        console.trace(err);
        return "fail";
    }
}

async function encrypt_data(message, key) {
    const vector = crypto.getRandomValues(new Uint8Array(16));
    const result = await crypto.subtle.encrypt({
        name: "RSA-OAEP",
        hash: {
            name: "SHA-256"
        },
        iv: vector
    }, key, convertStringToArrayBufferView(message));
    const encrypted_data = new Uint8Array(result);
    return _arrayBufferToBase64(encrypted_data);
}


async function storeKey(key) {
    const exported_key = await export_key(key)
    const jsonKey = JSON.stringify(exported_key);
    localStorage.setItem("PrivateKey", jsonKey);
}

function loadPrivateKey() {
    const jsonKey = localStorage.getItem("PrivateKey");
    const private_key = JSON.parse(jsonKey);
    return import_key(private_key, ["decrypt"])
}

async function test() {
    const key = await generate_key();
    const pubkey = key.publicKey;
    await storeKey(key.privateKey)
    const exportedKey = await export_key(pubkey);
    const importedKey = await import_key(exportedKey, ["encrypt"])
    const message = "Ahoy!";
    const ciphertext = await encrypt_data(message, importedKey);
    const privateKey = await loadPrivateKey();
    const plaintext = await decrypt_data(ciphertext, privateKey);
    const sendInbox = await putInbox(exportedKey);
    const recvInbox = await getInbox(sendInbox.key);
    console.dir(recvInbox);
    const send = await putSecret(exportedKey);
    const recv = await getSecret(send.key);
    console.dir(recv);
    return plaintext;
}

const SITE = 'https://api.secretpigeon.com/api';


async function putSecret(data) {
    return await putData("secret", data)
}
async function putInbox(data) {
    return await putData("inbox", data)
}

async function getSecret(data) {
    return await getData("secret", data)
}

async function getInbox(data) {
    return await getData("inbox", data)
}

async function putData(path, data) {
	const url =  `${SITE}/${encodeURIComponent(path)}`;

    const resp = await fetch(url, {
        body: JSON.stringify(data),
        headers: {
            'content-type': 'application/json'
        },
        method: 'PUT'
    })
    const body = await resp.json();
    return body;
}

async function getData(path, key) {
const url =  `${SITE}/${encodeURIComponent(path)}/${encodeURIComponent(key)}`;
    console.log("GET " + url);
    const resp = await fetch(url, {
        headers: {
            'content-type': 'application/json'
        },
        method: 'GET'
    })
    const body = await resp.json();
    return body;
}
