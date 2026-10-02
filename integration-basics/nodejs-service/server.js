const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
const PYTHON_URL = 'http://localhost:5001';
const HISTORY_FILE = path.join(__dirname, 'history.csv');

if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, 'timestamp,num1,num2,operation,result\n');
}

function logToCSV(num1, num2, operation, result) {
    const timestamp = new Date().toISOString();
    const line = `${timestamp},${num1},${num2},${operation},${result}\n`;
    fs.appendFileSync(HISTORY_FILE, line);
}

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js Gateway!' });
});

app.post('/api/calculate', async (req, res) => {
    console.log('Node.js received:', req.body);
    try {
        const pythonResponse = await axios.post(`${PYTHON_URL}/calculate`, req.body);
        const { num1, num2, operation } = req.body;
        logToCSV(num1, num2, operation, pythonResponse.data.result);
        res.json({
            gateway_message: 'Node.js successfully aggregated the data!',
            python_result: pythonResponse.data
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to reach Python service. Is it running on port 5001?'
        });
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const ping = await axios.get(`${PYTHON_URL}/ping`);
        res.json({ gateway: 'Node.js is running', python: ping.data });
    } catch (error) {
        res.status(500).json({ gateway: 'Node.js is running', python: 'Python is NOT reachable' });
    }
});

app.listen(PORT, () => {
    console.log(`Node.js Gateway: http://localhost:${PORT}`);
    console.log(`Python URL: ${PYTHON_URL}`);
});