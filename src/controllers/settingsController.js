// Page Tag
const tag = 'whisk-management:settingsController';

// Requirements
const bcrypt = require('bcrypt');
const debug = require('debug')(tag);
const {
  priceFormat,
  calculateMoms,
  calculateNetCost
} = require('../helpers');
const {
  getTreatBoxDates,
  updateUser,
  addProduct,
  updateProduct,
  removeProduct,
  getProductById,
  getSettings,
  updateSettings: dbUpdateSettings,
  getProducts
} = require('../../lib/db-control')();

function settingsController() {
  // Function for retrieving all settings from db
  async function retrieveSettings() {
    const promises = [
      getProducts(),
      getSettings('treatbox'),
      getSettings('rebatecodes'),
      getSettings('sms'),
      getTreatBoxDates(),
      getSettings('timeframe')
    ];

    const data = await Promise.allSettled(promises);
    return {
      products: data[0].value,
      treatbox: data[1].value,
      rebate: data[2].value,
      sms: data[3].value,
      treatboxDates: data[4].value,
      timeframe: data[5].value
    };
  }

  // Function to Render Settings Page
  async function displaySettings(req, res) {
    const settings = await retrieveSettings();
    return res.render('settings.ejs', {
      user: req.user,
      settings,
      priceFormat,
      editing: res.locals.editing
    });
  }

  // Function to create product object from body information
  function getProductDetailsFromBody(body) {
    const product = {
      name: body['add-product-name'],
      description: body['add-product-description'],
      grossPrice: parseInt(body['add-product-price'], 10) * 100,
      costPrice: parseInt(body['add-product-cost-price'], 10) * 100,
      momsRate: parseInt(body['add-product-moms'], 10),
      deadline: body['add-product-deadline'],
      delivery: []
    };
    for (let zone = 0; zone <= 3; zone += 1) {
      product.delivery.push({
        zone,
        deliverable: body[`add-zone-${zone}-delivery`] === 'on',
        price: parseInt(body[`add-zone-${zone}-price`], 10)
      });
    }
    product.momsAmount = calculateMoms(product.grossPrice, product.momsRate);
    product.netPrice = calculateNetCost(product.grossPrice, product.momsRate);
    return product;
  }

  // Function to Update Settings in Database
  async function updateSettings(req, res) {
    const [submit, id] = req.body.submit.split('-');

    switch (submit) {
      case 'editproduct': {
        const product = await getProductById(id);
        res.locals.editing = {
          status: true,
          product
        };
        break;
      }

      case 'addproduct': {
        await addProduct(getProductDetailsFromBody(req.body));
        break;
      }

      case 'updateproduct': {
        await updateProduct(id, getProductDetailsFromBody(req.body));
        break;
      }

      case 'deleteproduct': {
        await removeProduct(id);
        break;
      }

      case 'timeframeupdate': {
        const settings = {
          type: 'timeframe',
          delivery: {
            day: parseInt(req.body['timeframe-delivery-date'], 10),
            time: req.body['timeframe-delivery-time']
          },
          deadline: [{
            type: 'normal',
            day: parseInt(req.body['timeframe-deadline-date'], 10),
            time: req.body['timeframe-deadline-time']
          }, {
            type: 'vegetable',
            day: parseInt(req.body['timeframe-vegetable-deadline-date'], 10),
            time: req.body['timeframe-vegetable-deadline-time']
          }]
        };
        debug(settings);
        dbUpdateSettings(settings);
        break;
      }

      case 'treatboxupdate': {
        const settings = {
          type: 'treatbox',
          delivery: []
        };
        for (let i = 0; i <= 3; i += 1) {
          const zone = {
            zone: i,
            price: parseInt(req.body[`zone${i}-delivery-price`], 10) * 100,
            momsRate: 25
          };
          zone.momsAmount = calculateMoms(zone.price, zone.momsRate);
          settings.delivery.push(zone);
        }
        dbUpdateSettings(settings);
        break;
      }

      case 'rebatecodesupdate': {
        const codesToGet = (Object.keys(req.body).length - 1) / 2;
        const codes = [];
        for (let i = 0; i < codesToGet; i += 1) {
          const code = {
            value: req.body[`rebate-code-${i}`],
            type: req.body[`rebate-type-${i}`]
          };
          if (code.value !== '') {
            codes.push(code);
          }
        }
        const settings = {
          type: 'rebatecodes',
          codes
        };
        dbUpdateSettings(settings);
        break;
      }

      case 'smsupdate': {
        const settings = {
          type: 'sms',
          defaultDelivery: req.body['default-sms']
        };
        dbUpdateSettings(settings);
        break;
      }

      case 'updateuserdetails': {
        if (req.body.email === '') {
          req.flash('danger', 'E-mail can not be empty');
          break;
        }
        req.user.email = req.body.email;

        try {
          await updateUser(req.user);
          req.flash('success', 'Details Updated!');
        } catch (error) {
          req.flash('danger', error);
        }
        break;
      }

      case 'updatepassword': {
        if (!await bcrypt.compare(req.body['old-password'], req.user.password)) {
          req.flash('danger', 'Old Password Incorrect!');
          break;
        }
        if (!(req.body['new-password'] === req.body['confirm-new-password'])) {
          req.flash('danger', 'New Password must match Confirmed New Password');
          break;
        }

        req.user.password = await bcrypt.hash(req.body['new-password'], 10);
        try {
          await updateUser(req.user);
          req.flash('success', 'Password Updated!');
        } catch (error) {
          req.flash('danger', error);
        }
        break;
      }

      default:
        break;
    }

    return displaySettings(req, res);
  }

  return { retrieveSettings, updateSettings, displaySettings };
}

module.exports = settingsController;
