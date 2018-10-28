"use strict";

async function step1() {
    const key = await generate_key();
    const pubkey = key.publicKey;
    await storeKey(key.privateKey);
    const exportedKey = await export_key(pubkey);
    const sendInbox = await putInbox(exportedKey);
    return loc + "step2#" + sendInbox.key;
}

function copyToClipboard(value) {
    if (typeof navigator.clipboard !== 'undefined') {
        navigator.clipboard.writeText(value);
    }

}

const loc = location.href.split("step")[0];
step1().then(result => {
    const box = document.getElementById("secret");
    box.value = result;

    if (typeof navigator.clipboard !== 'undefined') {
        const copyButton = document.getElementById("copy");
        copyButton.addEventListener("click", function() {
            copyToClipboard(result)
        });
        copyButton.classList.remove("invisible");
    }
}).catch(oops => console.log(oops))
