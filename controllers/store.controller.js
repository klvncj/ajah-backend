const StoreModel = require("../models/store.model");

exports.createStore = async (req, res) => {
    try {
        const { name, description, banner, logo, socialLinks, shippingTypes, address, city, state, country, zipCode, phone, email, businessId } = req.body;
        const store = await StoreModel.create({ name, description, banner, logo, socialLinks, shippingTypes, address, city, state, country, zipCode, phone, email, businessId });
        res.status(201).json(store);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getStoreById = async (req, res) => {
    try {
        const store = await StoreModel.findById(req.params.id);
        res.status(200).json(store);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updateStore = async (req, res) => {
    try {
        const store = await StoreModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(store);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.deleteStore = async (req, res) => {
    try {
        const store = await StoreModel.findByIdAndDelete(req.params.id);
        res.status(200).json(store);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//controller to ensure that only one store data is available
exports.getStore = async (req, res) => {
    try {
        const store = await StoreModel.findOne();
        res.status(200).json(store);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
