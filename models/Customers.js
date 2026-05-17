const mongoose = require('mongoose');

const customersSchema = new mongoose.Schema(
    {
        customer_number: String,
        cutomer_name: String,
        territory: String,
        area: String,
        country: String
    },

);

module.exports = mongoose.model('Customers', customersSchema);