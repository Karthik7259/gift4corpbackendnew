import collegeMerchandiseModel from "../models/CollegeMerchandiseModel.js";

// Add new college merchandise
const addCollegeMerchandise = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        // Check if already exists
        const exists = await collegeMerchandiseModel.findOne({ name });
        if (exists) {
            return res.status(400).json({ success: false, message: "College merchandise already exists" });
        }

        const newMerchandise = new collegeMerchandiseModel({ name });
        await newMerchandise.save();

        res.json({ success: true, message: "College merchandise added successfully", merchandise: newMerchandise });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all college merchandise (active only; treat missing isActive as active for legacy docs)
const listCollegeMerchandise = async (req, res) => {
    try {
        const merchandises = await collegeMerchandiseModel
            .find({
                $or: [{ isActive: true }, { isActive: { $exists: false } }],
            })
            .sort({ createdAt: -1 });
        res.json({ success: true, merchandises });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete college merchandise
const deleteCollegeMerchandise = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "ID is required" });
        }

        await collegeMerchandiseModel.findByIdAndUpdate(id, { isActive: false });
        res.json({ success: true, message: "College merchandise deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export { addCollegeMerchandise, listCollegeMerchandise, deleteCollegeMerchandise };
