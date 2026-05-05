const { createHelpCommands } = require("./help");
const { pingCommand } = require("./ping");
const { stickerCommand } = require("./sticker");

const baseCommands = [pingCommand, stickerCommand];

const commandList = [
  ...baseCommands,
  ...createHelpCommands(baseCommands)
];

function findCommand(input) {
  const normalized = input.trim().toLowerCase();

  return commandList.find((command) => {
    if (command.name === normalized) {
      return true;
    }

    return command.aliases ? command.aliases.includes(normalized) : false;
  });
}

module.exports = {
  commandList,
  findCommand
};
