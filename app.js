const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = 3001;

const jsonParser = bodyParser.json();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors());

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

const dbName = 'jdscrum';

async function main() {
    await client.connect();
    console.log('Connected successfully to database');
    const db = client.db(dbName);
    const items = db.collection('items');
    const baskets = db.collection('baskets');
    const users = db.collection('users');
    const canvases = db.collection('canvases');
    

    app.get('/', (req, res) => res.send('Hello World!'));

    app.get('/baskets', (req, res) => {
        
        baskets.find({}).toArray(function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(docs);
            }
        });
    })

    app.get('/items', (req, res) => {
        items.find({}).toArray(function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(docs);
            }
        });
    })

    app.post('/items/insert', jsonParser, (req, res) => {
        const item = req.body;
        items.insertMany([item]);
        res.sendStatus(200);
    })

    app.delete('/items/delete/:id', jsonParser, (req, res) => {
        const id = parseInt(req.params.id);
        items.deleteMany({ id: id });
        res.sendStatus(200);
    })

    app.put('/items/update', jsonParser, (req, res) => {
        const itemsfromreq = req.body;
        itemsfromreq.forEach(item => {
            items.updateOne({ id: item.id }, { $set: { title: item.title, description: item.description, status: item.status } });
        });  
        res.sendStatus(200);          
    })

    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}




main()