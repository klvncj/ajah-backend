const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    banner: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        required: true
    },
    socialLinks: {
        type: {
            facebook: String,
            twitter: String,
            instagram: String,
            linkedin: String,
            whatsapp: String,
        },
        default: {}
    },
    shippingTypes: [
        { 
            standard: {
                type: Number,
                required: true
            },
            express: {
                type: Number,
                required: true
            },
        }
    ],
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    businessId : {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    

})

module.exports = mongoose.model("Store", storeSchema);