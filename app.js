const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");

const app = express();

app.use(bodyParser.json());

app.use(
    "/graphql",
    graphqlHTTP({
        schema: buildSchema(`
            type RootQuery {
                events: [String!]!
            }

            type RootMutation {
                createEvent(name: String!): String!
            }

            schema {
                query: RootQuery,
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: () => {
                return ["Exit", "Sensation", "MetalCamp"];
            },
            createEvent: (arg) => {
                const eventName = arg.name;
                return eventName;
            }
        },
        graphiql: true
    })
);

app.listen(3000);
