const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const ecc = require('@bitcoinerlab/secp256k1')
const { BIP32Factory } = require('bip32')
const bip32 = BIP32Factory(ecc)
const axios = require('axios');
const apiUrl = "https://api.blockcypher.com/v1/btc/test3";
const apiToken = "debe9e904b65463fa6a77a828409e0de";
var resp;

async function createWallet(walletName, mnemonic = bip39.generateMnemonic()) {

    if (!bip39.validateMnemonic(mnemonic)) {
        return {
            status: 500,
            message: 'Invalid BIP39 mnemonic'
        }
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const network = bitcoin.networks.testnet;
    const root = bip32.fromSeed(seed, network);
    const masterPublicKey = root.neutered();
    const xpub = masterPublicKey.toBase58();
    const testnetNode = root.derivePath("m/44'/1'/0'/0/0");
    const testnetAddress = bitcoin.payments.p2pkh({ pubkey: testnetNode.publicKey, network: network }).address;
    const walletData = {
        name: walletName,
        extended_public_key: xpub,
    };

    await axios
        .post(`${apiUrl}/wallets/hd?token=${apiToken}`, walletData)
        .then((response) => {
            resp = {
                status: 200,
                data: response.data,
                address: testnetAddress
            };
        })
        .catch((error) => {
            resp = {
                status: error.response.status,
                message: error.response.data.error,
                address: testnetAddress
            };
        });

    return resp
}

async function importWallet(name, mnemonic) {

    if (!bip39.validateMnemonic(mnemonic) || mnemonic === undefined) {
        return {
            status: 500,
            message: 'Invalid BIP39 mnemonic'
        }
    }

    const response = await createWallet(name, mnemonic);
    return response;
}

async function listWallets() {
    await axios
        .get(`${apiUrl}/wallets?token=${apiToken}`)
        .then((response) => {
            return {
                status: 200,
                wallets: response.data
            }
        })
        .catch((error) => {
            return {
                status: error.response.status,
                message: error.response.data.error
            }
        });
}

async function getBalance(walletAddress) {
    await axios
        .get(`${apiUrl}/addrs/${walletAddress}/balance`)
        .then((response) => {
            resp = {
                status: 200,
                balance: response.data.balance
            }
        })
        .catch((error) => {
            resp = {
                status: error.response.status,
                message: error.response.data.error
            }
        });
    return resp;
}

async function getTransactions(walletAddress) {
    await axios
        .get(`${apiUrl}/addrs/${walletAddress}/full`)
        .then((response) => {
            resp = {
                status: 200,
                txs: response.data.txs,
                balance: response.data.balance
            }
        })
        .catch((error) => {
            resp = {
                status: error.response.status,
                message: error.response.data.error
            }
        });
    return resp;
}

async function generateUnusedAddress(walletName) {
    await axios
        .post(`${apiUrl}/wallets/hd/${walletName}/addresses/derive?token=${apiToken}`)
        .then((response) => {
            const addr = response.data.chains[0].chain_addresses[0];
            resp = {
                status: 200,
                address: addr
            }
        })
        .catch((error) => {
            resp = {
                status: error.response.status,
                message: error.response.data.error
            }
        });
    return resp;
}

async function getWalletAddress(walletName) {
    await axios
        .get(`${apiUrl}/wallets/hd/${walletName}/addresses?token=${apiToken}`)
        .then((response) => {
            resp = {
                status: 200,
                wallets: response.data
            }
        })
        .catch((error) => {
            resp = {
                status: error.response.status,
                message: error.response.data.error
            }
        });
    return resp;
}

module.exports = {
    createWallet,
    importWallet,
    listWallets,
    getBalance,
    getTransactions,
    generateUnusedAddress,
    getWalletAddress
};