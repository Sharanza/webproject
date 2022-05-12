var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
// package to create unique ID's
const { v4: uuidv4 } = require('uuid');

var app = express();
var server = http.createServer(app);
server.listen(8080,function(){
    console.log("Server listening on port: 8080");
});

// variable which returns the sqlite Database object and automatically opens the database in-memory
let db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'../')));


app.get('/', function(req,res){
  res.sendFile(path.join(__dirname,'../index.html'));
});

// add extra fields here as type TEXT
db.run('CREATE TABLE IF NOT EXISTS gameRating(id TEXT, name TEXT, author TEXT, rating TEXT, comments TEXT)');

// View
app.post('/view', function(req,res){
  db.serialize(() => {
    db.each(
      'SELECT id, name, author, rating, comments FROM gameRating WHERE name = ?',
      [req.body.name],
      function(err,row) {
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        res.send(`Game details: id: ${row.id}, name: ${row.name}, author: ${row.author}, rating: ${row.rating}, comments: ${row.comments}`);
        console.log("Game rating displayed successfully");
      },
      // on complete function
      function(err, numRows) {
        // send message and response when nothing is found by the query. Page would hang and crash otherwise.
        if(numRows === 0) {
          res.status(404).send('No games were found with that name');
          console.log(`No games were found with the name ${req.body.name}`);
        }
      }
    );
  });
});

// Insert
app.post('/add', function(req,res){
  db.serialize(()=>{
    const id = uuidv4();
    db.run('INSERT INTO gameRating(id,name,author,rating,comments) VALUES(?,?,?,?,?)', [id, req.body.name, req.body.author, req.body.rating, req.body.comments], function(err){
      if (err) {
        return console.log(err.message);
      }
      console.log("New game rating has been added");
      res.send("New game has been added into the database with ID: "+id+ ", Name: "+req.body.name+ ", Author: "+req.body.author+ ", Game Rating: "+req.body.rating+ " and Comments: "+req.body.comments);
    });
});
});

//UPDATE
app.post('/update', function(req,res){
  db.serialize(()=>{
    db.run('UPDATE gameRating SET name = ?, author = ?, rating = ?, comments = ? WHERE id = ?', [req.body.name, req.body.author, req.body.rating, req.body.comments, req.body.id], function(err){
      if(err){
        res.send("Error encountered while updating");
        return console.error(err.message);
      }
      res.send("Game rating has been updated successfully. ID: "+req.body.id+ ", Name: "+req.body.name+ ", Author: "+req.body.author+ ", Game Rating: "+req.body.rating+ " and Comments: "+req.body.comments);
      console.log("Game rating updated successfully");
    });
  });
});

//DELETE
app.post('/delete', function(req,res){
  db.serialize(()=>{
    db.run('DELETE FROM gameRating WHERE id = ?', req.body.id, function(err) {
      if (err) {
        res.send("Error encountered while deleting");
        return console.error(err.message);
      }

      // if there were no changes made to the database by the DELETE statement then send a message and 404
      if (this.changes === 0) {
        // send a relevant message back and log it to the console
        const message = `No game with the ID ${req.body.id} was found`;
        res.status(404).send(message);
        return console.log(message);
      }

      // if there have been changes in the database then I know that the game has been deleted successfully
      // send a relevant message back and log to the console
      res.send("Game rating with ID: " + req.body.id + " has been deleted.");
      console.log("Game rating deleted");
    });
  });
});

app.get('/close', function(req,res){
  db.close((err) => {
    if (err) {
      res.send('There is some error in closing the database');
      return console.error(err.message);
    }
    console.log('Closing the database connection.');
    res.send('Database connection successfully closed');
  });
});

app.get('/get-all', function(req,res){
  db.serialize(()=>{
    db.all('SELECT * FROM gameRating', function(err,rows){
      if(err){
        res.send({
          success: false,
          message: "Error encountered while getting all"
        });
        return console.error(err.message);
      }
      res.send({
        success: true,
        games: rows,
      });
      console.log("Found all games");
    });
  });
});
