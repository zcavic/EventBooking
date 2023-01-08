const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/event");
const User = require("./models/user");
const bcryptjs = require("bcryptjs");

const app = express();

const getUser = async (userId) => {
    const userDb = await User.findById(userId);
    const user = {
        ...userDb._doc,
        createdEvents: getEvents(userDb._doc.createdEvents)
    };
    return user;
};

const getEvents = async (eventIds) => {
    const events = await Event.find({ id: { $in: eventIds } });
    return events.map((event) => ({ ...event._doc, creator: getUser(event._doc.creator) }));
};

app.use(bodyParser.json());

app.use(
    "/graphql",
    graphqlHTTP({
        schema: buildSchema(`
            type Event {
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String!
                creator: User!
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
            }

            type User {
                _id: ID!
                email: String!
                createdEvents: [Event!]
            }

            input UserInput {
                email: String!
                password: String!
            }

            type RootQuery {
                events: [Event!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput!): Event!
                createUser(userInput: UserInput!): User!
            }

            schema {
                query: RootQuery,
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: async () => {
                const events = await Event.find();
                return events.map((event) => ({ ...event._doc, creator: getUser(event._doc.creator) }));
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
        },
        graphiql: true
    })
);

mongoose
    .connect(
        `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.b2tlh.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
    )
    .then(() => {
        app.listen(3000);
        console.log("Service is started on port 3000.");
    })
    .catch((err) => {
        console.log(err);
    });
