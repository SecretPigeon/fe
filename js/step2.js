"use strict";


async function step2(key) {
    const recvInbox = await getInbox(key);
    const exportedKey = recvInbox['data'];
    const importedKey = await import_key(exportedKey, ["encrypt"])
    return importedKey;
}

function sendEvent(importedKey) {
    console.log('sendEvent()');
    sendMsg(importedKey).then(result => {
        console.log(result);
    }).catch(oops => console.log(oops))
}

async function sendMsg(importedKey) {
    console.log('sendMsg()');
    const box = document.getElementById("secret");
    const message = box.value;
    const ciphertext = await encrypt_data(message, importedKey);
    const sent = await putSecret({
        'ciphertext': ciphertext
    });
    const loc = location.href.split("step")[0];
    box.readOnly = true;
    const key = loc + "step3#" + sent.key;
    box.value = key;

    document.getElementById("send").hidden = true;

    if (typeof navigator.clipboard !== 'undefined') {
        const copyButton = document.getElementById("copy");
        copyButton.addEventListener("click", function() {
            copyToClipboard(key)
        });
        copyButton.hidden = false;
    }

    return key;
}

function copyToClipboard(key) {
    console.log("copyToClipboard: "+key);
    if (typeof navigator.clipboard !== 'undefined') {
        navigator.clipboard.writeText(key);
    }

}

const key = window.location.hash.replace('#', '');
step2(key).then(importedKey => {
    const box = document.getElementById("secret");
    box.disabled = false;
    
    const send = document.getElementById("send");
    send.addEventListener("click", function() {
        sendEvent(importedKey)
    });
    send.disabled = false;


}).catch(oops => console.log(oops))
