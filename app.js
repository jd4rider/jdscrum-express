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
        let ownerid = parseInt(req.query.ownerid);
        let canvasid = parseInt(req.query.canvasid);
        baskets.find({ownerid: ownerid, canvasid: canvasid}).toArray(function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(docs);
            }
        });
    })

    app.post('/baskets/insert', jsonParser, (req, res) => {
        const baskets_req = req.body;
        baskets.insertMany(baskets_req).then(function(result,err){
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    })

    app.get('/canvases', (req, res) => {
        let ownerid = parseInt(req.query.ownerid);
        canvases.find({ownerid: ownerid}).toArray(function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(docs);
            }
        });
    })

    app.post('/canvases/insert', jsonParser, (req, res) => {
        const canvas = req.body;
        canvases.insertMany([canvas]).then(function(result,err){
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    })

    app.get('/items', (req, res) => {
        let ownerid = parseInt(req.query.ownerid);
        let canvasid = parseInt(req.query.canvasid);
        items.find({ownerid: ownerid, canvasid: canvasid}).toArray(function(err, docs) {
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
        items.insertMany([item]).then(function(result,err){
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    })

    app.delete('/items/delete/:id/:ownerid/:canvasid', jsonParser, (req, res) => {
        const id = parseInt(req.params.id);
        const ownerid = parseInt(req.params.ownerid);
        const canvasid = parseInt(req.params.canvasid);
        items.deleteMany({ id: id, ownerid: ownerid, canvasid: canvasid }).then(function(result,err){
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    })

    app.put('/items/update', jsonParser, (req, res) => {
        const itemsfromreq = req.body;
        let errors = [];
        let itemsProcessed = 0;
        itemsfromreq.forEach(item => {
            items.updateOne({ id: item.id, canvasid: item.canvasid, ownerid: item.ownerid }, { $set: { title: item.title, description: item.description, status: item.status, priority: item.priority } }).then(function(result,err){
                itemsProcessed++;
                if (err) {
                    errors.push(err);
                } 
                if(itemsProcessed === itemsfromreq.length){
                    if(errors.length > 0){
                        console.log(errors);
                        res.sendStatus(500);
                    } else {
                        res.send(result);
                    }
                }
            });
        }); 
    })

    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}




main()