const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        event: {
            type: String,
            required: true
        },
        user: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
