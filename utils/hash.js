const bcrypt = require("bcryptjs");

const password = "SuceNexou2020"; // remplace localement
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log("Voici ton hash sécurisé :");
console.log(hash);














