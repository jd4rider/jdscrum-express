require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = 3001;

const jsonParser = bodyParser.json();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const accessTokenSecret = 'youraccesstokensecret';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
      const token = authHeader.split(' ')[1];

      jwt.verify(token, accessTokenSecret, (err, user) => {
          if (err) {
              return res.sendStatus(403);
          }

          req.user = user;
          next();
      });
  } else {
      res.sendStatus(401);
  }
};

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

    app.post('/api/login', jsonParser, async (req, res) => {
        const { username, password } = req.body;
        
        users.findOne({ username: username }, async (err, result) => {
            if (err) {
                return console.log(err.message);
            }
            if (result) {
                const validPassword = await bcrypt.compare(password, result.password);
                if (validPassword) {
                    const token = jwt.sign({ username: username, role: result.userrole }, accessTokenSecret);
                    res.status(200).json({ token, username, id: result.id, role: result.userrole });
                } else {
                    res.status(400).json({ error: 'Invalid password' });
                }
            } else {
                res.status(401).json({ error: 'User does not exist' });
            }

        });
    });

    app.post('/api/signup', jsonParser, async (req, res) => {
        const salt = await bcrypt.genSalt(10);
        const { username, password, fname, lname } = req.body;
        const allusers = await users.find().toArray();
        let nextid = 0;
        if(allusers) nextid = Math.max(...allusers.map(user => user.id)) + 1;
        else nextid += 1;

        users.insertOne({ id: nextid, username: username, password: await bcrypt.hash(password, salt), fname: fname, lname: lname, userrole: 'user' }, (err, result) => {
            if (err) {
                if(err.message.includes('Duplicate')) return res.status(201).json({ error: "User Already Exists" });
                else return console.log(err.message);
            }
            users.findOne({'id': nextid}, (err, result) => {
                if (err) return console.log(err.message);
                const token = jwt.sign({ username: username, role: result.userrole }, accessTokenSecret);
                res.status(200).json({ token, username, id: result.id, role: result.userrole });
            })

        })
    })

    app.get('/baskets', authenticateJWT, (req, res) => {
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

    app.get('/basketcount', authenticateJWT, (req, res) => {
        let ownerid = parseInt(req.query.ownerid);
        //let canvasid = parseInt(req.query.canvasid);
        baskets.find({ownerid: ownerid}).toArray(function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                if(docs.length) res.send({'lengths': Math.max(...docs.map(item => item.id))});
                else res.send({'lengths': 0});
            }
        });
    })

    app.post('/baskets/insert', jsonParser, authenticateJWT, (req, res) => {
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

    app.get('/canvases', authenticateJWT, (req, res) => {
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

    app.post('/canvases/insert', jsonParser, authenticateJWT, (req, res) => {
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

    app.get('/items', authenticateJWT, (req, res) => {
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

    app.get('/itemcount', authenticateJWT, (req, res) => {
        let ownerid = parseInt(req.query.ownerid);
        
        items.find({ownerid: ownerid}).toArray(function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                if(docs.length) res.send({'lengths': Math.max(...docs.map(item => item.id))});
                else res.send({'lengths': 0});
            }
        });
    })

    app.post('/items/insert', jsonParser, authenticateJWT, (req, res) => {
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

    app.delete('/items/delete/:id/:ownerid/:canvasid', jsonParser, authenticateJWT, (req, res) => {
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

    app.put('/items/update', jsonParser, authenticateJWT, (req, res) => {
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