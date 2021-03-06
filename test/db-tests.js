/* eslint-disable no-underscore-dangle */
// Page Tag
const tag = 'whisk-management:db-tests';

// Requirements
const assert = require('assert').strict;
const {
  connect,
  isConnected,
  disconnect,
  getDb,
  setupDb,
  insertUser,
  updateUser,
  getUser,
  getSettings,
  updateSettings,
  insertTreatBoxOrder,
  getTreatBoxOrders,
  getTreatBoxOrderById,
  getRecipients,
  updateTreatBoxOrders,
  recordSwishRefund,
  updateSwishRefundStatus,
  getHighestOrder,
  getTreatBoxTotals,
  removeTreatBoxOrder,
  addBoxLoan,
  getBoxLoans,
  updateBoxLoan,
  logError,
  getErrorLog
} = require('../lib/db-control')(tag, 'whisk-management-test');

describe('Database Control Connection Tests', () => {
  describe('Add and retrieve user from new db', () => {
    const newUser = {
      username: 'generic-user',
      password: '$2b$10$lFpTlz.Pr8teMQWV1Ys97.hTtbNmxmwF7ABy3kmPgcLCu5S/ZuDfi',
      firstName: 'User',
      surname: 'One',
      email: 'my@email.se'
    };

    it('is initially not connected to client', () => {
      assert.ok(!isConnected());
    });

    it('connects to client', async () => {
      await connect();
      assert.ok(isConnected());
    });

    it('retrieves correct reference to \'whisk-management-test\' db', async () => {
      const stats = await getDb().stats();
      assert.equal(stats.db, 'whisk-management-test');
    });

    it('drops database', async () => {
      const dbDropped = await getDb().dropDatabase();
      assert.ok(dbDropped);
    });

    it('sets up database with username and code index', async () => {
      await setupDb();
      const response = await getDb().collection('users').indexInformation();
      assert.ok(response.username_1);
    });

    it('inserts single user into db', async () => {
      const insertedUser = await insertUser(newUser);
      assert.equal(insertedUser.insertedCount, 1);
      assert.deepEqual(insertedUser.ops[0], newUser);
    });

    it('fails to insert duplicate user into db', async () => {
      const duplicateUser = await insertUser(newUser);
      assert.equal(duplicateUser, null);
    });

    it('retrieves user back from db', async () => {
      const user = await getUser(newUser.username);
      // eslint-disable-next-line no-underscore-dangle
      newUser._id = user._id;
      assert.deepEqual(user, newUser);
    });

    it('updates user', async () => {
      newUser.surname = 'Updated';
      const response = await updateUser(newUser);
      assert.equal(response.modifiedCount, 1);
      // eslint-disable-next-line no-underscore-dangle
      const user = await getUser(newUser.username);
      assert.equal(user.surname, 'Updated');
    });

    it('returns null for unregistered user', async () => {
      const user = await getUser('thisUserIsNotInTheDb');
      assert.equal(user, null);
    });

    it('has one document in collection', async () => {
      const stats = await getDb().collection('users').stats();
      assert.equal(stats.count, 1);
    });

    it('disconnects', () => {
      disconnect();
      assert.ok(!isConnected());
    });
  });

  describe('Add new treatbox order to database', () => {
    const order = {
      details: {
        name: 'Anders Lindström',
        email: 'stebunting@gmail.com',
        telephone: '0722441909'
      },
      delivery: {
        date: '2020-16-3',
        type: 'split-delivery'
      },
      recipients: [{
        items: [{
          id: '5eff260203e99ab77968dbc1',
          quantity: 1,
          name: 'Treat Box'
        }],
        details: {
          name: 'Anett Lilliehöök',
          telephone: '0725931284'
        },
        delivery: {
          address: 'Saltsjövägen 15A, 181 62 Lidingö, Sweden',
          addressNotes: 'House',
          googleFormattedAddress: 'Saltsjövägen 15A, 181 62 Lidingö, Sweden',
          zone: 2,
          message: '',
          sms: 'Your Treat Box from WHISK is now outside your door! Fika är viktigt när man jobbar hemifrån 😊 Sköt om dig! Anders\n\nWe\'ve tried to keep true to our sustainable packaging with this new option. The foil pie tin is perfect for reheating things in the oven or making a pie. It\'s dishwasher safe and can be used many times! Our friends at Cajsa Warg helped out with the perfect sized bags and its uses are endless & here are some ideas smarturl.it/BagIdeas \n\nwww.whisk.se',
          order: 10
        }
      }, {
        items: [{
          id: '5eff260203e99ab77968dbc1',
          quantity: 1,
          name: 'Treat Box'
        }, {
          _id: 'kjhjlkdfhasjklfhsjdkhfkj',
          name: 'Vegetable Box',
          quantity: 4
        }],
        details: {
          name: 'Madeleine Orlando Lundh',
          telephone: '0761498362'
        },
        delivery: {
          address: 'Marknadsvägen 283, 183 79 Täby, Sweden',
          addressNotes: '3 (Lundh)',
          googleFormattedAddress: 'Marknadsvägen 283, 183 79 Täby, Sweden',
          zone: 3,
          message: '',
          sms: 'Your Treat Box from WHISK is now outside your door! Fika är viktigt när man jobbar hemifrån 😊 Sköt om dig! Anders\n\nWe\'ve tried to keep true to our sustainable packaging with this new option. The foil pie tin is perfect for reheating things in the oven or making a pie. It\'s dishwasher safe and can be used many times! Our friends at Cajsa Warg helped out with the perfect sized bags and its uses are endless & here are some ideas smarturl.it/BagIdeas \n\nwww.whisk.se',
          order: 15
        }
      }],
      statement: {
        products: [{
          _id: '5eff260203e99ab77968dbc1',
          name: 'Treat Box',
          quantity: 5,
          price: 25000,
          momsAmount: 2678,
          momsRate: 12,
          subTotal: 125000,
          momsSubTotal: 13390
        }, {
          _id: 'kjhjlkdfhasjklfhsjdkhfkj',
          name: 'Vegetable Box',
          quantity: 4,
          price: 25000,
          momsAmount: 2678,
          momsRate: 12,
          subTotal: 125000,
          momsSubTotal: 13390
        }],
        bottomLine: {
          foodCost: 125000,
          deliveryCost: 15000,
          foodMoms: 13390,
          deliveryMoms: 3750,
          totalMoms: 17140,
          total: 140000
        },
        delivery: {
          zone2: {
            price: 5000,
            quantity: 1,
            momsAmount: 1250,
            momsRate: 25,
            momsSubTotal: 1250,
            subTotal: 5000
          },
          zone3: {
            price: 5000,
            quantity: 2,
            momsAmount: 1250,
            momsRate: 25,
            momsSubTotal: 2500,
            subTotal: 10000
          }
        }
      },
      payment: {
        rebateCode: [
          'SPECIALDELIVERY'
        ],
        method: 'Invoice',
        status: 'Ordered'
      }
    };

    it('connects to client', async () => {
      await connect();
      assert.ok(isConnected());
    });

    it('adds order to database', async () => {
      const insertedOrder = await insertTreatBoxOrder(order);
      assert.equal(insertedOrder.insertedCount, 1);
      assert.deepEqual(insertedOrder.ops[0], order);

      assert.ok(isConnected());
    });

    it('retrieves orders from database', async () => {
      const orders = await getTreatBoxOrders();
      assert.equal(orders.length, 1);
      assert.deepEqual(orders[0], order);

      const orderById = await getTreatBoxOrderById(order._id);
      assert.deepEqual(orderById, orders[0]);
    });

    it('adds second order to database', async () => {
      delete order._id;
      const insertedOrder = await insertTreatBoxOrder(order);
      assert.equal(insertedOrder.insertedCount, 1);
      assert.deepEqual(insertedOrder.ops[0], order);
    });

    it('updates order to paid', async () => {
      const orders = await getTreatBoxOrders();
      assert.equal(orders[1].payment.status, 'Ordered');

      await updateTreatBoxOrders(orders[1]._id, { 'payment.status': 'Paid' });
      const updatedOrders = await getTreatBoxOrders();
      assert.equal(updatedOrders[1].payment.status, 'Paid');
    });

    it('adds new collection method', async () => {
      const insertedOrder = await insertTreatBoxOrder({
        details: {
          name: 'Lovorka Jonic Kapnias',
          email: 'lovorkajonic@yahoo.com',
          telephone: '0762266018'
        },
        delivery: {
          date: '2020-29-3',
          type: 'collection'
        },
        statement: {
          products: [{
            _id: '5f04f05577576c0017232c83',
            name: 'Vegetable Box',
            quantity: 1,
            price: 25000,
            momsAmount: 2678,
            momsRate: 12,
            subTotal: 25000,
            momsSubTotal: 2678
          }],
          bottomLine: {
            foodCost: 25000,
            deliveryCost: 0,
            foodMoms: 2678,
            deliveryMoms: 0,
            totalMoms: 2678,
            total: 25000
          },
          delivery: {}
        },
        payment: {
          method: 'Invoice',
          status: 'Invoiced'
        }
      });
      assert.equal(insertedOrder.insertedCount, 1);
    });

    it('gets total items by week', async () => {
      const response = await getTreatBoxTotals();
      const treatBoxIndex = response[0].items.findIndex((x) => x.name === 'Treat Box');
      assert.equal(response[0].items[treatBoxIndex].name, 'Treat Box');
      assert.equal(response[0].items[treatBoxIndex].quantity, 10);
      assert.equal(response[0].items[1 - treatBoxIndex].name, 'Vegetable Box');
      assert.equal(response[0].items[1 - treatBoxIndex].quantity, 8);
      assert.equal(response[0].deliveries, 4);
      assert.equal(response[0].income, 280000);
    });

    it('gets array of recipients', async () => {
      const response = await getRecipients();
      assert.equal(response.length, 5);
    });

    it('gets highest order', async () => {
      const response = await getHighestOrder();
      assert.equal(response.highestOrder, 15);
    });

    it('removes one item from database', async () => {
      const orders = await getTreatBoxOrders();
      assert.equal(orders.length, 3);

      const response = await removeTreatBoxOrder(orders[0]._id);
      assert.equal(response.deletedCount, 1);

      const newOrders = await getTreatBoxOrders();
      assert.equal(newOrders.length, 2);
    });

    it('adds refund', async () => {
      const orders = await getTreatBoxOrders();
      const orderId = orders[1]._id;

      recordSwishRefund(orderId, {
        timestamp: new Date(),
        id: 'ABC123',
        amount: 100,
        status: 'CREATED'
      });

      const response = await getTreatBoxOrderById(orderId);
      assert.equal(response.payment.swish.refunds.length, 1);
      assert.equal(response.payment.swish.refunds[0].id, 'ABC123');
      assert.equal(response.payment.swish.refunds[0].amount, 100);
      assert.equal(response.payment.swish.refunds[0].status, 'CREATED');
    });

    it('updates refund status', async () => {
      await updateSwishRefundStatus('ABC123', 'PAID');
      const response = await getTreatBoxOrders({ 'payment.swish.refunds.id': 'ABC123' });
      assert.equal(response.length, 1);
      assert.equal(response[0].payment.swish.refunds.length, 1);
      assert.equal(response[0].payment.swish.refunds[0].id, 'ABC123');
      assert.equal(response[0].payment.swish.refunds[0].amount, 100);
      assert.equal(response[0].payment.swish.refunds[0].status, 'PAID');
    });

    it('doesn\'t update refund status when refund doesn\'t exist', async () => {
      await updateSwishRefundStatus('FAKEID', 'FAKESTATUS');
      const response = await getTreatBoxOrders({ 'payment.swish.refunds.id': 'FAKEID' });
      assert.equal(response.length, 0);
    });

    it('disconnects', () => {
      disconnect();
      assert.ok(!isConnected());
    });
  });

  describe('Add and update settings', () => {
    const settings = {
      type: 'treatbox',
      delivery: {
        zone2: {
          price: 5000,
          momsRate: 25,
          momsAmount: 1000
        }
      }

    };

    it('connects to client', async () => {
      await connect();
      assert.ok(isConnected());
    });

    it('adds settings to database', async () => {
      const response = await updateSettings(settings);
      assert.equal(response.upsertedCount, 1);
      assert.ok(isConnected());
    });

    it('update settings', async () => {
      settings.delivery.zone2.price = 10000;
      await updateSettings(settings);
    });

    it('retrieves settings', async () => {
      const response = await getSettings('treatbox');
      assert.deepEqual(response.delivery, settings.delivery);
    });

    it('disconnects', () => {
      disconnect();
      assert.ok(!isConnected());
    });
  });

  describe('Add and change loan boxes', () => {
    let dateOut = new Date();
    dateOut = `${dateOut.getFullYear()}-${dateOut.getMonth() + 1}-${dateOut.getDate()}`;

    let dateIn = new Date();
    dateIn.setDate(dateIn.getDate() + 14);
    dateIn = `${dateIn.getFullYear()}-${dateIn.getMonth() + 1}-${dateIn.getDate()}`;

    const details = {
      forename: 'ste',
      surname: 'bunting',
      email: 'stebunting@gmail.com',
      phoneNumber: '07813653351',
      notes: 'bnites',
      dateOut,
      dateIn,
      returned: false,
      remindersSent: 0
    };

    it('connects to client', async () => {
      await connect();
      assert.ok(isConnected());
    });

    it('adds new loan', async () => {
      const response = await addBoxLoan(details);
      assert.deepEqual(details, response.ops[0]);
    });

    it('gets loan', async () => {
      const response = await getBoxLoans();
      assert.equal(response.length, 1);
      assert.deepEqual(details, response[0]);
    });

    it('increments remindersSent', async () => {
      let response = await updateBoxLoan(details._id, { $inc: { remindersSent: 1 } });
      assert.equal(response.result.nModified, 1);
      response = await getBoxLoans();
      assert.equal(response.length, 1);
      assert.equal(response[0].remindersSent, 1);
    });

    it('updates loan', async () => {
      const id = details._id;
      delete details._id;
      details.phoneNumber = '0733283460';
      let response = await updateBoxLoan(id, { $set: details });
      assert.equal(response.result.nModified, 1);
      response = await getBoxLoans();
      assert.equal(response.length, 1);
      assert.equal(response[0].phoneNumber, '0733283460');
    });

    it('disconnects', () => {
      disconnect();
      assert.ok(!isConnected());
    });
  });

  describe('Log and Retrieve Errors', () => {
    it('connects to client', async () => {
      await connect();
      assert.ok(isConnected());
    });

    it('logs an error', async () => {
      const response = await logError({
        message: 'Error Message',
        details: JSON.stringify({ json: 1 }),
        data: 'Some Data',
        error: 'Error Stack'
      });
      assert.equal(response.message, 'Error Message');
      assert.equal(response.details, '{"json":1}');
      assert.equal(response.error, 'Error Stack');
    });

    it('retrieves errors from db', async () => {
      const response = await getErrorLog();
      assert.equal(response.length, 1);
    });

    it('logs an error with incorrect formatting', async () => {
      const response = await logError({
        incorrect: 'formatting'
      });
      assert.equal(response.message, undefined);
      assert.equal(response.details, undefined);
      assert.equal(response.error, undefined);
    });

    it('disconnects', () => {
      disconnect();
      assert.ok(!isConnected());
    });
  });

  describe('Attempt to perform functions when not connected', () => {
    const newUser = {
      username: 'testUser',
      firstName: 'Test',
      surname: 'User',
      password: 'bcryptedpassword',
      email: 'test@user.com'
    };

    it('doesn\'t setup indexes on db', async () => {
      await assert.rejects(setupDb(), (error) => {
        assert.equal(error.message, 'Not connected to database');
        return true;
      });
    });

    it('doesn\'t insert single user into db', async () => {
      await assert.rejects(insertUser(newUser), (error) => {
        assert.equal(error.message, 'Not connected to database');
        return true;
      });
    });

    it('doesn\'t get user from db', async () => {
      await assert.rejects(getUser(newUser.username), (error) => {
        assert.equal(error.message, 'Not connected to database');
        return true;
      });
    });
  });
});
