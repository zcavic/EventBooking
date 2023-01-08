const Event = require("../../models/event");
const User = require("../../models/user");
const bcryptjs = require("bcryptjs");

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

module.exports = {
    events: async () => {
        const events = await Event.find();
        return events.map((event) => ({ ...event._doc, creator: getUser.bind(this, event._doc.creator) }));
    },
    createEvent: async (arg) => {
        const user = await User.findById("63b9e0ea47ec9e3ef552abc1");
        if (!user) throw new Error("User not exist!");
        const event = new Event({ ...arg.eventInput, date: new Date(), creator: "63b9e0ea47ec9e3ef552abc1" });
        user.createdEvents.push(event);
        await user.save();
        return await event.save();
    },
    createUser: async (arg) => {
        if (await User.findOne({ email: arg.userInput.email })) throw new Error("User exist!");
        const user = new User({
            email: arg.userInput.email,
            password: await bcryptjs.hash(arg.userInput.password, 12)
        });
        return await user.save();
    }
};
