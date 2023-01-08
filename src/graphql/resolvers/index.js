const Event = require("../../models/event");
const User = require("../../models/user");
const Booking = require("../../models/booking");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUser = async (userId) => {
    const userDb = await User.findById(userId);
    const user = {
        ...userDb._doc,
        createdEvents: getEvents.bind(this, userDb._doc.createdEvents)
    };
    return user;
};

const getEvents = async (eventIds) => {
    const events = await Event.find({ id: { $in: eventIds } });
    return events.map((event) => ({ ...event._doc, creator: getUser.bind(this, event._doc.creator) }));
};

const getEvent = async (eventId) => {
    const eventDb = await Event.findById(eventId);
    const event = {
        ...eventDb._doc,
        creator: getUser.bind(this, eventDb._doc.creator)
    };
    return event;
};

module.exports = {
    bookings: async (arg, req) => {
        if (!req.isAuth) throw new Error("Unauthenticated");
        const bookings = await Booking.find();
        return bookings.map((booking) => ({
            _id: booking._doc._id,
            event: getEvent.bind(this, booking._doc.event),
            user: getUser.bind(this, booking._doc.user),
            createdAt: new Date(booking._doc.createdAt).toISOString(),
            updatedAt: new Date(booking._doc.updatedAt).toISOString()
        }));
    },
    events: async (arg, req) => {
        const events = await Event.find();
        return events.map((event) => ({ ...event._doc, creator: getUser.bind(this, event._doc.creator) }));
    },
    createEvent: async (arg, req) => {
        if (!req.isAuth) throw new Error("Unauthenticated");
        const user = await User.findById(req.user.userId);
        if (!user) throw new Error("User not exist!");
        const event = new Event({ ...arg.eventInput, date: new Date(), creator: req.user.userId });
        user.createdEvents.push(event);
        await user.save();
        return await event.save();
    },
    createUser: async (arg, req) => {
        if (await User.findOne({ email: arg.userInput.email })) throw new Error("User exist!");
        const user = new User({
            email: arg.userInput.email,
            password: await bcryptjs.hash(arg.userInput.password, 12)
        });
        return await user.save();
    },
    bookEvent: async (arg, req) => {
        const user = await User.findById(req.user.userId);
        if (!user) throw new Error("User not exist!");
        const event = await Event.findById(arg.eventId);
        if (!event) throw new Error("Event not exist!");

        const booking = new Booking({ event: event._id, user: user._id });

        await booking.save();
        return { ...booking, user: getUser.bind(this, user._id), event: getEvent.bind(this, event._id) };
    },
    cancelBooking: async (arg, req) => {
        const booking = await Booking.findById(arg.bookingId);
        if (!booking) throw new Error("Booking not exist!");
        const event = await Event.findById(booking._doc.event);
        if (!event) throw new Error("Event not exist!");
        await Booking.deleteOne({ _id: arg.bookingId });
        return { ...event._doc, creator: getUser.bind(this, event._doc.creator) };
    },
    login: async ({ email, password }) => {
        const user = await User.findOne({ email });
        if (!user) throw new Error("User doesn't exist!");
        const isEqual = await bcryptjs.compare(password, user._doc.password);
        if (!isEqual) throw new Error("Invalid password!");
        const token = jwt.sign({ userId: user.id, email: user.email }, "secret", { expiresIn: "1h" });
        return { userId: user.id, token, tokenExpiration: 1 };
    }
};
