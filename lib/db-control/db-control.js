// Page Tag
const tag = 'whisk-management:db-control';

// Requirements
require('dotenv').config();
const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')(tag);

const dbUrl = process.env.DB_URL;
let client;
let db;

function dbController(loggingTag, dbName = process.env.DB_NAME) {
  // Connect to MongoDB Database
  function connect() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(dbUrl, { useUnifiedTopology: true })
        .then((data) => {
          client = data;
          db = client.db(dbName);
          debug('Connected to MongoDB');
          return resolve(db);
        })
        .catch((error) => {
          debug('Error connecting to MongoDB');
          return reject(error);
        });
    });
  }

  // Disconnect from MongoDB Database
  function disconnect() {
    if (client != null) {
      client.close();
      client = undefined;
      db = undefined;
      debug('Disconnected from MongoDB');
    }
  }

  // Return true or false if database is connected or not
  function isConnected() {
    if (client === undefined) {
      return false;
    }
    return client.isConnected();
  }

  // Return a Database Instance
  function getDb() {
    return db;
  }

  // Setup database
  function setupDb() {
    return new Promise((resolve, reject) => {
      if (!isConnected()) {
        return reject(new Error('Not connected to database'));
      }
      db.createIndex('users', 'username', {
        unique: true,
        name: 'username_1'
      })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  // Insert user into user collection
  function insertUser(user) {
    return new Promise((resolve, reject) => {
      if (!isConnected()) {
        return reject(new Error('Not connected to database'));
      }
      db.collection('users').insertOne(user)
        .then((data) => resolve(data))
        .catch((error) => {
          if (error.code === 11000) {
            return resolve(null);
          }
          return reject(error);
        });
    });
  }

  // Get user from user collection
  function getUser(username) {
    return new Promise((resolve, reject) => {
      if (!isConnected()) {
        return reject(new Error('Not connected to database'));
      }
      db.collection('users').findOne({ username })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  // Add new treatbox order to the database
  function insertTreatBoxOrder(order) {
    return new Promise((resolve, reject) => {
      if (!isConnected()) {
        return reject(new Error('Not connected to database'));
      }
      db.collection('treatboxOrders').insertOne(order)
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  // Get orders from treatbox orders collection
  function getTreatBoxOrders() {
    return new Promise((resolve, reject) => {
      if (!isConnected()) {
        return reject(new Error('Not connected to database'));
      }
      db.collection('treatboxOrders').find().toArray()
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  function removeTreatBoxOrder(id) {
    return new Promise((resolve, reject) => {
      if (!isConnected()) {
        return reject(new Error('Not connected to database'));
      }
      db.collection('treatboxOrders').removeOne({ _id: ObjectID(id) })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  // Log error
  async function logError(message, error) {
    return new Promise((resolve, reject) => {
      db.collection('errorLog').insertOne({
        tag: loggingTag,
        message,
        error: error.stack
      })
        .then((data) => resolve(data.ops[0]))
        .catch((err) => reject(err));
    });
  }

  return {
    connect,
    isConnected,
    disconnect,
    getDb,
    setupDb,
    insertUser,
    getUser,
    insertTreatBoxOrder,
    getTreatBoxOrders,
    removeTreatBoxOrder,
    logError
  };
}

module.exports = dbController;