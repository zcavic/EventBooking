const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/event");

const app = express();

const events = [];

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
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
            }

            type RootQuery {
                events: [Event!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput!): Event!
            }

            schema {
                query: RootQuery,
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: async () => {
                return await Event.find();
            },
            createEvent: async (arg) => {
                const event = new Event({ ...arg.eventInput, date: new Date() });
                return await event.save();
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
