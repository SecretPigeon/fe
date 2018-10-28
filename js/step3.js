"use strict";

async function step3(key) {
    try {
        const recvInbox = await getInbox(key);
        const ciphertext = recvInbox['data']['ciphertext'];
        const privateKey = await loadPrivateKey();
        const plaintext = await decrypt_data(ciphertext, privateKey);
        console.log(plaintext);
        return plaintext;
    } catch (err) {
        console.trace(err);
        return "fail";
    }
}

const key = window.location.hash.replace('#', '');
step3(key).then(plaintext => {
    console.log(plaintext);
    const box = document.getElementById("secret");
    box.value = plaintext;
}).catch(oops => console.trace(oops))