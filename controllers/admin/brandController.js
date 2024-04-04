const Brand = require('../../models/brandModel');

const renderBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.render('admin/brands', { brands });
    } catch (error) {
        console.error(error);
    }
}
const renderAddBrand = (req, res) => {
    res.render('admin/brand-add');
}
const handleAddBrand = async (req, res) => {
    try {
        console.log('body', req.body);
        const { name } = req.body;
        const regexPattern = new RegExp('^' + name + '$', 'i');
        const checkBrandExists = await Brand.findOne({ name: regexPattern });
        console.log('exits', checkBrandExists);
        if (!checkBrandExists) {
            const newBrand = new Brand({ name: name });
            await newBrand.save();
            return res.status(200).json({ redirect: '/admin/brands' });
        }
        res.status(409).json({ error: 'Brand name already exist!' });
    } catch (error) {
        console.error(error);
    }
}

const handleBlockUnblock = async (req, res) => {
    try {
        console.log(req.body);
        const { isBlocked, brandId } = req.body;
        await Brand.findByIdAndUpdate(brandId, { $set: { isBlocked: isBlocked } });
        res.status(200).json({ status: true });
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    renderBrands,
    renderAddBrand,
    handleAddBrand,
    handleBlockUnblock
}