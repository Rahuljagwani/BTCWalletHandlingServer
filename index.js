const express = require("express");
const app = express();
const cors = require("cors");
const wallet = require("./wallet");

app.use(cors());
app.use(express.json());

app.post("/api/importwallet", async (req, res) => {
    const walletName = req.body.walletName;
    const mnemonic = req.body.mnemonic;
    const walletData = await wallet.getWalletAddress(walletName);
    var balance, response, addr, error;
    if (walletData.status === 404) {
        response = await wallet.createWallet(walletName, mnemonic);
        error = response.message;
        if (response.status === 200) {
            const resp = await wallet.generateUnusedAddress(walletName);
            addr = resp.address.address;
            error = resp.message;
            response.balance = '0';
            response.address = addr;
            response.txs = [];
        }
        response.error = error;
    } else if (walletData.status === 200) {

        if (walletData.wallets.chains[0].chain_addresses[0] === undefined) {
            const resp = await wallet.generateUnusedAddress(walletName);
            addr = resp.address.address;
            error = resp.message;
        } else {
            addr = walletData.wallets.chains[0].chain_addresses[0].address;
        }
        balance = await wallet.getTransactions(addr);

        if (balance.status === 200) {
            console.log(0);
            response = {
                status: balance.status,
                balance: balance.balance,
                address: addr,
                txs: balance.txs,
            }
        } else {
            error = balance.message;
            response = {
                status: balance.status,
                address: addr,
                error: error
            }
        }

    } else {
        console.log(1);
        response = walletData;
    }
    if (response.status !== 200) {
        res.status(500).json({ error: response.error });
    } else {
        res.send(response);
    }
});

app.post("/api/sync", async (req, res) => {
    const walletAddress = req.body.address;
    const response = await wallet.getTransactions(walletAddress);
    res.send(response);
});


app.listen(3001, () => {
    console.log("running on port 3001");
})