if (process.env.NODE_ENV === "production") {
    module.exports = require("./dist/use-redux-agent.min.js");
} else {
    module.exports = require("./dist/use-redux-agent.js");
}